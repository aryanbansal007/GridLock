import type { ReactElement } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom';
import { TopNav } from './components/TopNav';
import { Footer } from './components/Footer';
import { ToastProvider } from './components/Toast';
import { ErrorBoundary } from './components/ErrorBoundary';
import AuthPage from './pages/AuthPage';
import LandingPage from './pages/LandingPage';
import SimulatorSetup from './pages/Simulator/SimulatorSetup';
import LiveSimulator from './pages/Simulator/LiveSimulator';

import RaceEngineer from './pages/RaceEngineer';
import Dashboard from './pages/Dashboard';
import Drivers from './pages/Drivers';
import Teams from './pages/Teams';
import Profile from './pages/Profile';
import Calendar from './pages/Calendar';
import RaceDetail from './pages/RaceDetail';
import RaceControlPage from './pages/RaceControlPage';
import AnalysisPage from './pages/Analysis/AnalysisPage';

// Auth gate, used only where an account is genuinely needed: the Race Engineer (the AI
// calls cost money and are tied to a user's chat history) and the profile. Everything
// else — standings, calendar, race pages, analysis, the simulator — is open to anyone.
// The destination rides along as ?next= so logging in drops people where they were headed.
const ProtectedRoute = ({ children }: { children: ReactElement }) => {
  const location = useLocation();
  if (localStorage.getItem('token')) return children;
  return <Navigate to={`/auth?next=${encodeURIComponent(location.pathname + location.search)}`} replace />;
};

// The bare "/" URL is the only route that behaves differently depending on auth
// state: visitors without an account see the marketing Landing Page, logged-in
// visitors go straight to their dashboard.
const RootIndex = () => {
  return localStorage.getItem('token') ? <Navigate to="/dashboard" replace /> : <LandingPage />;
};

// Global layout containing the Top Navigation Bar — hidden while a simulation is
// playing so the track view gets the full screen (see LiveSimulator's own Exit button).
const MainLayout = () => {
  const location = useLocation();
  const isFullscreenSimulation = location.pathname.startsWith('/simulator/');
  // A chat interface needs a fixed-height viewport (message list scrolls
  // internally, input stays pinned to the bottom) rather than the normal
  // page-scrolls-and-Footer-sits-at-the-end layout every other page uses.
  const isChatPage = location.pathname.startsWith('/race-engineer');

  if (isFullscreenSimulation) {
    return (
      <div className="min-h-screen w-screen bg-[#080808] text-white overflow-x-hidden">
        <ErrorBoundary key={location.pathname}>
          <Outlet />
        </ErrorBoundary>
      </div>
    );
  }

  if (isChatPage) {
    return (
      <div className="h-screen w-screen bg-[#080808] text-white flex flex-col overflow-hidden">
        <TopNav />
        <main className="pt-15 flex-1 min-h-0">
          <ErrorBoundary key={location.pathname}>
            <Outlet />
          </ErrorBoundary>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-screen bg-[#080808] text-white flex flex-col overflow-x-hidden">
      <TopNav />
      <main className="flex-1 w-full pt-15">
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
        {/* Public routes */}
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/" element={<RootIndex />} />

        {/* Unified TopNav screen space — a pathless layout route, since each
            child below now owns its own absolute path (avoids two routes both
            claiming "/", which RootIndex already owns on its own). Open to everyone. */}
        <Route element={<MainLayout />}>
          {/* Core Analytics Views */}
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/drivers" element={<Drivers />} />
          <Route path="/teams" element={<Teams />} />

          {/* Account-only: needs a login (see ProtectedRoute) */}
          <Route path="/race-engineer" element={<ProtectedRoute><RaceEngineer /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />

          {/* Full season calendar */}
          <Route path="/events" element={<Calendar />} />

          {/* Race Analytics detail pages */}
          <Route path="/races/:raceId" element={<RaceDetail />} />
          <Route path="/races/:raceId/control" element={<RaceControlPage />} />
          <Route path="/analysis/:raceId" element={<AnalysisPage />} />

          {/* Maintained for legacy compatibility during integration transition */}
          <Route path="/simulator-setup" element={<SimulatorSetup />} />
          <Route path="/simulator/:raceId" element={<LiveSimulator />} />
        </Route>

        {/* Catch-all fallback navigation rules */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
    </ToastProvider>
  );
}
