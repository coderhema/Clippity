import type { AgentSkillDefinition, ClippityJobRecord, ClippityPluginAdapter, EditorEnvironment } from './types';

function makePluginResult(environment: EditorEnvironment, job: ClippityJobRecord, planSummary: string, payload: Record<string, unknown>) {
  return {
    environment,
    jobId: job.id,
    mode: job.kind,
    planSummary,
    payload,
  };
}

export const agentSkills: AgentSkillDefinition[] = [
  {
    id: 'beats-to-clips',
    description: 'Convert raw footage into a rhythm-aware clip sequence that can be executed anywhere.',
    environments: ['premiere-pro', 'blender', 'chatroom', 'agent'],
    jobKinds: ['beats-to-clips'],
  },
  {
    id: 'word-clip',
    description: 'Find target word mentions in transcript text and clip only those moments.',
    environments: ['agent', 'chatroom', 'premiere-pro', 'blender'],
    jobKinds: ['word-clip'],
  },
  {
    id: 'transcription',
    description: 'Transcribe media into reusable transcript segments for downstream editing.',
    environments: ['agent', 'chatroom', 'premiere-pro', 'blender'],
    jobKinds: ['transcribe'],
  },
  {
    id: 'scene-detection',
    description: 'Detect scenes and hard cuts for heavy processing in the worker layer.',
    environments: ['agent', 'chatroom', 'premiere-pro', 'blender'],
    jobKinds: ['scene-detect'],
  },
  {
    id: 'rhythm-matching',
    description: 'Align cuts to musical beats and motion beats.',
    environments: ['agent', 'chatroom', 'premiere-pro', 'blender'],
    jobKinds: ['rhythm-match'],
  },
  {
    id: 'reframing',
    description: 'Reframe clips for the target environment and aspect ratio.',
    environments: ['agent', 'chatroom', 'premiere-pro', 'blender'],
    jobKinds: ['reframe'],
  },
  {
    id: 'plugin-edit',
    description: 'Send a finished clip plan into a plugin or chatroom context for execution.',
    environments: ['premiere-pro', 'blender', 'chatroom', 'agent'],
    jobKinds: ['plugin-edit'],
  },
];

export const pluginAdapters: ClippityPluginAdapter[] = [
  {
    id: 'premiere-pro',
    environment: 'premiere-pro',
    description: 'Generate timeline-ready instructions for Premiere Pro.',
    canHandle: () => true,
    adapt: (plan, job) => makePluginResult('premiere-pro', job, plan.summary, {
      timeline: plan.clips,
      exportPreset: 'high-taste social cut',
      collaborationMode: 'plugin-first',
    }),
  },
  {
    id: 'blender',
    environment: 'blender',
    description: 'Generate node-friendly sequencing for Blender workflows.',
    canHandle: () => true,
    adapt: (plan, job) => makePluginResult('blender', job, plan.summary, {
      nodeGraph: plan.clips.map((clip) => ({
        clipId: clip.id,
        sourceStart: clip.sourceStart,
        sourceEnd: clip.sourceEnd,
        reframing: clip.reframing,
      })),
      renderGoal: 'cinematic cut with compositing-friendly segments',
    }),
  },
  {
    id: 'chatroom',
    environment: 'chatroom',
    description: 'Translate edit intent into concise chat-driven actions.',
    canHandle: () => true,
    adapt: (plan, job) => makePluginResult('chatroom', job, plan.summary, {
      replyDraft: 'I understood the mention. Here is the edit plan and the next actions to run.',
      actions: plan.clips.map((clip) => ({
        clipId: clip.id,
        beatTime: clip.beatTime,
        trimReason: clip.trimReason,
      })),
    }),
  },
  {
    id: 'agent',
    environment: 'agent',
    description: 'Expose clip planning as agent-callable skills.',
    canHandle: () => true,
    adapt: (plan, job) => makePluginResult('agent', job, plan.summary, {
      toolSurface: ['beats-to-clips', 'word-clip', 'transcribe', 'scene-detect', 'rhythm-match', 'reframe'],
      clipPlan: plan,
      callableAnywhere: true,
    }),
  },
];

export function getPluginAdapter(environment: EditorEnvironment) {
  return pluginAdapters.find((adapter) => adapter.environment === environment) ?? pluginAdapters[0];
}

export function listPluginEnvironments() {
  return pluginAdapters.map((adapter) => ({
    id: adapter.id,
    environment: adapter.environment,
    description: adapter.description,
  }));
}
