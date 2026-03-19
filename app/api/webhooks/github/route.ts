import { NextRequest, NextResponse } from 'next/server';
import { createHmac, timingSafeEqual } from 'crypto';
import { createJob, runAIAnalysisBackground } from '@/lib/jobs';

function verifyGitHubSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const computed = `sha256=${createHmac('sha256', secret).update(payload).digest('hex')}`;
  try {
    return timingSafeEqual(Buffer.from(signature), Buffer.from(computed));
  } catch {
    return false;
  }
}

export async function POST(request: NextRequest) {
  const secret = process.env.GITHUB_WEBHOOK_SECRET;
  if (!secret) {
    console.error('GITHUB_WEBHOOK_SECRET is not configured');
    return NextResponse.json({ error: 'Webhook not configured' }, { status: 500 });
  }

  const signature = request.headers.get('x-hub-signature-256') ?? '';
  const payload = await request.text();

  if (!verifyGitHubSignature(payload, signature, secret)) {
    console.warn('GitHub Webhook: invalid signature');
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  const event = request.headers.get('x-github-event');
  if (event !== 'push') {
    return NextResponse.json({ message: 'Event ignored' }, { status: 200 });
  }

  let body: Record<string, unknown>;
  try {
    body = JSON.parse(payload);
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const ref = body.ref as string;
  if (ref !== 'refs/heads/master') {
    return NextResponse.json({ message: 'Branch ignored' }, { status: 200 });
  }

  const commits = (body.commits as Array<{ id: string }>) ?? [];
  const repoInfo = body.repository as { name: string; owner: { login: string }; full_name: string };
  const pusher = body.pusher as { name: string };

  const owner = repoInfo.owner.login;
  const repo = repoInfo.name;
  const username = process.env.WEBHOOK_POST_OWNER || pusher.name;
  const shas = commits.map((c) => c.id).slice(0, 10);

  console.info('Webhook received: push to master', {
    repo: repoInfo.full_name,
    commits: commits.length,
    username,
  });

  if (shas.length === 0) {
    return NextResponse.json({ message: 'No commits to process' }, { status: 200 });
  }

  try {
    const job = await createJob(username, `${owner}/${repo}`, shas);
    runAIAnalysisBackground(job.id, owner, repo, shas, 'pro').catch((err) =>
      console.error(`Webhook job ${job.id} failed:`, err)
    );
    return NextResponse.json({ message: 'Job started', jobId: job.id }, { status: 200 });
  } catch (err) {
    console.error('Webhook: failed to create job', err);
    return NextResponse.json({ error: 'Failed to create job' }, { status: 500 });
  }
}
