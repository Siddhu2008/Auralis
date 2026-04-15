import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FileText, Upload, Sparkles, MessageSquare, 
  ChevronRight, Scissors, BookOpen, Key,
  Loader2, CheckCircle, Download, Share2, History, Bot, Send
} from 'lucide-react';
import { apiFetch } from '../api';
import { useToast } from '../components/ui/ToastProvider';
import PageTitle from '../components/PageTitle';
import ReactMarkdown from 'react-markdown';

const SummaryModeCard = ({ id, active, title, icon: Icon, description, onClick }) => (
  <button
    onClick={() => onClick(id)}
    className={`flex flex-col p-4 rounded-2xl border transition-all text-left relative overflow-hidden ${
      active 
        ? 'bg-accent-secondary/10 border-accent-secondary/50 shadow-lg shadow-accent-secondary/10' 
        : 'bg-bg-secondary/40 border-border-muted/30 hover:border-accent-secondary/20'
    }`}
  >
    <div className={`p-2 rounded-xl mb-3 shrink-0 w-fit ${active ? 'bg-accent-secondary text-bg-primary' : 'bg-bg-secondary/40 text-text-secondary'}`}>
      <Icon className="h-4 w-4" />
    </div>
    <h3 className={`text-[10px] font-black uppercase tracking-wider mb-1 ${active ? 'text-accent-secondary' : 'text-text-primary'}`}>{title}</h3>
    <p className="text-[10px] text-text-secondary font-bold uppercase tracking-tight leading-tight">{description}</p>
    {active && <motion.div layoutId="mode-active" className="absolute top-2 right-2 w-1.5 h-1.5 bg-accent-secondary rounded-full shadow-[0_0_8px_rgba(34,211,238,0.8)]" />}
  </button>
);

