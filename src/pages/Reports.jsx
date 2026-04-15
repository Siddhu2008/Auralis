import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    FileText,
    Calendar,
    Download,
    Search,
    ChevronRight,
    Video,
    ExternalLink,
    Filter,
    Sparkles,
} from 'lucide-react';
import { apiFetch } from '../api';
import { useToast } from '../components/ui/ToastProvider';
import ReactMarkdown from 'react-markdown';

export default function Reports() {
    const [meetings, setMeetings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedReport, setSelectedReport] = useState(null);
    const [reportText, setReportText] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [videoScript, setVideoScript] = useState('');
    const [showExportModal, setShowExportModal] = useState(false);
    const [isReportLoading, setIsReportLoading] = useState(false); // added report loading state
    const { addToast } = useToast();

    useEffect(() => {
        fetchMeetings();
    }, []);

    const fetchMeetings = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const res = await apiFetch('/api/meetings/past', {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json();
            if (res.ok) {
                setMeetings(data.meetings || []);
            }
        } catch (error) {
            addToast({ type: 'error', title: 'Error', message: 'Failed to load meetings' });
        } finally {
            setLoading(false);
        }
    };

    const loadReport = async (identifier) => {
        if (!identifier) return;
        
        const bundle = meetings.find(m => m.meeting.meeting_code === identifier || m.meeting.room_id === identifier);
        if (bundle && bundle.meeting.agent_report) {
            setReportText(bundle.meeting.agent_report);
            setSelectedReport(identifier);
            setVideoScript('');
            return;
        }

        setReportText(''); // Clear previous report text
        setSelectedReport(identifier);
        setIsReportLoading(true);
        try {
            const token = localStorage.getItem('token');
            const res = await apiFetch(`/api/agent/report/${identifier}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json();
            if (res.ok && data.report) {
                setReportText(data.report);
                setSelectedReport(identifier);
                setVideoScript(''); // Clear old script
            } else {
                setReportText('# No Report Generated\nAn AI report has not been generated for this meeting yet.');
                addToast({ type: 'warning', title: 'No Report', message: 'AI report not found for this meeting.' });
            }
        } catch (error) {
            setReportText('# Error Loading Report\nFailed to fetch the neural report from the Auralis core.');
            addToast({ type: 'error', title: 'Error', message: 'Failed to load report' });
        } finally {
            setIsReportLoading(false);
        }
    };

    const downloadDoc = async () => {
        if (!selectedReport) return;
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/agent/export/doc/${selectedReport}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                const blob = await res.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `Auralis_Report_${selectedReport}.docx`;
                document.body.appendChild(a);
                a.click();
                a.remove();
            }
        } catch (error) {
            addToast({ type: 'error', title: 'Export Failed', message: 'Could not download DOC.' });
        }
    };

    const filteredMeetings = meetings.filter(m =>
        (m.meeting?.title || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="flex flex-col lg:flex-row h-[calc(100vh-120px)] gap-4 lg:gap-6 overflow-y-auto lg:overflow-hidden pb-20 lg:pb-0">
            {/* Sidebar: Meeting List */}
            <div className="flex w-full lg:w-80 h-[400px] lg:h-auto flex-none lg:flex-shrink-0 flex-col rounded-3xl border border-white/10 bg-slate-900/50 backdrop-blur-xl">
                <div className="p-4 border-b border-white/10">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <FileText className="h-5 w-5 text-cyan-400" />
                        Meeting Reports
                    </h2>
                    <div className="mt-4 relative">
                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search meetings..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full rounded-xl bg-slate-950/50 border border-white/10 pl-10 pr-4 py-2 text-sm text-white outline-none focus:border-cyan-500/50"
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-2 space-y-1">
                    {loading && meetings.length === 0 && (
                        <div className="flex flex-col items-center justify-center p-12">
                            <div className="relative">
                                <div className="w-10 h-10 border-4 border-cyan-500/20 border-t-cyan-500 rounded-full animate-spin" />
                                <Sparkles className="h-3 w-3 text-cyan-500 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
                            </div>
                            <span className="mt-4 text-[10px] font-black uppercase tracking-widest text-slate-500">Syncing...</span>
                        </div>
                    )}
                    {filteredMeetings.map(m => {
                        const dateStr = m.meeting.started_at || m.meeting.scheduled_start_at;
                        const identifier = m.meeting.meeting_code || m.meeting.room_id;
                        return (
                        <button
                            key={identifier}
                            onClick={() => loadReport(identifier)}
                            className={`w-full flex flex-col gap-1 p-3 rounded-2xl transition text-left ${selectedReport === identifier ? 'bg-cyan-500/10 border border-cyan-500/20' : 'hover:bg-white/5 border border-transparent'}`}
                        >
                            <span className="text-sm font-semibold text-white truncate">{m.meeting.title || 'Untitled Meeting'}</span>
                            <span className="text-xs text-slate-400 flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {dateStr ? new Date(dateStr).toLocaleDateString() : 'Invalid Date'}
                            </span>
                        </button>
                    )})}
                    {!loading && filteredMeetings.length === 0 && (
                        <div className="p-8 text-center text-slate-500 text-sm">No meetings found.</div>
                    )}
                </div>
            </div>

            {/* Main Content: Report Viewer */}
            <div className="flex-1 flex flex-col rounded-3xl border border-white/10 bg-slate-900/50 backdrop-blur-xl overflow-hidden min-h-[500px] lg:min-h-0">
                {selectedReport ? (
                    <>
                        <div className="p-4 border-b border-white/10 flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white/5 gap-4 sm:gap-0">
                            <div className="max-w-full">
                                <h3 className="text-lg font-bold text-white">Report View</h3>
                                <p className="text-xs text-slate-400 truncate">Room: {selectedReport}</p>
                            </div>
                            <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                                <button
                                    onClick={downloadDoc}
                                    className="flex-1 sm:flex-none flex justify-center items-center gap-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-sm font-medium transition"
                                >
                                    <Download className="h-4 w-4 shrink-0" />
                                    <span className="whitespace-nowrap">Download DOC</span>
                                </button>
                                <button
                                    onClick={() => addToast({ title: 'Coming Soon', message: 'Video export is under development.' })}
                                    className="flex-1 sm:flex-none flex justify-center items-center gap-2 px-4 py-2 rounded-xl bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 text-sm font-medium transition"
                                >
                                    <Video className="h-4 w-4 shrink-0" />
                                    <span className="whitespace-nowrap">Video Summary</span>
                                </button>
                            </div>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 sm:p-8 custom-scrollbar relative">
                            {isReportLoading ? (
                                <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/80 backdrop-blur-sm z-10">
                                    <div className="w-10 h-10 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                                    <span className="text-cyan-400 font-medium">Generating neural report...</span>
                                </div>
                            ) : null}
                            <article className="prose prose-invert max-w-none">
                                <ReactMarkdown
                                    components={{
                                        h1: ({ node, ...props }) => <h1 className="text-2xl sm:text-3xl font-bold text-white mb-6 border-b border-white/10 pb-4 break-words" {...props} />,
                                        h2: ({ node, ...props }) => <h2 className="text-lg sm:text-xl font-bold text-cyan-400 mt-8 mb-4 flex items-center gap-2 break-words" {...props} />,
                                        p: ({ node, ...props }) => <p className="text-slate-300 leading-relaxed mb-4 break-words" {...props} />,
                                        li: ({ node, ...props }) => <li className="text-slate-300 mb-2 break-words" {...props} />,
                                        strong: ({ node, ...props }) => <strong className="text-white font-semibold" {...props} />,
                                    }}
                                >
                                    {reportText}
                                </ReactMarkdown>
                            </article>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-slate-500 p-8 text-center">
                        <FileText className="h-16 w-16 mb-4 opacity-20" />
                        <p>Select a meeting to view its AI report</p>
                    </div>
                )}
            </div>
        </div>
    );
}
