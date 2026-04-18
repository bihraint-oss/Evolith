import type { GetProfileResponse, SkillNodeView } from "@evolith/shared";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import RadarChart from "../components/RadarChart";
import SkillMap from "../components/SkillMap";
import { ApiClientError, getProfile, getSkills } from "../lib/api";
import { useSession } from "../lib/session";

interface DashboardData {
  profile: GetProfileResponse;
  skills: SkillNodeView[];
}

function getErrorMessage(error: unknown, fallbackMessage: string): string {
  if (error instanceof ApiClientError) {
    return error.message;
  }

  if (error instanceof Error && error.message.length > 0) {
    return error.message;
  }

  return fallbackMessage;
}

function formatLastDiagnosedAt(value: string | null): string {
  if (value === null) {
    return "Not completed yet";
  }

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function countSkillsByStatus(
  skills: SkillNodeView[],
  status: SkillNodeView["status"],
): number {
  return skills.filter((skill) => skill.status === status).length;
}

export function DashboardPage(): React.JSX.Element {
  const navigate = useNavigate();
  const { clearSession, session } = useSession();
  const [bootstrapAttempt, setBootstrapAttempt] = useState(0);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isBootstrapping, setIsBootstrapping] = useState(session !== null);

  useEffect(() => {
    if (session === null) {
      navigate("/auth", { replace: true });
      return;
    }

    let isActive = true;

    setIsBootstrapping(true);
    setDashboardData(null);
    setErrorMessage(null);

    async function bootstrapDashboard(): Promise<void> {
      try {
        const [profileResponse, skillsResponse] = await Promise.all([
          getProfile(),
          getSkills(),
        ]);

        if (!isActive) {
          return;
        }

        if (!profileResponse.hasCompletedDiagnosis) {
          navigate("/diagnosis", { replace: true });
          return;
        }

        setDashboardData({
          profile: profileResponse,
          skills: skillsResponse.skills,
        });
      } catch (error) {
        if (!isActive) {
          return;
        }

        if (error instanceof ApiClientError && error.isAuthExpired) {
          clearSession();
          navigate("/auth", { replace: true });
          return;
        }

        setErrorMessage(
          getErrorMessage(
            error,
            "We could not load your dashboard. Please try again.",
          ),
        );
      } finally {
        if (isActive) {
          setIsBootstrapping(false);
        }
      }
    }

    void bootstrapDashboard();

    return () => {
      isActive = false;
    };
  }, [bootstrapAttempt, clearSession, navigate, session]);

  function handleRetry(): void {
    setBootstrapAttempt((currentAttempt) => currentAttempt + 1);
  }

  function handleSignOut(): void {
    clearSession();
    navigate("/auth", { replace: true });
  }

  if (session === null) {
    return (
      <main className="min-h-screen px-6 py-10 text-ink-950">
        <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-4xl items-center justify-center rounded-4xl border border-white/70 bg-white/85 p-8 shadow-card backdrop-blur">
          <div className="max-w-md space-y-3 text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.35em] text-clay-500">
              Dashboard
            </p>
            <h1 className="text-3xl font-semibold tracking-tight">
              Redirecting to sign in
            </h1>
            <p className="text-base text-ink-700">
              This view requires an authenticated session.
            </p>
          </div>
        </div>
      </main>
    );
  }

  if (isBootstrapping) {
    return (
      <main className="min-h-screen px-6 py-10 text-ink-950">
        <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-4xl items-center justify-center rounded-4xl border border-white/70 bg-white/85 p-8 shadow-card backdrop-blur">
          <div className="max-w-md space-y-3 text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.35em] text-clay-500">
              Dashboard
            </p>
            <h1 className="text-3xl font-semibold tracking-tight">
              Loading your saved profile
            </h1>
            <p className="text-base text-ink-700">
              We are checking the live profile and skill graph before rendering the dashboard.
            </p>
          </div>
        </div>
      </main>
    );
  }

  if (dashboardData === null) {
    return (
      <main className="min-h-screen px-6 py-10 text-ink-950">
        <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-4xl items-center justify-center rounded-4xl border border-white/70 bg-white/85 p-8 shadow-card backdrop-blur">
          <section className="max-w-lg space-y-5 rounded-[2rem] border border-clay-200 bg-sand-50 p-8 shadow-sm">
            <div className="space-y-2">
              <p className="text-sm font-semibold uppercase tracking-[0.35em] text-clay-500">
                Dashboard Unavailable
              </p>
              <h1 className="text-3xl font-semibold tracking-tight text-ink-950">
                We could not load your current view
              </h1>
              <p className="text-base text-ink-700">
                {errorMessage ?? "The dashboard request did not complete."}
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                className="rounded-full bg-ink-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-ink-900"
                onClick={handleRetry}
                type="button"
              >
                Retry dashboard
              </button>
              <button
                className="rounded-full border border-clay-300 px-5 py-3 text-sm font-semibold text-ink-950 transition hover:border-clay-500 hover:bg-white"
                onClick={handleSignOut}
                type="button"
              >
                Sign out
              </button>
            </div>
          </section>
        </div>
      </main>
    );
  }

  const { profile, skills } = dashboardData;
  const radarData = profile.radar ?? [];

  return (
    <main className="min-h-screen px-6 py-10 text-ink-950">
      <div className="mx-auto max-w-7xl space-y-8 rounded-4xl border border-white/70 bg-white/85 p-6 shadow-card backdrop-blur lg:p-8">
        <section className="grid gap-6 rounded-[2rem] bg-[linear-gradient(135deg,rgba(19,34,56,0.98),rgba(48,76,96,0.92))] p-8 text-white lg:grid-cols-[1.05fr_0.95fr]">
          <div className="space-y-5">
            <p className="text-sm font-semibold uppercase tracking-[0.35em] text-sand-100/80">
              Dashboard
            </p>
            <div className="space-y-3">
              <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
                {session.user.displayName}, your current AI collaboration profile is ready.
              </h1>
              <p className="max-w-2xl text-base text-sand-100/80 sm:text-lg">
                Evolith loaded your saved diagnosis radar and the current authored skill roadmap
                so the next steps reflect live backend state instead of cached assumptions.
              </p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <article className="rounded-[1.5rem] border border-white/10 bg-white/10 p-5">
              <p className="text-sm font-semibold text-sand-50">Last diagnosis</p>
              <p className="mt-2 text-lg font-semibold">
                {formatLastDiagnosedAt(profile.lastDiagnosedAt)}
              </p>
            </article>
            <article className="rounded-[1.5rem] border border-white/10 bg-white/10 p-5">
              <p className="text-sm font-semibold text-sand-50">Available now</p>
              <p className="mt-2 text-4xl font-semibold">
                {countSkillsByStatus(skills, "available")}
              </p>
            </article>
            <article className="rounded-[1.5rem] border border-white/10 bg-white/10 p-5">
              <p className="text-sm font-semibold text-sand-50">In progress</p>
              <p className="mt-2 text-4xl font-semibold">
                {countSkillsByStatus(skills, "inProgress")}
              </p>
            </article>
            <article className="rounded-[1.5rem] border border-white/10 bg-white/10 p-5">
              <p className="text-sm font-semibold text-sand-50">Completed</p>
              <p className="mt-2 text-4xl font-semibold">
                {countSkillsByStatus(skills, "completed")}
              </p>
            </article>
          </div>
        </section>

        <div className="grid gap-8 xl:grid-cols-[0.9fr_1.1fr]">
          <RadarChart data={radarData} />
          <SkillMap skills={skills} />
        </div>
      </div>
    </main>
  );
}

export default DashboardPage;
