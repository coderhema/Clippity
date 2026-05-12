# Clippity MCP Server Specification

## Purpose
Expose Clippity's editing capabilities as Model Context Protocol tools so multiple AI agents can share the same editing surface, reuse intermediate outputs, and chain work without siloed workflows.

## Architecture goals
- Unsiloed by default: every stage produces reusable artifacts, not private one-off outputs.
- Tool-first: each editing capability is a first-class MCP tool.
- Composable: tools can be called independently or orchestrated in sequence.
- Traceable: every output includes source media, parameters, and provenance.
- Agent-friendly: tools return machine-readable artifacts plus concise human summaries.

## Core concept
The server treats a clip as a shared workspace with a stable clip id. Tools do not hide intermediate results. Instead, they publish artifacts that other agents can consume:
- transcripts
- scenes
- rhythm maps
- reframed compositions
- render jobs
- provenance metadata

This keeps editing work unsiloed across specialized agents.

## Server name
clippity-mcp

## Primary resources
- clip://{clip_id}
- transcript://{clip_id}
- scenes://{clip_id}
- rhythm-map://{clip_id}
- reframed-video://{clip_id}
- artifacts://{clip_id}/{artifact_id}

Resources should be read-only views over the shared workspace.

## Tools

### 1) transcribe_audio
Purpose: run Whisper transcription on source media.
Inputs:
- clip_id
- media_url or media_ref
- language?
- prompt?
- timestamps? default true
Outputs:
- transcript artifact
- segments with timestamps
- confidence metadata
- provenance

### 2) detect_scenes
Purpose: run PySceneDetect to segment video into scenes.
Inputs:
- clip_id
- media_url or media_ref
- detector? default adaptive
- threshold?
- min_scene_len?
Outputs:
- scenes artifact
- scene boundaries
- shot summaries if available
- provenance

### 3) match_rhythm
Purpose: analyze pacing and align edits to speech or music rhythm.
Inputs:
- clip_id
- transcript_ref?
- audio_ref?
- target_style?
- cut_density?
- pacing_mode? default speech-aligned
Outputs:
- rhythm map artifact
- suggested cut points
- tempo/pacing metrics
- provenance

### 4) reframe_clip
Purpose: use ClipsAI-style reframing for crop and subject tracking.
Inputs:
- clip_id
- media_url or media_ref
- aspect_ratio
- focus_mode?
- subject_hint?
Outputs:
- reframed render artifact
- crop track metadata
- preview asset
- provenance

### 5) compose_edit
Purpose: orchestrate the above tools into a single edit plan without hiding intermediate artifacts.
Inputs:
- clip_id
- objective
- steps array referencing other tool outputs
Outputs:
- edit plan
- dependency graph
- job ids for each stage

### 6) render_export
Purpose: render a final deliverable from accumulated artifacts.
Inputs:
- clip_id
- timeline_ref or edit_plan_ref
- format
- preset?
Outputs:
- export asset
- render logs
- checksum

## Tool contract principles
Every tool response should include:
- artifact_id
- clip_id
- status
- inputs_used
- outputs_created
- provenance
- next_recommended_action

## Data model
A minimal shared object model:
- Clip: the canonical workspace
- MediaAsset: original upload or linked source
- Artifact: any derived output
- Job: async processing task
- Provenance: inputs, model versions, parameters, timestamps

## Unsiloed workflow
1. One agent transcribes the clip.
2. Another agent uses the transcript to find rhythm.
3. A third agent detects scenes and proposes cut boundaries.
4. A reframing agent generates vertical or square variants.
5. A coordinating agent composes all artifacts into an edit plan.
6. Any agent can inspect or reuse the intermediate artifacts later.

No stage should force a single monolithic pipeline. Each stage must remain independently callable and reusable.

## Safety and reliability
- Non-destructive by default.
- Original media is never overwritten.
- All transforms create new artifacts.
- Tool outputs must be deterministic where possible, or expose seeds and versions.
- Large media jobs should be async with polling or subscription support.

## Transport and authentication
- MCP over standard transport.
- Authenticated per user workspace.
- Tool responses scoped to the caller's clip permissions.

## Suggested implementation layout
- server.ts: MCP server entrypoint
- tools/transcribe_audio.ts
- tools/detect_scenes.ts
- tools/match_rhythm.ts
- tools/reframe_clip.ts
- tools/compose_edit.ts
- tools/render_export.ts
- resources/*.ts for clip and artifact views

## Recommended next step
Implement the MCP server with the four editing tools as standalone skills, then add compose_edit as the orchestrator layer.
