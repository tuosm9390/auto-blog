-- =============================================================
-- Synapso.dev PRD-Aware Project Memory Core Schema
-- 실행 위치: Supabase Dashboard -> SQL Editor
-- 목적:
-- 1. projects
-- 2. project_plans
-- 3. state_snapshots
-- 4. analysis_runs
-- =============================================================

-- -------------------------------------------------------------
-- Helper: updated_at trigger
-- 프로젝트 내 다른 테이블에서도 재사용 가능
-- -------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- -------------------------------------------------------------
-- 1. projects
-- 제품의 최상위 엔터티. 앞으로는 post가 아니라 project가 중심
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id TEXT NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,
  original_thesis TEXT,
  current_thesis TEXT,
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'paused', 'archived')),
  github_repo_owner TEXT,
  github_repo_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (owner_id, slug)
);

CREATE INDEX IF NOT EXISTS idx_projects_owner_id
  ON public.projects(owner_id);

CREATE INDEX IF NOT EXISTS idx_projects_updated_at
  ON public.projects(updated_at DESC);

DROP TRIGGER IF EXISTS trg_projects_updated_at ON public.projects;
CREATE TRIGGER trg_projects_updated_at
BEFORE UPDATE ON public.projects
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

-- -------------------------------------------------------------
-- 2. project_plans
-- 현재 PRD / 계획 문서. 첫 버전은 project당 current 1개면 충분
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.project_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'Current Plan',
  content_markdown TEXT NOT NULL,
  summary TEXT,
  version INT NOT NULL DEFAULT 1,
  is_current BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_project_plans_project_id
  ON public.project_plans(project_id);

CREATE INDEX IF NOT EXISTS idx_project_plans_current
  ON public.project_plans(project_id, is_current);

DROP TRIGGER IF EXISTS trg_project_plans_updated_at ON public.project_plans;
CREATE TRIGGER trg_project_plans_updated_at
BEFORE UPDATE ON public.project_plans
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

-- -------------------------------------------------------------
-- 3. analysis_runs
-- 기존 jobs와 같은 역할. Refresh state 실행 이력
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.analysis_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  triggered_by TEXT REFERENCES public.profiles(id) ON DELETE SET NULL,
  input_summary TEXT,
  source_window_days INT NOT NULL DEFAULT 7,
  latest_snapshot_id UUID,
  error_message TEXT,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_analysis_runs_project_id
  ON public.analysis_runs(project_id);

CREATE INDEX IF NOT EXISTS idx_analysis_runs_status
  ON public.analysis_runs(status);

CREATE INDEX IF NOT EXISTS idx_analysis_runs_created_at
  ON public.analysis_runs(project_id, created_at DESC);

-- -------------------------------------------------------------
-- 4. state_snapshots
-- 새 제품의 핵심 결과물. JSON 중심으로 빠르게 시작
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.state_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  analysis_run_id UUID REFERENCES public.analysis_runs(id) ON DELETE SET NULL,
  summary TEXT NOT NULL,
  progress_percent INT NOT NULL DEFAULT 0
    CHECK (progress_percent >= 0 AND progress_percent <= 100),
  current_phase TEXT NOT NULL,
  blocker_count INT NOT NULL DEFAULT 0,
  risk_count INT NOT NULL DEFAULT 0,
  drift_count INT NOT NULL DEFAULT 0,
  watch_next TEXT[] NOT NULL DEFAULT '{}',
  plan_progress_json JSONB NOT NULL DEFAULT '[]'::jsonb,
  drift_json JSONB NOT NULL DEFAULT '[]'::jsonb,
  evidence_json JSONB NOT NULL DEFAULT '[]'::jsonb,
  raw_output_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_state_snapshots_project_id
  ON public.state_snapshots(project_id);

CREATE INDEX IF NOT EXISTS idx_state_snapshots_generated_at
  ON public.state_snapshots(project_id, generated_at DESC);

-- -------------------------------------------------------------
-- 5. latest_snapshot_id FK는 state_snapshots 생성 후 추가
-- 순환 참조를 피하기 위해 마지막에 건다
-- -------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'analysis_runs_latest_snapshot_id_fkey'
  ) THEN
    ALTER TABLE public.analysis_runs
      ADD CONSTRAINT analysis_runs_latest_snapshot_id_fkey
      FOREIGN KEY (latest_snapshot_id)
      REFERENCES public.state_snapshots(id)
      ON DELETE SET NULL;
  END IF;
END $$;

-- -------------------------------------------------------------
-- RLS
-- owner 기준으로 단순하게 시작
-- -------------------------------------------------------------

ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analysis_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.state_snapshots ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "projects_select_own" ON public.projects;
CREATE POLICY "projects_select_own"
  ON public.projects FOR SELECT
  USING (owner_id = auth.uid()::text);

DROP POLICY IF EXISTS "projects_insert_own" ON public.projects;
CREATE POLICY "projects_insert_own"
  ON public.projects FOR INSERT
  WITH CHECK (owner_id = auth.uid()::text);

