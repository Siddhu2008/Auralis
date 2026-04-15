import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, Bot, Video, FileText, Bell } from 'lucide-react';
import { useNotifications } from '../context/NotificationContext';

const BottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { unreadCount } = useNotifications();

  const navItems = [
    { id: 'dashboard', icon: LayoutDashboard, path: '/' },
    { id: 'assistant', icon: Bot, path: '/assistant' },
    { id: 'meetings', icon: Video, path: '/meetings' },
    { id: 'reports', icon: FileText, path: '/reports' },
    { id: 'notifications', icon: Bell, path: '/notifications', badge: unreadCount > 0 },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 lg:hidden px-4 pb-4">
      <div className="glass-card flex items-center justify-between px-6 py-3 shadow-2xl rounded-[24px]">
        {navItems.map((item) => {
          const active = location.pathname === item.path;
          const Icon = item.icon;
          
          return (
            <button
              key={item.id}
              onClick={() => navigate(item.path)}
              className="relative flex flex-col items-center justify-center w-12 h-12 rounded-xl transition-all"
            >
              <div className={`flex items-center justify-center w-10 h-10 rounded-xl transition-colors ${
                active ? 'btn-gradient' : 'text-[var(--txt-secondary)] hover:text-white hover:bg-white/5'
              }`}>
                <Icon className={`w-5 h-5 ${active ? 'text-white' : ''}`} />
                {item.badge && !active && (
                  <span className="absolute top-2 right-2 flex h-2.5 w-2.5 rounded-full bg-[var(--accent)]"></span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default BottomNav;
