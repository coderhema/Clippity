import type { ClippityEnvironment, ClippityPlatform, EditIntent, PluginEvent } from "./types";

function inferEnvironment(platform: ClippityPlatform): ClippityEnvironment {
  if (platform === "premiere-pro") {
    return "premiere-pro";
  }
  if (platform === "blender") {
    return "blender";
  }
  if (platform === "agent") {
    return "agent";
  }
  return "chatroom";
}

function toText(value: unknown, fallback?: string) {
  return typeof value === "string" ? value : fallback;
}

function toNumber(value: unknown, fallback = 0) {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

export function buildIntentFromPluginEvent(event: PluginEvent): EditIntent {
  const payload = event.payload ?? {};
  const objective = event.objective ?? toText(payload.objective, event.message ?? "Create an edit from the chat context");
  const targetAspectRatio = toText(payload.targetAspectRatio, toText(payload.aspectRatio, "")) || undefined;
  const tone = toText(payload.tone, "") as EditIntent["tone"] | undefined;
  const maxCuts = toNumber(payload.maxCuts, 0) || undefined;

  return {
    objective,
    environment: inferEnvironment(event.platform),
    platform: event.platform,
    mention: event.mention ?? toText(payload.mention),
    context: event.context ?? toText(payload.context),
    media: Array.isArray(payload.media) ? (payload.media as EditIntent["media"]) : undefined,
    transcript: Array.isArray(payload.transcript) ? (payload.transcript as EditIntent["transcript"]) : undefined,
    scenes: Array.isArray(payload.scenes) ? (payload.scenes as EditIntent["scenes"]) : undefined,
    beats: Array.isArray(payload.beats) ? (payload.beats as EditIntent["beats"]) : undefined,
    targetAspectRatio,
    tone,
    maxCuts,
    notes: [
      `Plugin source: ${event.platform}`,
      event.message ? `Message: ${event.message}` : "",
      event.context ? `Context: ${event.context}` : "",
    ].filter(Boolean),
  };
}

export function isChatPlatform(platform: ClippityPlatform) {
  return platform === "facebook-groups" || platform === "group-chat";
}

export function describePluginMode(platform: ClippityPlatform) {
  if (platform === "premiere-pro") {
    return "Premiere Pro timeline plugin";
  }
  if (platform === "blender") {
    return "Blender scene plugin";
  }
  if (isChatPlatform(platform)) {
    return "Chatroom mention listener";
  }
  return "Agent skill endpoint";
}
