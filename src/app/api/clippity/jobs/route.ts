import { NextResponse } from 'next/server';
import { getClippityJob, listClippityJobs, submitClippityJob } from '@/lib/clippity/daemon';
import type { ClippityJobRequest } from '@/lib/clippity/types';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const jobId = url.searchParams.get('jobId');
  if (jobId) {
    return NextResponse.json({ job: getClippityJob(jobId) });
  }

  return NextResponse.json({ jobs: listClippityJobs() });
}

export async function POST(request: Request) {
  const body = (await request.json()) as ClippityJobRequest;
  const job = submitClippityJob(body);
  return NextResponse.json({ job });
}
