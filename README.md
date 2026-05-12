# Clippity

Clippity is being migrated into a plugin-first, environment-agnostic video editing system.

## What this branch adds

- A modular core that normalizes edit requests from Premiere Pro, Blender, chatrooms, and AI agents.
- A beats-to-clips pipeline as the main sequencing primitive.
- Separate layers for scene detection, Whisper-style transcription, rhythm matching, and reframing.
- A skill API so agents can call the editing logic directly as reusable tools.

## Core concepts

- Beats-to-clips: turns musical timing, scene boundaries, and transcript context into a cut plan.
- Plugin adapters: convert environment-specific events into a shared edit intent.
- Agent skills: expose editing primitives like match-rhythm, detect-scenes, and reframe-clips.
- Manifest endpoint: returns the capabilities surface for plugins and automation.

## API

GET `/api/clippity`

Returns the Clippity manifest, including supported environments, plugins, and skills.

POST `/api/clippity`

Examples:

```json
{ "skill": "beats-to-clips", "input": { "objective": "make a tight highlight cut", "targetAspectRatio": "9:16" } }
```

```json
{ "event": { "platform": "group-chat", "message": "@clippity turn this into a reel", "context": "product launch recap" } }
```

## Notes

The implementation on this branch is structured so production providers can be swapped in for Whisper, PySceneDetect, MoviePy, Blender, or Premiere-specific execution without changing the shared architecture.
