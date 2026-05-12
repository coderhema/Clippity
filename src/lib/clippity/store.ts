import type { ClippityJobRecord, ClippityJobRequest, ClippityJobStatus } from './types';

interface ClippityGlobalStore {
  __clippityStore__?: MemoryClippityStore;
}

function now() {
  return new Date().toISOString();
}

function createJobId() {
  return globalThis.crypto && typeof globalThis.crypto.randomUUID === 'function'
    ? globalThis.crypto.randomUUID()
    : 'clippity-' + Math.random().toString(36).slice(2, 10);
}

export class MemoryClippityStore {
  private readonly jobs = new Map<string, ClippityJobRecord>();

  enqueue(request: ClippityJobRequest): ClippityJobRecord {
    const job: ClippityJobRecord = {
      id: createJobId(),
      kind: request.kind,
      status: 'queued',
      createdAt: now(),
      updatedAt: now(),
      environment: request.environment ?? request.input.context?.environment ?? 'agent',
      requestedBy: request.requestedBy ?? request.input.requestedBy,
      input: request.input,
    };

    this.jobs.set(job.id, job);
    return job;
  }

  get(id: string) {
    return this.jobs.get(id) ?? null;
  }

  list() {
    return Array.from(this.jobs.values()).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  update(id: string, patch: Partial<ClippityJobRecord>) {
    const existing = this.jobs.get(id);
    if (!existing) return null;
    const next: ClippityJobRecord = {
      ...existing,
      ...patch,
      updatedAt: now(),
    };
    this.jobs.set(id, next);
    return next;
  }

  claimJob(id: string) {
    const job = this.jobs.get(id);
    if (!job || job.status !== 'queued') return null;
    return this.update(id, { status: 'running' as ClippityJobStatus });
  }

  claimNextQueuedJob() {
    const next = this.list().find((job) => job.status === 'queued');
    if (!next) return null;
    return this.claimJob(next.id);
  }
}

const globalStore = globalThis as ClippityGlobalStore;
export const clippityStore = globalStore.__clippityStore__ ?? (globalStore.__clippityStore__ = new MemoryClippityStore());
