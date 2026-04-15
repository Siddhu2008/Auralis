import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, MessageSquare, FileText, Download, Share2, Sparkles, Calendar, Clock, FileType } from 'lucide-react';
import { format } from 'date-fns';

import { motion } from 'framer-motion';

const MeetingDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [meeting, setMeeting] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchMeeting = async () => {
            const token = localStorage.getItem('token');
            if (!token) {
                navigate('/login');
                return;
            }

            try {
                const res = await fetch(`/api/meetings/${id}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const data = await res.json();
                if (res.ok) {
                    setMeeting(data.meeting);
                }
            } catch (err) {
                console.error('Error fetching meeting:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchMeeting();
    }, [id, navigate]);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="w-12 h-12 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
            </div>
        );
    }

    if (!meeting) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
                <div className="w-20 h-20 bg-red-500/10 rounded-3xl flex items-center justify-center mb-6">
                    <FileText className="text-red-400 h-10 w-10 opacity-50" />
                </div>
                <h3 className="text-2xl font-black mb-2">Meeting Not Found</h3>
                <p className="text-slate-500 mb-8 max-w-xs mx-auto font-medium">Wait, where did it go? We couldn't find the meeting you're looking for.</p>
                <button
                    onClick={() => navigate('/history')}
                    className="bg-white/5 hover:bg-white/10 text-white px-8 py-3.5 rounded-2xl font-black uppercase tracking-widest text-xs transition-all border border-white/10"
                >
                    Back to History
                </button>
            </div>
        );
    }

    const downloadSummary = () => {
        if (!meeting) return;
        const content = `
MEETING REPORT: ${meeting.title || 'Untitled Session'}
Date: ${format(new Date(meeting.date), 'MMMM d, yyyy')}
Duration: ${meeting.duration || '0m'}
Participants: ${meeting.participantsCount || 1}

SUMMARY:
${meeting.summary || 'No summary available.'}

TRANSCRIPT:
${meeting.transcript || 'No transcript available.'}
        `;
        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Meeting_Summary_${id}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const downloadPDF = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`/api/meetings/${id}/download-pdf`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const blob = await res.blob();
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `Meeting_Report_${id}.pdf`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            }
        } catch (err) {
            console.error('PDF Download failed:', err);
        }
    };

    return (
        <div className="max-w-7xl mx-auto min-h-screen space-y-12 pb-20">
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-8">
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex-1"
                >
                    <div className="flex items-center gap-4 mb-6">
                        <button
                            onClick={() => navigate('/history')}
                            className="p-3 glass-panel hover:bg-white/10 rounded-2xl transition-all text-slate-400 group"
                        >
                            <ArrowLeft className="h-5 w-5 group-hover:-translate-x-1 transition-transform" />
                        </button>
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-400 glass-panel px-4 py-1.5 rounded-full">Neural Analysis</span>
                    </div>
                    <h1 className="text-5xl font-black mb-3 tracking-tight">{meeting.title || `Untitled Session`}</h1>
                    <div className="flex items-center gap-4 text-slate-400 font-medium text-lg">
                        <Calendar className="h-5 w-5 text-cyan-500/50" />
                        {format(new Date(meeting.date), 'MMMM d, yyyy')}
                        <span className="opacity-20 px-2">|</span>
                        <Clock className="h-5 w-5 text-cyan-500/50" />
                        {meeting.duration || '0m'}
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex gap-4"
                >
                    <button
                        onClick={downloadPDF}
                        className="btn-neu flex items-center gap-3 group"
                    >
                        <FileType className="h-4 w-4 text-cyan-400" />
                        <span className="text-xs font-black uppercase tracking-widest text-cyan-400">Download PDF</span>
                    </button>
                    <button
                        onClick={downloadSummary}
                        className="btn-neu flex items-center gap-3 group opacity-60 hover:opacity-100"
                    >
                        <Download className="h-4 w-4 text-slate-400 group-hover:translate-y-1 transition-transform" />
                        <span className="text-xs font-black uppercase tracking-widest">TXT</span>
                    </button>
                    <button className="btn-primary flex items-center gap-3">
                        <Share2 className="h-4 w-4" />
                        <span className="text-xs font-bold uppercase tracking-widest">Share Report</span>
                    </button>
                </motion.div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                {/* AI Summary Sidebar */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="lg:col-span-1 space-y-8"
                >
                    <div className="glass-card p-10 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-48 h-48 bg-cyan-500/5 blur-[100px] group-hover:bg-cyan-500/10 transition-all" />
                        <h3 className="text-2xl font-black flex items-center gap-3 mb-8">
                            <Sparkles className="h-6 w-6 text-cyan-400" /> Synthesized
                        </h3>
                        <div className="text-slate-400 text-base leading-[1.8] space-y-6 font-medium">
                            {meeting.summary ? (
                                meeting.summary.split('\n').map((para, i) => <p key={i} className="hover:text-white transition-colors">{para}</p>)
                            ) : (
                                <div className="p-8 rounded-2xl bg-slate-950/20 border border-dashed border-white/5 text-center">
                                    <p className="italic opacity-30 text-sm">Mainframe cooling required to generate insights.</p>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="glass-card p-10">
                        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-500/50 mb-8 ml-1">Archive Metadata</h3>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center p-5 bg-slate-950/40 rounded-2xl border border-white/5 group hover:border-white/10 transition-colors">
                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Computational Length</span>
                                <span className="text-xs font-black text-white">{meeting.duration || '0m'}</span>
                            </div>
                            <div className="flex justify-between items-center p-5 bg-slate-950/40 rounded-2xl border border-white/5 group hover:border-white/10 transition-colors">
                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Node Participants</span>
                                <span className="text-xs font-black text-white">{meeting.participantsCount || 1}</span>
                            </div>
                            <div className="flex justify-between items-center p-5 bg-slate-950/40 rounded-2xl border border-white/5 group hover:border-white/10 transition-colors">
                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Vector Complexity</span>
                                <span className="text-xs font-black text-cyan-400">{meeting.transcript?.split(' ').length || 0} Dimensions</span>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Full Transcript */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="lg:col-span-2"
                >
                    <div className="glass-card flex flex-col h-full min-h-[700px] overflow-hidden">
                        <div className="p-10 border-b border-white/5 flex items-center justify-between bg-white/5 backdrop-blur-3xl sticky top-0 z-10">
                            <h3 className="text-2xl font-black flex items-center gap-4">
                                <MessageSquare className="h-6 w-6 text-cyan-400" /> Neural Stream
                            </h3>
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.5)]" />
                                <span className="text-[10px] text-cyan-400 font-extrabold uppercase tracking-widest">Integrity Verified</span>
                            </div>
                        </div>
                        <div className="p-12 flex-1 scrollbar-custom">
                            {meeting.transcript ? (
                                <div className="text-slate-300 text-lg leading-[2.2] whitespace-pre-wrap font-medium space-y-4">
                                    {meeting.transcript}
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center p-32 text-slate-600 text-center space-y-6">
                                    <div className="p-8 rounded-full glass-panel opacity-10">
                                        <FileText className="h-20 w-20" />
                                    </div>
                                    <p className="text-sm font-black uppercase tracking-[0.4em] opacity-30">Void Fragment Detected</p>
                                </div>
                            )}
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default MeetingDetail;