export default function DocumentSummarizer() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [summaryMode, setSummaryMode] = useState('report');
  const [result, setResult] = useState(null);
  const [chatInput, setChatInput] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [chatLoading, setChatLoading] = useState(false);
  const { addToast } = useToast();

  const handleFileChange = (e) => {
    if (e.target.files[0]) setFile(e.target.files[0]);
  };

  const handleUpload = async () => {
    if (!file) return;
    setLoading(true);
    setResult(null);
    setChatHistory([]);
    
    const formData = new FormData();
    formData.append('file', file);
    formData.append('summary_type', summaryMode);

    try {
      const res = await apiFetch('/api/v1/documents/upload', {
        method: 'POST',
        body: formData,
        // No Content-Type header so browser sets boundary
      });
      const data = await res.json();
      if (res.ok) {
        setResult(data.document);
        addToast({ type: 'success', title: 'Analysis Complete', message: 'Document has been synthesized.' });
      } else {
        const errorMsg = data.error || 'The neural core failed to process this transmission.';
        addToast({ type: 'error', title: 'Analysis Failed', message: errorMsg });
      }
    } catch (err) {
      addToast({ type: 'error', title: 'Connection Error', message: 'Neural link failed.' });
    } finally {
      setLoading(false);
    }
  };

  const handleChat = async (e) => {
    e.preventDefault();
    if (!chatInput.trim() || chatLoading || !result) return;
    
    const userMsg = chatInput;
    setChatInput('');
    setChatHistory(prev => [...prev, { role: 'user', content: userMsg }]);
    setChatLoading(true);

    try {
      const res = await apiFetch(`/api/v1/documents/${result.id}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: userMsg })
      });
      const data = await res.json();
      if (res.ok) {
        setChatHistory(prev => [...prev, { role: 'assistant', content: data.answer }]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setChatLoading(false);
    }
  };

  // Function to process highlights in markdown
  const processMarkdown = (content) => {
    if (!content) return '';
    return content.replace(/<high>(.*?)<\/high>/g, '==$1==');
  };

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8 min-h-[calc(100vh-140px)]">
      <PageTitle title="Document Summarizer" />
      
      <header className="mb-10">
        <div className="flex items-center gap-3 mb-2">
            <FileText className="h-4 w-4 text-accent-secondary" />
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-accent-secondary">Knowledge Synthesis Unit</span>
        </div>
        <h1 className="text-4xl font-black tracking-tight mb-2">Doc Summarizer</h1>
        <p className="text-text-secondary font-bold uppercase tracking-widest text-[10px]">Deep Neural Analysis & Smart Extraction</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Upload & Options Column */}
        <div className="lg:col-span-4 space-y-6">
          <div className="glass-card p-8 border-border-muted/30 bg-bg-secondary/20">
            <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-text-secondary mb-6">Input Sequence</h2>
            <div 
              className={`relative h-48 border-2 border-dashed rounded-3xl flex flex-col items-center justify-center transition-all cursor-pointer group ${
                file ? 'border-accent-secondary/50 bg-accent-secondary/5' : 'border-border-muted/30 hover:border-accent-secondary/20 bg-bg-secondary/40'
              }`}
            >
              <input 
                type="file" 
                onChange={handleFileChange}
                className="absolute inset-0 opacity-0 cursor-pointer"
                accept=".pdf,.txt"
              />
              <div className="bg-bg-primary p-3 rounded-2xl mb-4 group-hover:scale-110 transition-transform">
                <Upload className="h-5 w-5 text-text-secondary group-hover:text-accent-secondary" />
              </div>
              <p className="text-xs font-bold text-text-primary mb-1">{file ? file.name : 'Select transmission data'}</p>
              <p className="text-[10px] text-text-secondary/40 font-black uppercase tracking-widest">PDF or TXT accepted</p>
            </div>

            <div className="mt-8 space-y-3">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-text-secondary mb-4">Synthesis Resolution</h3>
              <div className="grid grid-cols-2 gap-3">
                <SummaryModeCard 
                  id="report" 
                  active={summaryMode === 'report'}
                  title="Report"
                  icon={BookOpen}
                  description="Detailed technical synthesis"
                  onClick={setSummaryMode}
                />
                <SummaryModeCard 
                  id="short" 
                  active={summaryMode === 'short'}
                  title="Snapshot"
                  icon={Scissors}
                  description="2-sentence executive summary"
                  onClick={setSummaryMode}
                />
                <SummaryModeCard 
                  id="bullets" 
                  active={summaryMode === 'bullets'}
                  title="Briefing"
                  icon={FileText}
                  description="Key points in list format"
                  onClick={setSummaryMode}
                />
                <SummaryModeCard 
                  id="insights" 
                  active={summaryMode === 'insights'}
                  title="Insights"
                  icon={Key}
                  description="Strategic takeaways"
                  onClick={setSummaryMode}
                />
              </div>
            </div>

            <button 
              onClick={handleUpload}
              disabled={!file || loading}
              className="w-full mt-8 btn-gradient py-4 text-xs disabled:opacity-30 disabled:cursor-not-allowed group relative overflow-hidden"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              Initialize Analysis
            </button>
          </div>
          
          {result && (
            <div className="glass-card p-6 border-border-muted/30 bg-bg-secondary/20">
               <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-text-secondary mb-4">Meta Data</h2>
               <div className="space-y-4">
                 <div className="flex justify-between items-center bg-bg-primary/40 p-3 rounded-xl border border-border-muted/30">
                    <span className="text-[10px] font-black uppercase tracking-widest text-text-secondary">Stability</span>
                    <span className="text-[10px] font-black text-emerald-400">98.4%</span>
                 </div>
                 <div className="flex justify-between items-center bg-bg-primary/40 p-3 rounded-xl border border-border-muted/30">
                    <span className="text-[10px] font-black uppercase tracking-widest text-text-secondary">Word Count</span>
                    <span className="text-[10px] font-black text-text-primary">~{result.content.split(' ').length}</span>
                 </div>
               </div>
            </div>
          )}
        </div>

        {/* Results / Interaction Column */}
        <div className="lg:col-span-8 space-y-6 min-h-[600px] flex flex-col">
          <AnimatePresence mode="wait">
            {!result ? (
              <motion.div 
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex-1 glass-card border-dashed border-border-muted/30 flex flex-col items-center justify-center text-center p-12"
              >
                <div className="bg-bg-secondary/40 p-8 rounded-[40px] mb-8 relative">
                   <div className="absolute inset-0 bg-accent-secondary/10 blur-2xl rounded-full" />
                   <Sparkles className="h-12 w-12 text-bg-secondary relative z-10" />
                </div>
                <h3 className="text-xl font-black uppercase tracking-tight mb-2 text-text-primary">Awaiting Intelligence Sequence</h3>
                <p className="max-w-xs text-text-secondary/60 font-bold uppercase tracking-widest text-[10px] leading-relaxed">
                  Upload a transmission packet to begin deep semantic layer analysis and extraction.
                </p>
              </motion.div>
            ) : (
              <motion.div 
                key="result"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex-1 flex flex-col gap-6"
              >
                {/* Summary View */}
                <div className="glass-card border-border-muted/30 bg-bg-secondary/20 p-10 relative overflow-hidden flex-1 max-h-[500px] overflow-y-auto scrollbar-custom">
                  <div className="absolute top-0 right-0 p-6 flex gap-3">
                    <button className="p-2 hover:bg-white/5 rounded-xl text-text-secondary hover:text-text-primary transition-all"><Share2 className="h-4 w-4" /></button>
                    <button className="p-2 hover:bg-white/5 rounded-xl text-text-secondary hover:text-text-primary transition-all"><Download className="h-4 w-4" /></button>
                  </div>
                  
                  <article className="prose prose-invert max-w-none prose-p:text-text-secondary prose-headings:font-black prose-headings:uppercase prose-headings:tracking-tighter prose-strong:text-accent-secondary">
                    <ReactMarkdown components={{
                      em: ({node, ...props}) => <mark className="bg-accent-secondary/20 text-accent-secondary/90 px-1 py-0.5 rounded italic" {...props} />
                    }}>
                      {processMarkdown(result.summary)}
                    </ReactMarkdown>
                  </article>
                </div>

                {/* Chat Interaction */}
                <div className="glass-card border-border-muted/30 bg-bg-secondary/40 flex flex-col h-[400px]">
                  <div className="p-4 border-b border-border-muted/30 flex items-center justify-between">
                     <span className="text-[10px] font-black uppercase tracking-[0.2em] text-accent-secondary flex items-center gap-2">
                       <MessageSquare className="h-3 w-3" />
                       Contextual Interface
                     </span>
                     <div className="flex items-center gap-1.5 text-[10px] font-black text-text-secondary uppercase tracking-widest">
                        <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                        Live
                     </div>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-custom">
                    {chatHistory.length === 0 && (
                      <p className="text-center text-[10px] text-text-secondary/40 font-black uppercase tracking-widest mt-10">Initialize query for context deep dive</p>
                    )}
                    {chatHistory.map((msg, i) => (
                      <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[80%] p-4 rounded-2xl text-xs font-bold leading-relaxed ${
                          msg.role === 'user' ? 'bg-accent-primary text-text-primary' : 'bg-bg-primary border border-border-muted/30 text-text-secondary'
                        }`}>
                          {msg.content}
                        </div>
                      </div>
                    ))}
                    {chatLoading && (
                      <div className="flex justify-start">
                        <div className="bg-bg-primary border border-border-muted/30 p-4 rounded-2xl flex gap-1.5">
                           <div className="w-1.5 h-1.5 bg-accent-secondary rounded-full animate-bounce" />
                           <div className="w-1.5 h-1.5 bg-accent-secondary rounded-full animate-bounce [animation-delay:0.2s]" />
                           <div className="w-1.5 h-1.5 bg-accent-secondary rounded-full animate-bounce [animation-delay:0.4s]" />
                        </div>
                      </div>
                    )}
                  </div>

                  <form onSubmit={handleChat} className="p-4 border-t border-border-muted/30 bg-bg-secondary/40 flex gap-4">
                    <input 
                      value={chatInput}
                      onChange={e => setChatInput(e.target.value)}
                      type="text" 
                      placeholder="Ask about document context..."
                      className="flex-1 bg-bg-primary/80 border border-border-muted rounded-xl px-5 py-3 text-sm font-bold outline-none focus:border-accent-secondary/50 transition-all placeholder:text-text-secondary/40 text-text-primary"
                    />
                    <button 
                      type="submit"
                      disabled={!chatInput.trim() || chatLoading}
                      className="bg-bg-secondary border border-border-muted/30 hover:bg-accent-secondary hover:text-bg-primary disabled:opacity-30 p-3 rounded-xl transition-all"
                    >
                      <Send className="h-5 w-5" />
                    </button>
                  </form>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
