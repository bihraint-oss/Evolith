import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";

const rootElement = document.getElementById("root");

if (rootElement === null) {
  throw new Error("Expected #root element to exist.");
}

createRoot(rootElement).render(
  <StrictMode>
    <main className="min-h-screen px-6 py-10 text-ink-950">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-4xl flex-col justify-between rounded-4xl border border-white/70 bg-white/80 p-8 shadow-card backdrop-blur">
        <div className="space-y-4">
          <p className="text-sm font-semibold uppercase tracking-[0.35em] text-clay-500">
            Evolith
          </p>
          <h1 className="max-w-2xl text-4xl font-semibold tracking-tight text-ink-950">
            Frontend workspace scaffolded for the Phase 4 auth, diagnosis, and dashboard flow.
          </h1>
          <p className="max-w-2xl text-base text-ink-700">
            Vite, React, Tailwind, Recharts, and Vitest are wired. Route composition and product
            pages will land in the follow-up phase tasks.
          </p>
        </div>

        <div className="mt-10 grid gap-4 text-sm text-ink-700 md:grid-cols-3">
          <section className="rounded-3xl bg-sand-50 p-5">
            <p className="font-semibold text-ink-950">Auth</p>
            <p className="mt-2">Combined register and login flow will live at <code>/auth</code>.</p>
          </section>
          <section className="rounded-3xl bg-sand-50 p-5">
            <p className="font-semibold text-ink-950">Diagnosis</p>
            <p className="mt-2">Diagnosis start, resume, and progression are queued next.</p>
          </section>
          <section className="rounded-3xl bg-sand-50 p-5">
            <p className="font-semibold text-ink-950">Dashboard</p>
            <p className="mt-2">Radar and skill state rendering will connect to current APIs.</p>
          </section>
        </div>
      </div>
    </main>
  </StrictMode>,
);
