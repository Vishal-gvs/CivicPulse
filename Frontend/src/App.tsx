import React from 'react';
import {
  createRouter,
  createRoute,
  createRootRoute,
  RouterProvider,
  Outlet,
} from '@tanstack/react-router';
import { AuthProvider } from './context/AuthContext';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import ReportIssue from './pages/ReportIssue';
import TrackIssues from './pages/TrackIssues';
import Feedback from './pages/Feedback';
import AdminDashboard from './pages/AdminDashboard';
import Analytics from './pages/Analytics';
import Navbar from './components/Navbar';
import { Toaster } from 'sonner';
import { ThemeProvider } from 'next-themes';

const rootRoute = createRootRoute({
  component: () => (
    <AuthProvider>
      <div className="min-h-screen bg-background">
        <Navbar />
        <Outlet />
      </div>
      <Toaster richColors position="top-right" />
    </AuthProvider>
  ),
});

// Public Routes
const homeRoute = createRoute({ getParentRoute: () => rootRoute, path: '/', component: Home });
const loginRoute = createRoute({ getParentRoute: () => rootRoute, path: '/login', component: Login });
const registerRoute = createRoute({ getParentRoute: () => rootRoute, path: '/register', component: Register });

// Protected Routes (handled natively by the components via AuthContext per Medflow/Fullstack standards)
const dashboardRoute = createRoute({ getParentRoute: () => rootRoute, path: '/dashboard', component: Dashboard });
const reportIssueRoute = createRoute({ getParentRoute: () => rootRoute, path: '/report-issue', component: ReportIssue });
const trackIssuesRoute = createRoute({ getParentRoute: () => rootRoute, path: '/track-issues', component: TrackIssues });
const feedbackRoute = createRoute({ getParentRoute: () => rootRoute, path: '/feedback', component: Feedback });
const analyticsRoute = createRoute({ getParentRoute: () => rootRoute, path: '/analytics', component: Analytics });
const adminDashboardRoute = createRoute({ getParentRoute: () => rootRoute, path: '/admin', component: AdminDashboard });

const routeTree = rootRoute.addChildren([
  homeRoute,
  loginRoute,
  registerRoute,
  dashboardRoute,
  reportIssueRoute,
  trackIssuesRoute,
  feedbackRoute,
  analyticsRoute,
  adminDashboardRoute
]);

const router = createRouter({ routeTree });

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

export default function App() {
  const [showSplash, setShowSplash] = React.useState(true);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 800);
    return () => clearTimeout(timer);
  }, []);

  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
      {showSplash ? (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-gradient-amber transition-opacity duration-500">
          <div className="flex flex-col items-center gap-6 animate-pulse">
            <div className="w-24 h-24 sm:w-32 sm:h-32">
              <img src="/CivicPulse.png" alt="CivicPulse Logo" className="w-full h-full object-contain brightness-0 invert" />
            </div>
            <h1 className="text-4xl md:text-6xl font-bold font-display tracking-tight text-white">CivicPulse</h1>
          </div>
        </div>
      ) : (
        <RouterProvider router={router} />
      )}
    </ThemeProvider>
  );
}
