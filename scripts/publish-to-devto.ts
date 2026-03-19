/**
 * Dev.to 배포 스크립트 (임시 수동 배포용)
 * 사용법: DEVTO_API_KEY=xxx npx tsx scripts/publish-to-devto.ts <title> <body_markdown> [tags]
 *
 * 환경변수:
 *   DEVTO_API_KEY - Dev.to API 키 (https://dev.to/settings/extensions)
 */

const DEVTO_API_URL = 'https://dev.to/api/articles';

const POWERED_BY_BADGE = `

---
*이 포스트는 [Synapso](https://synapso.dev)로 자동 생성되었습니다.*`;

interface DevtoArticle {
  id: number;
  url: string;
  title: string;
}

async function publishToDevto(
  title: string,
  bodyMarkdown: string,
  tags: string[] = []
): Promise<DevtoArticle> {
  const apiKey = process.env.DEVTO_API_KEY;
  if (!apiKey) {
    throw new Error('DEVTO_API_KEY 환경변수가 설정되지 않았습니다.');
  }

  const body = bodyMarkdown + POWERED_BY_BADGE;

  const response = await fetch(DEVTO_API_URL, {
    method: 'POST',
    headers: {
      'api-key': apiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      article: {
        title,
        body_markdown: body,
        published: true,
        tags: tags.slice(0, 4), // Dev.to 최대 4개 태그
      },
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Dev.to API 오류 (${response.status}): ${error}`);
  }

  const data = await response.json() as DevtoArticle;
  return data;
}

// CLI 실행
async function main() {
  const [, , title, bodyMarkdown, tagsStr] = process.argv;

  if (!title || !bodyMarkdown) {
    console.error('사용법: npx tsx scripts/publish-to-devto.ts <title> <body_markdown> [tags,comma,separated]');
    process.exit(1);
  }

  const tags = tagsStr ? tagsStr.split(',').map(t => t.trim()) : [];

  console.log(`Dev.to에 배포 중: "${title}"`);

  try {
    const article = await publishToDevto(title, bodyMarkdown, tags);
    console.log(`✅ 배포 완료!`);
    console.log(`   ID: ${article.id}`);
    console.log(`   URL: ${article.url}`);
  } catch (error) {
    console.error('❌ 배포 실패:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

main();
