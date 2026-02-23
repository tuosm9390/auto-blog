import styles from "./page.module.css";
import Link from "next/link";

export default function HowItWorks() {
  return (
    <div className={styles.page}>

      {/* 1. Hero Section */}
      <section className={styles.heroSection}>
        <div className={styles.heroContent}>
          <span className={styles.heroBadge}>HOW IT WORKS</span>
          <h1 className={styles.heroTitle}>
            개발자의 워크플로우를 그대로.<br />
            <span className={styles.heroHighlight}>방해 없는 자동화.</span>
          </h1>
          <p className={styles.heroSubtitle}>
            기존에 하시던 대로 코드를 푸시하세요. 나머지는 저희 AI 엔진이 알아서 분석하고 기록합니다.
            완성된 문서를 검토하고 발행하기만 하면 끝납니다.
          </p>
        </div>
      </section>

      {/* 2. Process Timeline */}
      <section className={styles.processSection}>
        <div className={styles.processContainer}>

          <div className={styles.processStep}>
            <div className={styles.stepNumber}>01</div>
            <div className={styles.stepContent}>
              <h2>깃허브(GitHub) 레포지토리 연동</h2>
              <p>
                오토블로그에 로그인한 후 자신이 작업하는 깃허브 저장소를 연결하세요.
                설정된 권한 내에서만 안전하게 커밋 로그와 코드 변화를 읽어들입니다.
              </p>
            </div>
          </div>

          <div className={styles.processStep}>
            <div className={styles.stepNumber}>02</div>
            <div className={styles.stepContent}>
              <h2>AI 기술/코드 심층 분석</h2>
              <p>
                단순히 "무엇을 수정했다"가 영혼 없는 로그가 아닙니다.
                저희 전용 AI 모델은 <strong>"이 아키텍처를 왜 선택했는지"</strong>, <strong>"성능이나 보안에 어떤 영향을 주는지"</strong> 맥락(Context)을 파악하여 초안을 작성합니다.
              </p>
            </div>
          </div>

          <div className={styles.processStep}>
            <div className={styles.stepNumber}>03</div>
            <div className={styles.stepContent}>
              <h2>초안 리뷰 및 에디팅</h2>
              <p>
                AI가 작성해둔 마크다운(Markdown) 초안을 대시보드에서 편안하게 확인하세요.
                추가하고 싶은 생각이나 수정할 뉘앙스가 있다면 언제든 다이렉트 에디터에서 빠르게 편집할 수 있습니다.
              </p>
            </div>
          </div>

          <div className={styles.processStep}>
            <div className={styles.stepNumber}>04</div>
            <div className={styles.stepContent}>
              <h2>클릭 한 번으로 발행 및 포트폴리오 최신화</h2>
              <p>
                최종 검토를 마친 후 발행 버튼을 누르면, 사용자만의 프리미엄 기술 블로그 및 포트폴리오 페이지에
                즉각적으로 업데이트 되며 모든 SEO 최적화 메타 데이터도 자동으로 세팅됩니다.
              </p>
            </div>
          </div>

        </div>
      </section>

      {/* 3. CTA */}
      <section className={styles.ctaSection}>
        <h2>더 이상 글쓰기에 주말을 낭비하지 마세요.</h2>
        <div className={styles.ctaGroup}>
          <Link href="/login" className={styles.primaryButton}>무료로 연동해보기</Link>
          <Link href="/" className={styles.secondaryButton}>홈으로 돌아가기</Link>
        </div>
      </section>

    </div>
  );
}
