import type {
  ClipPlan,
  ClipPlanItem,
  ClippityJobInput,
  MediaSource,
  RhythmBeat,
  SceneCut,
  TranscriptSegment,
} from './types';

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function normalizeAspectRatio(aspectRatio?: string) {
  return aspectRatio && aspectRatio.trim() ? aspectRatio : '16:9';
}

function sentenceSplit(text: string) {
  return text
    .split(/(?<=[.!?])s+/)
    .map((part) => part.trim())
    .filter(Boolean);
}

function durationFromSource(source: MediaSource | undefined, fallback = 90) {
  return typeof source?.durationSeconds === 'number' && source.durationSeconds > 0 ? source.durationSeconds : fallback;
}

export function normalizeTranscriptSegments(input: ClippityJobInput): TranscriptSegment[] {
  if (input.transcriptSegments && input.transcriptSegments.length > 0) {
    return input.transcriptSegments.map((segment, index) => ({
      id: segment.id || 'segment-' + index,
      start: Math.max(0, segment.start),
      end: Math.max(segment.start, segment.end),
      text: segment.text.trim(),
      confidence: typeof segment.confidence === 'number' ? clamp(segment.confidence, 0, 1) : 0.9,
      speaker: segment.speaker,
    }));
  }

  if (input.transcriptText && input.transcriptText.trim()) {
    const parts = sentenceSplit(input.transcriptText.trim());
    return parts.map((text, index) => ({
      id: 'segment-' + index,
      start: index * 3,
      end: index * 3 + 2.6,
      text,
      confidence: 0.72,
    }));
  }

  return [];
}

export function normalizeScenes(input: ClippityJobInput, transcriptSegments: TranscriptSegment[]): SceneCut[] {
  if (input.scenes && input.scenes.length > 0) {
    return input.scenes.map((scene, index) => ({
      id: scene.id || 'scene-' + index,
      start: Math.max(0, scene.start),
      end: Math.max(scene.start, scene.end),
      score: clamp(scene.score, 0, 1),
      label: scene.label,
    }));
  }

  if (transcriptSegments.length > 0) {
    return transcriptSegments.map((segment, index) => ({
      id: 'scene-' + index,
      start: segment.start,
      end: segment.end,
      score: 0.7,
      label: 'dialogue-beat-' + index,
    }));
  }

  const duration = durationFromSource(input.source);
  const slice = duration / 3;
  return Array.from({ length: 3 }).map((_, index) => ({
    id: 'scene-' + index,
    start: index * slice,
    end: index === 2 ? duration : (index + 1) * slice,
    score: 0.55,
    label: 'fallback-scene-' + index,
  }));
}

export function normalizeBeats(input: ClippityJobInput, durationSeconds: number): RhythmBeat[] {
  if (input.beats && input.beats.length > 0) {
    return input.beats
      .map((beat) => ({
        time: Math.max(0, beat.time),
        strength: clamp(beat.strength, 0, 1),
      }))
      .sort((a, b) => a.time - b.time);
  }

  const count = Math.max(8, Math.floor(durationSeconds / 6));
  const step = durationSeconds / count;
  return Array.from({ length: count }).map((_, index) => ({
    time: index * step,
    strength: index % 4 === 0 ? 1 : index % 2 === 0 ? 0.75 : 0.5,
  }));
}

export function matchRhythmToScenes(sceneCuts: SceneCut[], beats: RhythmBeat[]) {
  return sceneCuts.map((scene, index) => {
    const midpoint = (scene.start + scene.end) / 2;
    const beat = beats.reduce<null | RhythmBeat>((winner, candidate) => {
      if (!winner) return candidate;
      return Math.abs(candidate.time - midpoint) < Math.abs(winner.time - midpoint) ? candidate : winner;
    }, null);

    return {
      sceneId: scene.id,
      beatTime: beat?.time ?? midpoint,
      trimReason: beat ? 'matched to nearest rhythm beat' : 'no beat supplied, using scene midpoint',
      score: clamp(scene.score + (beat ? beat.strength * 0.15 : 0), 0, 1),
      order: index,
    };
  });
}

function reframingForAspectRatio(aspectRatio: string, index: number) {
  const focalPoint = aspectRatio === '9:16' || aspectRatio === '4:5' ? 'speaker' : index % 2 === 0 ? 'center' : 'rule-of-thirds';
  return {
    aspectRatio,
    focalPoint,
    notes: [
      'preserve subject prominence',
      'keep motion inside safe frame',
      aspectRatio === '9:16' ? 'prioritize vertical crop and social-safe composition' : 'balance cinematic width with clean negative space',
    ],
  };
}

export function buildBeatsToClipsPlan(input: ClippityJobInput): ClipPlan {
  const transcriptSegments = normalizeTranscriptSegments(input);
  const sceneCuts = normalizeScenes(input, transcriptSegments);
  const durationSeconds = durationFromSource(input.source, Math.max(sceneCuts.at(-1)?.end ?? 72, 72));
  const beats = normalizeBeats(input, durationSeconds);
  const matches = matchRhythmToScenes(sceneCuts, beats);
  const aspectRatio = normalizeAspectRatio(input.aspectRatio);
  const clips: ClipPlanItem[] = matches.map((match, index) => {
    const scene = sceneCuts[index];
    return {
      id: scene.id,
      sourceStart: scene.start,
      sourceEnd: scene.end,
      beatTime: match.beatTime,
      trimReason: match.trimReason,
      reframing: reframingForAspectRatio(aspectRatio, index),
    };
  });

  return {
    title: input.title || input.source?.title || 'Untitled clip sequence',
    summary: 'Unsiloed beats-to-clips plan that aligns scene cuts, rhythm, and reframing for agent and plugin execution.',
    source: input.source ?? null,
    aspectRatio,
    transcriptSegments,
    sceneCuts,
    beats,
    clips,
    pluginTargets: ['premiere-pro', 'blender', 'chatroom', 'agent'],
    agentNotes: [
      'transcription, scene detection, rhythm matching, and reframing are exposed as modular skills',
      'heavy work should run in the daemon/worker layer and only publish compact clip plans to plugins',
      'chatroom mentions can map to the same job contract as editor plugins',
    ],
  };
}

export function transcribeJobFallback(input: ClippityJobInput) {
  return normalizeTranscriptSegments(input);
}

export function detectScenesFallback(input: ClippityJobInput) {
  return normalizeScenes(input, normalizeTranscriptSegments(input));
}

export function rhythmMatchFallback(input: ClippityJobInput) {
  const scenes = detectScenesFallback(input);
  const beats = normalizeBeats(input, durationFromSource(input.source, 72));
  return matchRhythmToScenes(scenes, beats);
}

export function reframeJobFallback(input: ClippityJobInput) {
  const plan = buildBeatsToClipsPlan(input);
  return plan.clips.map((clip) => ({
    clipId: clip.id,
    reframing: clip.reframing,
  }));
}
