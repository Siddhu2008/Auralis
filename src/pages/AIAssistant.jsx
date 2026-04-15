import { apiFetch } from '../api';
import { useToast } from '../components/ui/ToastProvider';
import ConfirmationModal from '../components/ui/ConfirmationModal';
import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Bot, Send, User, Calendar, Mail, CheckCircle, XCircle, 
    Info, Clock, ArrowRight, Loader2, Sparkles, Mic, 
    Image as ImageIcon, Paperclip, FileText, 
    Download, Trash2, RefreshCw, Zap, X, File, FileIcon,
    Search, Plus, Copy, Edit, Menu, Brain, History, ListTodo, MoreVertical,
    ChevronRight, CheckCircle2
} from 'lucide-react';
import { format } from 'date-fns';
import { useLocation } from 'react-router-dom';
import { useNotifications } from '../context/NotificationContext';

/**
 * ActionCard: Displays detected AI actions (scheduling, etc.)
 * Enhanced with Confirm/Edit/Cancel as requested
 */
const ActionCard = ({ title, icon: Icon, type, data, onConfirm, onCancel, onEdit, isProcessing }) => {
    const safeData = data || {};
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="premium-card p-5 border-[var(--primary)]/20 bg-slate-900/80 my-4 shadow-2xl shadow-blue-500/10 max-w-md backdrop-blur-md rounded-2xl"
        >
            <div className="flex items-center gap-2 mb-4">
                <div className="p-1.5 rounded-lg bg-[var(--primary)]/10 border border-[var(--primary)]/20">
                    <Icon className="h-4 w-4 text-[var(--primary)]" />
                </div>
                <h3 className="font-bold text-xs uppercase tracking-widest text-[var(--primary)]">{title}</h3>
            </div>

            <div className="space-y-3 mb-6">
                {(type === 'schedule' || type === 'modify') && (
                    <div className="space-y-2">
                        <div className="bg-slate-950/40 p-3 rounded-xl border border-white/5">
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Subject</p>
                            <p className="text-sm font-bold text-white leading-tight">{safeData.title || 'Untitled'}</p>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            <div className="bg-slate-950/40 p-3 rounded-xl border border-white/5">
                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Date</p>
                                <p className="text-[11px] font-bold text-white uppercase">{safeData.date || 'TBD'}</p>
                            </div>
                            <div className="bg-slate-950/40 p-3 rounded-xl border border-white/5">
                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Time</p>
                                <p className="text-[11px] font-bold text-white">{safeData.time || 'TBD'}</p>
                            </div>
                        </div>
                    </div>
                )}

                {type === 'email' && (
                    <div className="space-y-2">
                        <div className="bg-slate-950/40 p-3 rounded-xl border border-white/5">
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Recipient</p>
                            <p className="text-xs font-bold text-white">{safeData.recipient || safeData.to || 'Unknown'}</p>
                        </div>
                        <div className="bg-slate-950/40 p-3 rounded-xl border border-white/5">
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Subject</p>
                            <p className="text-xs font-bold text-slate-300">{safeData.subject || 'No subject'}</p>
                        </div>
                        <div className="bg-slate-950/40 p-3 rounded-xl border border-white/5 max-h-32 overflow-y-auto scrollbar-none">
                            <p className="text-[11px] text-slate-400 leading-relaxed italic">"{safeData.body || ''}"</p>
                        </div>
                    </div>
                )}
            </div>

            <div className="flex gap-3">
                <button
                    onClick={onCancel}
                    disabled={isProcessing}
                    className="flex-1 py-2 px-3 rounded-xl border border-white/10 text-[10px] font-bold uppercase text-slate-400 hover:text-white hover:bg-white/5 transition-all outline-none"
                >
                    Cancel
                </button>
                <button
                    onClick={onEdit}
                    disabled={isProcessing}
                    className="flex-1 py-2 px-3 rounded-xl border border-white/10 text-[10px] font-bold uppercase text-slate-400 hover:text-white hover:bg-white/5 transition-all outline-none"
                >
                    Edit
                </button>
                <button
                    onClick={onConfirm}
                    disabled={isProcessing}
                    className="flex-2 py-2 px-4 rounded-xl bg-blue-600 text-white text-[10px] font-bold uppercase hover:bg-blue-500 transition-all flex items-center justify-center gap-2 shadow-lg outline-none"
                >
                    {isProcessing ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                    Confirm
                </button>
            </div>
        </motion.div>
    );
};

