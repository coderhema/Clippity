# Clippity MCP Server Specification

## Purpose
Expose Clippity's editing capabilities as Model Context Protocol tools so multiple AI agents can share the same editing surface, reuse intermediate outputs, and chain work without siloed workflows.

## Architecture goals
- Unsiloed by default: every stage produces reusable artifacts, not private one-off outputs.
- Tool-first: each editing capability is a first-class MCP tool.
- Composable: tools can be called independently or orchestrated in sequence.
- Traceable: every output includes source media, parameters, and provenance.
- Agent-friendly: tools return machine-readable artifacts plus concise human summaries.
- Async for heavy work: compute-intensive tasks are queued to a daemon/worker, not blocked inside the MCP server.

## Core concept
The server treats a clip as a shared workspace with a stable clip id. Tools do not hide intermediate results. Instead, they publish artifacts that other agents can consume:
- transcripts
- scenes
- rhythm maps
- reframed compositions
- render jobs
- provenance metadata
- queue/job records

This keeps editing work unsiloed across specialized agents.

## Server name
clippity-mcp

## Primary resources
- clip://{clip_id}
- transcript://{clip_id}
- scenes://{clip_id}
- rhythm-map://{clip_id}
- reframed-video://{clip_id}
- job://{job_id}
- queue://{queue_name}
- artifacts://{clip_id}/{artifact_id}

Resources should be read-only views over the shared workspace.

## Runtime architecture
The system is split into three cooperating layers:

1. MCP API layer
- Accepts tool calls from any AI agent.
- Validates inputs and permissions.
- Enqueues heavy work.
- Returns job handles and references to shared artifacts.

2. Daemon / worker layer
- Pulls queued jobs.
- Performs heavy processing such as Whisper transcription and PySceneDetect.
- Writes artifacts back to the shared workspace.
- Emits status updates and provenance.

3. Shared artifact store
- Persistent store for transcripts, scenes, cuts, renders, and job metadata.
- Makes intermediate outputs visible and reusable by all agents.

This structure is intentionally unsiloed: the MCP layer never owns the full editing pipeline, and the worker never hides outputs from other agents.

## Daemon responsibilities
The daemon should handle:
- Whisper transcription
- PySceneDetect analysis
- long-running rendering jobs
- retry handling
- status transitions
- artifact publication
- job deduplication when possible

The daemon should not:
- own the user-facing workflow exclusively
- hide intermediate artifacts
- overwrite source media
- force a single monolithic edit pipeline

## Queue model
Heavy tools should queue jobs instead of running synchronously.

Suggested job fields:
- job_id
- clip_id
- tool_name
- status: queued | running | succeeded | failed | canceled
- priority
- inputs
- created_at
- updated_at
- artifact_ids
- error
- attempts
- worker_id

Suggested queues:
- transcribe
- scene-detect
- render
- general

## Tools

### 1) transcribe_audio
Purpose: run Whisper transcription on source media.
Execution model: enqueue a daemon job and return a job handle immediately.
Inputs:
- clip_id
- media_url or media_ref
- language?
- prompt?
- timestamps? default true
Outputs:
- job_id
- transcript artifact when complete
- segments with timestamps
- confidence metadata
- provenance

### 2) detect_scenes
Purpose: run PySceneDetect to segment video into scenes.
Execution model: enqueue a daemon job and return a job handle immediately.
Inputs:
- clip_id
- media_url or media_ref
- detector? default adaptive
- threshold?
- min_scene_len?
Outputs:
- job_id
- scenes artifact when complete
- scene boundaries
- shot summaries if available
- provenance

### 3) match_rhythm
Purpose: analyze pacing and align edits to speech or music rhythm.
Execution model: may run synchronously for lightweight analysis, but should also support queued execution for long inputs.
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
Execution model: can queue if the media is large or if batch exports are requested.
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
Execution model: creates a dependency graph and enqueues child jobs rather than collapsing everything into one private pipeline.
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
Execution model: always queued.
Inputs:
- clip_id
- timeline_ref or edit_plan_ref
- format
- preset?
Outputs:
- export asset
- render logs
- checksum
- job_id

## Worker/tool contract principles
Every tool response should include:
- artifact_id or job_id
- clip_id
- status
- inputs_used
- outputs_created
- provenance
- next_recommended_action

If the work is queued, the tool must return immediately with a job handle and enough metadata for another agent to inspect or continue the workflow later.

## Status and polling resources
To keep the system unsiloed and inspectable, the MCP server should expose:
- job://{job_id}
- queue://{queue_name}
- artifacts://{clip_id}/{artifact_id}

These resources let multiple agents coordinate without asking a single orchestrator for private state.

## Data model
A minimal shared object model:
- Clip: the canonical workspace
- MediaAsset: original upload or linked source
- Artifact: any derived output
- Job: async processing task
- Queue: dispatch lane for workers
- Provenance: inputs, model versions, parameters, timestamps

## Unsiloed workflow
1. One agent uploads or references media in the shared clip workspace.
2. The MCP layer queues Whisper transcription and PySceneDetect jobs.
3. The daemon publishes transcript and scene artifacts back to the shared store.
4. Another agent consumes those artifacts to find rhythm and propose cuts.
5. A reframing agent generates vertical or square variants.
6. A coordinating agent composes all artifacts into an edit plan.
7. Any agent can inspect, reuse, or extend the intermediate artifacts later.

No stage should force a single monolithic pipeline. Each stage must remain independently callable, inspectable, and reusable.

## Safety and reliability
- Non-destructive by default.
- Original media is never overwritten.
- All transforms create new artifacts.
- Tool outputs must be deterministic where possible, or expose seeds and versions.
- Large media jobs should be async with polling or subscription support.
- Queue retries must be idempotent where possible.

## Transport and authentication
- MCP over standard transport.
- Authenticated per user workspace.
- Tool responses scoped to the caller's clip permissions.

## Suggested implementation layout
- server.ts: MCP server entrypoint
- daemon.ts: background worker entrypoint
- queue.ts: job enqueue/dequeue abstraction
- tools/transcribe_audio.ts
- tools/detect_scenes.ts
- tools/match_rhythm.ts
- tools/reframe_clip.ts
- tools/compose_edit.ts
- tools/render_export.ts
- resources/*.ts for clip, job, and artifact views

## Recommended next step
Implement the MCP server with queued heavy tasks and the daemon worker first, then add compose_edit as the orchestrator layer.
