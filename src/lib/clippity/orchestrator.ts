import { buildBeatsToClipsPlan, deriveBeatMarkers, deriveSceneWindows } from "./beats-to-clips";
import { buildIntentFromPluginEvent } from "./plugin-adapters";
import type { EditIntent, EditPlan, PluginEvent, SceneBoundary, TranscriptSegment, BeatMarker } from "./types";

export interface ClippityProviders {
  transcribe?: (intent: EditIntent) => Promise<TranscriptSegment[] | undefined>;
  detectScenes?: (intent: EditIntent) => Promise<SceneBoundary[] | undefined>;
  extractBeats?: (intent: EditIntent) => Promise<BeatMarker[] | undefined>;
}

export async function enrichIntent(intent: EditIntent, providers: ClippityProviders = {}) {
  const transcript = intent.transcript ?? (await providers.transcribe?.(intent)) ?? [];
  const scenes = intent.scenes ?? (await providers.detectScenes?.(intent)) ?? [];
  const beats = intent.beats ?? (await providers.extractBeats?.(intent)) ?? [];

  return {
    ...intent,
    transcript: transcript.length > 0 ? transcript : intent.transcript,
    scenes: scenes.length > 0 ? scenes : intent.scenes,
    beats: beats.length > 0 ? beats : intent.beats,
  };
}

export async function orchestrateClippity(intent: EditIntent, providers: ClippityProviders = {}): Promise<EditPlan> {
  const enriched = await enrichIntent(intent, providers);
  return buildBeatsToClipsPlan(enriched);
}

export async function orchestratePluginEvent(event: PluginEvent, providers: ClippityProviders = {}): Promise<EditPlan> {
  return orchestrateClippity(buildIntentFromPluginEvent(event), providers);
}

export function analyzeClippityIntent(intent: EditIntent) {
  const scenes = deriveSceneWindows(intent);
  const beats = deriveBeatMarkers(intent);
  const coverage = scenes.length > 0 ? scenes.reduce((sum, scene) => sum + (scene.end - scene.start), 0) : 0;

  return {
    objective: intent.objective,
    environment: intent.environment,
    sceneCount: scenes.length,
    beatCount: beats.length,
    coverage,
    recommendedSkills: ["beats-to-clips", "match-rhythm", "detect-scenes", "transcribe-whisper", "reframe-clips"],
    mediaCount: intent.media?.length ?? 0,
    targetAspectRatio: intent.targetAspectRatio,
    tone: intent.tone,
  };
}