export default function AIAssistant() {
    // --- State Management ---
    const [convMessages, setConvMessages] = useState([
        {
            id: 'init-1',
            role: 'assistant',
            content: "Hello! I'm Auralis AI. Your command center is ready. How can I assist you?",
            timestamp: new Date()
        }
    ]);
    const [typingInputValue, setTypingInputValue] = useState('');
    const [isAILoading, setIsAILoading] = useState(false);
    const [isDataRefreshing, setIsDataRefreshing] = useState(false);
    const [fileAttachments, setFileAttachments] = useState([]);
    const [isVoiceActive, setIsVoiceActive] = useState(false);
    const [activeTab, setActiveTab] = useState('schedule');
    const [recentEmails, setRecentEmails] = useState([]);
    const [userSettings, setUserSettings] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [history, setHistory] = useState([]);
    const [memories, setMemories] = useState([]);
    const [memorySearch, setMemorySearch] = useState('');
    const [dailyAgenda, setDailyAgenda] = useState({ schedules: [], reminders: [], tasks: [] });
    const [isContextPanelOpen, setIsContextPanelOpen] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [editingTitle, setEditingTitle] = useState('');
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState(null);

    // --- Refs ---
    const chatEndRef = useRef(null);
    const mainFileInputRef = useRef(null);

    // --- Context Hooks ---
    const { addToast } = useToast();
    const { refreshNotifications } = useNotifications();
    const location = useLocation();

    // --- Auto-scroll ---
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [convMessages, isAILoading]);

    // --- Data Fetching ---
    const fetchData = async () => {
        setIsDataRefreshing(true);
        
        const fetchWithResilience = async (url, setter, transform = (d) => d) => {
            try {
                const res = await apiFetch(url);
                if (res.ok) {
                    const data = await res.json();
                    setter(transform(data));
                } else {
                    console.warn(`[Assistant] ${url} returned ${res.status}`);
                }
            } catch (err) {
                console.error(`[Assistant] Failed to fetch ${url}:`, err);
            }
        };

        try {
            await Promise.all([
                fetchWithResilience('/api/assistant/agenda', setDailyAgenda),
                fetchWithResilience('/api/email/list?limit=5', setRecentEmails, (data) => data.emails || data || []),
                fetchWithResilience('/api/settings', (data) => setUserSettings(data.settings)),
                fetchWithResilience('/api/assistant/history', (data) => setHistory(data.history || [])),
                fetchWithResilience('/api/assistant/memories', (data) => setMemories(data.memories || []))
            ]);
        } catch (err) {
            console.error("Dashboard link failure", err);
        } finally {
            setIsDataRefreshing(false);
        }
    };

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 60000);

        // Check for initial message from navigation state
        if (location.state?.initialMessage) {
            setTypingInputValue(location.state.initialMessage);
            // Optional: Auto-trigger chat? User said "written in the user input field", 
            // so we'll just write it there for now.
        }

        return () => clearInterval(interval);
    }, [location.state]);

    // --- Handlers ---
    const handleNewChat = () => {
        setConvMessages([{
            id: `init-${Date.now()}`,
            role: 'assistant',
            content: "Neural link purified. New session initiated. Standing by...",
            timestamp: new Date()
        }]);
        addToast({ type: 'info', title: 'New Chat Start' });
    };

    const loadHistoryItem = async (item) => {
        setIsAILoading(true);
        try {
            const res = await apiFetch(`/api/assistant/history/${item.id}`);
            if (res.ok) {
                const data = await res.json();
                if (data.type === 'chat') {
                    // It's a memory/chat item
                    setConvMessages([{
                        id: data.id,
                        role: 'user',
                        content: data.title.replace('Chat: ', ''),
                        timestamp: new Date(data.date)
                    }, {
                        id: `res_${data.id}`,
                        role: 'assistant',
                        content: data.content,
                        timestamp: new Date(data.date)
                    }]);
                } else {
                    // It's an action item
                    setConvMessages([{
                        id: data.id,
                        role: 'assistant',
                        content: `**${data.title}**\n\n${JSON.stringify(data.details, null, 2)}`,
                        timestamp: new Date(data.date)
                    }]);
                }
                addToast({ type: 'success', title: 'Neural Context Loaded' });
            }
        } catch (err) {
            console.error("Load interaction failed", err);
            addToast({ type: 'error', title: 'Load Failed' });
        } finally {
            setIsAILoading(false);
        }
    };

    const deleteHistoryItem = (e, id) => {
        e.stopPropagation();
        setItemToDelete(id);
        setIsDeleteModalOpen(true);
    };

    const confirmDeleteHistoryItem = async () => {
        if (!itemToDelete) return;
        try {
            const res = await apiFetch(`/api/assistant/history/${itemToDelete}`, { method: 'DELETE' });
            if (res.ok) {
                addToast({ type: 'success', title: 'Memory Redacted' });
                fetchData();
            }
        } catch (err) {
            addToast({ type: 'error', title: 'Redaction Failed' });
        } finally {
            setItemToDelete(null);
        }
    };

    const renameHistoryItem = async (id, newTitle) => {
        if (!newTitle.trim()) return;
        try {
            const res = await apiFetch(`/api/assistant/history/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title: newTitle })
            });
            if (res.ok) {
                addToast({ type: 'success', title: 'Neural Schema Updated' });
                setEditingId(null);
                fetchData();
            }
        } catch (err) {
            addToast({ type: 'error', title: 'Update Failed' });
        }
    };

    const commitFileUpload = async (file) => {
        const formData = new FormData();
        formData.append('file', file);
        try {
            const res = await apiFetch('/api/media/upload', { method: 'POST', body: formData });
            if (res.ok) {
                const data = await res.json();
                setFileAttachments(prev => [...prev, { ...data, name: file.name }]);
                addToast({ type: 'success', title: 'Neural Sync', message: file.name });
            }
        } catch (err) {
            addToast({ type: 'error', title: 'Uplink Failed' });
        }
    };

    const dispatchUserMessage = async (e) => {
        e?.preventDefault();
        const msgText = typingInputValue.trim();
        if (!msgText && fileAttachments.length === 0) return;
        if (isAILoading) return;

        const userMsg = { 
            id: `usr-${Date.now()}`, 
            role: 'user', 
            content: msgText, 
            files: fileAttachments.map(f => f.url),
            timestamp: new Date()
        };
        
        setConvMessages(prev => [...prev, userMsg]);
        setTypingInputValue('');
        setFileAttachments([]);
        setIsAILoading(true);

        try {
            const res = await apiFetch('/api/assistant/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: msgText, attachments: userMsg.files })
            });

            // Handle non-OK responses gracefully
            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}));
                throw new Error(errorData.error || errorData.message || `Protocol Error (${res.status})`);
            }

            const data = await res.json();
            
            setConvMessages(prev => [...prev, {
                id: `ai-${Date.now()}`,
                role: 'assistant',
                content: data.response || data.answer || data.message || "Neural link established. standing by.",
                action: data.action,
                actionData: data.action_data,
                timestamp: new Date()
            }]);
            
            if (data.action) fetchData();
        } catch (err) {
            console.error("AI Error:", err);
            setConvMessages(prev => [...prev, {
                id: `ai-err-${Date.now()}`,
                role: 'assistant',
                content: `Error: ${err.message || 'The neural core is currently re-indexing. Please attempt your query again.'}`,
                timestamp: new Date()
            }]);
            addToast({ type: 'error', title: 'Neural Disconnect', message: err.message });
        } finally {
            setIsAILoading(false);
        }
    };

    const confirmAIAction = async (msgId, action, payload) => {
        if (action === 'email') {
            const recipient = payload?.recipient || payload?.to;
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!recipient || !emailRegex.test(recipient)) {
                addToast({ type: 'error', title: 'Invalid Recipient', message: 'Please enter a valid email address before sending.' });
                return;
            }
        }
        try {
            const actionPayload = action === 'email' ? { ...payload, approved: true } : payload;
            const res = await apiFetch('/api/assistant/execute', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action, data: actionPayload })
            });
            const result = await res.json().catch(() => ({}));
            if (res.ok) {
                setConvMessages(prev => prev.map(m =>
                    m.id === msgId ? { ...m, action: null, content: `${m.content}\n\n✅ Directive Executed.` } : m
                ));
                fetchData();
                addToast({ type: 'success', title: 'Protocol Success' });
            } else {
                addToast({ type: 'error', title: 'Directive Failed', message: result.error || 'Failed to execute directive' });
            }
        } catch (err) {
            addToast({ type: 'error', title: 'System Error', message: 'Could not communicate with the neural core' });
        }
    };

    const toggleTaskStatus = async (taskId, currentStatus) => {
        const nextStatus = currentStatus === 'completed' ? 'pending' : 'completed';
        try {
            const res = await apiFetch(`/api/tasks/${taskId}`, {
                method: 'PUT',
                body: JSON.stringify({ status: nextStatus })
            });
            if (res.ok) {
                addToast({ type: 'success', title: 'Neural Update', message: `Task ${nextStatus === 'completed' ? 'completed' : 'reopened'}.` });
                fetchData();
            }
        } catch (err) {
            addToast({ type: 'error', title: 'Update Failed' });
        }
    };

    const filteredMessages = convMessages.filter(m => 
        m.content.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="h-[calc(100vh-100px)] w-full flex flex-col lg:flex-row bg-[#0F172A] overflow-hidden rounded-3xl border border-white/5 relative">
            
            {/* Mobile Header (Visible only on small screens) */}
            <div className="lg:hidden flex items-center justify-between p-4 border-b border-white/5 bg-[#0F172A]/80 backdrop-blur-md">
                <div className="flex items-center gap-2">
                    <Bot className="w-5 h-5 text-blue-400" />
                    <span className="font-bold text-white text-sm">Auralis AI</span>
                </div>
                <div className="flex gap-2">
                    <button 
                        onClick={() => { setActiveTab('schedule'); setIsContextPanelOpen(true); }} 
                        className="p-2 text-slate-400 hover:text-white"
                    >
                        <Calendar className="w-4 h-4" />
                    </button>
                    <button 
                        onClick={() => { setActiveTab('tasks'); setIsContextPanelOpen(true); }} 
                        className="p-2 text-slate-400 hover:text-white"
                    >
                        <ListTodo className="w-4 h-4" />
                    </button>
                    <button 
                        onClick={() => setIsContextPanelOpen(!isContextPanelOpen)} 
                        className={`p-2 rounded-lg transition-colors ${isContextPanelOpen ? 'bg-blue-500/20 text-blue-400' : 'text-slate-400 hover:text-white'}`}
                    >
                        <Menu className="w-4 h-4" />
                    </button>
                </div>
            </div>

            <div className="flex-1 flex overflow-hidden">
                {/* 🧠 SIDEBAR (Hidden on mobile) */}
                <aside className="hidden lg:flex w-[18%] border-r border-white/5 flex-col bg-[#111827]/30 backdrop-blur-md">
                    <div className="p-5 h-full flex flex-col">
                        <button onClick={handleNewChat} className="w-full btn-gradient py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-lg mb-6 hover:scale-[1.02] transition-transform outline-none">
                            <Plus className="w-4 h-4" /> New Chat
                        </button>
                        
                        <div className="space-y-6 flex-1 overflow-y-auto scrollbar-none">
                            <div>
                                <h3 className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                                    <History className="w-3 h-3" /> Recent Activity
                                </h3>
                                <div className="space-y-0.5">
                                    {isDataRefreshing && history.length === 0 ? (
                                        [1, 2, 3].map(i => (
                                            <div key={i} className="h-8 w-full bg-white/5 animate-pulse rounded-lg mb-1" />
                                        ))
                                    ) : (
                                        history.map(item => (
                                            <div key={item.id} className="group relative flex items-center w-full">
                                                {editingId === item.id ? (
                                                    <div className="flex-1 flex gap-2 p-1">
                                                        <input 
                                                            autoFocus
                                                            value={editingTitle}
                                                            onChange={e => setEditingTitle(e.target.value)}
                                                            onBlur={() => setEditingId(null)}
                                                            onKeyDown={e => {
                                                                if (e.key === 'Enter') renameHistoryItem(item.id, editingTitle);
                                                                if (e.key === 'Escape') setEditingId(null);
                                                            }}
                                                            className="flex-1 bg-white/10 border border-blue-500/50 rounded px-2 py-1 text-xs text-white outline-none"
                                                        />
                                                    </div>
                                                ) : (
                                                    <>
                                                        <button 
                                                            onClick={() => loadHistoryItem(item)}
                                                            className="w-full text-left p-2.5 rounded-lg hover:bg-white/5 text-xs text-slate-400 hover:text-white transition-colors flex items-center justify-between group outline-none pr-12"
                                                        >
                                                            <span className="truncate">{item.title}</span>
                                                            <ChevronRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                                                        </button>
                                                        <div className="absolute right-2.5 hidden group-hover:flex items-center gap-1.5 bg-[#111827]/80 backdrop-blur-md p-1 rounded-md border border-white/5">
                                                            <button 
                                                                onClick={(e) => { e.stopPropagation(); setEditingId(item.id); setEditingTitle(item.title); }}
                                                                className="p-1 text-slate-500 hover:text-blue-400 transition-colors"
                                                                title="Rename"
                                                            >
                                                                <Edit className="w-3 h-3" />
                                                            </button>
                                                            <button 
                                                                onClick={(e) => deleteHistoryItem(e, item.id)}
                                                                className="p-1 text-slate-500 hover:text-red-400 transition-colors"
                                                                title="Delete"
                                                            >
                                                                <Trash2 className="w-3 h-3" />
                                                            </button>
                                                        </div>
                                                    </>
                                                )}
                                            </div>
                                        ))
                                    )}
                                    {!isDataRefreshing && history.length === 0 && (
                                        <p className="p-2.5 text-[10px] text-slate-500 italic">No recent activity.</p>
                                    )}
                                </div>
                            </div>
                        </div>
                        
                        <div className="pt-4 border-t border-white/5 mt-auto">
                            <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-blue-500/5 ring-1 ring-blue-500/10">
                                <Zap className="w-3.5 h-3.5 text-blue-400" />
                                <div className="text-[9px] text-blue-300 font-bold uppercase tracking-tight">Pro Engine Active</div>
                            </div>
                        </div>
                    </div>
                </aside>

                {/* 💬 MAIN CHAT AREA */}
                <main className="flex-1 flex flex-col bg-[#0F172A] relative min-w-0">
                    {/* Messages Area */}
                    <div className="flex-1 overflow-y-auto px-4 py-6 md:px-8 md:py-8 space-y-6 md:space-y-8 scrollbar-none">
                        <AnimatePresence>
                            {filteredMessages.map((msg) => (
                                <motion.div
                                    key={msg.id}
                                    initial={{ opacity: 0, scale: 0.98, y: 10 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    exit={{ opacity: 0 }}
                                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                                >
                                    <div className={`flex gap-3 md:gap-4 max-w-[95%] md:max-w-[85%] animate-fade-in ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                                        {msg.role === 'assistant' && (
                                            <div className="w-7 h-7 md:w-8 md:h-8 rounded-lg bg-[#1E293B] border border-white/10 flex items-center justify-center shrink-0 shadow-lg">
                                                <Bot className="w-4 h-4 md:w-5 md:h-5 text-blue-400" />
                                            </div>
                                        )}
                                        <div className={`space-y-2 group ${msg.role === 'user' ? 'text-right' : ''}`}>
                                            <div className={`px-4 py-2.5 md:px-5 md:py-3 rounded-[18px] md:rounded-[20px] shadow-2xl ${
                                                msg.role === 'user' 
                                                ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white' 
                                                : 'bg-[#1E293B] text-slate-100 border border-white/5'
                                            }`}>
                                                <p className="text-xs md:text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                                            </div>
                                            
                                            {msg.action && ['schedule', 'reschedule', 'modify', 'cancel', 'email', 'task', 'set_pref'].includes(msg.action.toLowerCase()) && (
                                                <ActionCard
                                                    title={`Neural Directive`}
                                                    type={msg.action}
                                                    data={msg.actionData}
                                                    onConfirm={() => confirmAIAction(msg.id, msg.action, msg.actionData)}
                                                    onCancel={() => setConvMessages(prev => prev.map(m => m.id === msg.id ? { ...m, action: null } : m))}
                                                    isProcessing={isAILoading}
                                                    icon={msg.action === 'email' ? Mail : Calendar}
                                                    onEdit={() => setTypingInputValue(`Edit this ${msg.action}: `)}
                                                />
                                            )}
                                            
                                            <div className={`flex items-center gap-3 px-2 ${msg.role === 'user' ? 'justify-end' : ''}`}>
                                                <span className="text-[9px] md:text-[10px] text-slate-500 font-medium">
                                                    {format(msg.timestamp || new Date(), 'h:mm a')}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                        
                        {isAILoading && (
                            <div className="flex justify-start">
                                <div className="flex gap-4 max-w-[80%]">
                                    <div className="w-8 h-8 rounded-lg bg-[#111827] border border-white/10 flex items-center justify-center shrink-0">
                                        <Bot className="w-5 h-5 text-blue-400 animate-pulse" />
                                    </div>
                                    <div className="bg-[#1E293B] px-5 py-4 rounded-[20px] border border-white/5">
                                        <div className="flex gap-1.5">
                                            {[0, 1, 2].map(i => (
                                                <motion.div 
                                                    key={i}
                                                    animate={{ y: [0, -4, 0], opacity: [0.3, 1, 0.3] }}
                                                    transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.2 }}
                                                    className="w-1.5 h-1.5 bg-blue-400 rounded-full"
                                                />
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                        <div ref={chatEndRef} className="h-4" />
                    </div>

                    {/* Suggestions and Input Block */}
                    <div className="p-4 md:p-6 bg-gradient-to-t from-[#0F172A] to-transparent sticky bottom-0 z-20">
                        <div className="max-w-3xl mx-auto space-y-4">
                            
                            {/* Smart Suggestions */}
                            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none scroll-smooth">
                                {["Summarize today's emails", "Schedule a sync tomorrow", "Tasks from my meetings", "Check my agenda"].map(sug => (
                                    <button 
                                        key={sug}
                                        onClick={() => setTypingInputValue(sug)}
                                        className="px-3 py-1.5 md:px-4 md:py-2 bg-white/5 border border-white/10 rounded-full text-[10px] md:text-xs text-slate-400 hover:text-white hover:border-blue-500/50 hover:bg-blue-500/5 transition-all whitespace-nowrap outline-none"
                                    >
                                        {sug}
                                    </button>
                                ))}
                            </div>

                            {/* Input Bar */}
                            <form onSubmit={dispatchUserMessage} className="relative group">
                                <div className="bg-[#1E293B]/80 backdrop-blur-3xl border border-white/10 rounded-2xl flex items-end p-1.5 md:p-2 gap-1 md:gap-2 shadow-2xl ring-1 ring-white/5 focus-within:ring-blue-500/30 transition-all">
                                    
                                    <button type="button" onClick={() => mainFileInputRef.current?.click()} className="p-2 md:p-3 text-slate-500 hover:text-white transition-colors outline-none" title="Attach Data">
                                        <Plus className="w-5 h-5 md:w-6 md:h-6 border-2 border-slate-500 rounded-lg p-0.5 group-hover:border-white transition-all" />
                                        <input type="file" ref={mainFileInputRef} hidden onChange={e => commitFileUpload(e.target.files[0])} />
                                    </button>

                                    <textarea 
                                        rows={1}
                                        value={typingInputValue}
                                        onChange={e => setTypingInputValue(e.target.value)}
                                        placeholder="Neural command..."
                                        className="flex-1 bg-transparent border-none outline-none py-2.5 md:py-3 px-1 md:px-2 text-white placeholder:text-slate-600 text-xs md:text-sm resize-none max-h-32 md:max-h-48 scrollbar-custom"
                                        onKeyDown={e => {
                                            if (e.key === 'Enter' && !e.shiftKey) {
                                                e.preventDefault();
                                                dispatchUserMessage();
                                            }
                                        }}
                                    />

                                    <div className="flex items-center gap-1">
                                        <button 
                                            type="button" 
                                            onClick={() => setIsVoiceActive(!isVoiceActive)}
                                            className={`p-2 md:p-3 rounded-xl transition-all outline-none ${isVoiceActive ? 'bg-red-500 text-white shadow-lg shadow-red-500/40' : 'text-slate-500 hover:text-white'}`}
                                        >
                                            <Mic className={`w-4 h-4 md:w-5 md:h-5 ${isVoiceActive ? 'animate-pulse' : ''}`} />
                                        </button>
                                        <button 
                                            disabled={!typingInputValue.trim() && fileAttachments.length === 0}
                                            className="p-2 md:p-3 bg-blue-600 text-white rounded-xl shadow-lg shadow-blue-600/30 hover:bg-blue-500 disabled:opacity-20 transition-all outline-none"
                                        >
                                            <Send className="w-4 h-4 md:w-5 md:h-5" />
                                        </button>
                                    </div>
                                </div>
                            </form>
                        </div>
                    </div>
                </main>

                {/* Mobile Backdrop */}
                <AnimatePresence>
                    {isContextPanelOpen && (
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsContextPanelOpen(false)}
                            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
                        />
                    )}
                </AnimatePresence>

                {/* 🔥 RIGHT CONTEXT PANEL */}
                <aside className={`
                    fixed inset-y-0 right-0 z-50 w-[85%] sm:w-[400px] lg:relative lg:flex lg:w-[27%] 
                    border-l border-white/5 bg-[#111827] lg:bg-[#111827]/30 backdrop-blur-xl 
                    flex-col overflow-hidden transition-transform duration-300 ease-in-out
                    ${isContextPanelOpen ? 'translate-x-0 shadow-2xl shadow-black/50' : 'translate-x-full lg:translate-x-0'}
                `}>
                    {/* Mobile Close Button */}
                    <div className="lg:hidden flex items-center justify-between p-4 border-b border-white/5 bg-[#0F172A]">
                        <span className="text-xs font-bold text-white uppercase tracking-widest">Context Panel</span>
                        <button onClick={() => setIsContextPanelOpen(false)} className="p-2 text-slate-400 hover:text-white">
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                    
                    {/* Tabs */}
                    <div className="flex border-b border-white/5 bg-[#0F172A]/30">
                        {[
                            { id: 'memory', icon: Brain, label: 'Memory' },
                            { id: 'schedule', icon: Calendar, label: 'Schedule' },
                            { id: 'emails', icon: Mail, label: 'Emails' },
                            { id: 'tasks', icon: ListTodo, label: 'Tasks' },
                            { id: 'history', icon: History, label: 'Activity', mobileOnly: true },
                        ].map(tab => (
                            <button 
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex-1 flex flex-col items-center py-4 border-b-2 transition-all outline-none ${
                                    activeTab === tab.id ? 'border-blue-500 text-blue-400 bg-blue-500/5' : 'border-transparent text-slate-500 hover:text-slate-300'
                                } ${tab.mobileOnly ? 'lg:hidden' : ''}`}
                            >
                                <tab.icon className="w-3.5 h-3.5 mb-1" />
                                <span className="text-[9px] font-bold uppercase tracking-tighter">{tab.label}</span>
                            </button>
                        ))}
                    </div>

                    {/* New Chat Button for Mobile */}
                    <div className="lg:hidden p-4 border-b border-white/5">
                        <button onClick={() => { handleNewChat(); setIsContextPanelOpen(false); }} className="w-full btn-gradient py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-lg mb-0 hover:scale-[1.02] transition-transform outline-none">
                            <Plus className="w-4 h-4" /> New Chat
                        </button>
                    </div>

                    {/* Content Area */}
                    <div className="flex-1 overflow-y-auto p-5 scrollbar-custom space-y-6">
                        {activeTab === 'schedule' && (
                            <div className="space-y-6">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-[10px] font-bold text-white uppercase tracking-widest px-1">Today's Timeline</h3>
                                    <button onClick={fetchData} className={`p-1 rounded-lg hover:bg-white/5 transition-colors ${isDataRefreshing ? 'animate-spin' : ''}`}>
                                        <RefreshCw className="w-3 h-3 text-slate-500" />
                                    </button>
                                </div>
                                <div className="space-y-4">
                                    {isDataRefreshing && dailyAgenda.schedules.length === 0 ? (
                                        [1, 2].map(i => (
                                            <div key={i} className="flex gap-4 animate-pulse">
                                                <div className="w-2 h-2 rounded-full bg-slate-700 mt-2" />
                                                <div className="flex-1 space-y-2">
                                                    <div className="h-3 bg-white/5 rounded w-3/4" />
                                                    <div className="h-2 bg-white/5 rounded w-1/4" />
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <>
                                            {(dailyAgenda.schedules || []).filter(sch => {
                                                const d = new Date(sch.start_time);
                                                const now = new Date();
                                                return d.toDateString() === now.toDateString();
                                            }).map((sch, i) => (
                                                <div key={sch.id || i} className="flex gap-4 group cursor-pointer" onClick={() => setTypingInputValue(`About our meeting: ${sch.title}`)}>
                                                    <div className="flex flex-col items-center gap-1 mt-1">
                                                        <div className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.6)]" />
                                                        <div className="w-[1.5px] h-full bg-white/10" />
                                                    </div>
                                                    <div className="pb-3 text-left">
                                                        <p className="text-[9px] font-bold text-blue-400/80 mb-0.5 leading-none">{format(new Date(sch.start_time), 'h:mm a')}</p>
                                                        <p className="text-xs font-bold text-white group-hover:text-blue-400 transition-colors leading-tight">{sch.title}</p>
                                                    </div>
                                                </div>
                                            ))}

                                            {/* Show "Upcoming" section if no meetings today but some exist overall */}
                                            {(dailyAgenda.schedules || []).filter(sch => {
                                                const d = new Date(sch.start_time);
                                                const now = new Date();
                                                return d.toDateString() !== now.toDateString();
                                            }).length > 0 && (
                                                <div className="mt-8 pt-4 border-t border-white/5">
                                                    <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Upcoming Next</h3>
                                                    <div className="space-y-3">
                                                        {(dailyAgenda.schedules || []).filter(sch => {
                                                            const d = new Date(sch.start_time);
                                                            const now = new Date();
                                                            return d.getTime() > now.getTime() && d.toDateString() !== now.toDateString();
                                                        }).slice(0, 3).map((sch, i) => (
                                                            <div key={sch.id} className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5 opacity-60 hover:opacity-100 transition-opacity">
                                                                <div className="flex items-center gap-3">
                                                                    <div className="w-2 h-2 rounded-full bg-slate-600" />
                                                                    <div>
                                                                        <div className="text-[11px] font-bold text-slate-300">{sch.title}</div>
                                                                        <div className="text-[9px] text-slate-500">{format(new Date(sch.start_time), 'MMM d, h:mm a')}</div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </>
                                    )}

                                    {!isDataRefreshing && dailyAgenda.schedules.length === 0 && (
                                        <div className="text-center py-10">
                                            <Calendar className="w-8 h-8 text-slate-700 mx-auto mb-3 opacity-20" />
                                            <p className="text-[10px] text-slate-500 italic">No meetings scheduled.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {activeTab === 'emails' && (
                            <div className="space-y-6">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-[10px] font-bold text-white uppercase tracking-widest px-1">Recent Comms</h3>
                                </div>
                                <div className="space-y-2.5">
                                    {isDataRefreshing && recentEmails.length === 0 ? (
                                        [1, 2, 3].map(i => (
                                            <div key={i} className="animate-pulse bg-white/5 border border-white/5 p-3 rounded-xl space-y-2">
                                                <div className="h-3 bg-white/5 rounded w-3/4" />
                                                <div className="h-2 bg-white/5 rounded w-1/2" />
                                            </div>
                                        ))
                                    ) : (
                                        <>
                                            {recentEmails.map((em, i) => (
                                                <div key={i} className="bg-white/5 border border-white/5 p-3 rounded-xl hover:border-blue-500/30 transition-all cursor-pointer group text-left" onClick={() => setTypingInputValue(`Draft a professional reply to: ${em.subject}`)}>
                                                    <div className="flex justify-between items-start gap-2 mb-1">
                                                         <p className="text-xs font-bold text-white group-hover:text-blue-400 transition-colors truncate">{em.subject}</p>
                                                         <span className="text-[8px] text-slate-500 font-bold uppercase shrink-0">{format(new Date(em.created_at || Date.now()), 'h:mm a')}</span>
                                                    </div>
                                                    <p className="text-[10px] text-slate-500 line-clamp-2 leading-relaxed opacity-70">"{em.summary || em.body?.substring(0, 60) || 'Neural buffer check...'}"</p>
                                                </div>
                                            ))}
                                            {recentEmails.length === 0 && (
                                                <div className="text-center py-10 opacity-40">
                                                    <Mail className="w-8 h-8 mx-auto mb-2" />
                                                    <p className="text-[10px] italic">Inbox currently purified.</p>
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>
                            </div>
                        )}

                        {activeTab === 'tasks' && (
                            <div className="space-y-6">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-[10px] font-bold text-white uppercase tracking-widest px-1">Directives</h3>
                                </div>
                                <div className="space-y-2.5">
                                    {isDataRefreshing && (dailyAgenda.tasks || []).length === 0 ? (
                                        [1, 2, 3].map(i => (
                                            <div key={i} className="animate-pulse flex items-center gap-3 bg-white/5 border border-white/5 p-3 rounded-xl">
                                                <div className="w-4 h-4 rounded border border-slate-700 bg-slate-700" />
                                                <div className="flex-1 space-y-2">
                                                    <div className="h-3 bg-white/5 rounded w-2/3" />
                                                    <div className="h-2 bg-white/5 rounded w-1/4" />
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <>
                                            {[...dailyAgenda.tasks, ...(dailyAgenda.reminders || [])].map((item, i) => (
                                                <div 
                                                    key={i} 
                                                    className="flex items-center gap-3 bg-white/5 border border-white/5 p-3 rounded-xl group hover:bg-white/8 transition-all cursor-pointer"
                                                    onClick={() => setTypingInputValue(`Status of directive: ${item.title}`)}
                                                >
                                                    <button className="w-4 h-4 rounded border border-slate-700 flex items-center justify-center shrink-0">
                                                        {item.status === 'completed' && <CheckCircle2 className="w-3 h-3 text-blue-500" />}
                                                    </button>
                                                    <div className="flex-1 min-w-0 text-left">
                                                        <p className={`text-xs text-white font-bold truncate leading-none ${item.status === 'completed' ? 'line-through opacity-40' : ''}`}>{item.title}</p>
                                                        <p className="text-[8px] text-slate-500 font-black uppercase mt-1 leading-none">
                                                            {item.priority || 'REMINDER'} • {item.due_at || item.due || 'ASAP'}
                                                        </p>
                                                    </div>
                                                </div>
                                            ))}
                                            {(dailyAgenda.tasks.length === 0 && (!dailyAgenda.reminders || dailyAgenda.reminders.length === 0)) && (
                                                <div className="text-center py-10 opacity-40">
                                                    <ListTodo className="w-8 h-8 mx-auto mb-2" />
                                                    <p className="text-[10px] italic">All system nodes optimized.</p>
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>
                            </div>
                        )}


                        {activeTab === 'history' && (
                            <div className="space-y-6">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-[10px] font-bold text-white uppercase tracking-widest px-1">Recent Activity</h3>
                                </div>
                                <div className="space-y-1">
                                    {history.map(item => (
                                        <div key={item.id} className="group relative flex items-center w-full">
                                            {editingId === item.id ? (
                                                <div className="flex-1 flex gap-2 p-1">
                                                    <input 
                                                        autoFocus
                                                        value={editingTitle}
                                                        onChange={e => setEditingTitle(e.target.value)}
                                                        onBlur={() => setEditingId(null)}
                                                        onKeyDown={e => {
                                                            if (e.key === 'Enter') renameHistoryItem(item.id, editingTitle);
                                                            if (e.key === 'Escape') setEditingId(null);
                                                        }}
                                                        className="flex-1 bg-white/10 border border-blue-500/50 rounded px-2 py-1 text-xs text-white outline-none"
                                                    />
                                                </div>
                                            ) : (
                                                <>
                                                    <button 
                                                        onClick={() => loadHistoryItem(item)}
                                                        className="w-full text-left p-3 rounded-xl bg-white/5 border border-white/5 hover:border-blue-500/30 text-xs text-slate-300 hover:text-white transition-all flex items-center justify-between group outline-none pr-12"
                                                    >
                                                        <span className="truncate">{item.title}</span>
                                                        <ChevronRight className="w-3 h-3 opacity-40 group-hover:opacity-100 transition-opacity" />
                                                    </button>
                                                    <div className="absolute right-3 flex items-center gap-2">
                                                        <button 
                                                            onClick={(e) => { e.stopPropagation(); setEditingId(item.id); setEditingTitle(item.title); }}
                                                            className="p-1.5 text-slate-500 hover:text-blue-400 transition-colors bg-white/5 rounded-lg border border-white/5"
                                                        >
                                                            <Edit className="w-3.5 h-3.5" />
                                                        </button>
                                                        <button 
                                                            onClick={(e) => deleteHistoryItem(e, item.id)}
                                                            className="p-1.5 text-slate-500 hover:text-red-400 transition-colors bg-white/5 rounded-lg border border-white/5"
                                                        >
                                                            <Trash2 className="w-3.5 h-3.5" />
                                                        </button>
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    ))}
                                    {history.length === 0 && (
                                        <div className="text-center py-10 opacity-40">
                                            <History className="w-8 h-8 mx-auto mb-2" />
                                            <p className="text-[10px] italic">No activity logs found.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {activeTab === 'memory' && (
                            <div className="space-y-4">
                                <div className="flex items-center justify-between mb-2">
                                    <h3 className="text-[10px] font-bold text-white uppercase tracking-widest px-1">Neural Memory</h3>
                                    <button onClick={fetchData} className={`p-1 rounded-lg hover:bg-white/5 transition-colors ${isDataRefreshing ? 'animate-spin' : ''}`}>
                                        <RefreshCw className="w-3 h-3 text-slate-500" />
                                    </button>
                                </div>

                                {/* Search */}
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-500" />
                                    <input
                                        type="text"
                                        value={memorySearch}
                                        onChange={e => setMemorySearch(e.target.value)}
                                        placeholder="Search memory..."
                                        className="w-full bg-white/5 border border-white/10 rounded-xl pl-8 pr-3 py-2 text-[11px] text-white placeholder:text-slate-600 outline-none focus:border-blue-500/40 transition-colors"
                                    />
                                </div>

                                {isDataRefreshing && memories.length === 0 ? (
                                    [1,2,3,4].map(i => (
                                        <div key={i} className="animate-pulse bg-white/5 border border-white/5 p-3 rounded-xl space-y-2">
                                            <div className="h-2 bg-white/5 rounded w-1/4" />
                                            <div className="h-3 bg-white/5 rounded w-3/4" />
                                        </div>
                                    ))
                                ) : memories.filter(m => !memorySearch || m.content.toLowerCase().includes(memorySearch.toLowerCase())).length === 0 ? (
                                    <div className="text-center py-10 opacity-40">
                                        <Brain className="w-8 h-8 mx-auto mb-2" />
                                        <p className="text-[10px] italic">Memory banks empty.</p>
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        {memories
                                            .filter(m => !memorySearch || m.content.toLowerCase().includes(memorySearch.toLowerCase()))
                                            .map((m, i) => (
                                            <div
                                                key={m.id || i}
                                                className={`p-3 rounded-xl border text-left cursor-pointer hover:border-blue-500/30 transition-all group ${
                                                    m.role === 'user'
                                                        ? 'bg-blue-500/5 border-blue-500/10'
                                                        : 'bg-white/5 border-white/5'
                                                }`}
                                                onClick={() => setTypingInputValue(m.content)}
                                            >
                                                <p className={`text-[8px] font-black uppercase tracking-widest mb-1 ${
                                                    m.role === 'user' ? 'text-blue-400/60' : 'text-emerald-400/60'
                                                }`}>
                                                    {m.role === 'user' ? 'You' : 'Auralis AI'} · {m.created_at ? format(new Date(m.created_at), 'MMM d, h:mm a') : ''}
                                                </p>
                                                <p className="text-[11px] text-slate-300 leading-relaxed line-clamp-3">{m.content}</p>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Status Footer */}
                    <div className="p-5 border-t border-white/5 bg-[#0F172A]/50">
                        <div className="flex items-center justify-between p-3 bg-white/5 border border-white/5 rounded-xl">
                            <div className="flex items-center gap-3">
                                <Zap className="w-3.5 h-3.5 text-emerald-500" />
                                <div>
                                    <p className="text-[8px] font-black text-emerald-500 uppercase tracking-widest">Core Status</p>
                                    <p className="text-[10px] text-white font-bold uppercase tracking-tight">Healthy / Synced</p>
                                </div>
                            </div>
                            <div className="h-1.5 w-1.5 bg-emerald-400 rounded-full animate-pulse" />
                        </div>
                    </div>
                </aside>
            </div>

            <ConfirmationModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={confirmDeleteHistoryItem}
                title="Redact Neural Link?"
                message="Are you sure you want to permanently delete this interaction from your neural history? This action is irreversible."
                confirmText="Redact"
                cancelText="Keep Memory"
                variant="danger"
            />
        </div>
    );
}
