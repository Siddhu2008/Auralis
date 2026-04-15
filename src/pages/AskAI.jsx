import { apiFetch } from '../api';
import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, ArrowLeft, Send, Bot, User, Cpu, Zap } from 'lucide-react';

export default function AskAI() {
    const [question, setQuestion] = useState('');
    const [conversation, setConversation] = useState([]);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const { user } = useAuth();
    const scrollRef = useRef(null);

    useEffect(() => {
        const query = new URLSearchParams(window.location.search).get('q');
        if (query) {
            setQuestion(query);
            // Optionally auto-trigger search here
        }
    }, []);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [conversation, loading]);

    const handleAsk = async (e) => {
        e.preventDefault();
        if (!question.trim()) return;

        const currentQuestion = question;
        setQuestion('');
        setLoading(true);

        setConversation(prev => [...prev, { role: 'user', content: currentQuestion }]);

        try {
            const token = localStorage.getItem('token');
            const res = await apiFetch('/api/ai/ask', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ question: currentQuestion })
            });

            if (!res.ok) {
                if (res.status === 401) throw new Error("Neural credentials expired. Please re-authenticate.");
                throw new Error("Communication protocol failure.");
            }

            const data = await res.json();
            setConversation(prev => [
                ...prev,
                {
                    role: 'ai',
                    content: data.answer || "I processed your request, but the collective mind returned no data points.",
                    sources: data.sources
                }
            ]);
        } catch (err) {
            console.error("Chat Error:", err);
            setConversation(prev => [...prev, {
                role: 'ai',
                content: err.message || "Neural link interrupted. Please ensure the backend uplink is active."
            }]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="relative mx-auto flex min-h-[calc(100vh-120px)] max-w-5xl flex-col">
            <header className="mb-8 flex flex-col gap-4 sm:mb-12 sm:flex-row sm:items-end sm:justify-between">
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                >
                    <div className="flex items-center gap-3 mb-2">
                        <Zap className="h-4 w-4 text-purple-400 fill-purple-400/20" />
                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-purple-400">Neural Engine v2.4</span>
                    </div>
                    <h1 className="mb-2 text-3xl font-black tracking-tight sm:text-4xl">Ask Auralis AI</h1>
                    <p className="text-base font-medium text-slate-400 sm:text-lg">Cross-reference meeting intelligence in real-time.</p>
                </motion.div>

                <button
                    onClick={() => navigate('/')}
                    className="btn-neu flex items-center gap-2 group"
                >
                    <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 group-hover:text-white">Dashboard</span>
                </button>
            </header>

            <div className="flex-1 glass-card border-white/5 bg-slate-950/20 flex flex-col overflow-hidden relative">
                <div className="absolute inset-0 bg-gradient-to-b from-purple-500/5 via-transparent to-cyan-500/5 pointer-events-none" />

                <div
                    ref={scrollRef}
                    className="scrollbar-custom relative z-10 flex-1 space-y-6 overflow-y-auto p-4 sm:space-y-8 sm:p-8"
                >
                    <AnimatePresence>
                        {conversation.length === 0 ? (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="h-full flex flex-col items-center justify-center text-center space-y-6 opacity-40 py-20"
                            >
                                <div className="w-20 h-20 glass-panel rounded-3xl flex items-center justify-center mb-4">
                                    <Bot className="h-10 w-10 text-purple-400" />
                                </div>
                                <div>
                                    <p className="text-2xl font-black mb-2 tracking-tight">System Ready</p>
                                    <p className="text-sm font-medium max-w-xs mx-auto">Query the collective intelligence of all indexed meeting nodes.</p>
                                </div>
                                <div className="flex gap-3 pt-6">
                                    <div className="px-4 py-2 glass-panel rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-500">"What was the budget?"</div>
                                    <div className="px-4 py-2 glass-panel rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-500">"Summarize Action Items"</div>
                                </div>
                            </motion.div>
                        ) : (
                            conversation.map((msg, idx) => (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    key={idx}
                                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                                >
                                    <div className={`max-w-[85%] relative group ${msg.role === 'user' ? 'flex flex-row-reverse gap-4' : 'flex gap-4'}`}>
                                        <div className={`w-10 h-10 rounded-xl shrink-0 flex items-center justify-center border ${msg.role === 'user'
                                            ? 'bg-slate-900 border-white/10 text-cyan-400'
                                            : 'bg-purple-500 border-purple-400 text-slate-900'
                                            }`}>
                                            {msg.role === 'user' ? <User className="h-5 w-5" /> : <Sparkles className="h-5 w-5" />}
                                        </div>
                                        <div className={`rounded-2xl p-6 relative ${msg.role === 'user'
                                            ? 'bg-slate-950/50 border border-white/10 text-slate-200 rounded-tr-none'
                                            : 'glass-panel border-purple-500/20 text-slate-200 rounded-tl-none'
                                            }`}>
                                            <p className="leading-relaxed font-medium">
                                                {msg.content}
                                            </p>

                                            {msg.sources && msg.sources.length > 0 && (
                                                <div className="mt-6 pt-4 border-t border-white/5 space-y-3">
                                                    <div className="flex items-center gap-2">
                                                        <Cpu className="h-3 w-3 text-purple-400/50" />
                                                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Neural Sources</p>
                                                    </div>
                                                    <div className="flex flex-wrap gap-2">
                                                        {msg.sources.map((src, i) => (
                                                            <div key={i} className="px-3 py-1.5 glass-panel rounded-lg border-white/5 text-[10px] font-black text-purple-300 uppercase tracking-widest bg-purple-500/5">
                                                                Node_{src.meeting_id ? src.meeting_id.substring(0, 6) : 'UNK'}
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </motion.div>
                            ))
                        )}
                        {loading && (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
                                <div className="flex gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-purple-500 flex items-center justify-center text-slate-900 animate-pulse">
                                        <Sparkles className="h-5 w-5" />
                                    </div>
                                    <div className="glass-panel border-purple-500/20 rounded-2xl p-6 rounded-tl-none">
                                        <div className="flex gap-1.5">
                                            <div className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
                                            <div className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
                                            <div className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce" />
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                <div className="p-8 bg-slate-950/40 border-t border-white/5 relative z-20">
                    <form onSubmit={handleAsk} className="relative group">
                        <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-500/20 to-cyan-500/20 rounded-[24px] blur opacity-0 group-focus-within:opacity-100 transition-opacity" />
                        <div className="relative flex gap-4">
                            <input
                                type="text"
                                value={question}
                                onChange={e => setQuestion(e.target.value)}
                                placeholder="Query the neural network..."
                                className="flex-1 bg-slate-900 border border-white/10 rounded-2xl px-8 py-5 text-lg font-medium outline-none focus:ring-2 focus:ring-purple-500/30 self-center placeholder:text-slate-700 transition-all font-['Inter',sans-serif]"
                            />
                            <button
                                type="submit"
                                disabled={loading || !question.trim()}
                                className="bg-purple-500 hover:bg-purple-400 disabled:opacity-30 text-slate-950 p-5 rounded-2xl font-black transition-all shadow-lg shadow-purple-500/20 active:scale-95"
                            >
                                <Send className="h-6 w-6" />
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
