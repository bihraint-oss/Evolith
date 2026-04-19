import { Navigate, Outlet } from "react-router-dom";

import { useSession } from "../lib/session";

/**
 * Redirects anonymous visitors to `/auth` before rendering protected routes.
 */
export function ProtectedRoute(): React.JSX.Element {
  const { session } = useSession();

  if (session === null) {
    return <Navigate replace to="/auth" />;
  }

  return <Outlet />;
}

export default ProtectedRoute;
