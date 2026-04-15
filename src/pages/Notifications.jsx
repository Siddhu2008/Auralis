import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Bell, Check, ArrowLeft, Clock, Info, CheckCircle2, AlertCircle, Inbox, Radio, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../context/NotificationContext';
import { apiFetch } from '../api';

const Notifications = () => {
    const { notifications, refreshNotifications } = useNotifications();
    const [loading, setLoading] = useState(false);
    const [seeding, setSeeding] = useState(false);
    const navigate = useNavigate();

    // Always fetch fresh when user enters the page
    useEffect(() => {
        refreshNotifications();
    }, [refreshNotifications]);

    const markAsRead = async (id) => {
        const token = localStorage.getItem('token');
        try {
            await apiFetch(`/api/notifications/${id}/read`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            refreshNotifications();
        } catch (err) {
            console.error("Failed to mark notification as read:", err);
        }
    };

    const markAllRead = async () => {
        const unread = notifications.filter(n => !n.is_read);
        if (unread.length === 0) return;

        setLoading(true);
        const token = localStorage.getItem('token');
        try {
            await Promise.all(unread.map(n =>
                apiFetch(`/api/notifications/${n.id}/read`, {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${token}` }
                })
            ));
            refreshNotifications();
        } catch (err) {
            console.error("Failed to mark all as read:", err);
        } finally {
            setLoading(false);
        }
    };

    const createTestNotification = async () => {
        setSeeding(true);
        const token = localStorage.getItem('token');
        try {
            await apiFetch('/api/notifications/test', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            await refreshNotifications();
        } catch (err) {
            console.error("Failed to create test notification:", err);
        } finally {
            setSeeding(false);
        }
    };

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.05 }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 10 },
        visible: { opacity: 1, y: 0 }
    };

    const getIcon = (type) => {
        switch (type) {
            case 'success': return <CheckCircle2 className="h-5 w-5 text-green-400" />;
            case 'error': return <AlertCircle className="h-5 w-5 text-red-400" />;
            case 'warning': return <AlertCircle className="h-5 w-5 text-yellow-400" />;
            case 'task': return <CheckCircle2 className="h-5 w-5 text-emerald-400" />;
            case 'schedule': return <Bell className="h-5 w-5 text-blue-400" />;
            default: return <Info className="h-5 w-5 text-cyan-400" />;
        }
    };

    return (
        <div className="mx-auto flex min-h-[calc(100vh-120px)] max-w-4xl flex-col">
            <header className="mb-8 flex flex-col gap-4 sm:mb-12 sm:flex-row sm:items-end sm:justify-between">
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                >
                    <div className="flex items-center gap-3 mb-2">
                        <Radio className="h-4 w-4 text-cyan-400 animate-pulse" />
                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-cyan-400">Signal Intelligence</span>
                    </div>
                    <h1 className="mb-2 text-3xl font-black tracking-tight sm:text-4xl">Intelligence Log</h1>
                    <p className="text-base font-medium text-slate-400 sm:text-lg">Real-time alerts from the neural mainframe.</p>
                </motion.div>

                <div className="flex flex-wrap gap-3 sm:gap-4">
                    {notifications.some(n => !n.is_read) && (
                        <button
                            onClick={markAllRead}
                            disabled={loading}
                            className="btn-neu px-6 py-2.5 text-[10px] font-black uppercase tracking-widest text-slate-300 disabled:opacity-50"
                        >
                            {loading ? 'Processing...' : 'Sync All'}
                        </button>
                    )}
                    <button
                        onClick={() => navigate('/')}
                        className="btn-neu flex items-center gap-2 group px-4 py-2.5"
                    >
                        <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 group-hover:text-white">Exit</span>
                    </button>
                </div>
            </header>

            <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="space-y-4 flex-1"
            >
                <div className="flex flex-col gap-4">
                    {notifications.length === 0 ? (
                        <div
                            className="rounded-3xl border border-white/10 bg-white/5 p-10 text-center sm:p-20 animate-in fade-in zoom-in duration-300"
                        >
                            <div className="w-20 h-20 bg-cyan-500/10 rounded-3xl flex items-center justify-center mx-auto mb-6 border border-cyan-500/20">
                                <Inbox className="h-10 w-10 text-cyan-400/60" />
                            </div>
                            <h3 className="text-2xl font-black mb-3 tracking-tight text-white">Mainframe Clear</h3>
                            <p className="text-slate-400 font-medium mb-8">No signals detected yet. Notifications appear here when you save meetings or schedule events.</p>
                            <button
                                onClick={createTestNotification}
                                disabled={seeding}
                                className="btn-gradient inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-bold disabled:opacity-60"
                            >
                                <Plus className="h-4 w-4" />
                                {seeding ? 'Generating...' : 'Generate Test Signal'}
                            </button>
                        </div>
                    ) : (
                        notifications.map((notif) => (
                            <div
                                key={notif.id}
                                className={`group relative rounded-3xl border p-4 transition-all duration-500 sm:p-8 animate-in slide-in-from-bottom-4 fade-in duration-500 ${notif.is_read
                                    ? 'bg-white/5 border-white/10 opacity-60'
                                    : 'premium-card border-cyan-500/20 shadow-xl shadow-cyan-500/5 hover:border-cyan-500/40'
                                    }`}
                            >
                                <div className="flex items-start gap-6">
                                    <div className={`p-4 rounded-2xl transition-all duration-500 ${notif.is_read ? 'bg-slate-900/50' : 'bg-cyan-500/10 group-hover:bg-cyan-500/20'}`}>
                                        {getIcon(notif.type)}
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex justify-between items-start mb-4">
                                            <p className={`font-bold text-xl leading-tight ${notif.is_read ? 'text-slate-400' : 'text-white'}`}>
                                                {notif.message}
                                            </p>
                                            {!notif.is_read && (
                                                <button
                                                    onClick={() => markAsRead(notif.id)}
                                                    className="p-3 bg-cyan-500/10 hover:bg-cyan-500 text-cyan-400 hover:text-slate-950 rounded-xl transition-all shadow-lg hover:shadow-cyan-500/20 ml-4 shrink-0"
                                                    title="Mark as read"
                                                >
                                                    <Check className="h-5 w-5" />
                                                </button>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-6 flex-wrap">
                                            <div className="flex items-center gap-2 text-[10px] text-slate-500 font-black tracking-[0.2em] uppercase">
                                                <Clock className="h-3.5 w-3.5 opacity-60" />
                                                {new Date(notif.created_at).toLocaleString()}
                                            </div>
                                            {!notif.is_read && (
                                                <div className="flex items-center gap-2">
                                                    <span className="h-1.5 w-1.5 bg-cyan-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(34,211,238,0.8)]" />
                                                    <span className="text-[10px] text-cyan-500 font-black uppercase tracking-widest">Active Signal</span>
                                                </div>
                                            )}
                                            {notif.is_read && (
                                                <span className="text-[10px] text-slate-600 font-black uppercase tracking-widest">Read</span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </motion.div>
        </div>
    );
};

export default Notifications;
