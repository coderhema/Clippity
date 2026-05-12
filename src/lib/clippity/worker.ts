import { buildBeatsToClipsPlan, detectScenesFallback, reframeJobFallback, rhythmMatchFallback, transcribeJobFallback } from './pipeline';
import { getPluginAdapter } from './registry';
import type { ClippityJobRecord } from './types';
import { clippityStore } from './store';

function now() {
  return new Date().toISOString();
}

export async function processClippityJob(job: ClippityJobRecord): Promise<ClippityJobRecord> {
  const startedAt = now();

  try {
    let result: unknown;

    switch (job.kind) {
      case 'beats-to-clips':
        result = buildBeatsToClipsPlan(job.input);
        break;
      case 'transcribe':
        result = transcribeJobFallback(job.input);
        break;
      case 'scene-detect':
        result = detectScenesFallback(job.input);
        break;
      case 'rhythm-match':
        result = rhythmMatchFallback(job.input);
        break;
      case 'reframe':
        result = reframeJobFallback(job.input);
        break;
      case 'plugin-edit': {
        const plan = buildBeatsToClipsPlan(job.input);
        result = getPluginAdapter(job.environment).adapt(plan, job);
        break;
      }
      default:
        result = buildBeatsToClipsPlan(job.input);
        break;
    }

    return clippityStore.update(job.id, {
      status: 'succeeded',
      result: {
        startedAt,
        completedAt: now(),
        output: result,
      },
    }) as ClippityJobRecord;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown worker error';
    return clippityStore.update(job.id, {
      status: 'failed',
      error: message,
      result: {
        startedAt,
        completedAt: now(),
      },
    }) as ClippityJobRecord;
  }
}

export async function runWorkerTick() {
  const job = clippityStore.claimNextQueuedJob();
  if (!job) {
    return null;
  }
  return processClippityJob(job);
}

export async function runWorkerLoop(limit = 1) {
  const processed: ClippityJobRecord[] = [];
  for (let index = 0; index < limit; index += 1) {
    const next = await runWorkerTick();
    if (!next) break;
    processed.push(next);
  }
  return processed;
}
