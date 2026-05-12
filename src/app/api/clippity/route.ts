import { NextResponse } from 'next/server';
import { getClippityManifest, listClippityJobs, submitAndProcessClippityJob } from '@/lib/clippity/daemon';
import type { ClippityJobRequest } from '@/lib/clippity/types';

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json({
    manifest: getClippityManifest(),
    jobs: listClippityJobs(),
  });
}

export async function POST(request: Request) {
  const body = (await request.json()) as ClippityJobRequest & { mode?: 'queue' | 'process' };
  const job = await submitAndProcessClippityJob({
    kind: body.kind,
    input: body.input,
    environment: body.environment,
    requestedBy: body.requestedBy,
  });

  return NextResponse.json({
    mode: body.mode ?? 'process',
    job,
  });
}
