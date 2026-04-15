import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Bell, Calendar, CheckSquare, Sparkles } from 'lucide-react';
import { useNotifications } from '../context/NotificationContext';
import { useNavigate } from 'react-router-dom';

const NotificationsPanel = ({ isOpen, onClose }) => {
  const { notifications, removeNotification, clearAll } = useNotifications();
  const navigate = useNavigate();

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[60] bg-slate-950/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-y-0 right-0 z-[70] w-full max-w-sm flex flex-col premium-card rounded-none rounded-l-[32px] border-y-0 border-r-0 border-l border-[var(--glass-border)] shadow-2xl"
          >
            <div className="flex items-center justify-between p-6 border-b border-[var(--glass-border)]">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-[var(--primary)]/10 text-[var(--primary)]">
                  <Bell className="w-5 h-5" />
                </div>
                <h2 className="text-lg font-semibold text-white">Notifications</h2>
              </div>
              <button 
                onClick={onClose}
                className="p-2 rounded-xl text-[var(--txt-secondary)] hover:bg-[var(--glass)] hover:text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
              {notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-[var(--txt-secondary)] space-y-4">
                  <Bell className="w-12 h-12 opacity-20" />
                  <p>You're all caught up!</p>
                </div>
              ) : (
                notifications.map((notif) => (
                  <motion.div 
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    key={notif.id}
                    className="p-4 rounded-2xl glass-card relative group hover:bg-[var(--glass)] transition cursor-pointer"
                  >
                    <div className="flex gap-3">
                      <div className="mt-1">
                        {notif.type === 'meeting' && <Calendar className="w-5 h-5 text-blue-400" />}
                        {notif.type === 'task' && <CheckSquare className="w-5 h-5 text-[var(--accent)]" />}
                        {notif.type === 'ai' && <Sparkles className="w-5 h-5 text-purple-400" />}
                        {!['meeting', 'task', 'ai'].includes(notif.type) && <Bell className="w-5 h-5 text-slate-300" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm text-white">{notif.title}</p>
                        <p className="text-sm text-[var(--txt-secondary)] mt-0.5 line-clamp-2">{notif.message}</p>
                        <p className="text-xs text-slate-500 mt-2">{notif.time || 'Just now'}</p>
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </div>

            {notifications.length > 0 && (
              <div className="p-4 border-t border-[var(--glass-border)]">
                <button 
                  onClick={() => {
                    clearAll();
                    setTimeout(onClose, 300);
                  }}
                  className="w-full py-3 rounded-xl text-sm font-semibold text-white bg-slate-800 hover:bg-slate-700 transition"
                >
                  Clear all history
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default NotificationsPanel;