DROP POLICY IF EXISTS "projects_update_own" ON public.projects;
CREATE POLICY "projects_update_own"
  ON public.projects FOR UPDATE
  USING (owner_id = auth.uid()::text)
  WITH CHECK (owner_id = auth.uid()::text);

DROP POLICY IF EXISTS "projects_delete_own" ON public.projects;
CREATE POLICY "projects_delete_own"
  ON public.projects FOR DELETE
  USING (owner_id = auth.uid()::text);

DROP POLICY IF EXISTS "project_plans_select_own" ON public.project_plans;
CREATE POLICY "project_plans_select_own"
  ON public.project_plans FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.projects
      WHERE projects.id = project_plans.project_id
        AND projects.owner_id = auth.uid()::text
    )
  );

DROP POLICY IF EXISTS "project_plans_insert_own" ON public.project_plans;
CREATE POLICY "project_plans_insert_own"
  ON public.project_plans FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.projects
      WHERE projects.id = project_plans.project_id
        AND projects.owner_id = auth.uid()::text
    )
  );

DROP POLICY IF EXISTS "project_plans_update_own" ON public.project_plans;
CREATE POLICY "project_plans_update_own"
  ON public.project_plans FOR UPDATE
  USING (
    EXISTS (
      SELECT 1
      FROM public.projects
      WHERE projects.id = project_plans.project_id
        AND projects.owner_id = auth.uid()::text
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.projects
      WHERE projects.id = project_plans.project_id
        AND projects.owner_id = auth.uid()::text
    )
  );

DROP POLICY IF EXISTS "project_plans_delete_own" ON public.project_plans;
CREATE POLICY "project_plans_delete_own"
  ON public.project_plans FOR DELETE
  USING (
    EXISTS (
      SELECT 1
      FROM public.projects
      WHERE projects.id = project_plans.project_id
        AND projects.owner_id = auth.uid()::text
    )
  );

DROP POLICY IF EXISTS "analysis_runs_select_own" ON public.analysis_runs;
CREATE POLICY "analysis_runs_select_own"
  ON public.analysis_runs FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.projects
      WHERE projects.id = analysis_runs.project_id
        AND projects.owner_id = auth.uid()::text
    )
  );

DROP POLICY IF EXISTS "analysis_runs_insert_own" ON public.analysis_runs;
CREATE POLICY "analysis_runs_insert_own"
  ON public.analysis_runs FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.projects
      WHERE projects.id = analysis_runs.project_id
        AND projects.owner_id = auth.uid()::text
    )
  );

DROP POLICY IF EXISTS "analysis_runs_update_own" ON public.analysis_runs;
CREATE POLICY "analysis_runs_update_own"
  ON public.analysis_runs FOR UPDATE
  USING (
    EXISTS (
      SELECT 1
      FROM public.projects
      WHERE projects.id = analysis_runs.project_id
        AND projects.owner_id = auth.uid()::text
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.projects
      WHERE projects.id = analysis_runs.project_id
        AND projects.owner_id = auth.uid()::text
    )
  );

DROP POLICY IF EXISTS "analysis_runs_delete_own" ON public.analysis_runs;
CREATE POLICY "analysis_runs_delete_own"
  ON public.analysis_runs FOR DELETE
  USING (
    EXISTS (
      SELECT 1
      FROM public.projects
      WHERE projects.id = analysis_runs.project_id
        AND projects.owner_id = auth.uid()::text
    )
  );

DROP POLICY IF EXISTS "state_snapshots_select_own" ON public.state_snapshots;
CREATE POLICY "state_snapshots_select_own"
  ON public.state_snapshots FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.projects
      WHERE projects.id = state_snapshots.project_id
        AND projects.owner_id = auth.uid()::text
    )
  );

DROP POLICY IF EXISTS "state_snapshots_insert_own" ON public.state_snapshots;
CREATE POLICY "state_snapshots_insert_own"
  ON public.state_snapshots FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.projects
      WHERE projects.id = state_snapshots.project_id
        AND projects.owner_id = auth.uid()::text
    )
  );

DROP POLICY IF EXISTS "state_snapshots_update_own" ON public.state_snapshots;
CREATE POLICY "state_snapshots_update_own"
  ON public.state_snapshots FOR UPDATE
  USING (
    EXISTS (
      SELECT 1
      FROM public.projects
      WHERE projects.id = state_snapshots.project_id
        AND projects.owner_id = auth.uid()::text
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.projects
      WHERE projects.id = state_snapshots.project_id
        AND projects.owner_id = auth.uid()::text
    )
  );

DROP POLICY IF EXISTS "state_snapshots_delete_own" ON public.state_snapshots;
CREATE POLICY "state_snapshots_delete_own"
  ON public.state_snapshots FOR DELETE
  USING (
    EXISTS (
      SELECT 1
      FROM public.projects
      WHERE projects.id = state_snapshots.project_id
        AND projects.owner_id = auth.uid()::text
    )
  );

-- -------------------------------------------------------------
-- Verification queries
-- -------------------------------------------------------------
SELECT
  tablename,
  policyname,
  cmd
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('projects', 'project_plans', 'analysis_runs', 'state_snapshots')
ORDER BY tablename, policyname;
