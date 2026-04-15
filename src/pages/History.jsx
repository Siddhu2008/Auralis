import { useEffect, useMemo, useState } from 'react';
import { Calendar, Clock, FileText, Users, X, ExternalLink } from 'lucide-react';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { apiFetch } from '../api';
import { useToast } from '../components/ui/ToastProvider';

function MeetingDetailModal({ meeting, onClose }) {
  if (!meeting) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[110] flex items-center justify-center bg-black/70 p-4"
      >
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 12, scale: 0.98 }}
          className="premium-card max-h-[88vh] w-full max-w-4xl overflow-auto rounded-3xl border border-white/10 p-6"
        >
          <div className="mb-5 flex items-start justify-between gap-3">
            <div>
              <h3 className="text-2xl font-bold text-white">{meeting.title || 'Untitled Meeting'}</h3>
              <p className="mt-1 text-sm text-slate-400">
                {meeting.scheduled_start_at ? format(new Date(meeting.scheduled_start_at), 'PPP p') : 'Unknown date'}
              </p>
            </div>
            <button onClick={onClose} className="rounded-xl border border-white/10 p-2 text-slate-300 hover:bg-white/10">
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="grid gap-5 lg:grid-cols-2">
            <section className="rounded-2xl border border-white/10 bg-slate-950/30 p-4">
              <h4 className="mb-2 text-sm font-semibold text-cyan-200">Summary</h4>
              <p className="whitespace-pre-wrap text-sm text-slate-200">{meeting.summary || 'No summary available.'}</p>
            </section>

            <section className="rounded-2xl border border-white/10 bg-slate-950/30 p-4">
              <h4 className="mb-2 text-sm font-semibold text-cyan-200">Action Items</h4>
              {(meeting.action_items || []).length === 0 ? (
                <p className="text-sm text-slate-400">No action items detected.</p>
              ) : (
                <ul className="space-y-2 text-sm text-slate-200">
                  {(meeting.action_items || []).map((item, idx) => (
                    <li key={`${idx}-${item?.title || 'item'}`} className="rounded-lg border border-white/10 bg-white/5 p-2">
                      {typeof item === 'string' ? item : item?.title || JSON.stringify(item)}
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>

          <section className="mt-5 rounded-2xl border border-white/10 bg-slate-950/30 p-4">
            <h4 className="mb-2 text-sm font-semibold text-cyan-200">Transcript</h4>
            <p className="max-h-56 overflow-auto whitespace-pre-wrap text-sm text-slate-200">
              {meeting.transcript || 'No transcript available.'}
            </p>
          </section>

          <section className="mt-5 rounded-2xl border border-white/10 bg-slate-950/30 p-4">
            <h4 className="mb-2 text-sm font-semibold text-cyan-200">Recording</h4>
            {meeting.recording_link ? (
              <a
                href={meeting.recording_link}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-lg border border-cyan-400/30 bg-cyan-500/10 px-3 py-2 text-sm text-cyan-200"
              >
                Open recording <ExternalLink className="h-4 w-4" />
              </a>
            ) : (
              <p className="text-sm text-slate-400">No recording available.</p>
            )}
          </section>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export default function History() {
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const { addToast } = useToast();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      setErrorMessage('Session missing. Please log in again.');
      setLoading(false);
      return;
    }

    const run = async () => {
      try {
        const res = await apiFetch('/api/meetings/past', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(data.error || 'Failed to fetch past meetings');
        }
        setMeetings(Array.isArray(data.meetings) ? data.meetings : []);
      } catch (err) {
        const message = err.message || 'Unable to load meeting history.';
        setErrorMessage(message);
        addToast({
          type: 'error',
          title: 'Failed to load past meetings',
          message,
        });
      } finally {
        setLoading(false);
      }
    };

    run();
  }, [addToast]);

  const sortedMeetings = useMemo(
    () => [...meetings].sort((a, b) => new Date(b.meeting?.scheduled_start_at || 0) - new Date(a.meeting?.scheduled_start_at || 0)),
    [meetings],
  );

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-white/15 border-t-cyan-300" />
      </div>
    );
  }

  return (
    <div className="relative z-10 mx-auto w-full max-w-6xl min-h-[60vh] space-y-6 rounded-3xl border border-white/10 bg-slate-950/80 p-6 text-white shadow-2xl shadow-black/40 backdrop-blur">
      <div>
        <h1 className="text-3xl font-bold text-white">Past Meetings</h1>
        <p className="mt-1 text-sm text-slate-400">Completed meetings with summaries and transcripts.</p>
      </div>

      {errorMessage && (
        <div className="rounded-2xl border border-rose-400/30 bg-rose-500/10 p-4 text-sm text-rose-200">
          {errorMessage}
        </div>
      )}

      {sortedMeetings.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/15 bg-slate-950/35 p-10 text-center">
          <FileText className="mx-auto h-8 w-8 text-slate-500" />
          <p className="mt-3 text-sm text-slate-400">No completed meetings found.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {sortedMeetings.map((item) => {
            const meeting = item.meeting || {};
            return (
              <div key={meeting.id} className="premium-card rounded-2xl border border-white/10 p-5">
                <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
                  <div>
                    <h3 className="text-lg font-semibold text-white">{meeting.title || 'Untitled Meeting'}</h3>
                    <div className="mt-2 flex flex-wrap items-center gap-4 text-xs text-slate-400">
                      <span className="inline-flex items-center gap-1"><Calendar className="h-3.5 w-3.5" />{meeting.scheduled_start_at ? format(new Date(meeting.scheduled_start_at), 'PPP p') : 'N/A'}</span>
                      <span className="inline-flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{meeting.duration_minutes ? `${meeting.duration_minutes}m` : 'N/A'}</span>
                      <span className="inline-flex items-center gap-1"><Users className="h-3.5 w-3.5" />{item.participants?.length || 1}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelected({ ...meeting, summary: item.summary?.final_summary, transcript: item.transcript?.map(t => `${t.speaker_name}: ${t.text}`).join('\n'), action_items: item.summary?.action_items })}
                    className="btn-gradient rounded-xl px-4 py-2 text-sm font-semibold"
                  >
                    View Summary
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <MeetingDetailModal meeting={selected} onClose={() => setSelected(null)} />
    </div>
  );
}
