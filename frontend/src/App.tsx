import type { ReactElement } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom';
import { TopNav } from './components/TopNav';
import { Footer } from './components/Footer';
import { ToastProvider } from './components/Toast';
import { ErrorBoundary } from './components/ErrorBoundary';
import AuthPage from './pages/AuthPage';
import SimulatorSetup from './pages/Simulator/SimulatorSetup';
import LiveSimulator from './pages/Simulator/LiveSimulator';

import RaceEngineer from './pages/RaceEngineer';
import Dashboard from './pages/Dashboard';
import Drivers from './pages/Drivers';
import Teams from './pages/Teams';
import Profile from './pages/Profile';
import Calendar from './pages/Calendar';
import RaceDetail from './pages/RaceDetail';
import AnalysisPage from './pages/Analysis/AnalysisPage';

// Auth Protection Wrapper
const ProtectedRoute = ({ children }: { children: ReactElement }) => {
  return localStorage.getItem('token') ? children : <Navigate to="/auth" replace />;
};

// Global layout containing the Top Navigation Bar — hidden while a simulation is
// playing so the track view gets the full screen (see LiveSimulator's own Exit button).
const MainLayout = () => {
  const location = useLocation();
  const isFullscreenSimulation = location.pathname.startsWith('/simulator/');

  if (isFullscreenSimulation) {
    return (
      <div className="min-h-screen w-screen bg-[#080808] text-white overflow-x-hidden">
        <ErrorBoundary key={location.pathname}>
          <Outlet />
        </ErrorBoundary>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-screen bg-[#080808] text-white flex flex-col overflow-x-hidden">
      <TopNav />
      <main className="flex-1 w-full pt-[60px]">
        <ErrorBoundary key={location.pathname}>
          <Outlet />
        </ErrorBoundary>
      </main>
      <Footer />
    </div>
  );
};

export default function App() {
  return (
    <ToastProvider>
    <BrowserRouter>
      <Routes>
        {/* Authentication view stack */}
        <Route path="/auth" element={<AuthPage />} />

        {/* Unified TopNav Screen Space */}
        <Route path="/" element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
          {/* Root redirect maps to your analytics dashboard view */}
          <Route index element={<Navigate to="/dashboard" replace />} />

          {/* Core Analytics Views */}
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="drivers" element={<Drivers />} />
          <Route path="teams" element={<Teams />} />
          <Route path="race-engineer" element={<RaceEngineer />} />
          <Route path="profile" element={<Profile />} />

          {/* Full season calendar */}
          <Route path="events" element={<Calendar />} />

          {/* Race Analytics detail pages */}
          <Route path="races/:raceId" element={<RaceDetail />} />
          <Route path="analysis/:raceId" element={<AnalysisPage />} />

          {/* Maintained for legacy compatibility during integration transition */}
          <Route path="simulator-setup" element={<SimulatorSetup />} />
          <Route path="simulator/:raceId" element={<LiveSimulator />} />
        </Route>

        {/* Catch-all fallback navigation rules */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
    </ToastProvider>
  );
}
