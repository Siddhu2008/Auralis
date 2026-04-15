import { useEffect, useMemo, useState } from 'react';
import {
  addDays,
  addMonths,
  endOfMonth,
  format,
  isBefore,
  isSameDay,
  isSameMonth,
  parse,
  startOfMonth,
  startOfWeek,
  eachDayOfInterval,
} from 'date-fns';
import { AnimatePresence, motion } from 'framer-motion';
import { Calendar, CheckCircle2, ChevronLeft, ChevronRight, Clock, X } from 'lucide-react';

const WEEK_DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const toDateInputValue = (date) => format(date, 'yyyy-MM-dd');

const toTimeLabel = (hour, minute) => `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;

function generateBaseSlots() {
  const slots = [];
  for (let hour = 0; hour < 24; hour += 1) {
    slots.push(toTimeLabel(hour, 0));
    slots.push(toTimeLabel(hour, 30));
  }
  return slots;
}

function nextHalfHourLabel(now) {
  const hours = now.getHours();
  const minutes = now.getMinutes();
  const normalized = minutes <= 30 ? 30 : 0;
  const nextHour = minutes <= 30 ? hours : (hours + 1) % 24;
  return toTimeLabel(nextHour, normalized);
}

function toDateTime(dateString, timeString) {
  return parse(`${dateString} ${timeString}`, 'yyyy-MM-dd HH:mm', new Date());
}

export default function ScheduleMeetingModal({
  open,
  onClose,
  onConfirmSchedule,
  loading,
  addToast,
  meetingSettings,
  refreshNotifications,
}) {
  const today = new Date();
  const todayString = toDateInputValue(today);
  const [title, setTitle] = useState('');
  const [date, setDate] = useState(todayString);
  const [time, setTime] = useState('');
  const [month, setMonth] = useState(startOfMonth(today));
  const [dateError, setDateError] = useState('');
  const [showConfirm, setShowConfirm] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    if (!open) {
      const now = new Date();
      setTitle('');
      setDate(toDateInputValue(now));
      setTime('');
      setDateError('');
      setShowConfirm(false);
      setShowSuccess(false);
      setMonth(startOfMonth(now));
    }
  }, [open]);

  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(month);
    const monthEnd = endOfMonth(month);
    const gridStart = startOfWeek(monthStart);
    const gridEnd = addDays(gridStart, 41);
    return eachDayOfInterval({ start: gridStart, end: gridEnd }).map((day) => ({
      day,
      isCurrentMonth: isSameMonth(day, monthStart),
      isPast: isBefore(day, new Date(todayString)),
      isToday: isSameDay(day, new Date(todayString)),
      isSelected: isSameDay(day, new Date(date)),
    }));
  }, [month, date, todayString]);

  const timeSlots = useMemo(() => {
    const base = generateBaseSlots();
    const start = meetingSettings?.workingHoursStart || '00:00';
    const end = meetingSettings?.workingHoursEnd || '23:59';
    const dayFiltered = base.filter((slot) => slot >= start && slot <= end);
    if (date !== todayString) return dayFiltered;
    const minimum = nextHalfHourLabel(new Date());
    return dayFiltered.filter((slot) => slot >= minimum);
  }, [date, todayString, meetingSettings]);

  useEffect(() => {
    if (timeSlots.length === 0) {
      setTime('');
      return;
    }
    if (!time || !timeSlots.includes(time)) {
      setTime(timeSlots[0]);
    }
  }, [timeSlots, time]);

  const validateDate = (value) => {
    if (!value) return 'Date is required.';
    if (meetingSettings?.preventPastDate && value < todayString) return 'You cannot select a past date.';
    const d = new Date(value);
    const dayLabel = format(d, 'EEE');
    if (meetingSettings?.workingDays?.length && !meetingSettings.workingDays.includes(dayLabel)) {
      return 'Selected day is outside your working days.';
    }
    return '';
  };

  const validateDateTime = () => {
    const dateMessage = validateDate(date);
    if (dateMessage) return dateMessage;
    if (!time) return 'Select a valid time slot.';
    const selected = toDateTime(date, time);
    if (selected <= new Date()) return 'You cannot select a past date.';
    return '';
  };

  const handleOpenConfirmation = () => {
    const message = validateDateTime();
    setDateError(message);
    if (message) {
      addToast?.({
        type: 'error',
        title: 'Invalid schedule selection',
        message,
      });
      return;
    }
    if (meetingSettings?.requireConfirmation === false) {
      handleSchedule();
      return;
    }
    setShowConfirm(true);
  };

  const handleSchedule = async () => {
    const error = validateDateTime();
    setDateError(error);
    if (error) {
      setShowConfirm(false);
      return;
    }

    const payload = {
      title: title.trim(),
      start_time: toDateTime(date, time).toISOString(),
      duration_minutes: meetingSettings?.defaultDuration || 30,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
    };
    const result = await onConfirmSchedule(payload);
    if (!result?.ok) {
      addToast?.({
        type: 'error',
        title: 'Scheduling failed',
        message: result?.error || 'Please review your meeting details and try again.',
      });
      return;
    }

    setShowConfirm(false);
    setShowSuccess(true);
    refreshNotifications?.();
    addToast({

      type: 'success',
      title: 'Meeting scheduled',
      message: `${title.trim()} was added successfully.`,
    });
    window.setTimeout(() => onClose(), 1300);
  };

  if (!open) return null;

  return (
    <AnimatePresence>
      <motion.div
        key="schedule-modal"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-xl"
      >
        <motion.div
          initial={{ opacity: 0, y: 24, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 12, scale: 0.98 }}
          transition={{ duration: 0.28, ease: 'easeOut' }}
          className="premium-card w-full max-w-3xl rounded-3xl border border-white/12 p-5 sm:p-7 overflow-y-auto max-h-screen"
          role="dialog"
          aria-modal="true"
          aria-labelledby="schedule-title"
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan-300/70">
                Schedule Meeting
              </p>
              <h2 id="schedule-title" className="mt-1 text-2xl font-bold text-white sm:text-3xl">
                Plan a New Session
              </h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-white/10 p-2 text-slate-300 transition hover:bg-white/8 hover:text-white"
              aria-label="Close schedule modal"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-[1.2fr_1fr]">
            <div className="space-y-5">
              <label className="block">
                <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                  Meeting title
                </span>
                <input
                  type="text"
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  placeholder="Product review sync"
                  className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-300/60 focus:ring-2 focus:ring-cyan-400/30"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                  Date (manual input)
                </span>
                <input
                  type="date"
                  min={todayString}
                  value={date}
                  onChange={(event) => {
                    const value = event.target.value;
                    setDate(value);
                    setMonth(startOfMonth(new Date(value)));
                    setDateError(validateDate(value));
                  }}
                  className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-300/60 focus:ring-2 focus:ring-cyan-400/30"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                  Time slot
                </span>
                <div className="relative">
                  <Clock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-cyan-300/80" />
                  <select
                    value={time}
                    onChange={(event) => setTime(event.target.value)}
                    className="w-full appearance-none rounded-2xl border border-white/10 bg-slate-950/70 px-10 py-3 text-sm text-white outline-none transition focus:border-cyan-300/60 focus:ring-2 focus:ring-cyan-400/30"
                  >
                    {timeSlots.map((slot) => (
                      <option key={slot} value={slot}>
                        {slot}
                      </option>
                    ))}
                  </select>
                </div>
                {date === todayString && (
                  <p className="mt-2 text-xs text-slate-400">
                    Past time slots for today are automatically removed.
                  </p>
                )}
              </label>

              {dateError && (
                <p className="rounded-xl border border-rose-400/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">
                  {dateError}
                </p>
              )}
            </div>

            <div className="premium-card rounded-2xl border border-white/10 p-4">
              <div className="mb-4 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setMonth((value) => addMonths(value, -1))}
                  className="rounded-lg border border-white/10 p-2 text-slate-300 transition hover:bg-white/10"
                  aria-label="Previous month"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <p className="text-sm font-semibold text-slate-100">{format(month, 'MMMM yyyy')}</p>
                <button
                  type="button"
                  onClick={() => setMonth((value) => addMonths(value, 1))}
                  className="rounded-lg border border-white/10 p-2 text-slate-300 transition hover:bg-white/10"
                  aria-label="Next month"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>

              <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold text-slate-400">
                {WEEK_DAYS.map((label) => (
                  <span key={label} className="py-1">
                    {label}
                  </span>
                ))}
              </div>

              <motion.div
                key={format(month, 'yyyy-MM')}
                initial={{ opacity: 0.6, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.24, ease: 'easeOut' }}
                className="mt-2 grid grid-cols-7 gap-1"
              >
                {calendarDays.map((item) => (
                  <button
                    key={item.day.toISOString()}
                    type="button"
                    disabled={item.isPast}
                    onClick={() => {
                      setDate(toDateInputValue(item.day));
                      setDateError(validateDate(toDateInputValue(item.day)));
                    }}
                    className={`h-9 rounded-lg text-sm transition duration-300 ease-in-out ${
                      item.isSelected
                        ? 'bg-gradient-to-r from-indigo-500 via-blue-500 to-cyan-500 text-white shadow-lg shadow-cyan-600/20'
                        : item.isToday
                          ? 'border border-cyan-300/60 bg-cyan-500/8 text-cyan-200'
                          : item.isCurrentMonth
                            ? 'text-slate-200 hover:bg-white/10'
                            : 'text-slate-600'
                    } ${item.isPast ? 'cursor-not-allowed opacity-35 line-through' : ''}`}
                    aria-label={format(item.day, 'PPP')}
                  >
                    {format(item.day, 'd')}
                  </button>
                ))}
              </motion.div>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
              <p className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-slate-900/60 px-3 py-2 text-xs text-slate-300">
              <Calendar className="h-4 w-4 text-cyan-300" />
              {title.trim()
                ? `${title.trim()} · ${date} at ${time || '--:--'}`
                : `Select meeting details to continue`}
            </p>
            <button
              type="button"
              onClick={handleOpenConfirmation}
              disabled={loading || !title.trim() || !date || !time}
              className="btn-gradient px-6 py-3 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? 'Scheduling...' : 'Continue'}
            </button>
          </div>
        </motion.div>

        <AnimatePresence>
          {showConfirm && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
            >
              <motion.div
                initial={{ opacity: 0, y: 16, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.98 }}
                className="premium-card w-full max-w-md rounded-3xl border border-white/12 p-6"
              >
                <h3 className="text-xl font-bold text-white">Confirm Schedule</h3>
                <p className="mt-2 text-sm text-slate-300">
                  This will schedule <span className="font-semibold text-white">{title.trim()}</span> on{' '}
                  <span className="font-semibold text-white">
                    {format(new Date(date), 'EEE, MMM d')} at {time}
                  </span>.
                </p>
                <div className="mt-6 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShowConfirm(false)}
                    className="btn-surface flex-1 px-4 py-2.5 text-sm font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSchedule}
                    disabled={loading}
                    className="btn-gradient flex flex-1 items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold disabled:opacity-60"
                  >
                    {loading ? (
                      <>
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                        Processing
                      </>
                    ) : (
                      'Schedule Meeting'
                    )}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {showSuccess && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[115] flex items-center justify-center bg-black/45 p-4 backdrop-blur-sm"
            >
              <motion.div
                initial={{ scale: 0.92, opacity: 0, y: 10 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.92, opacity: 0 }}
                className="premium-card w-full max-w-xs rounded-3xl border border-emerald-400/30 p-6 text-center"
              >
                <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-300" />
                <p className="mt-3 text-lg font-semibold text-white">Scheduled Successfully</p>
                <p className="mt-1 text-sm text-slate-300">Your meeting is now in upcoming sessions.</p>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </AnimatePresence>
  );
}
