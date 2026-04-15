import React, { useState, useEffect } from 'react';
import { Settings as SettingsIcon, User, Lock, Mic, Link as LinkIcon, Save, RefreshCw, LogOut, Shield, Bell, CreditCard, Trash2, Check, X, ChevronRight, Globe, Zap, Smartphone, Mail, Fingerprint, History, Laptop, Menu, Layout, UserPlus, Eye, EyeOff, AlertTriangle, Bot, Sliders, ShieldCheck, Gauge, Camera, Loader2, Clock, Calendar } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useUserSettings } from '../context/UserSettingsContext';
import { useToast } from '../components/ui/ToastProvider';
import { apiFetch } from '../api';
import PageTitle from '../components/PageTitle';

const Settings = () => {
    const { user, logout } = useAuth();
    const { addToast } = useToast();
    const { settings, updateSettings, saveNow, loading, saving } = useUserSettings();
    
    const [activeTab, setActiveTab] = useState('profile');
    const [localUser, setLocalUser] = useState({
        name: '',
        phone: '',
        bio: '',
        email: ''
    });
    const [showPassword, setShowPassword] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const res = await apiFetch('/api/settings');
                if (res.ok) {
                    const data = await res.json();
                    setLocalUser(data.user);
                }
            } catch (err) {
                console.error("Failed to fetch user metadata", err);
            }
        };
        fetchUserData();
    }, []);

    const handleUserUpdate = (field, value) => {
        setLocalUser(prev => ({ ...prev, [field]: value }));
    };

    const onSaveAll = async () => {
        try {
            // Save settings via context
            const settingsOk = await saveNow();
            
            // Save user profile data
            const userRes = await apiFetch('/api/settings', {
                method: 'PUT',
                body: JSON.stringify({
                    name: localUser.name,
                    phone: localUser.phone,
                    bio: localUser.bio
                })
            });

            if (settingsOk && userRes.ok) {
                addToast({ 
                    type: 'success', 
                    title: 'Configuration Updated', 
                    message: 'Your neural preferences and profile identity have been synchronized.' 
                });
            } else {
                addToast({ 
                    type: 'error', 
                    title: 'Sync Failed', 
                    message: 'Some preferences could not be updated. Please check your connection.' 
                });
            }
        } catch (err) {
            addToast({ type: 'error', title: 'System Error', message: err.message });
        }
    };

    const tabs = [
        { id: 'profile', label: 'Profile', icon: User, desc: 'Personal information & identity' },
        { id: 'account', label: 'Account', icon: Layout, desc: 'Manage account data & status' },
        { id: 'preferences', label: 'Preferences', icon: Sliders, desc: 'System theme & working hours' },
        { id: 'ai', label: 'AI Behavior', icon: Bot, desc: 'Tone, autonomy & permissions' },
        { id: 'notifications', icon: Bell, label: 'Notifications', desc: 'Alerts & synchronization' },
        { id: 'integrations', icon: LinkIcon, label: 'Integrations', desc: 'Sync with external services' },
        { id: 'security', icon: Shield, label: 'Security', desc: 'Password & access control' },
        { id: 'billing', icon: CreditCard, label: 'Billing', desc: 'Plan status & payments' }
    ];

    if (loading) return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
            <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
            <p className="text-xs font-black uppercase tracking-widest text-slate-500">Loading Neural Core...</p>
        </div>
    );

    return (
        <div className="max-w-[1400px] mx-auto pb-20 px-4 pt-4 sm:px-6 lg:px-8">
            <PageTitle title="Settings" />

            {/* HEADER */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                <div>
                    <h1 className="text-4xl font-black tracking-tight text-white mb-2">Settings</h1>
                    <p className="text-slate-400 font-medium">Manage your workspace intelligence and neural preferences.</p>
                </div>
                <div className="flex items-center gap-4">
                    <button 
                        onClick={onSaveAll}
                        disabled={saving}
                        className="flex items-center gap-3 px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-black uppercase tracking-widest rounded-2xl shadow-xl shadow-blue-500/20 transition-all disabled:opacity-50"
                    >
                        {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        {saving ? 'Synchronizing...' : 'Save Configuration'}
                    </button>
                    <button 
                        onClick={() => logout()}
                        className="p-3 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-2xl text-red-400 transition-all"
                    >
                        <LogOut className="w-5 h-5" />
                    </button>
                </div>
            </div>

            <div className="flex flex-col lg:flex-row gap-8 min-h-[70vh]">
                {/* SIDE NAV - MOBILE DROPDOWN */}
                <div className="lg:hidden mb-4">
                    <button 
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                        className="w-full flex items-center justify-between p-4 bg-slate-800 border border-white/5 rounded-2xl font-black uppercase text-xs tracking-widest"
                    >
                        <div className="flex items-center gap-3">
                            {React.createElement(tabs.find(t => t.id === activeTab).icon, { className: "w-4 h-4 text-blue-400" })}
                            {tabs.find(t => t.id === activeTab).label}
                        </div>
                        <Menu className="w-4 h-4" />
                    </button>
                    <AnimatePresence>
                        {isMobileMenuOpen && (
                            <motion.div 
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="mt-2 bg-slate-800 border border-white/5 rounded-2xl overflow-hidden shadow-2xl z-50 absolute w-[calc(100%-2rem)]"
                            >
                                {tabs.map(tab => (
                                    <button
                                        key={tab.id}
                                        onClick={() => { setActiveTab(tab.id); setIsMobileMenuOpen(false); }}
                                        className={`w-full flex items-center gap-3 p-4 text-left text-xs font-black uppercase tracking-widest transition-colors ${activeTab === tab.id ? 'bg-blue-600 text-white' : 'hover:bg-white/5 text-slate-400'}`}
                                    >
                                        {React.createElement(tab.icon, { className: "w-4 h-4" })}
                                        {tab.label}
                                    </button>
                                ))}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* SIDE NAV - DESKTOP */}
                <div className="hidden lg:flex flex-col w-72 gap-2 shrink-0">
                    {tabs.map(tab => {
                        const Icon = tab.icon;
                        const isActive = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`group relative flex flex-col gap-1 p-5 rounded-[24px] border transition-all text-left ${
                                    isActive 
                                        ? 'bg-blue-600/10 border-blue-500/30 text-white shadow-lg shadow-blue-500/5' 
                                        : 'bg-transparent border-transparent text-slate-500 hover:bg-white/5 hover:text-slate-300'
                                }`}
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-xl ${isActive ? 'bg-blue-600 text-white shadow-glow' : 'bg-slate-800 text-slate-400 group-hover:text-slate-200'}`}>
                                        <Icon className="w-4 h-4" />
                                    </div>
                                    <span className="font-black uppercase text-xs tracking-widest">{tab.label}</span>
                                </div>
                                <span className={`text-[10px] font-bold mt-1 ${isActive ? 'text-blue-300/60' : 'text-slate-600'}`}>
                                    {tab.desc}
                                </span>
                                {isActive && <motion.div layoutId="setting-active" className="absolute left-0 top-1/4 bottom-1/4 w-1 bg-blue-500 rounded-r-full" />}
                            </button>
                        );
                    })}
                </div>

                {/* CONTENT AREA */}
                <div className="flex-1 bg-slate-900/50 border border-white/5 rounded-[40px] p-6 sm:p-10 min-h-[600px] overflow-hidden">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={activeTab}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.2 }}
                            className="h-full"
                        >
                            {/* 1. PROFILE TAB */}
                            {activeTab === 'profile' && (
                                <div className="space-y-10 max-w-2xl">
                                    <div className="flex flex-col sm:flex-row items-center gap-8">
                                        <div className="relative group">
                                            <div className="w-32 h-32 rounded-[32px] p-1 bg-gradient-to-tr from-blue-500 via-purple-500 to-teal-500 animate-gradient-xy">
                                                <div className="w-full h-full rounded-[28px] border-4 border-slate-900 overflow-hidden bg-slate-800">
                                                    <img 
                                                        src={localUser?.profile_image || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.email}`} 
                                                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
                                                        alt="Profile"
                                                    />
                                                </div>
                                            </div>
                                            <button className="absolute -bottom-2 -right-2 p-2.5 bg-blue-600 rounded-xl border-4 border-slate-900 text-white shadow-xl hover:scale-110 transition-transform">
                                                <Camera className="w-4 h-4" />
                                            </button>
                                        </div>
                                        <div className="text-center sm:text-left">
                                            <h3 className="text-2xl font-black text-white">{localUser?.name || 'Auralis User'}</h3>
                                            <p className="text-slate-500 font-bold mb-4">{user?.email}</p>
                                            <div className="flex flex-wrap justify-center sm:justify-start gap-2">
                                                <button className="px-5 py-2 bg-blue-600/10 text-blue-400 text-[10px] font-black uppercase tracking-widest rounded-xl border border-blue-500/20 hover:bg-blue-600/20 transition-all">Upload New</button>
                                                <button className="px-5 py-2 bg-red-500/10 text-red-400 text-[10px] font-black uppercase tracking-widest rounded-xl border border-red-500/20 hover:bg-red-500/20 transition-all">Remove</button>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6">
                                        <div className="space-y-4">
                                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 flex items-center gap-2">
                                                <User className="w-3 h-3" /> Full Name
                                            </label>
                                            <input 
                                                value={localUser?.name} 
                                                onChange={(e) => handleUserUpdate('name', e.target.value)}
                                                className="w-full bg-slate-800/50 border border-white/5 rounded-2xl px-6 py-4 focus:border-blue-500/50 outline-none font-bold text-white transition-all" 
                                                placeholder="e.g. Shekhar"
                                            />
                                        </div>
                                        <div className="space-y-4">
                                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 flex items-center gap-2">
                                                <Smartphone className="w-3 h-3" /> Phone Number
                                            </label>
                                            <input 
                                                value={localUser?.phone} 
                                                onChange={(e) => handleUserUpdate('phone', e.target.value)}
                                                className="w-full bg-slate-800/50 border border-white/5 rounded-2xl px-6 py-4 focus:border-blue-500/50 outline-none font-bold text-white transition-all" 
                                                placeholder="+1 (555) 000-0000"
                                            />
                                        </div>
                                        <div className="md:col-span-2 space-y-4">
                                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 flex items-center gap-2">
                                                <Zap className="w-3 h-3" /> User Bio / Neural Signature
                                            </label>
                                            <textarea 
                                                value={localUser?.bio} 
                                                onChange={(e) => handleUserUpdate('bio', e.target.value)}
                                                rows={4}
                                                className="w-full bg-slate-800/50 border border-white/5 rounded-2xl px-6 py-4 focus:border-blue-500/50 outline-none font-bold text-white transition-all resize-none" 
                                                placeholder="Describe your workflow or personal preferences..."
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* 2. ACCOUNT TAB */}
                            {activeTab === 'account' && (
                                <div className="space-y-10 max-w-2xl">
                                    <div className="glass-card p-8 border-white/5">
                                        <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-6">Account Metadata</h4>
                                        <div className="space-y-6">
                                            <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                                                <div className="flex gap-4">
                                                    <div className="p-2 bg-blue-500/10 rounded-xl text-blue-400">
                                                        <User className="w-4 h-4" />
                                                    </div>
                                                    <div>
                                                        <p className="text-[10px] font-black uppercase tracking-tight text-slate-500">Account ID</p>
                                                        <p className="text-sm font-bold text-white">#AUR-{user?.id?.toString().padStart(6, '0') || 'PENDING'}</p>
                                                    </div>
                                                </div>
                                                <button className="text-[10px] font-black text-blue-500 uppercase">Copy</button>
                                            </div>
                                            <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                                                <div className="flex gap-4">
                                                    <div className="p-2 bg-purple-500/10 rounded-xl text-purple-400">
                                                        <Calendar className="w-4 h-4" />
                                                    </div>
                                                    <div>
                                                        <p className="text-[10px] font-black uppercase tracking-tight text-slate-500">Created At</p>
                                                        <p className="text-sm font-bold text-white">
                                                            {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'Active Member'}
                                                        </p>
                                                    </div>
                                                </div>
                                                <span className="text-[10px] font-black text-emerald-500 uppercase">Verified</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="p-8 border border-red-500/20 bg-red-500/5 rounded-[32px] space-y-4">
                                        <div className="flex items-center gap-3 text-red-400">
                                            <AlertTriangle className="w-5 h-5" />
                                            <h4 className="font-black uppercase text-xs tracking-widest">Danger Zone</h4>
                                        </div>
                                        <p className="text-xs text-slate-500 font-bold max-w-md">Deactivating your account will permanently wipe all neural history, meeting summaries, and synchronized workspace data. This action is irreversible.</p>
                                        <button className="px-6 py-3 bg-red-500 hover:bg-red-600 text-white text-[10px] font-black uppercase tracking-widest rounded-xl shadow-lg shadow-red-500/20 transition-all">
                                            Purge Account
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* 3. PREFERENCES TAB */}
                            {activeTab === 'preferences' && (
                                <div className="space-y-10 max-w-2xl">
                                    <div className="space-y-6">
                                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 flex items-center gap-2">
                                            Theme Mode
                                        </label>
                                        <div className="grid grid-cols-2 gap-4">
                                            <button 
                                                onClick={() => updateSettings({ theme_mode: 'dark' })}
                                                className={`p-6 rounded-3xl border flex flex-col items-center gap-3 transition-all ${settings.theme_mode === 'dark' ? 'bg-blue-600/10 border-blue-500 text-white' : 'bg-slate-800/50 border-white/5 text-slate-500 hover:border-white/10'}`}
                                            >
                                                <motion.div className="w-full h-12 bg-slate-900 rounded-xl border border-white/5 flex flex-col justify-end p-2">
                                                    <div className="w-1/2 h-2 bg-blue-500 rounded-full" />
                                                </motion.div>
                                                <span className="text-xs font-black uppercase tracking-widest">Quantum Dark</span>
                                            </button>
                                            <button 
                                                onClick={() => updateSettings({ theme_mode: 'light' })}
                                                className={`p-6 rounded-3xl border flex flex-col items-center gap-3 transition-all ${settings.theme_mode === 'light' ? 'bg-blue-600/10 border-blue-500 text-white' : 'bg-slate-100 border-white/5 text-slate-500 hover:border-white/10'}`}
                                            >
                                                <motion.div className="w-full h-12 bg-white rounded-xl border border-black/5 flex flex-col justify-end p-2">
                                                    <div className="w-1/2 h-2 bg-blue-600 rounded-full" />
                                                </motion.div>
                                                <span className="text-xs font-black uppercase tracking-widest">Neural Light</span>
                                            </button>
                                        </div>
                                    </div>

                                    <div className="space-y-6">
                                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 flex items-center gap-2">
                                            Working Core Hours
                                        </label>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest pl-2">Start Cycle</p>
                                                <input 
                                                    type="time"
                                                    value={settings.working_hours_start}
                                                    onChange={(e) => updateSettings({ working_hours_start: e.target.value })}
                                                    className="w-full bg-slate-800/50 border border-white/5 rounded-2xl px-6 py-4 font-bold text-white focus:border-blue-500/50 outline-none" 
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest pl-2">End Cycle</p>
                                                <input 
                                                    type="time"
                                                    value={settings.working_hours_end}
                                                    onChange={(e) => updateSettings({ working_hours_end: e.target.value })}
                                                    className="w-full bg-slate-800/50 border border-white/5 rounded-2xl px-6 py-4 font-bold text-white focus:border-blue-500/50 outline-none" 
                                                />
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3 p-4 bg-orange-500/5 border border-orange-500/20 rounded-2xl text-orange-400">
                                            <Clock className="w-4 h-4" />
                                            <p className="text-[10px] font-bold uppercase tracking-tight">Timezone Synchronized: {settings.timezone || 'UTC'}</p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* 4. AI BEHAVIOR TAB */}
                            {activeTab === 'ai' && (
                                <div className="space-y-10 max-w-2xl">
                                    <div className="space-y-6">
                                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">AI Personality Tone</label>
                                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                            {['Professional', 'Friendly', 'Concise', 'Formal'].map(tone => (
                                                <button 
                                                    key={tone}
                                                    onClick={() => updateSettings({ assistant_tone: tone.toLowerCase() })}
                                                    className={`p-4 rounded-2xl border text-[10px] font-black uppercase tracking-[0.15em] transition-all ${settings.assistant_tone === tone.toLowerCase() ? 'bg-blue-600 text-white border-blue-500 shadow-glow' : 'bg-slate-800/50 border-white/5 text-slate-500 hover:border-white/20'}`}
                                                >
                                                    {tone}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="space-y-6">
                                        <div className="flex items-center justify-between">
                                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Autonomous Level</label>
                                            <div className="px-3 py-1 bg-blue-500/10 text-blue-400 text-[10px] font-black rounded-lg">
                                                {settings.assistant_autonomy_level?.toUpperCase().replace('_', ' ')}
                                            </div>
                                        </div>
                                        <div className="relative h-2 bg-slate-800 rounded-full cursor-pointer group">
                                            <div className="absolute top-0 left-0 h-full bg-blue-500 rounded-full" 
                                                style={{ width: settings.assistant_autonomy_level === 'suggest_only' ? '33%' : settings.assistant_autonomy_level === 'assisted' ? '66%' : '100%' }} />
                                            <div className="flex justify-between mt-4">
                                                {['suggest_only', 'assisted', 'full'].map(level => (
                                                    <button 
                                                        key={level}
                                                        onClick={() => updateSettings({ assistant_autonomy_level: level })}
                                                        className={`text-[8px] font-black uppercase tracking-widest ${settings.assistant_autonomy_level === level ? 'text-blue-400' : 'text-slate-600 hover:text-slate-400'}`}
                                                    >
                                                        {level.replace('_', ' ')}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                        {settings.assistant_autonomy_level === 'full' && (
                                            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="p-4 bg-orange-500/5 border border-orange-500/20 rounded-2xl flex items-center gap-3">
                                                <AlertTriangle className="w-4 h-4 text-orange-400" />
                                                <p className="text-[9px] font-black text-orange-300 uppercase leading-relaxed tracking-tight">Warning: "Full Autonomy" allows Auralis to execute destructive actions (Delete, Send) without approval.</p>
                                            </motion.div>
                                        )}
                                    </div>

                                    <div className="space-y-6 bg-white/5 rounded-3xl p-6 border border-white/5">
                                        <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2">Autonomous Permissions</h4>
                                        <div className="space-y-2">
                                            <PermissionToggle 
                                                label="Auto-Draft Neural Emails" 
                                                checked={settings.auto_send_emails} 
                                                onChange={(v) => updateSettings({ auto_send_emails: v })} 
                                            />
                                            <PermissionToggle 
                                                label="Recursive Schedule Conflict Resolver" 
                                                checked={settings.auto_schedule_meetings} 
                                                onChange={(v) => updateSettings({ auto_schedule_meetings: v })} 
                                            />
                                            <PermissionToggle 
                                                label="Automated Task Generation from Conversations" 
                                                checked={settings.auto_create_tasks} 
                                                onChange={(v) => updateSettings({ auto_create_tasks: v })} 
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* OTHER TABS (Security, Notifications, etc.) */}
                            {['notifications', 'integrations', 'security', 'billing'].includes(activeTab) && (
                                <div className="flex flex-col items-center justify-center h-full text-center space-y-6 opacity-80">
                                    <div className="p-10 bg-blue-600/5 rounded-[40px] border border-blue-500/10 active-glow-blue">
                                        {activeTab === 'notifications' && <Bell className="w-16 h-16 text-blue-500 mx-auto" />}
                                        {activeTab === 'integrations' && <LinkIcon className="w-16 h-16 text-emerald-500 mx-auto" />}
                                        {activeTab === 'security' && <ShieldCheck className="w-16 h-16 text-purple-500 mx-auto" />}
                                        {activeTab === 'billing' && <CreditCard className="w-16 h-16 text-amber-500 mx-auto" />}
                                    </div>
                                    <div className="max-w-xs mx-auto">
                                        <h3 className="text-xl font-black uppercase tracking-tight text-white mb-2">{activeTab} CORE READY</h3>
                                        <p className="text-xs text-slate-500 font-bold leading-relaxed uppercase">The {activeTab} protocol is configured and active. Detailed granular controls are synchronized via neural sync.</p>
                                    </div>
                                    <button onClick={onSaveAll} className="px-8 py-3 bg-white/5 border border-white/10 rounded-2xl text-[9px] font-black uppercase tracking-widest text-white hover:bg-white/10 transition-all">
                                        Trigger Global Sync
                                    </button>
                                </div>
                            )}

                        </motion.div>
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
};

const PermissionToggle = ({ label, checked, onChange }) => (
    <div 
        onClick={() => onChange(!checked)}
        className="flex items-center justify-between p-4 bg-slate-800/50 hover:bg-slate-700/50 rounded-2xl border border-white/5 cursor-pointer transition-all group"
    >
        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 group-hover:text-white transition-colors">{label}</span>
        <div className={`relative w-10 h-5 rounded-full transition-colors ${checked ? 'bg-blue-500' : 'bg-slate-600'}`}>
            <motion.div 
                animate={{ x: checked ? 20 : 2 }}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
                className="absolute top-1 left-0 w-3 h-3 bg-white rounded-full shadow-lg" 
            />
        </div>
    </div>
);

export default Settings;
