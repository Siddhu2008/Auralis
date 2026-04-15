import { useEffect, useState } from 'react';
import { useLoader } from '../context/LoaderContext';
import { useNavigate } from 'react-router-dom';
import { Mail, ArrowRight, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import GoogleSignInButton from '../components/GoogleSignInButton';
import { useAuth } from '../context/AuthContext';
import PageTitle from '../components/PageTitle';
import { apiFetch } from '../api';

const Login = () => {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [googleLoading, setGoogleLoading] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();
    const { login } = useAuth();
    const { setShow } = useLoader();

    useEffect(() => {
        setShow(loading || googleLoading);
    }, [loading, googleLoading, setShow]);

    const handleSendOTP = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        try {
            const response = await apiFetch('/api/auth/send-otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            });
            const data = await response.json();
            if (response.ok) {
                navigate('/verify-otp', { state: { email } });
            } else {
                setError(data.error || 'Failed to send OTP');
            }
        } catch (err) {
            setError('Network error. Please try again.');
        } finally {
            setLoading(false);
        }
    };
    return (
        <div className="min-h-screen flex text-[var(--txt-primary)] bg-[var(--bg-main)]">
            {/* Left Side - Illustration */}
            <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden items-center justify-center premium-card rounded-none border-y-0 border-l-0 border-r border-[var(--glass-border)]">
                <div className="absolute inset-0 bg-gradient-to-br from-[var(--primary)]/20 to-[var(--accent)]/20 z-0"></div>
                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1620712948343-008423bfd427?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80')] bg-cover bg-center opacity-30 mix-blend-overlay z-0"></div>
                
                <div className="relative z-10 p-12 max-w-lg">
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
                        <div className="w-20 h-20 rounded-[28px] bg-gradient-to-br from-[var(--primary)] to-[var(--accent)] flex items-center justify-center mb-10 shadow-[0_0_40px_rgba(0,212,170,0.3)]">
                            <span className="text-4xl font-display">🧠</span>
                        </div>
                        <h1 className="font-display text-5xl font-bold tracking-tight text-white mb-6 leading-[1.1]">
                            Your AI That <br/> Lives Your Life
                        </h1>
                        <p className="text-xl text-[var(--txt-secondary)] leading-relaxed">
                            Join Auralis to automate your meetings, emails, and tasks instantly.
                        </p>
                    </motion.div>
                </div>
            </div>

            {/* Right Side - Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 relative overflow-hidden">
                {/* Background decorative elements */}
                <div className="absolute top-[-20%] right-[-20%] w-[60%] h-[60%] bg-[var(--accent)]/10 blur-[120px] rounded-full" />
                <div className="absolute bottom-[-20%] left-[-20%] w-[60%] h-[60%] bg-[var(--primary)]/10 blur-[120px] rounded-full" />

                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="glass-card w-full max-w-md p-8 sm:p-10 relative z-10"
                >
                    <PageTitle title="Login" />
                    <div className="text-center mb-10 lg:hidden">
                        <div className="w-16 h-16 rounded-[24px] flex items-center justify-center mx-auto mb-6 shadow-[0_0_30px_rgba(0,212,170,0.2)] bg-gradient-to-br from-[var(--primary)] to-[var(--accent)]">
                            <span className="text-3xl font-display">🧠</span>
                        </div>
                        <h1 className="text-3xl font-black tracking-tight text-white mb-2 font-display">
                            AURALIS
                        </h1>
                        <p className="text-[var(--txt-secondary)] font-medium text-xs">AI Workspace</p>
                    </div>
                    
                    <div className="mb-10 hidden lg:block text-center">
                        <h2 className="text-3xl font-bold text-white font-display mb-2">Welcome Back</h2>
                        <p className="text-[var(--txt-secondary)] text-sm">Sign in to your digital twin</p>
                    </div>

                {error && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 sm:px-6 py-3 sm:py-4 rounded-2xl mb-6 sm:mb-8 text-xs sm:text-sm font-bold text-center"
                    >
                        {error}
                    </motion.div>
                )}

                <form onSubmit={handleSendOTP} className="space-y-6">
                    <div className="relative group pt-2">
                        <input
                            type="email"
                            required
                            id="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="peer w-full bg-[var(--bg-card)] border border-[var(--glass-border)] rounded-2xl py-4 pl-12 pr-4 text-[var(--txt-primary)] focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)]/50 outline-none transition-all placeholder-transparent"
                            placeholder="name@organization.com"
                        />
                        <Mail className="absolute left-4 top-1/2 h-5 w-5 text-slate-400 group-focus-within:text-[var(--primary)] transition-colors" />
                        <label 
                            htmlFor="email" 
                            className="absolute left-11 -top-2.5 bg-[#1B2538] px-2 text-xs font-semibold text-[var(--txt-secondary)] transition-all peer-placeholder-shown:text-sm peer-placeholder-shown:text-slate-400 peer-placeholder-shown:top-4 peer-placeholder-shown:bg-transparent peer-focus:-top-2.5 peer-focus:text-xs peer-focus:text-[var(--primary)] peer-focus:bg-[#1B2538] rounded"
                        >
                            Email Address
                        </label>
                    </div>

                    <button
                        type="submit"
                        disabled={loading || googleLoading}
                        className="btn-primary w-full py-3 sm:py-4 text-sm sm:text-base tracking-widest uppercase flex items-center justify-center gap-2 sm:gap-3"
                    >
                        {loading ? (
                            <Loader2 className="h-5 w-5 sm:h-6 sm:w-6 animate-spin" />
                        ) : (
                            <>
                                Initialize Access <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5" />
                            </>
                        )}
                    </button>
                </form>

                <div className="mt-8 sm:mt-10 relative">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-white/5"></div>
                    </div>
                    <div className="relative flex justify-center text-[9px] sm:text-[10px] font-black uppercase tracking-[0.2em] sm:tracking-[0.3em]">
                        <span className="px-3 sm:px-4 bg-[#020617] text-slate-600">Secure SSO</span>
                    </div>
                </div>

                <div className="mt-8 sm:mt-10">
                    <GoogleSignInButton
                        onSuccess={(data) => {
                            login(data.token, data.user);
                            navigate('/');
                        }}
                        onError={(err) => setError(err)}
                        onLoadingChange={setGoogleLoading}
                    />
                </div>

                <div className="mt-8 pt-6 border-t border-[var(--glass-border)] text-center">
                    <p className="text-slate-500 text-xs font-medium">
                        Secure AI authentication via local matrix overlay
                    </p>
                </div>
            </motion.div>
            </div>
        </div>
    );
};

export default Login;
