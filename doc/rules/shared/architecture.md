# 🏗️ 아키텍처 및 데이터 흐름

## 1. 디렉토리 구조

- app/[locale]/: 다국어 지원 및 페이지 컴포넌트
- app/api/: 서버리스 함수 및 웹훅 처리
- components/: 재사용 가능한 UI 컴포넌트 (UI/Business 분리)
- lib/: 데이터 액세스 계층(DAL), 외부 서비스 유틸리티
- doc/results/: 작업 보고서 및 분석 문서 저장소

## 2. 데이터 흐름 (Data Flow)

- Page -> Action -> DAL (lib/) -> Supabase 구조를 원칙으로 한다.
- 복잡한 비즈니스 로직은 lib/ 폴더 내 도메인 파일에 캡슐화한다.

## 3. DB 스키마 (v0.5.0)

- profiles, posts, jobs 테이블 간의 관계(Foreign Key) 준수.
- soft delete 로직이 적용된 deleted_at 필드 확인.
