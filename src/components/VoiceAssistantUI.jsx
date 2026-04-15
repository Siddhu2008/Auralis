import React, { useState, useEffect, useRef } from 'react';
import { Mic, X, Loader2, Check, RefreshCw, Send, Calendar, ListTodo, AlertCircle, Volume2, VolumeX } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import { apiFetch } from '../api';
import { useToast } from './ui/ToastProvider';
import { useUserSettings } from '../context/UserSettingsContext';

const VoiceAssistantUI = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [aiResponse, setAiResponse] = useState(null);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const location = useLocation();
  const { addToast } = useToast();
  const { settings } = useUserSettings();
  const recognitionRef = useRef(null);

  // Initialize Speech Recognition
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = settings?.language?.toLowerCase() === 'english' ? 'en-US' : 'en-US';

      recognitionRef.current.onresult = (event) => {
        const current = event.resultIndex;
        const resultTranscript = event.results[current][0].transcript;
        setTranscript(resultTranscript);
        
        if (event.results[current].isFinal) {
          handleStopListening(resultTranscript);
        }
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current.onerror = (event) => {
        console.error("Speech Recognition Error:", event.error);
        setIsListening(false);
        if (event.error !== 'no-speech') {
          addToast({ type: 'error', title: 'Mic Access Error', message: 'Could not access microphone.' });
        }
      };
    }
  }, [settings?.language]);

  // Cleanup speech if assistant is closed
  useEffect(() => {
    if (!isExpanded && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  }, [isExpanded]);

  const speakResponse = (text, hasAction) => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text);
    const voices = window.speechSynthesis.getVoices();
    const englishVoice = voices.find(v => v.lang.startsWith('en') && v.name.toLowerCase().includes('female')) || voices.find(v => v.lang.startsWith('en'));
    if (englishVoice) utterance.voice = englishVoice;
    
    utterance.rate = 1.0;
    utterance.pitch = 1.1;
    
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => {
        setIsSpeaking(false);
        if (!hasAction) {
            // Auto-refresh the UI so the user can ask another question immediately
            setAiResponse(null);
            setTranscript('');
        }
    };
    utterance.onerror = () => {
        setIsSpeaking(false);
        if (!hasAction) {
            setAiResponse(null);
            setTranscript('');
        }
    };
    
    window.speechSynthesis.speak(utterance);
  };

  const handleStartListening = () => {
    if (!recognitionRef.current) {
      addToast({ type: 'error', title: 'Not Supported', message: 'Voice recognition is not supported in this browser.' });
      return;
    }
    // Stop any AI currently speaking
    if (window.speechSynthesis) window.speechSynthesis.cancel();
    setIsSpeaking(false);
    setTranscript('');
    setAiResponse(null);
    setIsListening(true);
    recognitionRef.current.start();
  };

  const handleStopListening = async (finalTranscript) => {
    if (!finalTranscript || finalTranscript.length < 2) return;
    
    setIsProcessing(true);
    try {
      // Map current route to page name for backend context
      const pageMap = {
          '/': 'dashboard',
          '/meetings': 'meetings',
          '/tasks': 'tasks',
          '/emails': 'emails',
          '/assistant': 'chat',
          '/profile': 'profile',
          '/settings': 'settings'
      };
      const currentPageName = pageMap[location.pathname] || 'dashboard';

      const res = await apiFetch('/api/assistant/chat', {
        method: 'POST',
        body: JSON.stringify({
          message: finalTranscript,
          current_page: currentPageName
        })
      });

      if (res.ok) {
        const data = await res.json();
        setAiResponse(data);
        
        // Speak the response via browser TTS
        if (data.response) {
            speakResponse(data.response, !!data.action);
        }
      }
    } catch (err) {
      addToast({ type: 'error', title: 'Auralis Sync Error', message: 'Failed to process voice command.' });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleExecuteAction = async () => {
    if (!aiResponse?.action) return;
    
    setIsProcessing(true);
    try {
      const res = await apiFetch('/api/assistant/execute', {
        method: 'POST',
        body: JSON.stringify({
          action: aiResponse.action,
          data: aiResponse.action_data
        })
      });

      if (res.ok) {
        addToast({ type: 'success', title: 'Action Synchronized', message: aiResponse.response });
        setIsExpanded(false);
        setAiResponse(null);
      }
    } catch (err) {
      addToast({ type: 'error', title: 'Execution Fault', message: 'Protocol execution failed.' });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-[60] lg:bottom-10 lg:right-10">
      <AnimatePresence>
        {isExpanded && (
          <>
            {/* FULL SCREEN BLUR OVERLAY */}
            <motion.div 
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               exit={{ opacity: 0 }}
               onClick={() => setIsExpanded(false)}
               className="fixed inset-0 bg-slate-950/60 backdrop-blur-md z-[-1]"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 40 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 40 }}
              className="absolute bottom-20 right-0 mb-4 w-[90vw] max-w-[400px] sm:w-[350px] rounded-[32px] bg-slate-900 border border-white/10 shadow-2xl p-6 overflow-hidden"
            >
              {/* WAVE AND LISTENING STATE */}
              <div className="relative flex flex-col items-center justify-center space-y-6">
                <button 
                  onClick={() => setIsExpanded(false)}
                  className="absolute top-0 right-0 text-slate-500 hover:text-white transition"
                >
                  <X className="w-5 h-5" />
                </button>

                <div className="text-center space-y-1">
                  <h3 className="text-xs font-black uppercase tracking-[0.2em] text-blue-400">Auralis Voice</h3>
                  <p className="text-[10px] font-bold text-slate-500 uppercase">Context Aware Assistant</p>
                </div>

                <div className="p-1.5 rounded-full bg-slate-800 border border-white/5">
                  <div className={`w-20 h-20 rounded-full flex items-center justify-center relative ${isListening ? 'bg-blue-600/20' : 'bg-slate-900'}`}>
                    {isListening && (
                        <motion.div 
                          initial={{ scale: 0.8 }}
                          animate={{ scale: [1, 1.2, 1] }}
                          transition={{ repeat: Infinity, duration: 1 }}
                          className="absolute inset-0 rounded-full bg-blue-500/10 border border-blue-500/20"
                        />
                    )}
                    
                    {isProcessing ? (
                        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                    ) : (
                        <Mic className={`w-8 h-8 ${isListening ? 'text-blue-400' : 'text-slate-600'}`} />
                    )}

                    {/* WAVEFORM ANIMATION */}
                    {isListening && (
                        <div className="absolute inset-0 flex items-center justify-center gap-1">
                            {[...Array(8)].map((_, i) => (
                                <motion.div
                                    key={i}
                                    animate={{ height: [10, Math.random() * 40 + 20, 10] }}
                                    transition={{ duration: 0.4 + Math.random() * 0.4, repeat: Infinity }}
                                    className="w-1 bg-blue-500 rounded-full opacity-60"
                                />
                            ))}
                        </div>
                    )}
                  </div>
                </div>

                <div className="w-full space-y-4">
                  <div className="min-h-[60px] flex flex-col items-center justify-center">
                    {transcript && (
                        <p className="text-sm font-bold text-white text-center italic leading-relaxed">
                            "{transcript}"
                        </p>
                    )}
                    {!transcript && !isProcessing && !aiResponse && (
                        <p className="text-sm font-bold text-slate-500 uppercase tracking-widest text-center">
                            Awaiting Audio...
                        </p>
                    )}
                  </div>

                  <AnimatePresence>
                    {aiResponse && (
                        <motion.div 
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="space-y-4 pt-4 border-t border-white/5"
                        >
                            <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                                <p className="text-xs font-bold text-slate-300 leading-relaxed mb-4">
                                    {aiResponse.response}
                                </p>

                                {aiResponse.action && (
                                    <div className="flex flex-col gap-3">
                                        <div className="flex items-center gap-3 p-3 bg-blue-500/10 rounded-xl border border-blue-500/20">
                                            {aiResponse.action === 'schedule' && <Calendar className="w-4 h-4 text-blue-400" />}
                                            {aiResponse.action === 'task' && <ListTodo className="w-4 h-4 text-emerald-400" />}
                                            {aiResponse.action === 'email' && <Send className="w-4 h-4 text-purple-400" />}
                                            <span className="text-[10px] font-black uppercase text-blue-400 tracking-widest">
                                                Confirm Action: {aiResponse.action}
                                            </span>
                                        </div>
                                        <div className="flex gap-2">
                                            <button 
                                                onClick={handleExecuteAction}
                                                className="flex-1 py-2.5 bg-blue-600 rounded-xl text-[10px] font-black uppercase tracking-widest text-white hover:bg-blue-500 transition-colors"
                                            >
                                                Authorize
                                            </button>
                                            <button 
                                                onClick={() => { setAiResponse(null); setTranscript(''); }}
                                                className="px-4 py-2.5 bg-slate-800 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
                                            >
                                                Dismiss
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {!aiResponse && (
                    <button
                        onClick={isListening ? () => setIsListening(false) : handleStartListening}
                        className={`w-full py-4 rounded-2xl text-xs font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3 ${
                            isListening 
                            ? 'bg-red-500/10 text-red-500 border border-red-500/20' 
                            : 'bg-blue-600 text-white shadow-xl shadow-blue-500/20 hover:scale-[1.02]'
                        }`}
                    >
                        {isListening ? (
                            <>
                                <RefreshCw className="w-4 h-4 animate-spin" />
                                Processing Cycle
                            </>
                        ) : (
                            <>
                                <Mic className="w-4 h-4" />
                                Initiate Sequence
                            </>
                        )}
                    </button>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center shadow-2xl relative group overflow-hidden"
        aria-label="Toggle voice assistant"
      >
        <div className="absolute inset-0 bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 group-hover:scale-110 transition-transform duration-500" />
        
        {/* PULSE RINGS */}
        <span className="absolute inset-0 rounded-full bg-blue-400/30 animate-ping opacity-75"></span>
        <span className="absolute inset-0 rounded-full bg-blue-400/30 animate-ping opacity-40 [animation-delay:400ms]"></span>

        <Mic className="w-6 h-6 sm:w-7 sm:h-7 text-white relative z-10 group-hover:rotate-12 transition-transform" />
        <div className="absolute inset-0 border border-white/20 rounded-full" />
      </motion.button>
    </div>
  );
};

export default VoiceAssistantUI;
