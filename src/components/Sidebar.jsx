import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Bell, LogOut, Sparkles, X, Bot, Settings,
  FileText, Video, CheckSquare, Clock, Brain, BarChart2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';

const Sidebar = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout, user } = useAuth();
  const { unreadCount } = useNotifications();

  const mainMenu = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/' },
    { id: 'assistant', label: 'AI Assistant', icon: Bot, path: '/assistant' },
    { id: 'meetings', label: 'Meetings', icon: Video, path: '/meetings' },
    { id: 'emails', label: 'Emails', icon: FileText, path: '/emails' },
    { id: 'tasks', label: 'Tasks', icon: CheckSquare, path: '/tasks' },
  ];

  const intelligenceMenu = [
    { id: 'twin', label: 'Digital Twin', icon: Brain, path: '/digital-twin' },
    { id: 'analytics', label: 'Meeting report', icon: BarChart2, path: '/reports' },
  ];

  const systemMenu = [
    { id: 'settings', label: 'Settings', icon: Settings, path: '/settings' },
  ];

  const NavGroup = ({ title, items }) => (
    <div className="mb-6">
      <h3 className="text-[10px] font-bold text-[var(--txt-secondary)] uppercase tracking-[0.2em] mb-3 px-4">{title}</h3>
      <nav className="space-y-1">
        {items.map((item) => {
          const Icon = item.icon;
          const active = location.pathname === item.path;
          return (
            <button
              key={item.id}
              onClick={() => { navigate(item.path); onClose(); }}
              className={`group relative flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-left transition-all ${
                active ? 'bg-[var(--primary)]/10 text-[var(--primary)] font-semibold border border-[var(--primary)]/20 shadow-sm' : 'text-[var(--txt-secondary)] hover:bg-white/5 hover:text-white'
              }`}
            >
              <Icon className={`h-4 w-4 ${active ? 'text-[var(--primary)]' : 'group-hover:text-[var(--primary)] transition-colors'}`} />
              <span className="text-sm flex-1">{item.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.button key="overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onClick={onClose} className="fixed inset-0 z-40 bg-slate-950/70 backdrop-blur-sm lg:hidden"
        />
      )}

      <motion.aside
        initial={false}
        className={`fixed left-0 top-0 z-50 flex h-screen w-64 flex-col bg-[#0F172A] border-r border-[var(--glass-border)] py-6 transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="mb-8 flex items-center justify-between lg:hidden px-6">
          <p className="text-sm font-semibold text-white">Menu</p>
          <button onClick={onClose} className="rounded-xl border border-white/10 p-2 text-slate-300 hover:bg-white/10"><X className="h-4 w-4" /></button>
        </div>

        <div className="mb-10 flex items-center gap-3 px-6">
          <div className="rounded-xl bg-gradient-to-br from-[var(--primary)] to-[var(--accent)] p-2 shadow-lg shadow-[var(--primary)]/20">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <p className="font-display text-2xl font-bold text-white tracking-tight">Auralis</p>
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-none px-2">
           <NavGroup title="Main" items={mainMenu} />
           <NavGroup title="Intelligence" items={intelligenceMenu} />
           <NavGroup title="System" items={systemMenu} />
        </div>

        <div className="mt-auto px-4 pt-4 border-t border-[var(--glass-border)] pb-20 lg:pb-0">
          <button onClick={logout} className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors">
            <LogOut className="h-4 w-4" /> Sign Out
          </button>
        </div>
      </motion.aside>
    </AnimatePresence>
  );
};

export default Sidebar;
