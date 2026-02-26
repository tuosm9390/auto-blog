-- =========================================================================
-- [Phase 3] Soft Delete 및 Audit 로그 스키마 마이그레이션 (26.02.26)
-- =========================================================================

-- 1. posts 테이블에 삭제 일시 및 삭제자 정보를 저장하는 컬럼 추가
ALTER TABLE public.posts
ADD COLUMN deleted_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN deleted_by TEXT;

-- 2. 삭제되지 않은 포스트(deleted_at IS NULL)를 빠르게 조회하기 위한 부분 인덱스 생성
-- (전체 데이터가 늘어날 때 쿼리 성능 최적화)
CREATE INDEX idx_posts_active ON public.posts (created_at DESC) 
WHERE deleted_at IS NULL;

-- ※ 참고: 기존에 삭제된 데이터(Hard Delete)는 이미 복구 불가능하므로, 
-- 이 시점 이후부터 발생하는 삭제 요청에 대해서만 Audit 됨을 유의합니다.
