import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Brain, Activity, TrendingUp, Clock, Target, AlertTriangle, Zap, BarChart2, Sparkles } from 'lucide-react';
import PageTitle from '../components/PageTitle';
import { apiFetch } from '../api';

export default function DigitalTwin() {
  const [data, setData] = useState({
    productivity_score: 0,
    patterns: [],
    predictions: [],
    recommendations: [],
    suggestions: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await apiFetch('/api/digital-twin');
        if (res.ok) {
          const result = await res.json();
          setData(prev => ({ ...prev, ...result }));
        }
      } catch(e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) return (
     <div className="flex justify-center py-20 items-center min-h-[50vh]">
        <div className="w-8 h-8 rounded-full border-2 border-[var(--primary)] border-t-transparent animate-spin"/>
     </div>
  );

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <PageTitle title="Digital Twin" />

      {/* Header section with pulsating brain */}
      <div className="relative premium-card p-8 rounded-3xl overflow-hidden shadow-2xl border-[var(--primary)]/30">
        <div className="absolute top-[-50%] right-[-10%] w-[60%] h-[200%] bg-gradient-to-l from-[var(--primary)]/20 to-transparent blur-[100px] pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
           <div className="relative w-32 h-32 flex items-center justify-center shrink-0">
             <motion.div 
               animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.6, 0.3] }}
               transition={{ duration: 3, repeat: Infinity }}
               className="absolute inset-0 bg-[var(--primary)] rounded-full blur-xl"
             />
             <div className="relative z-10 bg-[var(--bg-main)] p-6 rounded-full border-2 border-[var(--primary)] shadow-[0_0_30px_rgba(91,108,255,0.4)]">
               <Brain className="w-12 h-12 text-[var(--primary)]" />
             </div>
           </div>
           
           <div className="text-center md:text-left">
             <div className="flex items-center justify-center md:justify-start gap-2 mb-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
                <p className="text-xs font-bold text-emerald-400 uppercase tracking-widest">Twin Synchronized</p>
             </div>
             <h1 className="text-4xl font-display font-bold text-white mb-2">Your Digital Twin</h1>
             <p className="text-[var(--txt-secondary)] max-w-xl">
               I have analyzed your behavior patterns, communication style, and productivity rhythms to better represent you autonomously.
             </p>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        
        {/* Productivity Score Ring */}
        <div className="premium-card p-6 flex flex-col items-center justify-center relative overflow-hidden text-center">
          <div className="absolute top-4 right-4"><Activity className="w-5 h-5 text-[var(--txt-secondary)]" /></div>
          <h2 className="text-sm font-semibold text-[var(--txt-secondary)] uppercase tracking-wider mb-8">Overall Productivity</h2>
          
          <div className="relative w-48 h-48 mb-4">
             {/* Simple SVG Ring */}
             <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="40" fill="transparent" stroke="var(--bg-card)" strokeWidth="8" />
                <motion.circle 
                  initial={{ strokeDashoffset: 251 }}
                  animate={{ strokeDashoffset: 251 - (251 * (data.productivity_score / 100)) }}
                  transition={{ duration: 1.5, ease: "easeOut" }}
                  cx="50" cy="50" r="40" fill="transparent" 
                  stroke="url(#gradient)" strokeWidth="8" strokeDasharray="251" 
                  strokeLinecap="round" 
                />
                <defs>
                   <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="var(--primary)" />
                      <stop offset="100%" stopColor="var(--accent)" />
                   </linearGradient>
                </defs>
             </svg>
             <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-4xl font-black text-white">{data.productivity_score}%</span>
                <span className="text-xs text-[var(--txt-secondary)] font-semibold mt-1 text-emerald-400">Calculated</span>
             </div>
          </div>
          <p className="text-sm text-[var(--txt-secondary)]">Optimized schedule efficiency</p>
        </div>

        {/* Behavior Analytics */}
        <div className="premium-card p-6 lg:col-span-2 relative overflow-hidden">
          <div className="absolute top-4 right-4"><Target className="w-5 h-5 text-[var(--txt-secondary)]" /></div>
          <h2 className="text-sm font-semibold text-[var(--txt-secondary)] uppercase tracking-wider mb-6">Behavior Analytics</h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
             <div className="bg-[var(--bg-main)]/50 border border-[var(--glass-border)] p-4 rounded-2xl flex gap-4 items-start hover:border-[var(--primary)]/50 transition-colors">
               <div className="p-2 bg-blue-500/10 rounded-lg shrink-0">
                 <Clock className="w-5 h-5 text-blue-400" />
               </div>
               <div>
                 <h4 className="font-bold text-white text-sm mb-1">Peak Focus Time</h4>
                 <p className="text-xs text-[var(--txt-secondary)] leading-relaxed">You reply to emails faster and complete complex tasks between 9:00 AM and 11:30 AM.</p>
               </div>
             </div>
             <div className="bg-[var(--bg-main)]/50 border border-[var(--glass-border)] p-4 rounded-2xl flex gap-4 items-start hover:border-[var(--primary)]/50 transition-colors">
               <div className="p-2 bg-purple-500/10 rounded-lg shrink-0">
                 <Zap className="w-5 h-5 text-purple-400" />
               </div>
               <div>
                 <h4 className="font-bold text-white text-sm mb-1">Communication Style</h4>
                 <p className="text-xs text-[var(--txt-secondary)] leading-relaxed">Your tone is generally polite but concise. You frequently use bullet points for clarity.</p>
               </div>
             </div>
             {data.patterns.map((pt, i) => (
                <div key={i} className="bg-[var(--bg-main)]/50 border border-[var(--glass-border)] p-4 rounded-2xl flex gap-4 items-start hover:border-[var(--primary)]/50 transition-colors">
                 <div className="p-2 bg-emerald-500/10 rounded-lg shrink-0">
                   <TrendingUp className="w-5 h-5 text-emerald-400" />
                 </div>
                 <div>
                   <h4 className="font-bold text-white text-sm mb-1">Pattern Identified</h4>
                   <p className="text-xs text-[var(--txt-secondary)] leading-relaxed">{pt}</p>
                 </div>
                </div>
             ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Identified Recommendations */}
        <div className="premium-card p-6 relative">
          <h2 className="text-sm font-semibold text-white uppercase tracking-wider mb-6">Actionable Recommendations</h2>
          
          <div className="space-y-4">
             {data.recommendations.map((rec, idx) => (
               <div key={idx} className="flex items-start gap-3 p-4 bg-[var(--bg-main)] border border-[var(--primary)]/20 rounded-xl group transition-all hover:bg-[var(--primary)]/10">
                  <Sparkles className="w-5 h-5 text-[var(--primary)] shrink-0" />
                  <p className="text-sm text-white font-medium leading-snug">{rec}</p>
               </div>
             ))}
             {data.recommendations.length === 0 && (
                <p className="text-sm text-[var(--txt-secondary)]">No new recommendations at this time.</p>
             )}
          </div>
        </div>

        {/* AI Predictions */}
        <div className="premium-card p-6 bg-gradient-to-br from-[var(--bg-card)] to-[var(--primary)]/5 border-[var(--primary)]/30">
           <h2 className="text-sm font-semibold text-white uppercase tracking-wider mb-6 flex items-center gap-2">
             <AlertTriangle className="w-4 h-4 text-amber-400" /> Proactive Predictions
           </h2>
           
           <div className="space-y-4">
              {data.predictions.map((pred, idx) => (
                <div key={idx} className="bg-[var(--bg-main)]/80 p-5 rounded-2xl border-l-4 border-l-amber-400 shadow-lg backdrop-blur-sm">
                  <h4 className="font-bold text-white mb-2">Forecasted Behavior</h4>
                  <p className="text-sm text-[var(--txt-secondary)] leading-relaxed mb-3">
                    {pred}
                  </p>
                </div>
              ))}
              {data.suggestions.map((sug, idx) => (
                <div key={idx} className="bg-[var(--bg-main)]/80 p-5 rounded-2xl border-l-4 border-l-[var(--primary)] shadow-lg backdrop-blur-sm">
                  <h4 className="font-bold text-white mb-2">Smart Suggestion</h4>
                  <p className="text-sm text-[var(--txt-secondary)] leading-relaxed mb-3">
                    {typeof sug === "string" ? sug : sug.reason}
                  </p>
                  <button className="text-sm font-bold text-[var(--primary)] hover:text-blue-400 flex items-center gap-1 transition-colors">
                    Review Suggestion <Sparkles className="w-3 h-3" />
                  </button>
                </div>
              ))}
           </div>
        </div>
      </div>
    </div>
  );
}
