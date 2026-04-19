import { Navigate, Route, Routes } from "react-router-dom";

import AppShell from "./components/AppShell";
import ProtectedRoute from "./components/ProtectedRoute";
import AuthPage from "./pages/Auth";
import DashboardPage from "./pages/Dashboard";
import DiagnosisPage from "./pages/Diagnosis";

/**
 * Declares the top-level browser routes for auth, diagnosis, and dashboard flows.
 */
export function App(): React.JSX.Element {
  return (
    <Routes>
      <Route element={<AppShell />} path="/">
        <Route element={<Navigate replace to="/auth" />} index />
        <Route element={<AuthPage />} path="auth" />

        <Route element={<ProtectedRoute />}>
          <Route element={<DiagnosisPage />} path="diagnosis" />
          <Route element={<DashboardPage />} path="dashboard" />
        </Route>

        <Route element={<Navigate replace to="/" />} path="*" />
      </Route>
    </Routes>
  );
}

export default App;
