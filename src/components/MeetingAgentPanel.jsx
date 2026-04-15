import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Bot,
    Power,
    PowerOff,
    MessageSquare,
    FileText,
    Mail,
    Volume2,
    VolumeX,
    Send,
    ChevronDown,
    ChevronUp,
    Sparkles,
    HelpCircle,
    Download,
    Video,
    Clock,
    Mic,
} from 'lucide-react';
import { apiFetch } from '../api';

export default function MeetingAgentPanel({ socket, roomId, userId, isProxyEnabled, onToggleProxy }) {
    const [agentActive, setAgentActive] = useState(false);
    const [qaPairs, setQaPairs] = useState([]);
    const [agentMessages, setAgentMessages] = useState([]);
    const [chatInput, setChatInput] = useState('');
    const [voiceMuted, setVoiceMuted] = useState(false);
    const [expanded, setExpanded] = useState(true);
    const [report, setReport] = useState(null);
    const [emailDraft, setEmailDraft] = useState(null);
    const [emailInstruction, setEmailInstruction] = useState('');
    const [showEmailModal, setShowEmailModal] = useState(false);
    const [postMeetingQuestion, setPostMeetingQuestion] = useState('');
    const [postMeetingAnswer, setPostMeetingAnswer] = useState(null);
    const [loading, setLoading] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const chatEndRef = useRef(null);
    const audioRef = useRef(null);

    // Play TTS audio
    const playAudio = useCallback((base64Audio) => {
        if (voiceMuted || !base64Audio) return;
        try {
            const audio = new Audio(`data:audio/mp3;base64,${base64Audio}`);
            audioRef.current = audio;
            audio.play().catch(() => { });
        } catch (e) {
            console.error('Audio playback error:', e);
        }
    }, [voiceMuted]);

    // Socket listeners
    useEffect(() => {
        if (!socket) return;

        const onAgentStatus = (data) => {
            setAgentActive(data.active);
        };

        const onAgentQA = (data) => {
            setQaPairs((prev) => [...prev, { ...data, timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }]);
        };

        const onAgentVoice = (data) => {
            playAudio(data.audio);
        };

        const onChatMessage = (data) => {
            if (data.sender === 'Auralis_Agent') {
                setAgentMessages((prev) => [...prev, {
                    text: data.message,
                    intent: data.intent,
                    timestamp: data.timestamp,
                }]);
            }
        };

        const onProcessingStatus = (data) => {
            if (data.agent_report) {
                setReport(data.agent_report);
            }
        };

        socket.on('agent_status_change', onAgentStatus);
        socket.on('agent_qa_detected', onAgentQA);
        socket.on('agent_voice_response', onAgentVoice);
        socket.on('chat_message', onChatMessage);
        socket.on('processing_status', onProcessingStatus);

        return () => {
            socket.off('agent_status_change', onAgentStatus);
            socket.off('agent_qa_detected', onAgentQA);
            socket.off('agent_voice_response', onAgentVoice);
            socket.off('chat_message', onChatMessage);
            socket.off('processing_status', onProcessingStatus);
        };
    }, [socket, playAudio]);

    // Auto-scroll chat
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [agentMessages]);

    const deployAgent = () => {
        if (!socket) return;
        socket.emit('deploy_agent', { room: roomId, user_id: userId });
        setAgentActive(true);
    };

    const retireAgent = () => {
        if (!socket) return;
        socket.emit('retire_agent', { room: roomId });
        setAgentActive(false);
    };

    const sendChat = () => {
        if (!chatInput.trim() || !socket) return;
        socket.emit('agent_chat', { room: roomId, message: chatInput.trim() });
        setAgentMessages((prev) => [...prev, {
            text: chatInput.trim(),
            sender: 'user',
            timestamp: new Date().toISOString(),
        }]);
        setChatInput('');
    };

    // Speech-to-Text Logic
    const toggleDictation = () => {
        if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
            alert('Your browser does not support speech recognition. Try Chrome or Edge.');
            return;
        }

        if (isListening) {
            setIsListening(false);
            return;
        }

        const SpeechRecognitionApi = window.SpeechRecognition || window.webkitSpeechRecognition;
        const recognition = new SpeechRecognitionApi();

        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'en-US';

        recognition.onstart = () => {
            setIsListening(true);
        };

        recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            setChatInput((prev) => prev ? prev + ' ' + transcript : transcript);
        };

        recognition.onerror = (event) => {
            console.error('Speech recognition error', event.error);
            setIsListening(false);
        };

        recognition.onend = () => {
            setIsListening(false);
        };

        recognition.start();
    };

    const askPostMeeting = async () => {
        if (!postMeetingQuestion.trim()) return;
        setLoading(true);
        const token = localStorage.getItem('token');
        try {
            const res = await apiFetch('/api/agent/ask', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ question: postMeetingQuestion, room_id: roomId }),
            });
            const data = await res.json();
            setPostMeetingAnswer(data.answer);
            if (data.audio) playAudio(data.audio);
        } catch {
            setPostMeetingAnswer('Failed to get answer. Try again.');
        } finally {
            setLoading(false);
            setPostMeetingQuestion('');
        }
    };

    const downloadDoc = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/agent/export/doc/${roomId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                const blob = await res.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `Auralis_Report_${roomId}.docx`;
                document.body.appendChild(a);
                a.click();
                a.remove();
            }
        } catch (error) {
            console.error('Download failed', error);
        } finally {
            setLoading(false);
        }
    };


    const draftEmail = async () => {
        if (!emailInstruction.trim()) return;
        setLoading(true);
        const token = localStorage.getItem('token');
        try {
            const res = await apiFetch('/api/agent/draft-email', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ instruction: emailInstruction, room_id: roomId }),
            });
            const data = await res.json();
            setEmailDraft(data.email);
        } catch {
            setEmailDraft({ error: 'Failed to draft email.' });
        } finally {
            setLoading(false);
        }
    };

    const sendDraftedEmail = () => {
        if (!emailDraft || emailDraft.sent) return;

        const subject = encodeURIComponent(emailDraft.subject || 'Meeting Recap');
        const body = encodeURIComponent(emailDraft.body || '');
        const to = emailDraft.to && emailDraft.to !== 'unspecified@pending.com' ? emailDraft.to : '';

        // Gmail compose URL format
        const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${to}&su=${subject}&body=${body}`;

        window.open(gmailUrl, '_blank');

        // Mark as "handled" locally
        setEmailDraft(prev => ({ ...prev, sent: true }));
    };

    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex flex-col rounded-2xl border border-white/10 bg-slate-900/80 backdrop-blur-xl shadow-2xl w-80 max-h-[90vh] overflow-hidden"
        >
            {/* Header */}
            <div
                className="flex cursor-pointer items-center justify-between rounded-t-2xl bg-gradient-to-r from-cyan-600/30 to-purple-600/30 px-4 py-3 border-b border-white/5"
                onClick={() => setExpanded((v) => !v)}
            >
                <div className="flex items-center gap-2.5">
                    <div className={`relative h-2.5 w-2.5 rounded-full ${agentActive ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`} />
                    <Bot className="h-5 w-5 text-cyan-300" />
                    <span className="text-sm font-bold text-white tracking-tight">Auralis AI</span>
                    {agentActive && (
                        <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[9px] font-bold text-emerald-300 border border-emerald-500/30">
                            ACTIVE
                        </span>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={(e) => { e.stopPropagation(); setVoiceMuted((v) => !v); }}
                        className="rounded-lg p-1 text-slate-400 hover:bg-white/10 hover:text-white transition"
                        title={voiceMuted ? 'Unmute' : 'Mute'}
                    >
                        {voiceMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                    </button>
                    {expanded ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
                </div>
            </div>

            <AnimatePresence>
                {expanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="flex flex-col overflow-y-auto custom-scrollbar"
                    >
                        {/* Status / Toggle */}
                        <div className="px-4 py-3 border-b border-white/5 bg-white/5">
                            {!agentActive ? (
                                <button
                                    onClick={deployAgent}
                                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-cyan-500/20 transition hover:scale-[1.02] active:scale-[0.98]"
                                >
                                    <Power className="h-3.5 w-3.5" />
                                    DEPLOY AURALIS
                                </button>
                            ) : (
                                <button
                                    onClick={retireAgent}
                                    className="flex w-full items-center justify-center gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-2.5 text-xs font-bold text-rose-300 transition hover:bg-rose-500/20"
                                >
                                    <PowerOff className="h-3.5 w-3.5" />
                                    RETIRE AGENT
                                </button>
                            )}

                            {/* New: Proxy/Digital Twin Toggle */}
                            <div className="mt-2 flex items-center justify-between rounded-xl bg-white/5 p-2 px-3 border border-white/5">
                                <div className="flex items-center gap-2">
                                    <Sparkles className={`h-3.5 w-3.5 ${isProxyEnabled ? 'text-cyan-400' : 'text-slate-500'}`} />
                                    <span className="text-[10px] font-bold text-slate-300 uppercase tracking-tight">Digital Twin Mode</span>
                                </div>
                                <button
                                    onClick={onToggleProxy}
                                    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none ${isProxyEnabled ? 'bg-cyan-500' : 'bg-slate-700'}`}
                                >
                                    <span
                                        className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${isProxyEnabled ? 'translate-x-5' : 'translate-x-1'}`}
                                    />
                                </button>
                            </div>
                        </div>

                        {/* Live Q&A Feed */}
                        {agentActive && (
                            <div className="px-4 py-3 border-b border-white/5">
                                <div className="mb-2 flex items-center justify-between">
                                    <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-cyan-300/80">
                                        <HelpCircle className="h-3.5 w-3.5" />
                                        Meeting Q&A
                                    </div>
                                    <span className="text-[10px] bg-cyan-500/10 px-1.5 py-0.5 rounded text-cyan-200">{qaPairs.length}</span>
                                </div>
                                <div className="max-h-32 space-y-2 overflow-y-auto scrollbar-none p-1">
                                    {qaPairs.length > 0 ? qaPairs.slice(-5).map((qa, i) => (
                                        <div key={i} className="rounded-xl bg-white/5 p-2 text-[11px] border border-white/5">
                                            <div className="flex justify-between items-start mb-1">
                                                <p className="font-bold text-cyan-200">Q: {qa.question}</p>
                                                <span className="text-[9px] text-slate-500 shrink-0 ml-2">{qa.timestamp}</span>
                                            </div>
                                            <p className="text-slate-300 leading-snug">A: {qa.answer}</p>
                                        </div>
                                    )) : (
                                        <p className="text-[10px] text-slate-500 italic text-center py-2">Listening for questions...</p>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Agent Chat */}
                        {agentActive && (
                            <div className="px-4 py-3 border-b border-white/5 bg-purple-500/5">
                                <div className="mb-2 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-purple-300/80">
                                    <MessageSquare className="h-3.5 w-3.5" />
                                    Agent Chat
                                </div>
                                <div className="max-h-40 flex flex-col space-y-2 overflow-y-auto scrollbar-none p-1 mb-2">
                                    {agentMessages.slice(-10).map((msg, i) => (
                                        <div
                                            key={i}
                                            className={`rounded-xl px-3 py-2 text-xs leading-relaxed ${msg.sender === 'user'
                                                ? 'ml-auto max-w-[90%] bg-cyan-600/20 text-cyan-100 border border-cyan-500/10'
                                                : 'mr-auto max-w-[90%] bg-white/10 text-slate-200 border border-white/10'
                                                }`}
                                        >
                                            {msg.text}
                                        </div>
                                    ))}
                                    <div ref={chatEndRef} />
                                </div>
                                <div className="flex gap-2">
                                    <input
                                        value={chatInput}
                                        onChange={(e) => setChatInput(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && sendChat()}
                                        placeholder="Ask Auralis..."
                                        className="min-w-0 flex-1 rounded-lg border border-white/10 bg-slate-950/60 px-3 py-2 text-xs text-white outline-none focus:border-purple-400/50"
                                    />
                                    <button
                                        onClick={toggleDictation}
                                        className={`rounded-lg p-2 transition ${isListening ? 'bg-rose-500/50 text-white animate-pulse' : 'bg-purple-600/30 text-purple-300 hover:bg-purple-600/50'}`}
                                        title="Dictate message"
                                    >
                                        <Mic className="h-3.5 w-3.5" />
                                    </button>
                                    <button
                                        onClick={sendChat}
                                        disabled={!chatInput.trim()}
                                        className="rounded-lg bg-purple-600/30 p-2 text-purple-300 transition hover:bg-purple-600/50 disabled:opacity-40"
                                    >
                                        <Send className="h-3.5 w-3.5" />
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Reports section (Available when report exists or meeting ended) */}
                        <div className="px-4 py-3 border-b border-white/5">
                            <div className="mb-2 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-amber-300/80">
                                <FileText className="h-3.5 w-3.5" />
                                Export & Summary
                            </div>

                            <div className="flex gap-2">
                                <button
                                    onClick={downloadDoc}
                                    disabled={loading}
                                    className="flex w-full items-center justify-center gap-2 rounded-lg bg-white/5 border border-white/10 p-2 text-[10px] font-bold text-slate-300 hover:bg-white/10 transition disabled:opacity-30"
                                >
                                    <Download className="h-3.5 w-3.5 text-cyan-400" />
                                    DOC REPORT
                                </button>
                            </div>
                        </div>

                        {/* Post-Meeting Question / Draft Email */}
                        <div className="px-4 py-3 space-y-4">
                            <div>
                                <div className="mb-2 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-emerald-300/80">
                                    <Mail className="h-3.5 w-3.5" />
                                    Gmail Assistant
                                </div>
                                <div className="flex gap-2">
                                    <input
                                        value={emailInstruction}
                                        onChange={(e) => setEmailInstruction(e.target.value)}
                                        placeholder='e.g. "Draft recap to team"'
                                        className="min-w-0 flex-1 rounded-lg border border-white/10 bg-slate-950/60 px-3 py-2 text-xs text-white outline-none focus:border-emerald-400/50"
                                    />
                                    <button
                                        onClick={draftEmail}
                                        disabled={loading || !emailInstruction.trim()}
                                        className="rounded-lg bg-emerald-600/30 px-3 py-2 text-[10px] font-bold text-emerald-300 transition hover:bg-emerald-600/50 disabled:opacity-40 whitespace-nowrap"
                                    >
                                        DRAFT
                                    </button>
                                </div>
                                {emailDraft && (
                                    <div className="mt-2 p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-[10px]">
                                        <p className="font-bold text-emerald-200 truncate">{emailDraft.subject}</p>
                                        <p className="text-slate-300 mt-1 line-clamp-3">{emailDraft.body}</p>
                                        {!emailDraft.sent && (
                                            <button onClick={sendDraftedEmail} className="mt-2 w-full py-1.5 bg-emerald-600 text-white font-bold rounded-lg hover:bg-emerald-500 transition">OPEN IN GMAIL</button>
                                        )}
                                        {emailDraft.sent && <p className="mt-2 text-emerald-400 font-bold text-center">✓ REDIRECTED TO GMAIL</p>}
                                    </div>
                                )}
                            </div>

                            <div>
                                <div className="mb-2 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-orange-300/80">
                                    <Sparkles className="h-3.5 w-3.5" />
                                    Meeting Memory
                                </div>
                                <div className="flex gap-2">
                                    <input
                                        value={postMeetingQuestion}
                                        onChange={(e) => setPostMeetingQuestion(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && askPostMeeting()}
                                        placeholder="Ask about meeting data..."
                                        className="min-w-0 flex-1 rounded-lg border border-white/10 bg-slate-950/60 px-3 py-2 text-xs text-white outline-none focus:border-orange-400/50"
                                    />
                                    <button
                                        onClick={askPostMeeting}
                                        disabled={loading}
                                        className="rounded-lg bg-orange-600/30 px-3 py-2 text-[10px] font-bold text-orange-300 transition hover:bg-orange-600/50 disabled:opacity-40"
                                    >
                                        ASK AI
                                    </button>
                                </div>
                                {postMeetingAnswer && (
                                    <div className="mt-2 p-2 rounded-lg bg-orange-500/10 border border-orange-500/20 text-[10px] text-orange-100 leading-relaxed">
                                        <p className="font-bold text-orange-300 mb-1">Auralis Answer:</p>
                                        {postMeetingAnswer}
                                    </div>
                                )}
                                {loading && (
                                    <div className="mt-2 text-center text-[10px] text-orange-300 animate-pulse">Thinking...</div>
                                )}
                            </div>
                        </div>

                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}
