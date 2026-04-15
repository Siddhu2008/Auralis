import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Calendar, Inbox, CheckSquare, Sparkles, Plus, Edit3, 
  Mic, AlertCircle, Video, CheckCircle2, Bell, Clock
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { format } from 'date-fns';
import { apiFetch } from '../api';

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const today = new Date();
  
  const [data, setData] = useState(null);
  const [suggestions, setSuggestions] = useState([]);

  useEffect(() => {
    const loadHome = async () => {
       try {
         const [resDash, resTwin] = await Promise.all([
           apiFetch('/api/dashboard'),
           apiFetch('/api/digital-twin')
         ]);
         const dashData = resDash.ok ? await resDash.json() : null;
         const twinData = resTwin.ok ? await resTwin.json() : null;
         
         if (dashData) setData(dashData);
         if (twinData) setSuggestions(twinData.suggestions || []);
       } catch(e) {
         console.error("Dashboard Load Error", e);
       }
    };
    loadHome();
  }, []);

  if (!data) return (
     <div className="flex justify-center py-20 items-center min-h-[50vh]">
        <div className="w-8 h-8 rounded-full border-2 border-[var(--primary)] border-t-transparent animate-spin"/>
     </div>
  );

  const meetingsTodayTotal = data.upcoming_schedules?.filter(s => {
    const d = new Date(s.scheduled_start_at || s.start_time);
    return !isNaN(d.getTime()) && d.getDate() === today.getDate();
  }).length || 0;

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-20">
      
      {/* 1. Daily Briefing (Hero Card) */}
      <div className="relative w-full h-auto sm:h-[140px] rounded-3xl overflow-hidden flex items-center px-5 sm:px-8 py-5 sm:py-0 shadow-2xl bg-gradient-to-r from-blue-700 to-teal-600">
         <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-teal-500 opacity-90" />
         <motion.div 
           animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
           transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
           className="absolute top-[-50%] right-[-10%] w-[60%] h-[200%] bg-white/20 blur-[80px]"
         />
         
         <div className="relative z-10 w-full flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
            <div className="min-w-0">
               <h1 className="text-xl sm:text-3xl font-display font-bold text-white mb-1 truncate">Good Morning, {user?.name?.split(' ')[0] || 'Siddhu'}</h1>
               <p className="text-white/80 font-medium text-xs sm:text-base">{format(today, 'EEEE, MMMM do')} • {format(today, 'h:mm a')}</p>
            </div>
            
            <div className="flex gap-4 sm:gap-6 mt-2 md:mt-0 flex-wrap">
               <div className="flex items-center gap-2 text-white">
                 <div className="p-1.5 sm:p-2 bg-white/20 rounded-lg"><Calendar className="w-4 h-4 sm:w-5 sm:h-5" /></div>
                 <div><p className="font-bold text-sm sm:text-lg leading-none">{meetingsTodayTotal}</p><p className="text-[10px] sm:text-xs text-white/70">Meetings</p></div>
               </div>
               <div className="flex items-center gap-2 text-white">
                 <div className="p-1.5 sm:p-2 bg-white/20 rounded-lg"><Inbox className="w-4 h-4 sm:w-5 sm:h-5" /></div>
                 <div><p className="font-bold text-sm sm:text-lg leading-none">{data.email_metrics?.unread || 0}</p><p className="text-[10px] sm:text-xs text-white/70">Emails</p></div>
               </div>
               <div className="flex items-center gap-2 text-white">
                 <div className="p-1.5 sm:p-2 bg-white/20 rounded-lg"><CheckSquare className="w-4 h-4 sm:w-5 sm:h-5" /></div>
                 <div><p className="font-bold text-sm sm:text-lg leading-none">{data.task_metrics?.pending || 0}</p><p className="text-[10px] sm:text-xs text-white/70">Tasks</p></div>
               </div>
            </div>
         </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-start">
         
         {/* 2. Quick Actions */}
         <div className="premium-card p-6 rounded-3xl">
            <h2 className="text-lg font-bold text-white mb-4">Quick Actions</h2>
            <div className="grid grid-cols-2 gap-4">
              {[
                { icon: Plus, label: 'Create Meeting', onClick: () => navigate('/meetings'), color: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
                { icon: Edit3, label: 'Draft Email', onClick: () => navigate('/emails'), color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
                { icon: CheckSquare, label: 'Add Task', onClick: () => navigate('/tasks'), color: 'bg-purple-500/10 text-purple-400 border-purple-500/20' },
                { icon: Mic, label: 'Ask AI', onClick: () => navigate('/assistant'), color: 'bg-[var(--primary)]/10 text-[var(--primary)] border-[var(--primary)]/20 shadow-[0_0_15px_var(--primary)] backdrop-blur-md' },
              ].map((action, i) => (
                <button 
                  key={i} onClick={action.onClick}
                  className={`flex flex-col items-center justify-center p-4 rounded-2xl border transition-all hover:scale-105 hover:shadow-lg ${action.color}`}
                >
                  <action.icon className="w-6 h-6 mb-2" />
                  <span className="text-xs font-bold text-white">{action.label}</span>
                </button>
              ))}
            </div>
         </div>

         {/* 3. AI Suggestions */}
         <div className="premium-card p-6 rounded-3xl flex flex-col">
           <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
             <Sparkles className="w-5 h-5 text-[var(--primary)]" /> Smart Suggestions
           </h2>
           <div className="space-y-3 flex-1 overflow-y-auto max-h-[220px] pr-2 scrollbar-custom">
             {suggestions.map((sug, i) => (
               <div key={i} className="bg-[var(--bg-main)] border border-[var(--glass-border)] p-4 rounded-2xl flex items-center justify-between group hover:border-[var(--primary)]/50 transition-colors">
                 <div className="flex items-center gap-3">
                   <div className={`p-2 rounded-lg ${typeof sug === 'string' && sug.includes('conflict') ? 'bg-amber-500/10 text-amber-500' : 'bg-emerald-500/10 text-emerald-500'}`}>
                      {typeof sug === 'string' && sug.includes('conflict') ? <AlertCircle className="w-4 h-4" /> : <Inbox className="w-4 h-4" />}
                   </div>
                   <p className="text-sm font-semibold text-white truncate max-w-[140px] sm:max-w-[200px]">{typeof sug === 'string' ? sug : sug.reason}</p>
                 </div>
                 <div className="flex gap-2">
                    <button 
                      onClick={() => {
                        const content = typeof sug === 'string' ? sug : (sug.reason || sug.message || "Analyze this");
                        navigate('/assistant', { state: { initialMessage: content } });
                      }} 
                      className="px-3 py-1 bg-[var(--primary)] text-white text-xs font-bold rounded-lg hover:bg-blue-600"
                    >
                      Act
                    </button>
                 </div>
               </div>
             ))}
             {suggestions.length === 0 && (
                 <p className="text-sm text-[var(--txt-secondary)] text-center mt-8">No specific recommendations right now.</p>
             )}
           </div>
         </div>

         {/* 4. Upcoming Meetings */}
         <div className="premium-card p-6 rounded-3xl">
            <h2 className="text-lg font-bold text-white mb-4">Upcoming Meetings</h2>
            <div className="space-y-3 overflow-y-auto max-h-[220px] pr-2 scrollbar-custom">
              {data.upcoming_schedules?.filter(mtg => {
                if (mtg.title?.startsWith('Instant Session')) return false;
                if (['completed', 'ended', 'cancelled', 'past'].includes(mtg.status?.toLowerCase())) return false;
                
                const st = (mtg.scheduled_start_at || mtg.start_time) ? new Date(mtg.scheduled_start_at || mtg.start_time) : null;
                if (!st || isNaN(st.getTime())) return true; // Keep if no parseable date
                
                const now = new Date();
                const diffHours = (now - st) / (1000 * 60 * 60);
                // Keep if it's in the future or started less than 1 hour ago (and not marked completed)
                return diffHours < 1;
              }).slice(0, 3).map((mtg, i) => {
                const st = (mtg.scheduled_start_at || mtg.start_time) ? new Date(mtg.scheduled_start_at || mtg.start_time) : null;
                const isValid = st && !isNaN(st.getTime());
                return (
                  <div key={i} className="flex items-center justify-between p-3 sm:p-4 bg-[var(--bg-main)] border border-[var(--glass-border)] rounded-2xl group hover:border-[var(--primary)]/50 transition-colors cursor-pointer" onClick={() => navigate('/meetings')}>
                    <div className="flex items-center gap-4">
                      <div className="text-center shrink-0">
                        <p className="text-xs font-bold text-[var(--primary)]">{isValid ? format(st, 'h:mm') : '--:--'}</p>
                        <p className="text-[10px] text-[var(--txt-secondary)] uppercase">{isValid ? format(st, 'a') : ''}</p>
                      </div>
                      <div className="w-px h-8 bg-white/10" />
                      <p className="font-semibold text-white line-clamp-1">{mtg.title}</p>
                    </div>
                    <button className="sm:opacity-0 sm:group-hover:opacity-100 px-3 sm:px-4 py-1.5 sm:py-2 bg-white/5 hover:bg-white/10 rounded-xl text-xs font-bold text-white transition-all flex items-center gap-2">
                      <Video className="w-3 h-3" /> Join
                    </button>
                  </div>
                )
              })}
              {data.upcoming_schedules?.length === 0 && (
                 <p className="text-sm text-[var(--txt-secondary)] py-4 text-center">Your schedule is clear.</p>
              )}
            </div>
         </div>

         {/* 5. Tasks Overview */}
         <div className="premium-card p-6 rounded-3xl flex flex-col">
            <h2 className="text-lg font-bold text-white mb-4">Tasks Overview</h2>
            <div className="grid grid-cols-2 gap-2 flex-1 items-center" onClick={() => navigate('/tasks')}>
              <div className="bg-[var(--bg-main)] border border-[var(--glass-border)] rounded-2xl p-4 flex flex-col items-center justify-center text-center cursor-pointer hover:border-slate-500/50 transition-colors">
                 <span className="text-3xl font-black text-slate-400 mb-1">{data.task_metrics?.pending || 0}</span>
                 <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">To Do</span>
              </div>
              <div className="bg-[var(--bg-main)] border border-emerald-500/20 rounded-2xl p-4 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-emerald-500/5 transition-colors">
                 <span className="text-3xl font-black text-emerald-400 mb-1">{data.task_metrics?.completed || 0}</span>
                 <span className="text-[10px] font-bold text-emerald-400/80 uppercase tracking-wider">Done</span>
              </div>
            </div>
         </div>

         {/* 6. Priority Inbox */}
         <div className="premium-card p-6 rounded-3xl">
            <h2 className="text-lg font-bold text-white mb-4">Priority Inbox</h2>
            <div className="space-y-3 overflow-y-auto max-h-[220px] pr-2 scrollbar-custom">
              {data.recent_emails?.map((em, i) => (
                <div key={i} className="p-4 bg-[var(--bg-main)] border border-[var(--glass-border)] rounded-2xl cursor-pointer hover:border-[var(--primary)]/50 transition-colors" onClick={()=>navigate('/emails')}>
                  <div className="flex justify-between items-center mb-1">
                    <h4 className="font-bold text-white text-sm truncate max-w-[140px] sm:max-w-[200px]">{em.sender || em.recipient || em.from}</h4>
                    {em.unread && <span className="w-2 h-2 rounded-full bg-[var(--primary)] shrink-0" />}
                  </div>
                  <p className="text-xs text-[var(--txt-secondary)] mb-2 truncate">{em.subject}</p>
                  <div className="flex items-start gap-2 bg-[var(--primary)]/10 p-2 rounded-lg border border-[var(--primary)]/20">
                    <Sparkles className="w-3 h-3 text-[var(--primary)] shrink-0 mt-0.5" />
                    <p className="text-[10px] text-white/80 leading-tight line-clamp-2">{em.summary || "This email has been intel-processed."}</p>
                  </div>
                </div>
              ))}
              {(!data.recent_emails || data.recent_emails.length === 0) && (
                 <p className="text-sm text-[var(--txt-secondary)] py-4 text-center">Inbox zero achieved. 🚀</p>
              )}
            </div>
         </div>


         {/* 7. Productivity Insights */}
         <div className="premium-card p-6 rounded-3xl flex flex-col">
            <h2 className="text-lg font-bold text-white mb-4">Productivity Week</h2>
            <div className="flex-1 flex items-center justify-center gap-8 bg-[var(--bg-main)] rounded-2xl border border-[var(--glass-border)] p-4">
               <div className="flex flex-col items-center text-center">
                  <div className="w-16 h-16 rounded-full border-4 border-emerald-500/30 flex items-center justify-center mb-2">
                    <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                  </div>
                  <p className="text-2xl font-black text-white leading-none">{data.task_metrics?.completed || 0}</p>
                  <p className="text-[10px] font-bold text-[var(--txt-secondary)] uppercase mt-1">Tasks Done</p>
               </div>
               <div className="w-px h-16 bg-[var(--glass-border)]" />
               <div className="flex flex-col items-center text-center">
                  <div className="w-16 h-16 rounded-full border-4 border-blue-500/30 flex items-center justify-center mb-2">
                    <Video className="w-6 h-6 text-blue-400" />
                  </div>
                  <p className="text-2xl font-black text-white leading-none">{data.completed_meetings || 0}</p>
                  <p className="text-[10px] font-bold text-[var(--txt-secondary)] uppercase mt-1">Meetings Met</p>
               </div>
            </div>
         </div>

      </div>
    </div>
  );
}
