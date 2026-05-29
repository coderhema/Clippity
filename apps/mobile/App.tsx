import AsyncStorage from '@react-native-async-storage/async-storage';
import type { ClippityJobRecord, ClippityJobRequest } from '@clippity/shared/clippity';
import { StatusBar } from 'expo-status-bar';
import * as SecureStore from 'expo-secure-store';
import { Video, ResizeMode } from 'expo-av';
import { useEffect, useMemo, useRef, useState } from 'react';
import { listClippityJobs, pollClippityJob, submitClippityJob } from './src/lib/clippity-api';
import {
  Alert,
  LayoutChangeEvent,
  PanResponder,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

type MobileScreen = 'onboarding' | 'library' | 'editor' | 'progress' | 'export';

type Project = {
  id: string;
  title: string;
  sourceUrl: string;
  durationSeconds: number;
  aspectRatio: '9:16' | '1:1' | '16:9';
};

type OfflineQueuedJob = {
  id: string;
  request: ClippityJobRequest;
};

const STORAGE_KEYS = {
  apiBase: 'clippity.mobile.apiBase',
  activeProjectId: 'clippity.mobile.activeProjectId',
  draftInPoint: 'clippity.mobile.draft.inPoint',
  draftOutPoint: 'clippity.mobile.draft.outPoint',
  queuedJobs: 'clippity.mobile.queue',
} as const;

const TOKEN_KEY = 'clippity.mobile.authToken';

const demoProjects: Project[] = [
  {
    id: 'launch-spot',
    title: 'Launch Spot',
    sourceUrl: 'https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    durationSeconds: 120,
    aspectRatio: '9:16',
  },
  {
    id: 'event-recap',
    title: 'Event Recap',
    sourceUrl: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
    durationSeconds: 180,
    aspectRatio: '1:1',
  },
];

const demoBeats = [0.08, 0.18, 0.34, 0.46, 0.62, 0.71, 0.84, 0.93];
const demoScenes = [0.1, 0.29, 0.57, 0.88];

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

export default function App() {
  const [screen, setScreen] = useState<MobileScreen>('onboarding');
  const [apiBase, setApiBase] = useState('http://localhost:3000');
  const [tokenInput, setTokenInput] = useState('');
  const [token, setToken] = useState('');
  const [projects] = useState<Project[]>(demoProjects);
  const [activeProjectId, setActiveProjectId] = useState(demoProjects[0].id);
  const [inPoint, setInPoint] = useState(0.12);
  const [outPoint, setOutPoint] = useState(0.78);
  const [timelineWidth, setTimelineWidth] = useState(1);
  const [jobs, setJobs] = useState<ClippityJobRecord[]>([]);
  const [queue, setQueue] = useState<OfflineQueuedJob[]>([]);
  const [busy, setBusy] = useState(false);

  const inStartRef = useRef(inPoint);
  const outStartRef = useRef(outPoint);

  const activeProject = useMemo(
    () => projects.find((project) => project.id === activeProjectId) ?? projects[0],
    [projects, activeProjectId],
  );

  useEffect(() => {
    (async () => {
      const [savedBase, savedProject, savedIn, savedOut, savedQueue, savedToken] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.apiBase),
        AsyncStorage.getItem(STORAGE_KEYS.activeProjectId),
        AsyncStorage.getItem(STORAGE_KEYS.draftInPoint),
        AsyncStorage.getItem(STORAGE_KEYS.draftOutPoint),
        AsyncStorage.getItem(STORAGE_KEYS.queuedJobs),
        SecureStore.getItemAsync(TOKEN_KEY),
      ]);
      if (savedBase) setApiBase(savedBase);
      if (savedProject) setActiveProjectId(savedProject);
      if (savedIn) setInPoint(clamp(Number(savedIn), 0, 0.95));
      if (savedOut) setOutPoint(clamp(Number(savedOut), 0.05, 1));
      if (savedQueue) {
        try {
          setQueue(JSON.parse(savedQueue) as OfflineQueuedJob[]);
        } catch {
          setQueue([]);
        }
      }
      if (savedToken) {
        setToken(savedToken);
        setTokenInput(savedToken);
        setScreen('library');
      }
    })();
  }, []);

  useEffect(() => {
    void AsyncStorage.setItem(STORAGE_KEYS.apiBase, apiBase);
  }, [apiBase]);

  useEffect(() => {
    void AsyncStorage.setItem(STORAGE_KEYS.activeProjectId, activeProjectId);
  }, [activeProjectId]);

  useEffect(() => {
    void AsyncStorage.setItem(STORAGE_KEYS.draftInPoint, String(inPoint));
  }, [inPoint]);

  useEffect(() => {
    void AsyncStorage.setItem(STORAGE_KEYS.draftOutPoint, String(outPoint));
  }, [outPoint]);

  useEffect(() => {
    void AsyncStorage.setItem(STORAGE_KEYS.queuedJobs, JSON.stringify(queue));
  }, [queue]);

  useEffect(() => {
    if (screen !== 'progress' || !token) return;
    const timer = setInterval(() => {
      void refreshJobs();
    }, 5000);
    return () => clearInterval(timer);
  }, [screen, token, apiBase]);

  async function persistAuth() {
    if (!tokenInput.trim()) {
      Alert.alert('Add token', 'Enter an auth token to continue.');
      return;
    }
    await SecureStore.setItemAsync(TOKEN_KEY, tokenInput.trim());
    setToken(tokenInput.trim());
    setScreen('library');
  }

  async function refreshJobs() {
    if (!token) return;
    try {
      const result = await listClippityJobs(apiBase, token);
      setJobs(result.jobs);
    } catch (error) {
      Alert.alert('Sync failed', error instanceof Error ? error.message : 'Unable to load jobs.');
    }
  }

  async function flushQueue() {
    if (!token || queue.length === 0) return;
    const queued = [...queue];
    for (const item of queued) {
      try {
        await submitClippityJob(apiBase, token, item.request);
        setQueue((current) => current.filter((entry) => entry.id !== item.id));
      } catch {
        break;
      }
    }
  }

  useEffect(() => {
    void flushQueue();
  }, [token, apiBase]);

  async function runAutoClipPlan() {
    if (!token) {
      Alert.alert('Auth required', 'Complete onboarding with a token first.');
      return;
    }
    if (!activeProject) return;
    setBusy(true);
    const request: ClippityJobRequest = {
      kind: 'beats-to-clips',
      input: {
        title: `${activeProject.title} Auto Clip`,
        aspectRatio: activeProject.aspectRatio,
        source: {
          title: activeProject.title,
          url: activeProject.sourceUrl,
          kind: 'video',
          durationSeconds: activeProject.durationSeconds,
        },
        scenes: demoScenes.map((point, index) => ({
          id: `scene-${index}`,
          start: Math.round(point * activeProject.durationSeconds),
          end: Math.round((demoScenes[index + 1] ?? outPoint) * activeProject.durationSeconds),
          score: 0.7,
        })),
        beats: demoBeats.map((point) => ({
          time: Math.round(point * activeProject.durationSeconds),
          strength: 0.85,
        })),
      },
      environment: 'agent',
      requestedBy: 'mobile-app',
    };

    try {
      const result = await submitClippityJob(apiBase, token, request);
      const completed = await pollClippityJob(apiBase, token, result.job.id);
      await refreshJobs();
      setScreen('progress');
      if (completed?.status === 'succeeded') {
        Alert.alert('Clip plan ready', 'Auto Clip Plan completed successfully.');
      }
    } catch {
      const queuedJob: OfflineQueuedJob = { id: `${Date.now()}`, request };
      setQueue((current) => [queuedJob, ...current]);
      Alert.alert('Queued offline', 'Network unavailable. The job will retry automatically.');
    } finally {
      setBusy(false);
    }
  }

  function makeHandlePan(which: 'in' | 'out') {
    return PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        if (which === 'in') inStartRef.current = inPoint;
        if (which === 'out') outStartRef.current = outPoint;
      },
      onPanResponderMove: (_, gestureState) => {
        const normalized = gestureState.dx / timelineWidth;
        if (which === 'in') {
          setInPoint(clamp(inStartRef.current + normalized, 0, outPoint - 0.05));
        } else {
          setOutPoint(clamp(outStartRef.current + normalized, inPoint + 0.05, 1));
        }
      },
    });
  }

  const inPan = useMemo(() => makeHandlePan('in'), [inPoint, outPoint, timelineWidth]);
  const outPan = useMemo(() => makeHandlePan('out'), [inPoint, outPoint, timelineWidth]);

  function onTimelineLayout(event: LayoutChangeEvent) {
    setTimelineWidth(Math.max(event.nativeEvent.layout.width, 1));
  }

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar style="light" />
      <View style={styles.header}>
        <Text style={styles.badge}>CLIPPITY MOBILE</Text>
        <Text style={styles.title}>Cinematic Clip Studio</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {screen === 'onboarding' && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Connect your workspace</Text>
            <Text style={styles.cardCopy}>Authenticate and set your Clippity API endpoint.</Text>
            <TextInput style={styles.input} value={apiBase} onChangeText={setApiBase} placeholder="http://localhost:3000" placeholderTextColor="#7f859a" />
            <TextInput style={styles.input} value={tokenInput} onChangeText={setTokenInput} placeholder="Auth token" placeholderTextColor="#7f859a" secureTextEntry />
            <Pressable style={styles.primaryButton} onPress={persistAuth}>
              <Text style={styles.primaryButtonText}>Start editing</Text>
            </Pressable>
          </View>
        )}

        {screen === 'library' && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Project Library</Text>
            <Text style={styles.cardCopy}>Import videos, resume drafts, and trigger AI clip jobs.</Text>
            {projects.map((project) => (
              <Pressable key={project.id} style={[styles.projectCard, project.id === activeProjectId && styles.projectCardActive]} onPress={() => setActiveProjectId(project.id)}>
                <Text style={styles.projectTitle}>{project.title}</Text>
                <Text style={styles.projectMeta}>{project.durationSeconds}s · {project.aspectRatio}</Text>
              </Pressable>
            ))}
            <Pressable style={styles.primaryButton} onPress={() => setScreen('editor')}>
              <Text style={styles.primaryButtonText}>Open clip editor</Text>
            </Pressable>
          </View>
        )}

        {screen === 'editor' && activeProject && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Clip Editor</Text>
            <Text style={styles.cardCopy}>Drag in/out handles, inspect beat + scene assists, then generate your plan.</Text>
            <Video
              style={styles.video}
              source={{ uri: activeProject.sourceUrl }}
              resizeMode={ResizeMode.COVER}
              shouldPlay={false}
              isMuted
              useNativeControls
            />

            <View style={styles.timelineFrame} onLayout={onTimelineLayout}>
              {demoBeats.map((beat) => (
                <View key={`beat-${beat}`} style={[styles.marker, { left: `${beat * 100}%`, backgroundColor: '#43e5ff' }]} />
              ))}
              {demoScenes.map((scene) => (
                <View key={`scene-${scene}`} style={[styles.sceneMarker, { left: `${scene * 100}%` }]} />
              ))}
              <View style={[styles.selection, { left: `${inPoint * 100}%`, width: `${(outPoint - inPoint) * 100}%` }]} />
              <View style={[styles.handle, { left: `${inPoint * 100}%` }]} {...inPan.panHandlers} />
              <View style={[styles.handle, { left: `${outPoint * 100}%` }]} {...outPan.panHandlers} />
            </View>

            <Text style={styles.rangeLabel}>
              Clip range: {(inPoint * activeProject.durationSeconds).toFixed(1)}s → {(outPoint * activeProject.durationSeconds).toFixed(1)}s
            </Text>

            <View style={styles.aspectRow}>
              {(['9:16', '1:1', '16:9'] as const).map((ratio) => (
                <View key={ratio} style={[styles.pill, activeProject.aspectRatio === ratio && styles.pillActive]}>
                  <Text style={styles.pillText}>{ratio}</Text>
                </View>
              ))}
            </View>

            <Pressable style={[styles.primaryButton, busy && styles.primaryButtonDisabled]} disabled={busy} onPress={runAutoClipPlan}>
              <Text style={styles.primaryButtonText}>{busy ? 'Running…' : 'Auto Clip Plan'}</Text>
            </Pressable>
          </View>
        )}

        {screen === 'progress' && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Job Progress</Text>
            <Text style={styles.cardCopy}>Track queue, polling status, and completed clip plans.</Text>
            <Pressable style={styles.secondaryButton} onPress={refreshJobs}>
              <Text style={styles.secondaryButtonText}>Refresh jobs</Text>
            </Pressable>
            {queue.length > 0 && (
              <Text style={styles.queueText}>Offline queue: {queue.length} pending</Text>
            )}
            {jobs.slice(0, 8).map((job) => (
              <View key={job.id} style={styles.jobCard}>
                <Text style={styles.jobKind}>{job.kind}</Text>
                <Text style={styles.jobStatus}>{job.status}</Text>
              </View>
            ))}
          </View>
        )}

        {screen === 'export' && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Export & Share</Text>
            <Text style={styles.cardCopy}>Background export pipeline and social-first presets.</Text>
            <View style={styles.aspectRow}>
              {['9:16 Reels', '1:1 Feed', '16:9 YouTube'].map((preset) => (
                <View key={preset} style={styles.pill}>
                  <Text style={styles.pillText}>{preset}</Text>
                </View>
              ))}
            </View>
            <Pressable style={styles.primaryButton} onPress={() => Alert.alert('Queued', 'Export has been queued in the background.')}>
              <Text style={styles.primaryButtonText}>Queue export</Text>
            </Pressable>
          </View>
        )}
      </ScrollView>

      <View style={styles.nav}>
        {[
          ['library', 'Library'],
          ['editor', 'Editor'],
          ['progress', 'Progress'],
          ['export', 'Export'],
        ].map(([key, label]) => (
          <Pressable key={key} onPress={() => setScreen(key as MobileScreen)} style={[styles.navItem, screen === key && styles.navItemActive]}>
            <Text style={styles.navText}>{label}</Text>
          </Pressable>
        ))}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#070a12' },
  header: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 4 },
  badge: { color: '#6f7c98', fontSize: 11, letterSpacing: 2 },
  title: { color: '#eef2ff', fontSize: 24, fontWeight: '700', marginTop: 5 },
  content: { padding: 16, gap: 14, paddingBottom: 100 },
  card: { backgroundColor: '#0f1422', borderRadius: 20, borderWidth: 1, borderColor: '#20283a', padding: 16, gap: 12 },
  cardTitle: { color: '#f7f8ff', fontSize: 20, fontWeight: '700' },
  cardCopy: { color: '#95a1be', lineHeight: 20 },
  input: { backgroundColor: '#0a0f1c', borderWidth: 1, borderColor: '#28314a', borderRadius: 12, color: '#f4f6ff', paddingHorizontal: 12, paddingVertical: 10 },
  primaryButton: { backgroundColor: '#25e6ff', borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
  primaryButtonDisabled: { opacity: 0.6 },
  primaryButtonText: { color: '#031018', fontWeight: '700' },
  secondaryButton: { borderColor: '#2f3a57', borderWidth: 1, borderRadius: 12, paddingVertical: 10, alignItems: 'center' },
  secondaryButtonText: { color: '#c6d0ea', fontWeight: '600' },
  projectCard: { borderWidth: 1, borderColor: '#27324b', borderRadius: 12, padding: 12, backgroundColor: '#0b111f' },
  projectCardActive: { borderColor: '#25e6ff', shadowColor: '#25e6ff', shadowOpacity: 0.2, shadowRadius: 10 },
  projectTitle: { color: '#f2f5ff', fontWeight: '700' },
  projectMeta: { color: '#93a0bf', marginTop: 4 },
  video: { height: 190, borderRadius: 14, backgroundColor: '#03060e' },
  timelineFrame: { height: 64, borderRadius: 12, backgroundColor: '#0a0f1b', borderWidth: 1, borderColor: '#26324b', justifyContent: 'center', overflow: 'hidden' },
  marker: { position: 'absolute', width: 2, top: 8, bottom: 8 },
  sceneMarker: { position: 'absolute', width: 1, top: 0, bottom: 0, backgroundColor: '#a986ff' },
  selection: { position: 'absolute', top: 10, bottom: 10, backgroundColor: 'rgba(37,230,255,0.18)', borderRadius: 8 },
  handle: { position: 'absolute', top: 6, bottom: 6, width: 14, marginLeft: -7, borderRadius: 8, backgroundColor: '#25e6ff' },
  rangeLabel: { color: '#dce3f7', fontVariant: ['tabular-nums'] },
  aspectRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  pill: { borderRadius: 999, paddingHorizontal: 12, paddingVertical: 8, backgroundColor: '#10182b', borderWidth: 1, borderColor: '#2b3753' },
  pillActive: { borderColor: '#25e6ff', backgroundColor: '#102736' },
  pillText: { color: '#d9e4ff', fontSize: 12, fontWeight: '600' },
  queueText: { color: '#ffd88f', fontWeight: '600' },
  jobCard: { borderWidth: 1, borderColor: '#24314a', borderRadius: 12, padding: 10, flexDirection: 'row', justifyContent: 'space-between', backgroundColor: '#0a101d' },
  jobKind: { color: '#cfd8f1', fontWeight: '600' },
  jobStatus: { color: '#7ef0bc', fontWeight: '700' },
  nav: { position: 'absolute', left: 10, right: 10, bottom: 14, borderRadius: 16, backgroundColor: '#0d1322', borderWidth: 1, borderColor: '#222d44', flexDirection: 'row', padding: 6, gap: 6 },
  navItem: { flex: 1, borderRadius: 12, alignItems: 'center', justifyContent: 'center', minHeight: 40 },
  navItemActive: { backgroundColor: '#18243e' },
  navText: { color: '#d2ddf9', fontWeight: '600', fontSize: 12 },
});
