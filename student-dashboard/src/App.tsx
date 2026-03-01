import type { ReactElement } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import DashboardLayout from "./components/layout/DashboardLayout";
import DashboardPage from "./pages/Dashboard.tsx";
import TasksPage from "./pages/Tasks.tsx";
import ExamsPage from "./pages/Exams.tsx";
import CollabPage from "./pages/Collaboration.tsx";
import LoginPage from "./pages/Login.tsx";
import { SecurityHeaders } from "./components/security/SecurityHeaders.tsx";

/**
 * OWASP A01: Broken Access Control
 * Guard component that redirects to login if the user is not authenticated.
 * Note: In a real app, this would check a JWT or auth context.
 */
function ProtectedRoute({ children }: { children: ReactElement }) {
  const isAuthenticated = true; // Mocked: Assume true for UI showcase. Change to false to test guard.
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}

/**
 * Componente principal de la app
 */
function App() {
  return (
    <>
      <SecurityHeaders />
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />

          <Route path="/dashboard" element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
            <Route index element={<DashboardPage />} />
            <Route path="tasks" element={<TasksPage />} />
            <Route path="exams" element={<ExamsPage />} />
            <Route path="collab" element={<CollabPage />} />
          </Route>

          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </>
  );
}

export default App;
