import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { ProtectedRoute } from '@/components/layout/ProtectedRoute';
import { AppShell } from '@/components/layout/AppShell';
import { ErrorBoundary } from '@/components/layout/ErrorBoundary';

import Splash from '@/pages/Splash';
import Landing from '@/pages/Landing';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import ForgotPassword from '@/pages/ForgotPassword';
import ResetPassword from '@/pages/ResetPassword';
import Onboarding from '@/pages/Onboarding';
import Dashboard from '@/pages/Dashboard';
import CalendarPage from '@/pages/Calendar';
import LogHub from '@/pages/log/LogHub';
import LogFlow from '@/pages/log/LogFlow';
import LogSymptoms from '@/pages/log/LogSymptoms';
import LogMood from '@/pages/log/LogMood';
import History from '@/pages/History';
import CycleDetails from '@/pages/history/CycleDetails';
import EditPeriod from '@/pages/history/EditPeriod';
import Profile from '@/pages/Profile';
import EditProfile from '@/pages/EditProfile';
import Settings from '@/pages/Settings';
import NotFound from '@/pages/NotFound';

export default function App() {
  return (
    <ErrorBoundary>
      <Toaster position="top-center" toastOptions={{ duration: 3000 }} />
      <Routes>
        {/* Splash + public routes */}
        <Route path="/" element={<Splash />} />
        <Route path="/welcome" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/onboarding" element={<Onboarding />} />

        {/* Protected routes, wrapped in the app shell (content + bottom nav) */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <AppShell>
                <Dashboard />
              </AppShell>
            </ProtectedRoute>
          }
        />
        <Route
          path="/calendar"
          element={
            <ProtectedRoute>
              <AppShell>
                <CalendarPage />
              </AppShell>
            </ProtectedRoute>
          }
        />
        <Route
          path="/log"
          element={
            <ProtectedRoute>
              <AppShell>
                <LogHub />
              </AppShell>
            </ProtectedRoute>
          }
        />
        <Route
          path="/log/flow"
          element={
            <ProtectedRoute>
              <LogFlow />
            </ProtectedRoute>
          }
        />
        <Route
          path="/log/symptoms"
          element={
            <ProtectedRoute>
              <LogSymptoms />
            </ProtectedRoute>
          }
        />
        <Route
          path="/log/mood"
          element={
            <ProtectedRoute>
              <LogMood />
            </ProtectedRoute>
          }
        />
        <Route
          path="/history"
          element={
            <ProtectedRoute>
              <AppShell>
                <History />
              </AppShell>
            </ProtectedRoute>
          }
        />
        <Route
          path="/history/:id"
          element={
            <ProtectedRoute>
              <CycleDetails />
            </ProtectedRoute>
          }
        />
        <Route
          path="/history/:id/edit"
          element={
            <ProtectedRoute>
              <EditPeriod />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <AppShell>
                <Profile />
              </AppShell>
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile/edit"
          element={
            <ProtectedRoute>
              <EditProfile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <Settings />
            </ProtectedRoute>
          }
        />

        {/* 404 */}
        <Route path="/404" element={<NotFound />} />
        <Route path="*" element={<Navigate to="/404" replace />} />
      </Routes>
    </ErrorBoundary>
  );
}
