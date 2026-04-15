import { BrowserRouter as Router, Routes, Route, Navigate, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import { NotificationProvider } from './context/NotificationContext';
import React, { useState, useEffect, createContext, useContext, lazy, Suspense } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Calendar,
  Clock,
  Bot,
  History as HistoryIcon,
  ArrowUpRight,
  Plus,
  Rocket,
} from 'lucide-react';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import GlobalLoader from './components/GlobalLoader';
import { apiFetch } from './api';
import ScheduleMeetingModal from './components/ScheduleMeetingModal';
import { ToastProvider, useToast } from './components/ui/ToastProvider';
import { UserSettingsProvider } from './context/UserSettingsContext';
import { useUserSettings } from './context/UserSettingsContext';
import { useNotifications } from './context/NotificationContext';
import { LoaderProvider, useLoader } from './context/LoaderContext';
import BottomNav from './components/BottomNav';
import VoiceAssistantUI from './components/VoiceAssistantUI';
import NotificationsPanel from './components/NotificationsPanel';

const LandingPage = lazy(() => import('./pages/LandingPage'));
const Login = lazy(() => import('./pages/Login'));
const OTPVerify = lazy(() => import('./pages/OTPVerify'));
const MeetingRoom = lazy(() => import('./pages/MeetingRoom'));
const History = lazy(() => import('./pages/History'));
const Profile = lazy(() => import('./pages/Profile'));
const MeetingDetail = lazy(() => import('./pages/MeetingDetail'));
const AIAssistant = lazy(() => import('./pages/AIAssistant'));
const Reports = lazy(() => import('./pages/Reports'));
const Notifications = lazy(() => import('./pages/Notifications'));
const Settings = lazy(() => import('./pages/Settings'));
const Background3D = lazy(() => import('./components/Background3D'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const TaskManager = lazy(() => import('./pages/TaskManager'));
const Meetings = lazy(() => import('./pages/Meetings'));
const Email = lazy(() => import('./pages/Email'));
const AIProxy = lazy(() => import('./pages/AIProxy'));
const DigitalTwin = lazy(() => import('./pages/DigitalTwin'));

const NotificationToastBridge = () => {
  const { registerToastCallback } = useNotifications();
  const { addToast } = useToast();
  useEffect(() => {
    registerToastCallback(addToast);
  }, [registerToastCallback, addToast]);
  return null;
};

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

const ProtectedRoute = () => {
  const token = localStorage.getItem('token');
  if (!token) {
    return <Navigate to="/welcome" replace />;
  }
  return <Outlet />;
};

const RouteSkeleton = () => (
  <div className="mx-auto w-full max-w-7xl space-y-5 py-6">
    <div className="skeleton h-8 w-52 rounded-xl" />
    <div className="grid gap-5 lg:grid-cols-3">
      <div className="skeleton h-48 rounded-3xl" />
      <div className="skeleton h-48 rounded-3xl" />
      <div className="skeleton h-48 rounded-3xl" />
    </div>
  </div>
);

class RouteErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error) {
    console.error('Route render error:', error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="mx-auto w-full max-w-4xl rounded-2xl border border-rose-400/30 bg-rose-500/10 p-6 text-rose-200">
          <h2 className="text-lg font-semibold">Page failed to render</h2>
          <p className="mt-2 text-sm">There was an error rendering this page. Please refresh.</p>
        </div>
      );
    }
    return this.props.children;
  }
}

const AppLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const location = useLocation();

  return (
    <div className="min-h-screen overflow-x-hidden bg-app text-[var(--txt-primary)]">
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      <div className="flex min-h-screen flex-col lg:pl-[280px]">
        <Navbar 
          onToggleSidebar={() => setIsSidebarOpen((current) => !current)} 
          onOpenNotifications={() => setIsNotificationsOpen(true)}
        />
        <main className="flex-1 px-4 pb-28 pt-32 sm:px-6 lg:px-10">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.28, ease: 'easeInOut' }}
              className="mx-auto w-full max-w-7xl"
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
      <NotificationsPanel isOpen={isNotificationsOpen} onClose={() => setIsNotificationsOpen(false)} />
      <BottomNav />
      <VoiceAssistantUI />
    </div>
  );
};




function AppRoutes() {
  const location = useLocation();

  return (
    <div className="relative font-['Inter',sans-serif]">
      <Suspense fallback={null}>
        <Background3D />
      </Suspense>
      <NotificationToastBridge />
      <Suspense fallback={<RouteSkeleton />}>
        <AnimatePresence mode="wait" initial={false}>
          <Routes location={location} key={location.pathname}>
            <Route path="/welcome" element={<LandingPage />} />
            <Route path="/login" element={<Login />} />
            <Route path="/verify-otp" element={<OTPVerify />} />

            <Route element={<ProtectedRoute />}>
              <Route element={<AppLayout />}>
                <Route path="/" element={<Dashboard />} />
                {/* BUG-002 FIX: Redirect /dashboard to / */}
                <Route path="/dashboard" element={<Navigate to="/" replace />} />
                <Route path="/history" element={<RouteErrorBoundary><History /></RouteErrorBoundary>} />
                <Route path="/history/:id" element={<RouteErrorBoundary><MeetingDetail /></RouteErrorBoundary>} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/assistant" element={<AIAssistant />} />
                <Route path="/digital-twin" element={<DigitalTwin />} />
                <Route path="/digital-twin" element={<DigitalTwin />} />
                <Route path="/meetings" element={<Meetings />} />
                <Route path="/proxy/:id" element={<AIProxy />} />
                <Route path="/tasks" element={<TaskManager />} />
                <Route path="/emails" element={<Email />} />
                <Route path="/reports" element={<Reports />} />
                <Route path="/notifications" element={<Notifications />} />
              </Route>
              <Route path="/meeting/:roomId" element={<MeetingRoom />} />
            </Route>
            {/* BUG-026 FIX: Catch-all 404 redirect */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AnimatePresence>
      </Suspense>
    </div>
  );
}

function App() {
  return (
    <SocketProvider>
      <AuthProvider>
        <NotificationProvider>
          <UserSettingsProvider>
            <ToastProvider>
              <LoaderProvider>
                <Router>
                  <AppRoutes />
                </Router>
              </LoaderProvider>
            </ToastProvider>
          </UserSettingsProvider>
        </NotificationProvider>
      </AuthProvider>
    </SocketProvider>
  );
}

export default App;
