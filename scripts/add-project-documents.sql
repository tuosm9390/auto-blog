-- 프로젝트 Evidence 문서를 저장하는 테이블과 RLS 정책
-- =============================================================
-- Synapso.dev Project Documents Schema
-- 실행 위치: Supabase Dashboard -> SQL Editor
-- 목적:
-- 1. project_documents
-- 2. owner 기준 RLS policies
-- =============================================================

CREATE TABLE IF NOT EXISTS public.project_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL,
  title TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'active', 'superseded', 'archived')),
  content_markdown TEXT NOT NULL DEFAULT '',
  is_applied BOOLEAN NOT NULL DEFAULT false,
  related_links_json JSONB NOT NULL DEFAULT '[]'::jsonb,
  analysis_signals_json JSONB NOT NULL DEFAULT '[]'::jsonb,
  last_used_snapshot_id UUID REFERENCES public.state_snapshots(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT project_documents_document_type_check CHECK (
    document_type IN (
      'roadmap',
      'backlog',
      'sprint_plan',
      'decision_log',
      'technical_design',
      'risk_log',
      'release_ops_learning'
    )
  ),
  CONSTRAINT project_documents_project_type_unique UNIQUE (project_id, document_type)
);

CREATE INDEX IF NOT EXISTS idx_project_documents_project_id
  ON public.project_documents(project_id);

CREATE INDEX IF NOT EXISTS idx_project_documents_applied
  ON public.project_documents(project_id, is_applied);

DROP TRIGGER IF EXISTS trg_project_documents_updated_at ON public.project_documents;
CREATE TRIGGER trg_project_documents_updated_at
BEFORE UPDATE ON public.project_documents
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.project_documents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "project_documents_select_own" ON public.project_documents;
CREATE POLICY "project_documents_select_own"
  ON public.project_documents FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.projects
      WHERE projects.id = project_documents.project_id
        AND projects.owner_id = auth.uid()::text
    )
  );

DROP POLICY IF EXISTS "project_documents_insert_own" ON public.project_documents;
CREATE POLICY "project_documents_insert_own"
  ON public.project_documents FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.projects
      WHERE projects.id = project_documents.project_id
        AND projects.owner_id = auth.uid()::text
    )
  );

DROP POLICY IF EXISTS "project_documents_update_own" ON public.project_documents;
CREATE POLICY "project_documents_update_own"
  ON public.project_documents FOR UPDATE
  USING (
    EXISTS (
      SELECT 1
      FROM public.projects
      WHERE projects.id = project_documents.project_id
        AND projects.owner_id = auth.uid()::text
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.projects
      WHERE projects.id = project_documents.project_id
        AND projects.owner_id = auth.uid()::text
    )
  );

DROP POLICY IF EXISTS "project_documents_delete_own" ON public.project_documents;
CREATE POLICY "project_documents_delete_own"
  ON public.project_documents FOR DELETE
  USING (
    EXISTS (
      SELECT 1
      FROM public.projects
      WHERE projects.id = project_documents.project_id
        AND projects.owner_id = auth.uid()::text
    )
  );

SELECT
  tablename,
  policyname,
  cmd
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'project_documents'
ORDER BY policyname;
