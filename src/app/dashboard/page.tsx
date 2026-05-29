const toolUsage = [
  { name: "beat2clips", runs: 42, videos: 18 },
  { name: "rhythm match", runs: 31, videos: 14 },
  { name: "scene detect", runs: 27, videos: 13 },
  { name: "reframe", runs: 19, videos: 9 },
];

const recentVideos = [
  { title: "Summer launch reel", tools: ["beat2clips", "rhythm match"] },
  { title: "Creator podcast cutdown", tools: ["caption sheet", "fast clipper"] },
  { title: "Event recap vertical", tools: ["teleprompter", "reframe"] },
];

const workspacePanels = [
  {
    title: "Fast clipper",
    description: "Jump into a fast clipping workspace for rapid rough cuts.",
    status: "Ready",
  },
  {
    title: "Caption sheet",
    description: "Review transcript lines, edit captions, and export subtitle drafts.",
    status: "In use",
  },
  {
    title: "Teleprompter",
    description: "Open script-ready prompting with speed controls for recording.",
    status: "Ready",
  },
];

export default function page() {
  return (
    <section className="min-h-screen bg-zinc-950 px-6 py-8 text-zinc-100 sm:px-8">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
        <header className="rounded-3xl border border-zinc-800 bg-zinc-900/70 p-6">
          <p className="text-xs uppercase tracking-[0.25em] text-zinc-400">Admin</p>
          <h1 className="mt-2 text-3xl font-semibold">Dashboard</h1>
          <p className="mt-2 max-w-3xl text-sm text-zinc-300">
            Monitor which tools are being used by uploaded videos and jump into the editor utilities.
          </p>
        </header>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {toolUsage.map((tool) => (
            <article key={tool.name} className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
              <p className="text-sm capitalize text-zinc-300">{tool.name}</p>
              <p className="mt-3 text-3xl font-semibold">{tool.runs}</p>
              <p className="mt-1 text-xs text-zinc-400">runs across {tool.videos} videos</p>
            </article>
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <section className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
            <h2 className="text-lg font-medium">Recent videos</h2>
            <div className="mt-4 space-y-3">
              {recentVideos.map((video) => (
                <article key={video.title} className="rounded-xl border border-zinc-800 bg-zinc-950 p-4">
                  <h3 className="text-sm font-medium text-zinc-100">{video.title}</h3>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {video.tools.map((tool) => (
                      <span key={tool} className="rounded-full border border-zinc-700 px-3 py-1 text-xs text-zinc-300">
                        {tool}
                      </span>
                    ))}
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
            <h2 className="text-lg font-medium">Editor utilities</h2>
            <div className="mt-4 space-y-3">
              {workspacePanels.map((panel) => (
                <article key={panel.title} className="rounded-xl border border-zinc-800 bg-zinc-950 p-4">
                  <div className="flex items-start justify-between gap-4">
                    <h3 className="text-sm font-medium text-zinc-100">{panel.title}</h3>
                    <span className="rounded-full border border-emerald-700/50 px-2 py-1 text-xs text-emerald-300">
                      {panel.status}
                    </span>
                  </div>
                  <p className="mt-2 text-xs leading-5 text-zinc-300">{panel.description}</p>
                </article>
              ))}
            </div>
          </section>
        </div>
      </div>
    </section>
  );
}
