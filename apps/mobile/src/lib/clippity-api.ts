import type { ClippityJobRecord, ClippityJobRequest } from '@clippity/shared/clippity';

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchClippity<T>(apiBase: string, token: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${apiBase}/api/clippity`, {
    ...init,
    headers: {
      'content-type': 'application/json',
      ...(token ? { authorization: 'Bearer ' + token } : {}),
      ...(init?.headers ?? {}),
    },
  });
  if (!response.ok) {
    throw new Error(`Clippity API failed (${response.status})`);
  }
  return response.json() as Promise<T>;
}

export async function submitClippityJob(apiBase: string, token: string, request: ClippityJobRequest) {
  return fetchClippity<{ mode: string; job: ClippityJobRecord }>(apiBase, token, {
    method: 'POST',
    body: JSON.stringify({ ...request, mode: 'process' }),
  });
}

export async function listClippityJobs(apiBase: string, token: string) {
  return fetchClippity<{ jobs: ClippityJobRecord[] }>(apiBase, token, { method: 'GET' });
}

export async function pollClippityJob(apiBase: string, token: string, jobId: string, maxAttempts = 10) {
  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const jobs = await listClippityJobs(apiBase, token);
    const match = jobs.jobs.find((job) => job.id === jobId);
    if (match && match.status !== 'queued' && match.status !== 'running') {
      return match;
    }
    await delay(1200);
  }
  return null;
}
