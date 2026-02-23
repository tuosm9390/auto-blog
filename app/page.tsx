import styles from "./page.module.css";
import {
  creatorsReviews,
  evaluatorsReviews
} from "./data/reviews";

export default function Home() {
  // 리뷰 배열 합치기 (다양한 페르소나 믹스)
  const allReviews = [...creatorsReviews, ...evaluatorsReviews].sort(() => Math.random() - 0.5);

  // 무한 롤링을 위해 배열을 두 번 이어붙임
  const marqueeReviews1 = allReviews.slice(0, 10);
  const marqueeReviews2 = allReviews.slice(10, 20);

  return (
    <div className={styles.page}>

      {/* 1. Hero Section (강렬한 타이포그래피) */}
      <section className={styles.heroSection}>
        <div className={styles.heroContent}>
          <span className={styles.heroBadge}>
            AUTOMATED TECH BLOGGING
          </span>
          <h1 className={styles.heroTitle}>
            코딩만 하세요.<br />
            기술 블로그는 <span className={styles.heroHighlight}>AI</span>가 완성합니다.
          </h1>
          <p className={styles.heroSubtitle}>
            깃허브 커밋만으로 압도적인 퀄리티의 기술 포스팅과<br />
            매력적인 개발자 포트폴리오를 자동으로 생성하세요.
          </p>
          <div className={styles.ctaGroup}>
            <a href="#demo" className={styles.primaryButton}>무료로 시작하기</a>
            <a href="#how" className={styles.secondaryButton}>작동 방식 보기</a>
          </div>
        </div>
      </section>

      {/* 2. Marquee Reviews (Social Proof 무한 롤링) */}
      <section className={styles.reviewSection}>
        <div className={styles.marqueeHeader}>
          <h2>현직 엔지니어와 채용 담당자의 생생한 반응</h2>
        </div>

        {/* 첫 번째 무한 롤링 트랙 (왼쪽으로) */}
        <div className={styles.marqueeContainer}>
          <div className={`${styles.marqueeTrack} ${styles.marqueeLeft}`}>
            {[...marqueeReviews1, ...marqueeReviews1].map((review, idx) => (
              <div key={`left-${idx}`} className={styles.reviewCard}>
                <p className={styles.reviewQuote}>"{review.quote}"</p>
                <div className={styles.reviewAuthor}>
                  <span className={styles.authorBadge}>{review.role}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 두 번째 무한 롤링 트랙 (오른쪽으로) */}
        <div className={styles.marqueeContainer}>
          <div className={`${styles.marqueeTrack} ${styles.marqueeRight}`}>
            {[...marqueeReviews2, ...marqueeReviews2].map((review, idx) => (
              <div key={`right-${idx}`} className={styles.reviewCard}>
                <p className={styles.reviewQuote}>"{review.quote}"</p>
                <div className={styles.reviewAuthor}>
                  <span className={styles.authorBadge}>{review.role}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 3. Pain Point & Solution Feature (미니멀 기능 설명) */}
      <section className={styles.featureSection}>
        <div className={styles.featureGrid}>
          <div className={styles.featureCard}>
            <div className={styles.featureIcon}>⏱️</div>
            <h3>일요일 밤을 되찾으세요</h3>
            <p>더 이상 블로그 포스팅에 주말을 갈아 넣지 마세요. 커밋 로그 분석부터 발행까지 클릭 한 번으로 끝납니다.</p>
          </div>
          <div className={styles.featureCard}>
            <div className={styles.featureIcon}>✨</div>
            <h3>프리미엄 미학의 포트폴리오</h3>
            <p>어설픈 템플릿 대신, 다크모드와 글래스모피즘이 결합된 편집(Editorial) 디자인으로 기술적 권위를 어필하세요.</p>
          </div>
          <div className={styles.featureCard}>
            <div className={styles.featureIcon}>📈</div>
            <h3>압도적인 발견 가능성 (SEO)</h3>
            <p>AI가 메타 태그와 시맨틱 마크업을 구조화하여 구글 검색 상단에 당신의 아티클을 자동으로 노출시킵니다.</p>
          </div>
        </div>
      </section>

      {/* 4. Final CTA (전환 유도) */}
      <section className={styles.ctaSection}>
        <h2>개발자로서의 가치를<br />지금 바로 200% 증명하세요.</h2>
        <a href="#demo" className={styles.primaryButton}>깃허브 연동하고 분석 시작하기</a>
      </section>

    </div>
  );
}
