import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mic, Video, Volume2, Settings } from 'lucide-react';

const SettingsDialog = ({ isOpen, onClose, devices, selectedDevices, onDeviceChange }) => {
    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                    />

                    <motion.div
                        initial={{ scale: 0.9, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.9, opacity: 0, y: 20 }}
                        className="relative w-full max-w-lg bg-slate-900/80 backdrop-blur-2xl border border-white/10 rounded-[32px] overflow-hidden shadow-2xl"
                        onClick={e => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-blue-500/10 rounded-xl">
                                    <Settings className="h-5 w-5 text-blue-400" />
                                </div>
                                <h2 className="text-xl font-bold text-white">Device Settings</h2>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-2 hover:bg-white/10 rounded-full transition-colors"
                            >
                                <X className="h-5 w-5 text-slate-400" />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="p-8 space-y-8">
                            {/* Video Input */}
                            <div className="space-y-3">
                                <label className="flex items-center gap-2 text-sm font-semibold text-slate-400 uppercase tracking-wider">
                                    <Video className="h-4 w-4" /> Camera
                                </label>
                                <select
                                    value={selectedDevices.videoInput}
                                    onChange={(e) => onDeviceChange('videoInput', e.target.value)}
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all cursor-pointer hover:bg-white/[0.08]"
                                >
                                    {devices.videoInput.map(d => (
                                        <option key={d.deviceId} value={d.deviceId} className="bg-slate-900">
                                            {d.label || `Camera ${d.deviceId.substring(0, 5)}`}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Audio Input */}
                            <div className="space-y-3">
                                <label className="flex items-center gap-2 text-sm font-semibold text-slate-400 uppercase tracking-wider">
                                    <Mic className="h-4 w-4" /> Microphone
                                </label>
                                <select
                                    value={selectedDevices.audioInput}
                                    onChange={(e) => onDeviceChange('audioInput', e.target.value)}
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all cursor-pointer hover:bg-white/[0.08]"
                                >
                                    {devices.audioInput.map(d => (
                                        <option key={d.deviceId} value={d.deviceId} className="bg-slate-900">
                                            {d.label || `Mic ${d.deviceId.substring(0, 5)}`}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Audio Output */}
                            <div className="space-y-3">
                                <label className="flex items-center gap-2 text-sm font-semibold text-slate-400 uppercase tracking-wider">
                                    <Volume2 className="h-4 w-4" /> Speakers / Output
                                </label>
                                <select
                                    value={selectedDevices.audioOutput}
                                    onChange={(e) => onDeviceChange('audioOutput', e.target.value)}
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all cursor-pointer hover:bg-white/[0.08]"
                                >
                                    {devices.audioOutput.map(d => (
                                        <option key={d.deviceId} value={d.deviceId} className="bg-slate-900">
                                            {d.label || `Speaker ${d.deviceId.substring(0, 5)}`}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="p-6 bg-white/[0.02] border-t border-white/5 text-center">
                            <button
                                onClick={onClose}
                                className="px-8 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-2xl transition-all shadow-lg shadow-blue-500/20 active:scale-95"
                            >
                                Done
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default SettingsDialog;
