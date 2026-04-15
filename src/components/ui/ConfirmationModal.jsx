import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X } from 'lucide-react';

const ConfirmationModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title = "Confirm Action", 
  message = "Are you sure you want to proceed?",
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "danger" // danger, info
}) => {
  if (!isOpen) return null;

  const variants = {
    danger: {
      icon: <AlertTriangle className="h-6 w-6 text-rose-500" />,
      button: "bg-rose-500 hover:bg-rose-600 text-white shadow-rose-500/20",
      border: "border-rose-500/20"
    },
    info: {
      icon: <AlertTriangle className="h-6 w-6 text-cyan-500" />,
      button: "bg-cyan-500 hover:bg-cyan-600 text-white shadow-cyan-500/20",
      border: "border-cyan-500/20"
    }
  };

  const selectedVariant = variants[variant] || variants.danger;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
        />

        {/* Modal content */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className={`relative w-full max-w-md overflow-hidden rounded-3xl border ${selectedVariant.border} bg-slate-900/80 p-6 shadow-2xl backdrop-blur-xl`}
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute right-4 top-4 rounded-full p-2 text-slate-400 transition-colors hover:bg-slate-800 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>

          <div className="flex flex-col items-center text-center">
            <div className={`mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-800/50 border border-slate-700/50`}>
              {selectedVariant.icon}
            </div>

            <h3 className="mb-2 text-xl font-bold text-white leading-tight">
              {title}
            </h3>
            
            <p className="mb-8 text-sm text-slate-400 leading-relaxed">
              {message}
            </p>

            <div className="flex w-full gap-3">
              <button
                onClick={onClose}
                className="flex-1 rounded-2xl border border-slate-700 bg-slate-800/50 px-4 py-3 text-sm font-semibold text-white transition-all hover:bg-slate-700 active:scale-95"
              >
                {cancelText}
              </button>
              <button
                onClick={() => {
                  onConfirm();
                  onClose();
                }}
                className={`flex-1 rounded-2xl px-4 py-3 text-sm font-semibold shadow-lg transition-all active:scale-95 ${selectedVariant.button}`}
              >
                {confirmText}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default ConfirmationModal;
