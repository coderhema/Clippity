import type { BeatMarker, EditIntent, EditOperation, EditPlan, SceneBoundary, TranscriptSegment } from "./types";

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function uniqueSortedTimes(times: number[]) {
  return [...new Set(times.map((time) => Number(time.toFixed(3))))].sort((a, b) => a - b);
}

function estimateFallbackDuration(intent: EditIntent) {
  const mediaDuration = intent.media?.reduce((max, asset) => Math.max(max, asset.durationSeconds ?? 0), 0) ?? 0;
  const transcriptDuration = intent.transcript?.reduce((max, segment) => Math.max(max, segment.end), 0) ?? 0;
  const sceneDuration = intent.scenes?.reduce((max, scene) => Math.max(max, scene.end), 0) ?? 0;
  return Math.max(mediaDuration, transcriptDuration, sceneDuration, 12);
}

export function deriveSceneWindows(intent: EditIntent): SceneBoundary[] {
  if (intent.scenes && intent.scenes.length > 0) {
    return [...intent.scenes].sort((a, b) => a.start - b.start);
  }

  if (intent.transcript && intent.transcript.length > 0) {
    return intent.transcript.map((segment, index) => ({
      start: segment.start,
      end: segment.end,
      confidence: segment.confidence ?? Math.max(0.55, 0.95 - index * 0.03),
      label: segment.speaker ?? `segment-${index + 1}`,
    }));
  }

  const duration = estimateFallbackDuration(intent);
  const bucket = Math.max(3, Math.min(8, Math.round(duration / 4)));
  const windows: SceneBoundary[] = [];
  for (let start = 0; start < duration; start += bucket) {
    windows.push({
      start,
      end: Math.min(duration, start + bucket),
      confidence: 0.5,
      label: `fallback-${windows.length + 1}`,
    });
  }
  return windows;
}

export function deriveBeatMarkers(intent: EditIntent): BeatMarker[] {
  if (intent.beats && intent.beats.length > 0) {
    return [...intent.beats].sort((a, b) => a.time - b.time);
  }

  const duration = estimateFallbackDuration(intent);
  const step = Math.max(0.85, Math.min(2.5, duration / 8));
  const beats: BeatMarker[] = [];
  for (let time = 0; time <= duration; time += step) {
    beats.push({
      time,
      strength: time === 0 ? 1 : 0.72,
      label: time === 0 ? "downbeat" : "accent",
    });
  }
  return beats;
}

export function matchRhythmWithClips(intent: EditIntent) {
  const scenes = deriveSceneWindows(intent);
  const beats = deriveBeatMarkers(intent);
  const maxCuts = Math.max(1, intent.maxCuts ?? Math.min(12, beats.length));
  const selectedBeats = beats.slice(0, maxCuts);
  const clipWindows: {
    beat: BeatMarker;
    scene: SceneBoundary;
    start: number;
    end: number;
    caption?: TranscriptSegment;
  }[] = [];

  selectedBeats.forEach((beat, index) => {
    const scene = scenes.find((candidate) => beat.time >= candidate.start && beat.time <= candidate.end)
      ?? scenes[Math.min(index, scenes.length - 1)];
    const sceneLength = Math.max(1.2, scene.end - scene.start);
    const duration = clamp(sceneLength * 0.85, 1.25, 6.5);
    const start = clamp(beat.time - duration * 0.5, scene.start, Math.max(scene.start, scene.end - duration));
    const end = clamp(start + duration, scene.start, scene.end);
    const caption = intent.transcript?.find((segment) => beat.time >= segment.start && beat.time <= segment.end);
    clipWindows.push({ beat, scene, start, end, caption });
  });

  return { scenes, beats: selectedBeats, clipWindows };
}

function transitionStyleForTone(tone: EditIntent["tone"], beat: BeatMarker, index: number): "hard-cut" | "match-cut" | "whip-pan" | "dissolve" {
  const highEnergy = tone === "high-energy" || tone === "social";
  if (beat.label === "downbeat" || index === 0) {
    return highEnergy ? "hard-cut" : "match-cut";
  }
  if (tone === "cinematic") return "dissolve";
  if (highEnergy) return "whip-pan";
  return "hard-cut";
}

export function buildBeatsToClipsPlan(intent: EditIntent): EditPlan {
  const rhythm = matchRhythmWithClips(intent);
  const operations: EditOperation[] = [];
  const notes = new Set<string>(intent.notes ?? []);

  if (intent.targetAspectRatio) {
    operations.push({
      type: "reframe",
      target: { aspectRatio: intent.targetAspectRatio, subject: intent.mention ?? intent.objective },
      rationale: `Lock the delivery to ${intent.targetAspectRatio} for environment-agnostic publishing.`,
    });
  }

  rhythm.clipWindows.forEach((window, index) => {
    operations.push({
      type: "clip",
      sourceId: intent.media?.[0]?.id,
      sourceLabel: window.scene.label,
      start: Number(window.start.toFixed(3)),
      end: Number(window.end.toFixed(3)),
      rationale: `Keep motion and meaning centered on the beat at ${window.beat.time.toFixed(2)}s.`,
    });

    if (window.caption?.text) {
      operations.push({
        type: "caption",
        text: window.caption.text,
        start: Number(window.caption.start.toFixed(3)),
        end: Number(window.caption.end.toFixed(3)),
        rationale: "Use transcript timing to preserve spoken context.",
      });
    }

    if (index < rhythm.clipWindows.length - 1) {
      operations.push({
        type: "transition",
        style: transitionStyleForTone(intent.tone, window.beat, index),
        fromIndex: index,
        toIndex: index + 1,
        beatTime: window.beat.time,
        rationale: intent.tone === "cinematic"
          ? "Prefer a tasteful blend between shots while staying locked to the musical grid."
          : "Snap the next cut to the next rhythmic anchor.",
      });
    }
  });

  if (intent.context) {
    notes.add(intent.context);
  }
  if (intent.mention) {
    notes.add(`Mention source: ${intent.mention}`);
  }
  notes.add("Beats-to-clips is the core sequencing primitive for all plugins and agent skills.");

  return {
    id: `clippity-${Date.now().toString(36)}`,
    name: `Beats-to-Clips: ${intent.objective}`,
    objective: intent.objective,
    environment: intent.environment,
    operations,
    skills: ["beats-to-clips", "match-rhythm", "detect-scenes", "transcribe-whisper", "reframe-clips"],
    confidence: rhythm.beats.length > 0 ? 0.86 : 0.68,
    notes: [...notes],
  };
}
