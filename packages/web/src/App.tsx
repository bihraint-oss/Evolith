type PlaceholderPanel = {
  title: string;
  description: string;
  eyebrow: string;
};

const placeholderPanels: PlaceholderPanel[] = [
  {
    title: "Auth",
    description: "Register and login flows will land here next, backed by the existing Hono auth endpoints.",
    eyebrow: "Route /auth",
  },
  {
    title: "Diagnosis",
    description: "The six-question diagnosis flow will resume server-side sessions instead of duplicating state in the browser.",
    eyebrow: "Route /diagnosis",
  },
  {
    title: "Dashboard",
    description: "Radar results and grouped skill states will render from profile and skills API responses without recomputation.",
    eyebrow: "Route /dashboard",
  },
];

export default function App() {
  return (
    <main className="app-shell">
      <section className="hero card">
        <div className="hero-kicker">Phase 4 frontend scaffold</div>
        <h1>Diagnosis-driven growth, staged for the demo loop.</h1>
        <p className="hero-copy">
          The Vite client is wired into the workspace and ready for the auth,
          diagnosis, and dashboard routes that will layer on top of the existing API.
        </p>
        <div className="hero-actions">
          <a
            className="button-primary"
            href="http://localhost:3000/api/health"
            rel="noreferrer"
            target="_blank"
          >
            Check API health
          </a>
          <span className="pill">React + Vite + Tailwind foundation</span>
        </div>
      </section>

      <section className="panel-grid">
        {placeholderPanels.map((panel) => (
          <article
            className="card panel-card"
            key={panel.title}
          >
            <p className="panel-eyebrow">{panel.eyebrow}</p>
            <h2>{panel.title}</h2>
            <p>{panel.description}</p>
          </article>
        ))}
      </section>
    </main>
  );
}
