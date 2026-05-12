export type ClippityEnvironment = "agent" | "chatroom" | "premiere-pro" | "blender";
export type ClippityPlatform = "premiere-pro" | "blender" | "facebook-groups" | "group-chat" | "agent";
export type ClippityTone = "cinematic" | "clean" | "high-energy" | "documentary" | "social";

export interface MediaAsset {
  id: string;
  kind: "video" | "audio" | "image" | "project" | "transcript";
  title?: string;
  durationSeconds?: number;
  source?: string;
  metadata?: Record<string, unknown>;
}

export interface SceneBoundary {
  start: number;
  end: number;
  confidence: number;
  label?: string;
}

export interface BeatMarker {
  time: number;
  strength: number;
  label?: "downbeat" | "upbeat" | "accent";
}

export interface TranscriptSegment {
  start: number;
  end: number;
  text: string;
  speaker?: string;
  confidence?: number;
}

export interface ReframeTarget {
  aspectRatio: string;
  subject?: string;
}

export interface EditIntent {
  objective: string;
  environment: ClippityEnvironment;
  platform?: ClippityPlatform;
  mention?: string;
  context?: string;
  media?: MediaAsset[];
  transcript?: TranscriptSegment[];
  scenes?: SceneBoundary[];
  beats?: BeatMarker[];
  targetAspectRatio?: string;
  tone?: ClippityTone;
  maxCuts?: number;
  notes?: string[];
}

export type EditOperation =
  | {
      type: "clip";
      sourceId?: string;
      start: number;
      end: number;
      rationale: string;
      sourceLabel?: string;
    }
  | {
      type: "transition";
      style: "hard-cut" | "match-cut" | "whip-pan" | "dissolve";
      fromIndex: number;
      toIndex: number;
      beatTime?: number;
      rationale: string;
    }
  | {
      type: "reframe";
      target: ReframeTarget;
      rationale: string;
    }
  | {
      type: "caption";
      text: string;
      start: number;
      end: number;
      rationale: string;
    }
  | {
      type: "overlay";
      label: string;
      start: number;
      end: number;
      rationale: string;
    }
  | {
      type: "note";
      text: string;
    };

export interface EditPlan {
  id: string;
  name: string;
  objective: string;
  environment: ClippityEnvironment;
  operations: EditOperation[];
  skills: string[];
  confidence: number;
  notes: string[];
}

export interface PluginEvent {
  platform: ClippityPlatform;
  objective?: string;
  message?: string;
  context?: string;
  mention?: string;
  payload?: Record<string, unknown>;
}

export interface SkillCatalogEntry {
  name: string;
  summary: string;
  environment: ClippityEnvironment[];
}

export interface ClippityManifest {
  name: string;
  version: string;
  accessibility: string;
  environments: ClippityEnvironment[];
  skills: SkillCatalogEntry[];
  pluginModes: {
    name: string;
    platforms: ClippityPlatform[];
    description: string;
  }[];
}
