import type { ClippityManifest, SkillCatalogEntry } from "./types";

export const clippitySkillCatalog: SkillCatalogEntry[] = [
  {
    name: "analyze-context",
    summary: "Summarize the edit request, available media, and the best next action.",
    environment: ["agent", "chatroom", "premiere-pro", "blender"],
  },
  {
    name: "transcribe-whisper",
    summary: "Produce a transcript layer that can be used for edit decisions and captions.",
    environment: ["agent", "chatroom", "premiere-pro", "blender"],
  },
  {
    name: "detect-scenes",
    summary: "Break footage into scene boundaries for structural editing decisions.",
    environment: ["agent", "chatroom", "premiere-pro", "blender"],
  },
  {
    name: "extract-beats",
    summary: "Find musical beat markers for rhythm-aware editing.",
    environment: ["agent", "chatroom", "premiere-pro", "blender"],
  },
  {
    name: "match-rhythm",
    summary: "Align clips, cut points, and transitions to the beat grid.",
    environment: ["agent", "chatroom", "premiere-pro", "blender"],
  },
  {
    name: "reframe-clips",
    summary: "Auto-reframe sources for vertical, square, or widescreen delivery.",
    environment: ["agent", "chatroom", "premiere-pro", "blender"],
  },
  {
    name: "beats-to-clips",
    summary: "Core feature: convert beat timing, scenes, and transcript context into a cut plan.",
    environment: ["agent", "chatroom", "premiere-pro", "blender"],
  },
  {
    name: "handle-chat-mention",
    summary: "Turn a tagged chat mention into a ready-to-run edit intent.",
    environment: ["chatroom", "agent"],
  },
];

export const clippityPluginModes = [
  {
    name: "Premiere Pro plugin",
    platforms: ["premiere-pro" as const],
    description: "Receive timeline context, scene references, and export a cut list that can be pushed into an NLE workflow.",
  },
  {
    name: "Blender plugin",
    platforms: ["blender" as const],
    description: "Use the same edit intelligence to drive scene assembly, reframing, and render prep.",
  },
  {
    name: "Chatroom agent",
    platforms: ["facebook-groups" as const, "group-chat" as const],
    description: "When tagged in a chat, Clippity interprets the message, resolves context, and prepares the edit plan.",
  },
  {
    name: "Agent skill API",
    platforms: ["agent" as const],
    description: "Expose editing primitives as callable tools so AI agents can directly invoke the video workflow.",
  },
];

export const clippityManifest: ClippityManifest = {
  name: "Clippity",
  version: "4.0-migration",
  accessibility: "Environment-agnostic video editing through plugins and agent-callable skills.",
  environments: ["agent", "chatroom", "premiere-pro", "blender"],
  skills: clippitySkillCatalog,
  pluginModes: clippityPluginModes,
};

export function getClippityManifest(): ClippityManifest {
  return clippityManifest;
}
