import type { ReactNode } from "react";
import { Outlet } from "react-router-dom";

/**
 * Allows the app shell to wrap routed content or explicit children.
 */
export interface AppShellProps {
  children?: ReactNode;
}

/**
 * Provides the shared page chrome and atmospheric background for routed content.
 */
export function AppShell(props: AppShellProps): React.JSX.Element {
  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[radial-gradient(circle_at_top_left,rgba(232,216,201,0.9),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(201,123,87,0.16),transparent_28%),linear-gradient(180deg,#fdf8f3_0%,#f5ede3_100%)]">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.45),transparent_40%)]" />
      <div className="pointer-events-none absolute left-0 top-0 h-72 w-72 -translate-x-20 -translate-y-20 rounded-full bg-white/40 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 right-0 h-80 w-80 translate-x-20 translate-y-16 rounded-full bg-clay-200/40 blur-3xl" />

      <div className="relative">{props.children ?? <Outlet />}</div>
    </div>
  );
}

export default AppShell;
