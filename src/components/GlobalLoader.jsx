import { motion } from 'framer-motion';

export default function GlobalLoader({ show }) {
  if (!show) return null;
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="flex flex-col items-center gap-5"
      >
        <motion.div
          animate={{ y: [0, -8, 0], scale: [1, 1.06, 1] }}
          transition={{ duration: 1.05, repeat: Infinity, ease: 'easeInOut' }}
          className="relative"
        >
          <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-cyan-400/40 via-sky-500/30 to-blue-500/20 blur-xl" />
          <div className="relative flex h-20 w-20 items-center justify-center rounded-full border border-white/15 bg-slate-950/60 shadow-[0_0_40px_rgba(34,211,238,0.35)]">
            <div className="absolute inset-1 rounded-full border border-cyan-300/30" />
            <img src="/auralis-logo.png" alt="Auralis Loader" className="relative h-10 w-10" />
          </div>
        </motion.div>
        <motion.span
          animate={{ opacity: [0.55, 1, 0.55] }}
          transition={{ duration: 1.05, repeat: Infinity, ease: 'easeInOut' }}
          className="text-cyan-100 font-black text-sm uppercase tracking-[0.28em]"
        >
          Synchronizing workspace
        </motion.span>
        <p className="text-xs text-slate-300/85">
          Optimizing meetings, tasks and assistant in real time.
        </p>
      </motion.div>
    </div>
  );
}
