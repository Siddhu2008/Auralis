import { useState } from 'react';
import { Search, Bell, User, Zap, Menu } from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { deriveAvatarFromEmail } from '../utils/userProfile';

const Navbar = ({ onToggleSidebar, onOpenNotifications }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { unreadCount } = useNotifications();
  const [imgFailed, setImgFailed] = useState(false);
  // Only use real profile image, not Gravatar fallback — we'll show initials instead
  const avatarSrc = user?.profile_image || '';
  const userInitial = (user?.name || user?.email || 'U').charAt(0).toUpperCase();

  return (
    <div className="pointer-events-none fixed left-0 right-0 top-4 z-40 flex justify-center px-4 lg:left-[280px]">
      <motion.header
        initial={{ y: -16, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.28, ease: 'easeOut' }}
        className="pointer-events-auto relative flex h-14 w-full max-w-[1200px] items-center justify-between premium-card px-3 sm:h-16 sm:px-6 lg:px-8"
      >
        <div className="flex min-w-0 flex-1 items-center gap-3 sm:gap-4">
          <button
            onClick={onToggleSidebar}
            className="rounded-xl border border-white/12 p-2 text-slate-200 transition hover:bg-white/10 lg:hidden"
            aria-label="Toggle sidebar"
          >
            <Menu className="h-5 w-5" />
          </button>

          <div className="group relative hidden max-w-md flex-1 sm:block">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500 transition group-focus-within:text-cyan-300" />
            <input
              type="text"
              placeholder="Ask AI assistant"
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  navigate('/assistant');
                  event.currentTarget.value = '';
                }
              }}
              className="w-full rounded-2xl border border-[var(--glass-border)] bg-slate-900/50 py-2.5 pl-10 pr-4 text-sm text-[var(--txt-primary)] outline-none transition focus:border-[var(--primary)]"
              aria-label="Search"
            />
          </div>
        </div>

        <div className="ml-4 flex items-center gap-3 sm:gap-4">
          <div className="hidden items-center gap-2 rounded-xl border border-cyan-300/20 bg-cyan-500/8 px-3 py-1.5 md:flex">
            <Zap className="h-3.5 w-3.5 text-cyan-300" />
            <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-cyan-100">Realtime</span>
          </div>

          <button
            onClick={onOpenNotifications || (() => navigate('/notifications'))}
            className="relative rounded-xl border border-[var(--glass-border)] p-2 text-[var(--txt-secondary)] transition hover:bg-[var(--glass)] hover:text-white"
            aria-label="Open notifications"
          >
            <Bell className="h-5 w-5 text-white" />
            {unreadCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-[var(--accent)] text-[10px] font-black text-slate-950 shadow-lg shadow-cyan-500/40">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          <button
            onClick={() => navigate('/profile')}
            className="flex items-center gap-2 rounded-xl border border-white/12 bg-white/5 px-2.5 py-1.5 transition hover:bg-white/10"
            aria-label="Open profile"
          >
            <div className="h-8 w-8 overflow-hidden rounded-lg bg-gradient-to-r from-indigo-500 via-blue-500 to-cyan-500 p-[1px]">
              <div className="flex h-full w-full items-center justify-center rounded-[7px] bg-slate-950">
                {avatarSrc && !imgFailed ? (
                  <img
                    src={avatarSrc}
                    alt="Profile"
                    className="h-full w-full rounded-[7px] object-cover"
                    onError={() => setImgFailed(true)}
                  />
                ) : (
                  <span className="text-sm font-bold bg-gradient-to-br from-cyan-400 to-blue-500 bg-clip-text text-transparent">
                    {userInitial}
                  </span>
                )}
              </div>
            </div>
            <div className="hidden text-left sm:block">
              <p className="max-w-[130px] truncate text-sm font-semibold text-white">{user?.name || 'Operator'}</p>
              <p className="text-[11px] text-slate-400">{user?.role || 'Member'}</p>
            </div>
          </button>
        </div>
      </motion.header>
    </div>
  );
};

export default Navbar;
