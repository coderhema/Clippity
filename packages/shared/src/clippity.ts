export type EditorEnvironment = 'premiere-pro' | 'blender' | 'chatroom' | 'agent';
export type ClippityJobKind = 'beats-to-clips' | 'transcribe' | 'scene-detect' | 'rhythm-match' | 'reframe' | 'plugin-edit' | 'word-clip';
export type ClippityJobStatus = 'queued' | 'running' | 'succeeded' | 'failed';

export interface MediaSource {
  id?: string;
  url?: string;
  kind?: 'video' | 'audio' | 'image' | 'chat';
  durationSeconds?: number;
  title?: string;
}

export interface TranscriptSegment {
  id: string;
  start: number;
  end: number;
  text: string;
  confidence?: number;
  speaker?: string;
}

export interface SceneCut {
  id: string;
  start: number;
  end: number;
  score: number;
  label?: string;
}

export interface RhythmBeat {
  time: number;
  strength: number;
}

export interface ReframeDirective {
  aspectRatio: string;
  focalPoint: 'center' | 'speaker' | 'motion' | 'rule-of-thirds';
  notes: string[];
}

export interface ClipPlanItem {
  id: string;
  sourceStart: number;
  sourceEnd: number;
  beatTime?: number;
  trimReason: string;
  reframing: ReframeDirective;
}

export interface ClipPlan {
  title: string;
  summary: string;
  source: MediaSource | null;
  aspectRatio: string;
  transcriptSegments: TranscriptSegment[];
  sceneCuts: SceneCut[];
  beats: RhythmBeat[];
  clips: ClipPlanItem[];
  pluginTargets: EditorEnvironment[];
  agentNotes: string[];
}

export interface PluginContext {
  environment: EditorEnvironment;
  workspaceName?: string;
  chatroomUrl?: string;
  projectId?: string;
  notes?: string[];
}

export interface ClippityJobInput {
  source?: MediaSource;
  transcriptText?: string;
  transcriptSegments?: TranscriptSegment[];
  targetWord?: string;
  scenes?: SceneCut[];
  beats?: RhythmBeat[];
  aspectRatio?: string;
  title?: string;
  context?: PluginContext;
  requestedBy?: string;
}

export interface ClippityJobRequest {
  kind: ClippityJobKind;
  input: ClippityJobInput;
  environment?: EditorEnvironment;
  requestedBy?: string;
}

export interface ClippityJobRecord {
  id: string;
  kind: ClippityJobKind;
  status: ClippityJobStatus;
  createdAt: string;
  updatedAt: string;
  environment: EditorEnvironment;
  requestedBy?: string;
  input: ClippityJobInput;
  result?: unknown;
  error?: string;
}

export interface ClippityPluginAdapter {
  id: string;
  environment: EditorEnvironment;
  description: string;
  canHandle(job: ClippityJobRecord): boolean;
  adapt(plan: ClipPlan, job: ClippityJobRecord): Record<string, unknown>;
}

export interface AgentSkillDefinition {
  id: string;
  description: string;
  environments: EditorEnvironment[];
  jobKinds: ClippityJobKind[];
}
