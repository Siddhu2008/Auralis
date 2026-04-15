import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useParams, useNavigate } from 'react-router-dom';
import { Shield, Sparkles, MicOff, Users, ArrowLeft, LogOut, Cpu, AlertCircle } from 'lucide-react';

export default function AIProxy() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [transcript, setTranscript] = useState([
    { speaker: 'Sarah', text: 'So we need to decide on the roadmap by Q3.', time: '10:02 AM' },
    { speaker: 'David', text: 'I agree, but we should prioritize the AI features first.', time: '10:03 AM' }
  ]);
  const [isTakingOver, setIsTakingOver] = useState(false);
  const [takeoverCountdown, setTakeoverCountdown] = useState(3);

  useEffect(() => {
    // Mock incoming transcript over time
    const msgs = [
      { speaker: 'AI Proxy', text: 'I have noted the priority for AI features. Siddhu supports this direction.', time: '10:04 AM', isAI: true },
      { speaker: 'Sarah', text: 'Great. Let me document that in the project spec.', time: '10:05 AM' },
    ];
    let step = 0;
    const interval = setInterval(() => {
      if (step < msgs.length && !isTakingOver) {
        setTranscript(prev => [...prev, msgs[step]]);
        step++;
      }
    }, 4000);
    return () => clearInterval(interval);
  }, [isTakingOver]);

  useEffect(() => {
    if (isTakingOver && takeoverCountdown > 0) {
      const timer = setTimeout(() => setTakeoverCountdown(prev => prev - 1), 1000);
      return () => clearTimeout(timer);
    } else if (isTakingOver && takeoverCountdown === 0) {
      navigate(`/meeting/${id}`); // Jump into real meeting room
    }
  }, [isTakingOver, takeoverCountdown, navigate, id]);

  const handleTakeOver = () => {
    setIsTakingOver(true);
  };

  return (
    <div className="h-[calc(100vh-140px)] flex flex-col md:flex-row gap-8 px-4 max-w-7xl mx-auto items-center justify-center">
      
      {/* Visual Avatar Side */}
      <div className="w-full md:w-1/2 flex flex-col items-center justify-center border-r-0 md:border-r border-[var(--glass-border)] pr-0 md:pr-8 py-8">
        <button onClick={() => navigate('/meetings')} className="self-start text-[var(--txt-secondary)] hover:text-white flex items-center gap-2 mb-12">
          <ArrowLeft className="w-4 h-4" /> Back to Hub
        </button>

        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-2 mb-4">
             <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.8)]" />
             <p className="text-sm font-bold text-red-500 uppercase tracking-widest">Live Proxy Active</p>
          </div>
          <h1 className="text-3xl font-display font-bold text-white mb-2">Listening to Marketing Sync...</h1>
          <p className="text-[var(--txt-secondary)]">Auralis Agent is representing you in Room #{id}</p>
        </div>

        {/* Glowing Orb Animation */}
        <div className="relative w-64 h-64 flex items-center justify-center mb-12">
          {/* Outer glow aura */}
          <motion.div 
            animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            className="absolute inset-0 bg-gradient-to-br from-[var(--primary)] to-[var(--accent)] rounded-full blur-[60px] opacity-40 mix-blend-screen"
          />
          {/* Wave pulses */}
          <motion.div 
            animate={{ scale: [0.8, 1.5], opacity: [0.8, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeOut" }}
            className="absolute inset-0 border-2 border-[var(--primary)] rounded-full"
          />
          <motion.div 
            animate={{ scale: [0.8, 1.5], opacity: [0.8, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeOut", delay: 1 }}
            className="absolute inset-0 border-2 border-[var(--accent)] rounded-full"
          />
          {/* Core Orb */}
          <div className="relative z-10 w-32 h-32 rounded-full glass-card border-[var(--primary)]/50 flex flex-col items-center justify-center shadow-[0_0_40px_rgba(91,108,255,0.6)] backdrop-blur-md overflow-hidden bg-[var(--bg-main)]/50">
             <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-[var(--primary)]/40 to-transparent" />
             <Cpu className="w-12 h-12 text-white mb-2" />
             <div className="flex gap-1 justify-center items-end h-4 w-full px-8">
               {[1, 2, 3, 4, 5].map(i => (
                 <motion.div key={i} animate={{ height: ['20%', '100%', '20%'] }} transition={{ duration: 0.5 + Math.random()*0.5, repeat: Infinity, ease: "linear", delay: i*0.1 }} className="flex-1 bg-white rounded-t-sm" />
               ))}
             </div>
          </div>
        </div>

        <div className="w-full max-w-xs">
          {isTakingOver ? (
            <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-6 text-center">
               <h3 className="text-xl font-bold text-red-400 mb-2">Assuming Control...</h3>
               <p className="text-4xl font-black text-white">{takeoverCountdown}s</p>
            </div>
          ) : (
            <button onClick={handleTakeOver} className="w-full btn-gradient py-4 rounded-2xl font-bold text-white shadow-[0_0_30px_rgba(91,108,255,0.4)] hover:shadow-[0_0_40px_rgba(91,108,255,0.6)] transition-all flex items-center justify-center gap-2 group">
              <LogOut className="w-5 h-5 group-hover:-translate-x-1 transition-transform" /> Take Over Session
            </button>
          )}
        </div>
      </div>

      {/* Transcript Side */}
      <div className="w-full md:w-1/2 h-[600px] flex flex-col premium-card rounded-3xl overflow-hidden shadow-2xl relative">
        <div className="p-6 border-b border-[var(--glass-border)] bg-[var(--bg-main)]/80 flex justify-between items-center backdrop-blur-md">
          <div className="flex items-center gap-3">
             <div className="p-2 border border-[var(--glass-border)] rounded-lg bg-white/5">
                <Users className="w-5 h-5 text-[var(--primary)]" />
             </div>
             <div>
               <h3 className="font-bold text-white">Live Transcript</h3>
               <p className="text-xs text-[var(--txt-secondary)]">Encrypted Connection</p>
             </div>
          </div>
          <span className="bg-emerald-500/10 text-emerald-400 px-3 py-1 rounded-full text-xs font-bold border border-emerald-500/20">Recording</span>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-[var(--bg-card)]/30 scrollbar-custom">
           {transcript.map((msg, idx) => (
             <motion.div 
               key={idx} 
               initial={{ opacity: 0, x: msg.isAI ? 20 : -20 }}
               animate={{ opacity: 1, x: 0 }}
               className={`flex flex-col max-w-[85%] ${msg.isAI ? 'ml-auto items-end' : 'mr-auto items-start'}`}
             >
               <span className="text-xs font-semibold text-[var(--txt-secondary)] mb-1 uppercase tracking-wider">{msg.speaker} <span className="text-[10px] opacity-60 ml-1">{msg.time}</span></span>
               <div className={`p-4 rounded-2xl text-sm leading-relaxed ${msg.isAI ? 'bg-gradient-to-r from-[var(--primary)] to-[var(--accent)] text-white shadow-lg' : 'bg-[var(--bg-main)] border border-[var(--glass-border)] text-white/90 shadow-sm'}`}>
                 {msg.text}
               </div>
             </motion.div>
           ))}
        </div>
        
        <div className="p-4 bg-[var(--bg-main)] border-t border-[var(--glass-border)] flex items-center justify-center text-[var(--txt-secondary)] gap-2 text-sm font-semibold">
           <MicOff className="w-4 h-4 text-red-400" /> Your microphone is disabled.
        </div>
      </div>

    </div>
  );
}
