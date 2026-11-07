import { env } from "./shared/env";

function App() {
  return (
    <main className="mx-auto max-w-2xl p-8">
      <h1 className="text-5xl font-bold">Theme check</h1>
      <p className="mt-4">Body text in Atkinson Hyperlegible, 20px.</p>
      <p className="mt-2 text-ink-muted">Secondary text.</p>
      <p className="mt-4 rounded-lg bg-success-bg p-4 text-success-ink">
        Success tint with its text color.
      </p>
      <button
        type="button"
        className="mt-8 h-14 rounded-lg bg-accent px-8 font-bold text-white focus-visible:outline-4 focus-visible:outline-offset-4 focus-visible:outline-accent"
      >
        Accent button
      </button>
      <p className="mt-8 text-ink-muted">Supabase: {env.supabaseUrl}</p>
    </main>
  );
}

export default App;
