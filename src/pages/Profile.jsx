import { apiFetch } from '../api';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    User, Mail, Shield, Camera, Trash2, LogOut, Check, X, 
    Loader2, Bot, Globe, Settings, BadgeCheck, Phone,
    Calendar, CheckCircle2, Zap, LayoutDashboard, History,
    TrendingUp, Link as LinkIcon, ExternalLink, ChevronRight,
    MessageSquare, Clock, Star
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useUserSettings } from '../context/UserSettingsContext';
import { normalizeUser, deriveAvatarFromEmail } from '../utils/userProfile';
import { useAuth } from '../context/AuthContext';
import { format } from 'date-fns';

const Profile = () => {
    const navigate = useNavigate();
    const [data, setData] = useState({ profile: null, stats: null, activity: [], insights: null });
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('overview'); // overview, activity, insights, connections
    const [isDeleting, setIsDeleting] = useState(false);
    
    const { settings } = useUserSettings();
    const { logout } = useAuth();

    useEffect(() => {
        fetchProfileData();
    }, []);

    const fetchProfileData = async () => {
        try {
            const res = await apiFetch('/api/profile/');
            if (res.ok) {
                const result = await res.json();
                const normalized = normalizeUser(result.profile || {});
                setData({
                    ...result,
                    profile: normalized
                });
            }
        } catch (err) {
            console.error('Fetch profile error:', err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[80vh] space-y-6">
                <div className="relative">
                    <div className="w-20 h-20 border-4 border-blue-500/10 border-t-blue-500 rounded-full animate-spin" />
                    <Bot className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 text-blue-500 animate-pulse" />
                </div>
                <p className="text-xs font-black uppercase tracking-[0.3em] text-slate-500">Synchronizing Identity Core...</p>
            </div>
        );
    }

    const { profile, stats, activity, insights } = data;
    const avatarSrc = profile?.profile_image || deriveAvatarFromEmail(profile?.email || '');

    if (!loading && !profile) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[80vh] space-y-6">
                <div className="p-6 bg-red-500/10 border border-red-500/20 rounded-[32px] text-center max-w-md">
                    <X className="w-12 h-12 text-red-500 mx-auto mb-4" />
                    <h2 className="text-xl font-black uppercase tracking-tight text-white mb-2">Sync Interrupted</h2>
                    <p className="text-xs text-slate-400 font-bold mb-6">We couldn't reach your identity core. This might be due to a brief network instability or a temporary neural log failure.</p>
                    <button 
                        onClick={() => { setLoading(true); fetchProfileData(); }}
                        className="px-8 py-3 bg-red-500 hover:bg-red-600 text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-2xl transition-all shadow-lg shadow-red-500/20"
                    >
                        Re-initialize Neural Link
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-[1400px] mx-auto pb-20 px-4 pt-4 sm:px-6 lg:px-8">
            {/* 1. PROFILE HEADER */}
            <motion.div 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative bg-slate-900/50 border border-white/5 rounded-[32px] p-8 mb-8 overflow-hidden group"
            >
                <div className="absolute top-0 right-0 w-[500px] h-full bg-gradient-to-l from-blue-500/5 to-transparent skew-x-12 translate-x-32" />
                
                <div className="relative flex flex-col md:flex-row items-center gap-8">
                    {/* Avatar */}
                    <div className="relative group/avatar">
                        <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full p-1 bg-gradient-to-tr from-blue-500 via-purple-500 to-teal-500 animate-gradient-xy">
                            <div className="w-full h-full rounded-full border-4 border-slate-900 overflow-hidden bg-slate-800">
                                <img 
                                    src={avatarSrc} 
                                    className="w-full h-full object-cover group-hover/avatar:scale-110 transition-transform duration-500" 
                                    alt={profile?.name || 'User'}
                                />
                            </div>
                        </div>
                        <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-blue-600 rounded-xl border-4 border-[#0f172a] flex items-center justify-center shadow-lg">
                            <BadgeCheck className="w-4 h-4 text-white" />
                        </div>
                    </div>

                    {/* User Info */}
                    <div className="flex-1 text-center md:text-left">
                        <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4 mb-2">
                            <h1 className="text-3xl sm:text-4xl font-black tracking-tight">{profile?.name || 'Auralis User'}</h1>
                            <span className="inline-flex px-3 py-1 bg-blue-500/10 text-blue-400 text-[10px] font-black uppercase tracking-widest rounded-full border border-blue-500/20 self-center md:self-auto">
                                Pro Member
                            </span>
                        </div>
                        <p className="text-slate-400 font-bold mb-4">{profile?.email || 'email@auralis.ai'}</p>
                        <div className="flex flex-wrap justify-center md:justify-start gap-4">
                            <div className="flex items-center gap-2 text-xs font-bold text-slate-500 bg-white/5 px-4 py-2 rounded-xl">
                                <Zap className="w-3.5 h-3.5 text-yellow-500" />
                                AI-Optimized Productivity User
                            </div>
                            <div className="flex items-center gap-2 text-xs font-bold text-slate-500 bg-white/5 px-4 py-2 rounded-xl">
                                <Clock className="w-3.5 h-3.5 text-blue-500" />
                                Active for {profile?.created_at ? Math.floor((Date.now() - new Date(profile.created_at)) / (1000 * 60 * 60 * 24)) : 0} Days
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3">
                        <button 
                            onClick={() => navigate('/settings')}
                            className="bg-white/5 hover:bg-white/10 border border-white/10 p-4 rounded-2xl transition-all group"
                        >
                            <Settings className="w-5 h-5 text-slate-400 group-hover:rotate-90 transition-transform duration-500" />
                        </button>
                        <button 
                            onClick={() => logout()}
                            className="bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 p-4 rounded-2xl transition-all group"
                        >
                            <LogOut className="w-5 h-5 text-red-400 group-hover:translate-x-1 transition-transform" />
                        </button>
                    </div>
                </div>
            </motion.div>

            {/* 2. STATS CARDS */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
                {[
                    { label: 'Meetings', value: stats?.meetings || 0, sub: '+12 this week', icon: Calendar, color: 'blue' },
                    { label: 'Tasks', value: `${stats?.completed_tasks || 0}/${stats?.tasks || 0}`, sub: 'Completion Rate: ' + Math.round(((stats?.completed_tasks || 0)/(stats?.tasks || 1)) * 100) + '%', icon: CheckCircle2, color: 'emerald' },
                    { label: 'Emails', value: stats?.emails || 0, sub: 'Synced via Google', icon: Mail, color: 'purple' },
                    { label: 'AI Actions', value: stats?.ai_actions || 0, sub: 'Autonomous operations', icon: Bot, color: 'orange' }
                ].map((stat, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.1 }}
                        className="glass-card group p-6 hover:translate-y-[-4px] transition-all duration-300"
                    >
                        <div className={`p-3 bg-${stat.color}-500/10 rounded-2xl w-fit mb-4 group-hover:scale-110 transition-transform`}>
                            <stat.icon className={`w-6 h-6 text-${stat.color}-400`} />
                        </div>
                        <h3 className="text-3xl font-black mb-1">{stat.value}</h3>
                        <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest mb-2">{stat.label}</p>
                        <div className="h-1 w-full bg-slate-800 rounded-full overflow-hidden">
                            <div className={`h-full bg-${stat.color}-500/50 w-2/3`} />
                        </div>
                        <p className="text-[9px] font-bold text-slate-600 mt-2 uppercase tracking-tight">{stat.sub}</p>
                    </motion.div>
                ))}
            </div>

            {/* 3. TABS SECTION */}
            <div className="space-y-6">
                <div className="flex items-center gap-1 sm:gap-2 bg-slate-900/50 p-1.5 sm:p-2 rounded-2xl border border-white/5 w-full sm:w-fit overflow-x-auto scrollbar-none">
                    {[
                        { id: 'overview', label: 'Overview', icon: LayoutDashboard },
                        { id: 'activity', label: 'Activity', icon: History },
                        { id: 'insights', label: 'AI Insights', icon: TrendingUp },
                        { id: 'connections', label: 'Connections', icon: LinkIcon }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-6 py-2.5 sm:py-3 rounded-xl text-[10px] sm:text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap shrink-0 ${
                                activeTab === tab.id 
                                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' 
                                : 'text-slate-500 hover:text-white hover:bg-white/5'
                            }`}
                        >
                            <tab.icon className="w-4 h-4" />
                            <span className="hidden sm:inline">{tab.label}</span>
                        </button>
                    ))}
                </div>

                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.2 }}
                        className="min-h-[400px]"
                    >
                        {/* OVERVIEW TAB */}
                        {activeTab === 'overview' && (
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                <div className="lg:col-span-2 space-y-6">
                                    <div className="glass-card p-8">
                                        <h3 className="text-xl font-black mb-6 flex items-center gap-3">
                                            <BadgeCheck className="w-5 h-5 text-blue-500" />
                                            About Intelligence Node
                                        </h3>
                                        <div className="space-y-4">
                                            <p className="text-slate-400 leading-relaxed font-medium">
                                                User preferences indicate a preference for high-efficiency, {settings?.aiPersona?.tone || 'professional'} communication. 
                                                Active node operating in {settings?.profile?.timezone || 'UTC'} with language protocol set to {settings?.profile?.language || 'English'}.
                                            </p>
                                            <div className="grid grid-cols-2 gap-4 pt-4">
                                                <div className="p-4 bg-white/5 rounded-2xl">
                                                    <p className="text-[10px] font-black text-slate-500 uppercase mb-1">Work Hours</p>
                                                    <p className="text-sm font-bold">{settings?.workingHours?.start || '09:00'} - {settings?.workingHours?.end || '18:00'}</p>
                                                </div>
                                                <div className="p-4 bg-white/5 rounded-2xl">
                                                    <p className="text-[10px] font-black text-slate-500 uppercase mb-1">Response Depth</p>
                                                    <p className="text-sm font-bold capitalize">{settings?.aiPersona?.responseDepth || 'balanced'}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="glass-card p-8">
                                        <h3 className="text-xl font-black mb-6">Recent Interactions</h3>
                                        <div className="space-y-4">
                                            {(activity || []).slice(0, 5).map((item, i) => (
                                                <div key={i} className="flex items-center gap-4 p-4 hover:bg-white/5 rounded-2xl transition-colors group cursor-pointer">
                                                    <div className={`p-2.5 rounded-xl bg-blue-500/10 group-hover:scale-110 transition-transform`}>
                                                        {item.type === 'task' ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Calendar className="w-4 h-4 text-blue-400" />}
                                                    </div>
                                                    <div className="flex-1">
                                                        <h4 className="text-xs font-bold text-white uppercase">{item.title}</h4>
                                                        <p className="text-[10px] text-slate-500 mt-1 font-black tracking-widest uppercase">
                                                            {item.type} • {format(new Date(item.time), 'MMM d, h:mm a')}
                                                        </p>
                                                    </div>
                                                    <ChevronRight className="w-4 h-4 text-slate-700" />
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    <div className="glass-card p-8 border-yellow-500/10">
                                        <h3 className="text-xl font-black mb-6 text-yellow-500 flex items-center gap-2">
                                            <Zap className="w-5 h-5" />
                                            Daily Briefing
                                        </h3>
                                        <div className="p-4 bg-yellow-500/5 rounded-2xl border border-yellow-500/10">
                                            <p className="text-[11px] text-yellow-500/80 leading-relaxed font-bold italic lowercase italic">
                                                “Auralis has processed {stats?.ai_actions || 0} autonomous decisions for you today. You have {(activity || []).filter(a => a.type==='meeting').length} meetings remaining in this cycle.”
                                            </p>
                                        </div>
                                        <button 
                                            onClick={() => navigate('/assistant')}
                                            className="w-full mt-6 py-4 bg-yellow-600/10 hover:bg-yellow-600/20 text-yellow-500 text-[10px] font-black uppercase tracking-widest rounded-2xl border border-yellow-500/20 transition-all flex items-center justify-center gap-2"
                                        >
                                            View Full Agenda
                                            <ChevronRight className="w-3 h-3" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* ACTIVITY TAB */}
                        {activeTab === 'activity' && (
                            <div className="glass-card p-8">
                                <div className="flex items-center justify-between mb-10">
                                    <h3 className="text-xl font-black">Neural Event Timeline</h3>
                                    <div className="flex gap-2">
                                        <button className="px-4 py-2 bg-white/5 border border-white/5 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-white transition-all">All</button>
                                        <button className="px-4 py-2 text-[10px] font-black uppercase tracking-widest text-slate-500">Meetings</button>
                                        <button className="px-4 py-2 text-[10px] font-black uppercase tracking-widest text-slate-500">Tasks</button>
                                    </div>
                                </div>
                                <div className="relative space-y-8 pl-8 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[2px] before:bg-slate-800">
                                    {(activity || []).map((item, i) => (
                                        <div key={i} className="relative group">
                                            <div className="absolute -left-9 top-1.5 w-4 h-4 rounded-full border-4 border-slate-900 bg-blue-500 group-hover:scale-125 transition-transform z-10 shadow-[0_0_10px_rgba(59,130,246,0.5)]" />
                                            <div className="p-6 bg-white/5 border border-white/5 rounded-3xl hover:border-blue-500/20 transition-all">
                                                <div className="flex items-center justify-between mb-2">
                                                    <div className="flex items-center gap-3">
                                                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 bg-white/5 px-3 py-1 rounded-lg">
                                                            {item.type}
                                                        </span>
                                                        <h4 className="text-sm font-bold text-white uppercase">{item.title}</h4>
                                                    </div>
                                                    <span className="text-[10px] font-bold text-slate-600">{format(new Date(item.time), 'h:mm a • MMM d')}</span>
                                                </div>
                                                <p className="text-xs text-slate-500 font-medium">Verified system action recorded in neural log #{item.original_id || i}. Status: {item.status || 'Archived'}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* INSIGHTS TAB */}
                        {activeTab === 'insights' && (
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                <div className="glass-card p-8">
                                    <h3 className="text-xl font-black mb-6 flex items-center gap-3">
                                        <TrendingUp className="w-5 h-5 text-purple-500" />
                                        Behavioral Patterns
                                    </h3>
                                    <div className="space-y-4">
                                        {(insights?.patterns || []).map((pattern, i) => (
                                            <div key={i} className="p-6 bg-purple-500/5 border border-purple-500/10 rounded-3xl group hover:border-purple-500/30 transition-all">
                                                <div className="flex gap-4">
                                                    <div className="p-2.5 bg-purple-500/10 rounded-xl h-fit">
                                                        <Zap className="w-4 h-4 text-purple-400" />
                                                    </div>
                                                    <p className="text-xs font-bold text-slate-300 leading-relaxed uppercase tracking-tight">
                                                        {pattern}
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="glass-card p-8 overflow-hidden relative">
                                    <h3 className="text-xl font-black mb-6 flex items-center gap-3">
                                        <Bot className="w-5 h-5 text-teal-400" />
                                        Predictive Intelligence
                                    </h3>
                                    <div className="space-y-4">
                                        <div className="p-6 bg-teal-500/5 border border-teal-500/10 rounded-3xl">
                                            <h4 className="text-[10px] font-black uppercase text-teal-400 mb-2 tracking-widest">Autonomous Suggestion</h4>
                                            <p className="text-sm font-bold text-white leading-relaxed">
                                                Based on your current load, we suggest scheduling 20 minutes of focus time before your 4 PM sync.
                                            </p>
                                        </div>
                                        <div className="p-6 bg-white/5 border border-white/5 rounded-3xl">
                                            <h4 className="text-[10px] font-black uppercase text-slate-500 mb-2 tracking-widest">Efficiency Forecast</h4>
                                            <p className="text-sm font-bold text-white/50 italic">
                                                “Analyzing tomorrow's agenda... Probability of task completion: 92% if started before noon.”
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* CONNECTIONS TAB */}
                        {activeTab === 'connections' && (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {[
                                    { name: 'Google Cloud API', status: 'Connected', lastSync: '2 minutes ago', icon: Globe, color: 'blue' },
                                    { name: 'Primary Gmail', status: 'Active', lastSync: 'Real-time', icon: Mail, color: 'red' },
                                    { name: 'Auralis Calendar', status: 'Synced', lastSync: '5 minutes ago', icon: Calendar, color: 'teal' }
                                ].map((conn, i) => (
                                    <div key={i} className="glass-card p-6 flex flex-col justify-between group">
                                        <div className="flex items-center justify-between mb-6">
                                            <div className={`p-3 bg-${conn.color}-500/10 rounded-2xl`}>
                                                <conn.icon className={`w-5 h-5 text-${conn.color}-400`} />
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                                                <span className="text-[9px] font-black uppercase text-green-500 tracking-tighter">{conn.status}</span>
                                            </div>
                                        </div>
                                        <div>
                                            <h4 className="font-black text-sm mb-1">{conn.name}</h4>
                                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Sync: {conn.lastSync}</p>
                                        </div>
                                        <button className="mt-6 w-full py-3 bg-white/5 hover:bg-white/10 rounded-xl text-[9px] font-black uppercase tracking-widest border border-white/5 transition-all flex items-center justify-center gap-2 group-hover:border-blue-500/30">
                                            Settings
                                            <ExternalLink className="w-3 h-3" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </motion.div>
                </AnimatePresence>
            </div>

        </div>
    );
};

export default Profile;
