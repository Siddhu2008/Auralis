import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from './AuthContext';
import { useSocket } from './SocketContext';
import { apiFetch } from '../api';

const NotificationContext = createContext();

export const useNotifications = () => useContext(NotificationContext);

export const NotificationProvider = ({ children }) => {
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const { isAuthenticated, user } = useAuth();
    const socket = useSocket();
    const toastCbRef = useRef(null);
    const seenIdsRef = useRef(new Set());

    // Stable toast registration (called by NotificationToastBridge once)
    const registerToastCallback = useCallback((cb) => {
        toastCbRef.current = cb;
    }, []);

    // Stable fetch function – safe to use as a dependency
    const fetchNotifications = useCallback(async () => {
        const token = localStorage.getItem('token');
        if (!token) return;

        try {
            const res = await apiFetch('/api/notifications', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!res.ok) return;
            const data = await res.json();
            const notifs = data.notifications || [];

            setNotifications(notifs);
            const unread = notifs.filter(n => !n.is_read);
            setUnreadCount(unread.length);

            // Fire toasts only for genuinely new unread items
            if (toastCbRef.current) {
                unread.forEach(n => {
                    if (!seenIdsRef.current.has(n.id)) {
                        seenIdsRef.current.add(n.id);
                        toastCbRef.current({
                            type: n.type === 'success' ? 'success' : n.type === 'error' ? 'error' : 'info',
                            title: 'New Notification',
                            message: n.message,
                        });
                    }
                });
            } else {
                // Seed without toasts on first load
                unread.forEach(n => seenIdsRef.current.add(n.id));
            }
        } catch (err) {
            console.error('Failed to fetch notifications:', err);
        }
    }, []); // No deps — only references stable refs and state setters

    useEffect(() => {
        if (!isAuthenticated) {
            setNotifications([]);
            setUnreadCount(0);
            seenIdsRef.current = new Set();
            return;
        }

        // WebSocket listener
        if (socket && isAuthenticated && user && user.id) {
            const joinUserRoom = () => {
                console.log(`[Socket] Joining private room for user ${user.id}`);
                socket.emit('join_user', { user_id: user.id });
            };

            // Join immediately
            joinUserRoom();

            // Re-join on reconnect
            socket.on('connect', joinUserRoom);

            socket.on('new_notification', (notif) => {
                console.log("[Socket] Received new notification:", notif);
                setNotifications(prev => {
                    const exists = prev.some(n => n.id === notif.id);
                    if (exists) return prev;
                    return [notif, ...prev];
                });
                if (!notif.is_read) {
                    setUnreadCount(prev => prev + 1);
                    if (toastCbRef.current) {
                        toastCbRef.current({
                            type: notif.type === 'success' ? 'success' : notif.type === 'error' ? 'error' : 'info',
                            title: notif.title || 'New Signal',
                            message: notif.message,
                        });
                    }
                }
            });

            // Cleanup for this specific socket/user combo
            return () => {
                socket.off('connect', joinUserRoom);
                socket.off('new_notification');
            };
        }
    }, [isAuthenticated, user, socket]);

    useEffect(() => {
        if (!isAuthenticated) return;

        // Immediate fetch, then poll every 30 s
        fetchNotifications();
        const interval = setInterval(fetchNotifications, 30000);
        return () => clearInterval(interval);
    }, [isAuthenticated, fetchNotifications]);

    const clearAll = useCallback(async () => {
        const token = localStorage.getItem('token');
        if (!token) return;

        try {
            const res = await apiFetch('/api/notifications', {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                setNotifications([]);
                setUnreadCount(0);
                seenIdsRef.current = new Set();
            }
        } catch (err) {
            console.error('Failed to clear notifications:', err);
        }
    }, []);

    return (
        <NotificationContext.Provider
            value={{
                notifications,
                unreadCount,
                refreshNotifications: fetchNotifications,
                registerToastCallback,
                clearAll,
            }}
        >
            {children}
        </NotificationContext.Provider>
    );
};
