const environments = [
  {
    title: "Premiere Pro",
    text: "Plugin-first editing that can surface scene boundaries, beat-synced cuts, and reframing directly in the timeline.",
  },
  {
    title: "Blender",
    text: "Modular scene and render orchestration for creators who move between motion design, compositing, and video.",
  },
  {
    title: "Chatrooms",
    text: "When tagged in a group thread, Clippity reads the message context and turns it into an edit intent.",
  },
  {
    title: "AI agents",
    text: "Every core step is exposed as a callable skill so agents can detect scenes, match rhythm, clip, and reframe anywhere.",
  },
];

const features = ["beats-to-clips", "Whisper transcription layer", "PySceneDetect-style scene graph", "ClipAI reframing", "plugin adapters", "skill API"];

export default function Home() {
  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-100">
      <section className="mx-auto flex max-w-6xl flex-col gap-10 px-6 py-20 lg:px-10">
        <div className="max-w-3xl space-y-6">
          <p className="text-sm uppercase tracking-[0.35em] text-neutral-400">Clippity v4 migration</p>
          <h1 className="text-4xl font-semibold tracking-tight sm:text-6xl">
            Environment-agnostic video editing, delivered through plugins and AI skills.
          </h1>
          <p className="text-lg leading-8 text-neutral-300">
            This branch reorganizes Clippity around a modular core so the same edit intelligence can live inside Premiere Pro,
            Blender, chatrooms, and agent workflows without changing the editing logic.
          </p>
          <div className="flex flex-wrap gap-3 text-sm text-neutral-200">
            {features.map((feature) => (
              <span key={feature} className="rounded-full border border-white/10 bg-white/5 px-4 py-2">
                {feature}
              </span>
            ))}
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {environments.map((item) => (
            <article key={item.title} className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-lg shadow-black/20">
              <h2 className="text-lg font-medium text-white">{item.title}</h2>
              <p className="mt-3 text-sm leading-6 text-neutral-300">{item.text}</p>
            </article>
          ))}
        </div>

        <div className="grid gap-6 rounded-3xl border border-white/10 bg-neutral-900/70 p-8 lg:grid-cols-[1.2fr_0.8fr]">
          <div>
            <h2 className="text-2xl font-semibold">Core architecture</h2>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <h3 className="font-medium">Beats-to-clips</h3>
                <p className="mt-2 text-sm text-neutral-300">A shared sequencing primitive that aligns cuts, transitions, and reframing to music and motion.</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <h3 className="font-medium">Whisper + scene graph</h3>
                <p className="mt-2 text-sm text-neutral-300">Transcription and scene detection are separate providers so each environment can plug in its own runtime.</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <h3 className="font-medium">Agent skills</h3>
                <p className="mt-2 text-sm text-neutral-300">Every editing primitive is callable as a tool, making Clippity accessible from agents and automation layers.</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <h3 className="font-medium">Plugin adapters</h3>
                <p className="mt-2 text-sm text-neutral-300">Premiere Pro, Blender, and chatroom events all normalize into one edit intent model.</p>
              </div>
            </div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-black/30 p-5">
            <h3 className="text-sm uppercase tracking-[0.25em] text-neutral-400">API surface</h3>
            <p className="mt-4 text-sm leading-6 text-neutral-300">
              GET /api/clippity returns the manifest. POST /api/clippity can run a named skill like beats-to-clips or
              handle a plugin/chat event and turn it into a plan.
            </p>
            <div className="mt-6 rounded-xl border border-white/10 bg-white/5 p-4 text-xs leading-6 text-neutral-300">
              {`{ skill: "beats-to-clips", input: { objective, beats, scenes, transcript, targetAspectRatio } }`}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
