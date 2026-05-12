import { clippityStore } from './store';
import { agentSkills, listPluginEnvironments } from './registry';
import type { ClippityJobRequest } from './types';
import { runWorkerTick } from './worker';

export function submitClippityJob(request: ClippityJobRequest) {
  return clippityStore.enqueue(request);
}

export async function submitAndProcessClippityJob(request: ClippityJobRequest) {
  const job = submitClippityJob(request);
  return runWorkerTick(job.id) ?? job;
}

export function getClippityManifest() {
  return {
    name: 'Clippity',
    mode: 'unsiloed',
    architecture: 'daemon-worker',
    description: 'Environment-agnostic video editing with plugin adapters for Premiere Pro, Blender, chatrooms, and AI agents.',
    skills: agentSkills,
    pluginEnvironments: listPluginEnvironments(),
    workerResponsibilities: [
      'transcription',
      'scene detection',
      'rhythm matching',
      'reframing',
      'beats-to-clips assembly',
    ],
    accessibility: 'available anywhere through plugins, APIs, and agent skills',
  };
}

export function listClippityJobs() {
  return clippityStore.list();
}

export function getClippityJob(id: string) {
  return clippityStore.get(id);
}
