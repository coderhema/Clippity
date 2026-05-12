import { clippitySkillCatalog } from "./capabilities";
import { analyzeClippityIntent, orchestrateClippity, orchestratePluginEvent } from "./orchestrator";
import { buildBeatsToClipsPlan, deriveBeatMarkers, deriveSceneWindows, matchRhythmWithClips } from "./beats-to-clips";
import { buildIntentFromPluginEvent } from "./plugin-adapters";
import type { EditIntent, PluginEvent } from "./types";

function normalizeIntent(input: unknown): EditIntent {
  return input as EditIntent;
}

function normalizePluginEvent(input: unknown): PluginEvent {
  return input as PluginEvent;
}

const skillHandlers = {
  "analyze-context": async (input: unknown) => {
    const intent = normalizeIntent(input);
    return {
      manifest: clippitySkillCatalog,
      analysis: analyzeClippityIntent(intent),
    };
  },
  "transcribe-whisper": async (input: unknown) => {
    const intent = normalizeIntent(input);
    return {
      note: "Whisper should be plugged in through the transcription provider layer.",
      transcript: intent.transcript ?? [],
      objective: intent.objective,
      environment: intent.environment,
    };
  },
  "detect-scenes": async (input: unknown) => {
    const intent = normalizeIntent(input);
    return {
      scenes: deriveSceneWindows(intent),
      objective: intent.objective,
      environment: intent.environment,
    };
  },
  "extract-beats": async (input: unknown) => {
    const intent = normalizeIntent(input);
    return {
      beats: deriveBeatMarkers(intent),
      objective: intent.objective,
      environment: intent.environment,
    };
  },
  "match-rhythm": async (input: unknown) => {
    const intent = normalizeIntent(input);
    return {
      rhythm: matchRhythmWithClips(intent),
      objective: intent.objective,
      environment: intent.environment,
    };
  },
  "reframe-clips": async (input: unknown) => {
    const intent = normalizeIntent(input);
    return {
      plan: buildBeatsToClipsPlan({ ...intent, targetAspectRatio: intent.targetAspectRatio ?? "9:16" }),
      objective: intent.objective,
      environment: intent.environment,
    };
  },
  "beats-to-clips": async (input: unknown) => {
    return buildBeatsToClipsPlan(normalizeIntent(input));
  },
  "handle-chat-mention": async (input: unknown) => {
    const event = normalizePluginEvent(input);
    return orchestratePluginEvent(event);
  },
  "execute-edit": async (input: unknown) => {
    const intent = normalizeIntent(input);
    return orchestrateClippity(intent);
  },
  "resolve-plugin-event": async (input: unknown) => {
    const event = normalizePluginEvent(input);
    return buildIntentFromPluginEvent(event);
  },
} as const;

export type ClippitySkillName = keyof typeof skillHandlers;

export async function runClippitySkill(name: string, input: unknown) {
  const handler = skillHandlers[name as ClippitySkillName];
  if (!handler) {
    throw new Error(`Unknown Clippity skill: ${name}`);
  }
  return await handler(input);
}

export function listClippitySkills() {
  return clippitySkillCatalog;
}
