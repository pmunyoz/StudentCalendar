import type { ReactElement } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import DashboardLayout from "./components/layout/DashboardLayout";
import DashboardPage from "./pages/Dashboard.tsx";
import TasksPage from "./pages/Tasks.tsx";
import ExamsPage from "./pages/Exams.tsx";
import CollabPage from "./pages/Collaboration.tsx";
import SettingsPage from "./pages/Settings.tsx";
import LoginPage from "./pages/Login.tsx";
import { SecurityHeaders } from "./components/security/SecurityHeaders.tsx";
import { AuthProvider, useAuth } from './context/AuthContext';

/**
 * OWASP A01: Broken Access Control
 * Guard component that redirects to login if the user is not authenticated.
 */
function ProtectedRoute({ children }: { children: ReactElement }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!user) {
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
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />

            <Route path="/dashboard" element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
              <Route index element={<DashboardPage />} />
              <Route path="tasks" element={<TasksPage />} />
              <Route path="exams" element={<ExamsPage />} />
              <Route path="collab" element={<CollabPage />} />
              <Route path="settings" element={<SettingsPage />} />
            </Route>

            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </>
  );
}

export default App;
