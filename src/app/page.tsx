const pillars = [
  {
    title: 'Plugin-first editing',
    body: 'One editing core, many surfaces: Premiere Pro, Blender, chatrooms, and agent tools all share the same job contract.',
  },
  {
    title: 'Daemon / worker split',
    body: 'Heavy transcription, scene detection, and rhythm analysis stay in the worker layer while the daemon coordinates execution.',
  },
  {
    title: 'Skills for AI agents',
    body: 'Beats-to-clips, clipping, reframing, rhythm matching, and transcription are exposed as callable skills anywhere.',
  },
  {
    title: 'Beats-to-clips core',
    body: 'Clippity converts raw footage into high-taste sequences that track beats, scene boundaries, and framing intent.',
  },
];

const surfaces = ['Premiere Pro', 'Blender', 'Chatrooms', 'Agent APIs'];

export default function Home() {
  return (
    <main className='min-h-screen bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.08),_transparent_35%),linear-gradient(180deg,_#09090b_0%,_#111114_100%)] text-white'>
      <section className='mx-auto flex min-h-screen w-full max-w-7xl flex-col justify-center px-6 py-16 sm:px-10 lg:px-16'>
        <div className='mb-10 inline-flex w-fit items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/70 backdrop-blur'>
          Unsiloed video editing, built for anywhere
        </div>

        <div className='grid gap-10 lg:grid-cols-[1.2fr_0.8fr] lg:items-start'>
          <div className='space-y-6'>
            <h1 className='max-w-4xl text-5xl font-semibold tracking-tight text-balance sm:text-6xl lg:text-7xl'>
              Clippity turns editing into a modular system that travels with the user.
            </h1>
            <p className='max-w-2xl text-lg leading-8 text-white/70 sm:text-xl'>
              The same core powers plugin surfaces, chat-driven edits, and AI-agent skills so rhythm matching,
              clipping, scene detection, transcription, and reframing can run without silos.
            </p>

            <div className='flex flex-wrap gap-3'>
              {surfaces.map((surface) => (
                <span key={surface} className='rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/80'>
                  {surface}
                </span>
              ))}
            </div>
          </div>

          <div className='rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl shadow-black/30 backdrop-blur'>
            <p className='text-sm uppercase tracking-[0.28em] text-white/45'>Core feature</p>
            <h2 className='mt-3 text-2xl font-semibold'>Beats to clips</h2>
            <p className='mt-3 text-sm leading-7 text-white/70'>
              Heavy work is split into daemon and worker responsibilities so long-running transcription and scene
              detection stay modular, swappable, and agent-callable.
            </p>
            <div className='mt-6 space-y-3'>
              {['scene detection', 'whisper-style transcription', 'rhythm matching', 'clipsai reframing'].map((item) => (
                <div key={item} className='flex items-center justify-between rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white/80'>
                  <span>{item}</span>
                  <span className='text-white/35'>ready for plugins</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className='mt-14 grid gap-4 md:grid-cols-2 xl:grid-cols-4'>
          {pillars.map((pillar) => (
            <article key={pillar.title} className='rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur'>
              <h3 className='text-lg font-medium'>{pillar.title}</h3>
              <p className='mt-3 text-sm leading-7 text-white/70'>{pillar.body}</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
