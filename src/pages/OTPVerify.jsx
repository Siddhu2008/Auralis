import { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Loader2, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';
import { apiFetch } from '../api';

const OTPVerify = () => {
    const [otp, setOtp] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const { state } = useLocation();
    const { login } = useAuth();
    const navigate = useNavigate();
    const inputRef = useRef(null);

    useEffect(() => {
        if (!state?.email) {
            navigate('/login');
        }
        inputRef.current?.focus();
    }, [state, navigate]);

    const handleVerify = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const response = await apiFetch('/api/auth/verify-otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: state.email, otp }),
            });

            let data = {};
            try {
                data = await response.json();
            } catch (jsonErr) {
                // ignore
            }

            if (response.ok) {
                login(data.token, data.user);
                navigate('/');
            } else if (response.status === 401) {
                setError(data.error || 'Invalid or expired OTP. Please try again.');
            } else if (response.status === 403) {
                setError('Access denied. CORS or client ID error. Please check your server and try again.');
            } else if (response.status === 500) {
                setError('Server error. Please try again later.');
            } else {
                setError(data.error || 'Verification failed. Try again.');
            }
        } catch (err) {
            setError('Network or server error. Please check your connection and try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden bg-bg-primary">
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-accent-primary/5 blur-[120px] rounded-full" />

            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="glass-card p-12 w-full max-w-lg relative z-10"
            >
                <button
                    onClick={() => navigate('/login')}
                    className="group mb-12 flex items-center gap-3 text-text-secondary/60 hover:text-text-primary transition-all font-black text-[10px] uppercase tracking-widest"
                >
                    <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
                    Back to Terminal
                </button>

                <h2 className="text-4xl font-black text-text-primary mb-3 tracking-tighter">Enter Auth Key</h2>
                <p className="text-text-secondary/60 font-black uppercase tracking-widest mb-10 text-[10px]">
                    Matrix signature sent to <span className="text-accent-secondary">{state?.email}</span>
                </p>

                {error && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-rose-500/10 border border-rose-500/20 text-rose-400 px-6 py-4 rounded-2xl mb-8 text-sm font-bold text-center"
                    >
                        {error}
                        <button
                            type="button"
                            className="mt-4 px-4 py-2 rounded-xl bg-accent-primary text-white font-black uppercase tracking-widest text-[10px] hover:bg-accent-secondary transition-all"
                            onClick={() => setError('')}
                        >
                            Retry
                        </button>
                    </motion.div>
                )}

                <form onSubmit={handleVerify} className="space-y-10">
                    <div className="relative">
                        <input
                            ref={inputRef}
                            type="text"
                            maxLength={6}
                            value={otp}
                            onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                            className="w-full bg-bg-secondary/50 border border-border-muted/30 rounded-2xl py-8 px-4 text-center text-4xl tracking-[0.6em] text-accent-secondary focus:ring-4 focus:ring-accent-secondary/20 outline-none transition-all font-black"
                            placeholder="000000"
                        />
                        <div className="absolute inset-x-0 -bottom-2 flex justify-center gap-1 opacity-20">
                            {[...Array(6)].map((_, i) => (
                                <div key={i} className="w-8 h-1 bg-text-primary rounded-full" />
                            ))}
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading || otp.length < 6}
                        className="btn-primary w-full py-4 text-base tracking-widest uppercase flex items-center justify-center gap-3 disabled:opacity-30 disabled:grayscale transition-all"
                    >
                        {loading ? (
                            <Loader2 className="h-6 w-6 animate-spin" />
                        ) : (
                            <>Authorize Session</>
                        )}
                    </button>
                </form>

                <div className="mt-12 text-center">
                    <p className="text-text-secondary/40 text-[10px] font-black uppercase tracking-widest">
                        Check Local Matrix for Security Signature
                    </p>
                </div>
            </motion.div>
        </div>
    );
};

export default OTPVerify;
