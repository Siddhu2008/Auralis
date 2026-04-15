import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Plus, Video, Copy, PhoneCall, Loader2, X } from 'lucide-react';
import PageTitle from '../components/PageTitle';
import { apiFetch } from '../api';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, eachDayOfInterval, addDays, addWeeks, subWeeks, isSameDay, isSameMonth } from 'date-fns';
import { useToast } from '../components/ui/ToastProvider';

export default function Meetings() {
  const [viewMode, setViewMode] = useState('week'); // 'month' | 'week'
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [joinCode, setJoinCode] = useState('');
  const [isDeployingProxy, setIsDeployingProxy] = useState(false);
  const [isStartingInstant, setIsStartingInstant] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  const currentWeekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  
  const { addToast } = useToast();
  
  // Create Meeting state
  const [newTitle, setNewTitle] = useState('');
  const [newDate, setNewDate] = useState('');
  const [newTime, setNewTime] = useState('');

  const today = new Date();
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const hours = Array.from({length: 24}, (_, i) => i); // 12 AM to 11 PM

  // Today's date string for min attribute on date input
  const todayStr = format(today, 'yyyy-MM-dd');

  const fetchMeetings = async () => {
    try {
      const res = await apiFetch('/api/meetings/upcoming');
      const data = await res.json();
      if (res.ok) {
        setMeetings(data.meetings || data || []);
      }
    } catch(e) {
      console.error(e);
      addToast({ type: 'error', title: 'Error', message: 'Failed to fetch schedule.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMeetings();
  }, []);

  // Navigation
  const goToPrev = () => {
    if (viewMode === 'week') {
      setCurrentDate(prev => subWeeks(prev, 1));
    } else {
      setCurrentDate(prev => {
        const d = new Date(prev);
        d.setMonth(d.getMonth() - 1);
        return d;
      });
    }
  };
  const goToNext = () => {
    if (viewMode === 'week') {
      setCurrentDate(prev => addWeeks(prev, 1));
    } else {
      setCurrentDate(prev => {
        const d = new Date(prev);
        d.setMonth(d.getMonth() + 1);
        return d;
      });
    }
  };
  const goToToday = () => setCurrentDate(new Date());

  const handleCreateMeeting = async (e) => {
    e.preventDefault();

    // Past date validation
    const selectedDateTime = new Date(`${newDate}T${newTime}:00`);
    if (selectedDateTime < new Date()) {
      addToast({ type: 'error', title: 'Invalid Date', message: 'Cannot schedule a meeting in the past.' });
      return;
    }

    try {
      const startIso = selectedDateTime.toISOString();
      const endObj = new Date(selectedDateTime);
      endObj.setHours(endObj.getHours() + 1);
      const endIso = endObj.toISOString();

      const res = await apiFetch('/api/meetings/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newTitle,
          start_time: startIso,
          end_time: endIso,
          participants: []
        })
      });
      if (res.ok) {
        addToast({ type: 'success', title: 'Scheduled', message: 'Meeting added to agenda.' });
        setShowModal(false);
        setNewTitle('');
        setNewDate('');
        setNewTime('');
        fetchMeetings();
      } else {
         throw new Error('Failed');
      }
    } catch(err) {
      addToast({ type: 'error', title: 'Error', message: 'Could not create meeting.' });
    }
  };

  const handleInstantMeeting = async () => {
    setIsStartingInstant(true);
    try {
      const res = await apiFetch('/api/meetings/instant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: `Instant Session - ${format(new Date(), 'HH:mm')}` })
      });
      const data = await res.json();
      if (res.ok) {
        addToast({ type: 'success', title: 'Session Active', message: 'Neural link established.' });
        window.location.href = `/meeting/${data.meeting_code}`;
      } else {
        throw new Error(data.error || 'Failed');
      }
    } catch(err) {
      addToast({ type: 'error', title: 'Buffer Error', message: 'Could not initialize instant protocol.' });
    } finally {
      setIsStartingInstant(false);
    }
  };

  const handleJoinByCode = async (e) => {
    e.preventDefault();
    if (!joinCode) return;
    setIsJoining(true);
    try {
      const res = await apiFetch(`/api/meetings/join/${joinCode.toUpperCase()}`);
      const data = await res.json();
      if (res.ok) {
        window.location.href = `/meeting/${data.meeting_code}`;
      } else {
        addToast({ type: 'error', title: 'Invalid Code', message: 'No such neural frequency found.' });
      }
    } catch(err) {
      addToast({ type: 'error', title: 'Connection Error', message: 'Failed to resolve protocol.' });
    } finally {
      setIsJoining(false);
    }
  };

  const handleProxyStart = async (mtgId) => {
    setIsDeployingProxy(true);
    addToast({ type: 'info', title: 'Deploying Proxy', message: 'Connecting meeting proxy agent...' });
    try {
      const res = await apiFetch('/api/meetings/proxy/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ meeting_id: mtgId })
      });
      const data = await res.json();
      if (res.ok) {
        addToast({ type: 'success', title: 'Proxy Active', message: data.message || 'AI is now proxying the meeting.' });
      } else {
        throw new Error(data.error || 'Failed');
      }
    } catch(err) {
       addToast({ type: 'error', title: 'Proxy Failure', message: 'Failed to deploy proxy.' });
    } finally {
       setIsDeployingProxy(false);
    }
  };

  const processedWeekMeetings = React.useMemo(() => {
    if (viewMode !== 'week') return [];
    
    // 1. Filter and parse valid meetings in the current week
    const validMeetings = meetings.map((item, idx) => {
      const mtg = item.meeting || item || {};
      const startTime = mtg.scheduled_start_at || mtg.start_time;
      if (!startTime) return null;
      
      const start = new Date(startTime);
      const isPast = start < new Date();
      const isCompleted = ['completed', 'ended', 'cancelled', 'past'].includes(mtg.status?.toLowerCase());
      
      if (isCompleted) return null;

      let dayIndex = -1;
      for (let i = 0; i < 7; i++) {
        const dayDate = addDays(currentWeekStart, i);
        if (isSameDay(start, dayDate)) {
          dayIndex = i;
          break;
        }
      }
      if (dayIndex === -1) return null;

      const hr = start.getHours();
      const min = start.getMinutes();
      if (hr < 0 || hr > 23) return null;

      const topPx = (hr * 96) + (min / 60) * 96;
      
      // Default duration is 1 hour if end_time not present
      let durationHours = 1;
      if (mtg.end_time) {
        const end = new Date(mtg.end_time);
        if (end > start) {
          durationHours = (end - start) / (1000 * 60 * 60);
        }
      }
      const heightPx = Math.max(durationHours * 96, 48); // min 30 mins

      return {
        _id: idx,
        item,
        mtg,
        start,
        end: new Date(start.getTime() + durationHours * 60 * 60 * 1000),
        dayIndex,
        topPx,
        heightPx,
        isPast,
      };
    }).filter(Boolean);

    // 2. Group by day
    const daysArr = Array.from({length: 7}, () => []);
    validMeetings.forEach(m => daysArr[m.dayIndex].push(m));

    // 3. Compute overlaps block by block
    const processed = [];
    daysArr.forEach((dayMeetings) => {
      dayMeetings.sort((a, b) => a.start - b.start);
      
      let blocks = [];
      let currentBlock = [];
      let blockMaxEnd = null;
      
      dayMeetings.forEach(mtg => {
        if (blockMaxEnd === null || mtg.start < blockMaxEnd) {
          currentBlock.push(mtg);
          blockMaxEnd = blockMaxEnd === null ? mtg.end : new Date(Math.max(blockMaxEnd.getTime(), mtg.end.getTime()));
        } else {
          blocks.push(currentBlock);
          currentBlock = [mtg];
          blockMaxEnd = mtg.end;
        }
      });
      if (currentBlock.length > 0) blocks.push(currentBlock);
      
      blocks.forEach(block => {
        let columns = [];
        block.forEach(m => {
          let placed = false;
          for (let i = 0; i < columns.length; i++) {
            if (m.start >= columns[i][columns[i].length - 1].end) {
              columns[i].push(m);
              m.colIndex = i;
              placed = true;
              break;
            }
          }
          if (!placed) {
            columns.push([m]);
            m.colIndex = columns.length - 1;
          }
        });
        
        const maxCols = columns.length;
        block.forEach(m => {
          m.maxCols = maxCols;
          processed.push(m);
        });
      });
    });

    return processed;
  }, [meetings, currentWeekStart, viewMode]);

  return (
    <div className="min-h-[calc(100vh-140px)] lg:h-[calc(100vh-140px)] flex flex-col max-w-[1600px] mx-auto p-4 lg:p-0">
      <PageTitle title="Calendar" />
      
      {/* 3. MEETINGS PAGE Layout */}
      <div className="flex flex-col lg:flex-row gap-6 h-full overflow-y-auto lg:overflow-hidden">
        
        {/* Left: Calendar (70%) */}
        <div className="w-full lg:w-[70%] premium-card flex flex-col rounded-3xl overflow-hidden shadow-2xl">
          
           <div className="p-4 border-b border-[var(--glass-border)] bg-[var(--bg-main)] flex flex-wrap gap-4 justify-between items-center shrink-0">
             <div className="flex items-center gap-4">
               <button onClick={goToToday} className="btn-surface px-4 py-2 rounded-xl text-sm font-bold text-white">Today</button>
               <div className="flex items-center gap-2 text-[var(--txt-secondary)]">
                 <button onClick={goToPrev} className="p-1 hover:text-white transition-colors"><ChevronLeft className="w-5 h-5" /></button>
                 <button onClick={goToNext} className="p-1 hover:text-white transition-colors"><ChevronRight className="w-5 h-5" /></button>
               </div>
               <h2 className="text-lg lg:text-xl font-bold text-white ml-2 whitespace-nowrap">{format(currentDate, 'MMMM yyyy')}</h2>
             </div>
             <div className="bg-[var(--bg-card)] rounded-xl p-1 border border-[var(--glass-border)] flex">
               <button onClick={() => setViewMode('week')} className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-all ${viewMode === 'week' ? 'bg-[var(--glass)] text-white shadow-sm' : 'text-[var(--txt-secondary)] hover:text-white'}`}>Week</button>
               <button onClick={() => setViewMode('month')} className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-all ${viewMode === 'month' ? 'bg-[var(--glass)] text-white shadow-sm' : 'text-[var(--txt-secondary)] hover:text-white'}`}>Month</button>
             </div>
          </div>

          {/* Calendar Body */}
          <div className="flex-1 overflow-y-auto overflow-x-auto bg-[var(--bg-main)] relative flex flex-col scrollbar-custom min-h-[500px]">
            
            {loading && (
               <div className="absolute inset-0 z-50 flex items-center justify-center bg-[var(--bg-main)]/50 backdrop-blur-sm">
                  <Loader2 className="w-8 h-8 animate-spin text-[var(--primary)]" />
               </div>
            )}

            {viewMode === 'week' ? (
              <div className="min-w-[800px] flex flex-col flex-1">
                {/* Day Headers */}
                <div className="grid grid-cols-[64px_repeat(7,1fr)] border-b border-[var(--glass-border)] sticky top-0 bg-[var(--bg-main)]/90 backdrop-blur z-30">
                  <div className="border-r border-[var(--glass-border)]" />
                  {days.map((d, i) => {
                    const dayDate = addDays(currentWeekStart, i);
                    const dateNum = dayDate.getDate();
                    const isToday2 = isSameDay(dayDate, today);
                    return (
                      <div key={d} className="text-center py-4 border-r border-[var(--glass-border)] last:border-0 h-20 flex flex-col justify-center items-center">
                        <p className="text-[10px] font-bold text-[var(--txt-secondary)] uppercase tracking-tighter">{d}</p>
                        <div className="h-8 flex items-center justify-center mt-1">
                          <p className={`text-xl font-black w-8 h-8 rounded-full flex items-center justify-center transition-all ${isToday2 ? 'bg-[var(--primary)] text-white shadow-lg shadow-[var(--primary)]/20' : 'text-white'}`}>{dateNum}</p>
                        </div>
                      </div>
                    )
                  })}
                </div>

                {/* Time Grid */}
                <div className="grid grid-cols-[64px_repeat(7,1fr)] flex-1 relative min-h-[2304px]">
                  {/* Time axis */}
                  <div className="border-r border-[var(--glass-border)] flex flex-col relative z-20 bg-[var(--bg-main)]">
                    {hours.map(h => (
                      <div key={h} className="h-24 relative">
                        <span className="absolute -top-3 left-4 text-[10px] font-bold text-[var(--txt-secondary)] w-full">
                          {h === 0 ? '12 AM' : h === 12 ? '12 PM' : h > 12 ? `${h-12} PM` : `${h} AM`}
                        </span>
                      </div>
                    ))}
                  </div>
                  
                  {/* Day Columns (Grouped for absolute positioning of events) */}
                  <div className="col-span-7 grid grid-cols-7 relative h-full">
                    {days.map(d => (
                      <div key={d} className="border-r border-[var(--glass-border)] last:border-0 h-full relative group">
                        {/* Horizontal lines */}
                        {hours.map(h => (
                          <div key={h} className="h-24 border-b border-[var(--glass-border)]/50 w-full" />
                        ))}
                      </div>
                    ))}
                    
                    {/* Dynamically Rendered Events */}
                    {!loading && processedWeekMeetings.map((m) => {
                      const { mtg, isPast, dayIndex, topPx, heightPx, colIndex } = m;
                      
                      const dayWidthPct = 100 / 7;
                      
                      // Using a cascading staggered layout for overlapping meetings
                      const offsetPx = Math.min(colIndex * 16, 48); // Max offset of 48px to stay inside cell
                      
                      return (
                        <div 
                            key={m._id}
                            className={`absolute rounded-xl p-2 md:p-3 mx-0.5 backdrop-blur-md shadow-xl transition-all hover:scale-105 hover:!z-50 cursor-pointer overflow-hidden group/item ${
                              isPast ? 'bg-slate-500/80 border border-slate-500/20 opacity-80' : 'bg-gradient-to-br from-blue-500/90 to-indigo-500/90 border border-blue-400/50 hover:border-blue-300'
                            }`}
                            style={{
                              top: `${topPx}px`,
                              height: `${Math.max(heightPx, 60)}px`, // Ensure it is large enough to click and see
                              width: `calc(${dayWidthPct}% - ${12 + offsetPx}px)`, 
                              left: `calc(${(dayIndex * dayWidthPct)}% + ${4 + offsetPx}px)`,
                              zIndex: 10 + colIndex, // Staggered z-index
                            }}
                        >
                          <div className="flex items-center gap-1 mb-1">
                             <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${isPast ? 'bg-slate-300' : 'bg-blue-200 animate-pulse'}`} />
                             <p className="text-[9px] md:text-[10px] font-black text-white/95 tracking-tighter truncate drop-shadow-md">
                                {format(m.start, 'h:mm a')}
                             </p>
                          </div>
                          <p className="text-white text-[10px] md:text-xs font-black leading-snug line-clamp-2 uppercase tracking-tight drop-shadow-md">{mtg.title || 'Untitled Meeting'}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ) : (
              /* Month View */
              <div className="grid grid-cols-7 h-full min-h-[600px] border-l border-t border-[var(--glass-border)]">
                {days.map(d => (
                  <div key={d} className="p-2 text-center border-r border-b border-[var(--glass-border)] bg-[var(--bg-main)]/50">
                    <span className="text-[10px] font-bold text-[var(--txt-secondary)] uppercase">{d}</span>
                  </div>
                ))}
                {eachDayOfInterval({
                  start: startOfWeek(startOfMonth(currentDate), { weekStartsOn: 1 }),
                  end: endOfWeek(endOfMonth(currentDate), { weekStartsOn: 1 })
                }).map((day, i) => {
                  const dayMeetings = meetings.filter(m => {
                    const mtg = m.meeting || m || {};
                    const st = mtg.scheduled_start_at || mtg.start_time;
                    return st && isSameDay(new Date(st), day);
                  });
                  const isCurMonth = isSameMonth(day, currentDate);
                  const isToday4 = isSameDay(day, today);
                  return (
                    <div key={i} className={`min-h-[100px] p-2 border-r border-b border-[var(--glass-border)] ${isCurMonth ? 'bg-transparent' : 'bg-white/5 opacity-40'}`}>
                      <div className="flex justify-between items-start mb-2">
                        <span className={`text-xs font-bold ${isToday4 ? 'bg-[var(--primary)] text-white w-5 h-5 rounded-full flex items-center justify-center' : 'text-white'}`}>
                          {format(day, 'd')}
                        </span>
                      </div>
                      <div className="space-y-1">
                        {dayMeetings.slice(0, 3).map((m, j) => {
                          const mtg = m.meeting || m || {};
                          return (
                            <div key={j} className="text-[8px] p-1 bg-blue-500/20 border border-blue-500/30 rounded text-white truncate">
                              {mtg.title}
                            </div>
                          );
                        })}
                        {dayMeetings.length > 3 && (
                          <div className="text-[8px] text-[var(--txt-secondary)] pl-1">+{dayMeetings.length - 3} more</div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Panel (30%) */}
        <div className="w-full lg:w-[30%] flex flex-col gap-6 h-full shrink-0">
          
          <div className="flex flex-col gap-3">
            <button 
               onClick={handleInstantMeeting}
               disabled={isStartingInstant}
               className="w-full bg-white/5 border border-white/10 py-4 rounded-3xl font-bold text-white hover:bg-white/10 transition-all flex items-center justify-center gap-2 group disabled:opacity-50"
            >
              <Video className="w-5 h-5 text-emerald-400 group-hover:scale-110 transition-transform" /> 
              {isStartingInstant ? 'Initializing...' : 'Instant Protocol'}
            </button>
            <button 
               onClick={() => setShowJoinModal(true)}
               className="w-full bg-slate-800/50 border border-white/5 py-4 rounded-3xl font-bold text-[var(--txt-secondary)] hover:text-white transition-all flex items-center justify-center gap-2"
            >
              <Copy className="w-5 h-5" /> Join via Code
            </button>
            <button 
               onClick={() => setShowModal(true)}
               className="w-full btn-gradient py-4 rounded-3xl font-bold text-white shadow-xl flex items-center justify-center gap-2 hover:scale-[1.02] transition-transform"
            >
              <Plus className="w-5 h-5" /> Schedule Protocol
            </button>
          </div>

          <div className="premium-card rounded-3xl p-6 flex-1 flex flex-col overflow-hidden shadow-2xl">
             <h2 className="text-lg font-bold text-white mb-6">Upcoming Agenda</h2>
             
             <div className="flex-1 overflow-y-auto space-y-4 pr-1 scrollbar-custom">
               {loading && <Loader2 className="w-6 h-6 animate-spin text-[var(--primary)] mx-auto mt-10" />}
               
               {!loading && meetings.filter(item => {
                 const mtg = item.meeting || item || {};
                 const startTime = mtg.scheduled_start_at || mtg.start_time;
                 return (!startTime || new Date(startTime) >= new Date()) && !mtg.title?.startsWith('Instant Session');
               }).length === 0 && (
                 <p className="text-sm text-[var(--txt-secondary)] text-center py-4">No upcoming meetings detected.</p>
               )}

                {!loading && meetings
                  .filter(item => {
                    const mtg = item.meeting || item || {};
                    const startTime = mtg.scheduled_start_at || mtg.start_time;
                    const isCompleted = ['completed', 'ended', 'cancelled', 'past'].includes(mtg.status?.toLowerCase());
                    return (!startTime || new Date(startTime) >= new Date()) && !mtg.title?.startsWith('Instant Session') && !isCompleted;
                  })
                  .map((item, i) => {
                   const mtg = item.meeting || item || {};
                   const startTime = mtg.scheduled_start_at || mtg.start_time;
                   const mtgDate = startTime ? new Date(startTime) : null;
                   const isValid = mtgDate && !isNaN(mtgDate.getTime());
                   const isToday3 = isValid && isSameDay(mtgDate, today);
                   const timeLabel = isValid 
                     ? (isToday3 ? `Today, ${format(mtgDate, 'h:mm a')}` : format(mtgDate, 'MMM d, h:mm a'))
                     : 'N/A';
                  return (
                    <div key={i} className="bg-[var(--bg-main)] border border-[var(--glass-border)] rounded-2xl p-4 group hover:border-[var(--primary)]/50 transition-colors">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span className={`w-3 h-3 rounded-full ${isToday3 ? 'bg-[var(--primary)]' : 'bg-slate-500'}`} />
                          <p className="text-[10px] font-bold text-[var(--txt-secondary)] uppercase tracking-wider">{timeLabel}</p>
                        </div>
                        <span className="text-[10px] bg-[var(--bg-card)] px-2 py-1 rounded-full text-white/60">
                          {mtg.end_time ? '1h' : 'TBD'}
                        </span>
                      </div>
                      <h3 className="font-bold text-white mb-4 line-clamp-1">{mtg.title}</h3>
                      
                      <div className="flex gap-2">
                        <button 
                          onClick={() => {
                            if (mtg.meeting_code) {
                              window.location.href = `/meeting/${mtg.meeting_code}`;
                            }
                          }}
                          className="flex-1 bg-white/5 hover:bg-white/10 text-white text-xs py-2 rounded-xl font-bold transition-colors flex items-center justify-center gap-1.5 border border-white/5"
                        >
                          <Video className="w-3.5 h-3.5 text-[var(--primary)]" /> Join
                        </button>
                        <button 
                          onClick={() => {
                            if (mtg.meeting_code) {
                               navigator.clipboard.writeText(mtg.meeting_code);
                               addToast({ type: 'success', title: 'Copied', message: 'Meeting code copied to clipboard.' });
                            }
                          }}
                          className="bg-white/5 hover:bg-white/10 text-white p-2 rounded-xl transition-colors border border-white/5"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                        <button 
                          onClick={() => handleProxyStart(mtg.id)}
                          disabled={isDeployingProxy}
                          className="flex-1 btn-surface border border-[var(--primary)]/30 hover:border-[var(--primary)] text-[var(--primary)] text-xs py-2 rounded-xl font-bold transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
                        >
                          <PhoneCall className="w-3.5 h-3.5" /> Proxy AI
                        </button>
                      </div>
                    </div>
                  );
               })}
             </div>
          </div>
        </div>

      </div>

      {/* Schedule Modal */}
      <AnimatePresence>
         {showModal && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
              <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} onClick={() => setShowModal(false)} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
              <motion.div initial={{opacity:0, scale:0.95}} animate={{opacity:1, scale:1}} exit={{opacity:0, scale:0.95}} className="relative bg-[var(--bg-card)] border border-[var(--glass-border)] p-6 rounded-3xl w-full max-w-md shadow-2xl">
                 <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-white">Schedule Meeting</h2>
                    <button onClick={() => setShowModal(false)} className="p-1 hover:bg-white/10 rounded-lg text-white"><X className="w-5 h-5"/></button>
                 </div>
                 <form onSubmit={handleCreateMeeting} className="space-y-4">
                    <div>
                       <label className="text-xs font-semibold text-[var(--txt-secondary)] uppercase mb-1 block">Title</label>
                       <input value={newTitle} onChange={e=>setNewTitle(e.target.value)} required type="text" className="w-full bg-[var(--bg-main)] border border-[var(--glass-border)] rounded-xl px-4 py-3 outline-none focus:border-[var(--primary)] text-white" placeholder="Product Review" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                       <div>
                         <label className="text-xs font-semibold text-[var(--txt-secondary)] uppercase mb-1 block">Date</label>
                         <input value={newDate} onChange={e=>setNewDate(e.target.value)} required type="date" min={todayStr} className="w-full bg-[var(--bg-main)] border border-[var(--glass-border)] rounded-xl px-3 py-3 outline-none focus:border-[var(--primary)] text-[var(--txt-secondary)]" />
                       </div>
                       <div>
                         <label className="text-xs font-semibold text-[var(--txt-secondary)] uppercase mb-1 block">Time</label>
                         <input value={newTime} onChange={e=>setNewTime(e.target.value)} required type="time" className="w-full bg-[var(--bg-main)] border border-[var(--glass-border)] rounded-xl px-3 py-3 outline-none focus:border-[var(--primary)] text-[var(--txt-secondary)]" />
                       </div>
                    </div>
                    <button type="submit" className="w-full btn-gradient py-3 rounded-xl font-bold text-white mt-4 shadow-lg">Confirm Protocol</button>
                 </form>
              </motion.div>
            </div>
         )}
      </AnimatePresence>

      {/* Join By Code Modal */}
      <AnimatePresence>
         {showJoinModal && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
              <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} onClick={() => setShowJoinModal(false)} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
              <motion.div initial={{opacity:0, scale:0.95}} animate={{opacity:1, scale:1}} exit={{opacity:0, scale:0.95}} className="relative bg-[var(--bg-card)] border border-[var(--glass-border)] p-8 rounded-[32px] w-full max-w-sm shadow-2xl overflow-hidden">
                 <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-indigo-500" />
                 <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-black text-white uppercase tracking-tight">Join Protocol</h2>
                    <button onClick={() => setShowJoinModal(false)} className="p-2 hover:bg-white/10 rounded-xl text-slate-400"><X className="w-5 h-5"/></button>
                 </div>
                 <form onSubmit={handleJoinByCode} className="space-y-6">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Enter Neural Code</label>
                       <input 
                         value={joinCode} 
                         onChange={e=>setJoinCode(e.target.value.toUpperCase())} 
                         required 
                         type="text" 
                         maxLength={8}
                         className="w-full bg-slate-900 border border-white/5 rounded-2xl px-6 py-4 outline-none focus:border-blue-500 text-white font-black text-center text-2xl tracking-[0.3em] uppercase placeholder:tracking-normal placeholder:font-bold placeholder:text-sm" 
                         placeholder="ABC-123" 
                       />
                    </div>
                    <button 
                      type="submit" 
                      disabled={isJoining || !joinCode}
                      className="w-full btn-gradient py-4 rounded-2xl font-black text-xs uppercase tracking-widest text-white shadow-xl shadow-blue-500/20 disabled:opacity-50 transition-all"
                    >
                      {isJoining ? 'Resolving...' : 'Establish Connection'}
                    </button>
                 </form>
              </motion.div>
            </div>
         )}
      </AnimatePresence>
    </div>
  );
}
