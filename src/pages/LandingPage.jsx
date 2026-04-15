import React from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { Bot, Calendar, Sparkles, Mail, CheckCircle, ArrowRight, Play } from 'lucide-react';

const LandingPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-app overflow-x-hidden text-[var(--txt-primary)]">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex justify-center px-4 pt-4 text-[var(--txt-primary)]">
        <div className="premium-card rounded-full w-full max-w-7xl px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-gradient-to-r from-[var(--primary)] to-[var(--accent)] p-2 rounded-full hidden sm:block">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="font-display font-bold text-xl tracking-tight text-white">Auralis </span>
          </div>
          <div className="hidden md:flex items-center gap-8 font-medium text-sm text-[var(--txt-secondary)]">
            <a href="#features" className="hover:text-white transition">Features</a>
            <a href="#how-it-works" className="hover:text-white transition">How It Works</a>
            <a href="#pricing" className="hover:text-white transition">Pricing</a>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/login" className="text-sm font-semibold text-[var(--txt-secondary)] hover:text-white transition">
              Login
            </Link>
            <Link to="/login" className="btn-gradient px-5 py-2 text-sm">
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 px-4 max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
        <div className="flex-1 text-center lg:text-left z-10">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <span className="inline-block py-1.5 px-3 rounded-full bg-[var(--primary)]/10 text-[var(--primary)] text-xs font-bold tracking-wider uppercase mb-6 border border-[var(--primary)]/20">
              Meet your new digital twin
            </span>
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}
            className="font-display text-5xl lg:text-7xl font-bold tracking-tight text-white leading-[1.1]"
          >
            Your AI That <br className="hidden lg:block"/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--primary)] to-[var(--accent)]">
              Lives Your Life
            </span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }}
            className="mt-6 text-lg lg:text-xl text-[var(--txt-secondary)] max-w-2xl mx-auto lg:mx-0 leading-relaxed"
          >
            Meetings, emails, tasks — handled automatically. Reclaim 20+ hours a week with an AI that learns your behavior and acts on your behalf.
          </motion.p>
          <motion.div 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.3 }}
            className="mt-10 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4"
          >
            <button onClick={() => navigate('/login')} className="btn-gradient px-8 py-4 w-full sm:w-auto text-base flex items-center justify-center gap-2 group">
              Start Free Trial
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
            <button className="glass-card px-8 py-4 w-full sm:w-auto text-base font-semibold flex items-center justify-center gap-2 hover:bg-[var(--glass)] transition">
              <Play className="w-5 h-5" />
              Watch Demo
            </button>
          </motion.div>
        </div>
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.7, delay: 0.2 }}
          className="flex-1 w-full max-w-md lg:max-w-none relative"
        >
          {/* Dashboard Mockup */}
          <div className="relative z-10 premium-card rounded-2xl p-4 sm:p-6 pb-0 shadow-2xl border-t border-[var(--glass-border)] transform perspective-[1000px] rotate-y-[-5deg] rotate-x-[5deg]">
             <div className="flex items-center justify-between mb-6">
                <div className="flex gap-2 text-sm font-semibold text-white">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-[var(--primary)] to-[var(--accent)]" />
                  <div>
                    Good Morning, user<br/>
                    <span className="text-xs text-[var(--txt-secondary)] font-normal">3 upcoming meetings today</span>
                  </div>
                </div>
             </div>
             <div className="space-y-3 mb-6">
               <div className="glass-card p-4 rounded-xl flex items-center justify-between">
                 <div className="flex items-center gap-3">
                   <div className="p-2 rounded-lg bg-[var(--primary)]/20 text-[var(--primary)]"><Calendar className="w-4 h-4" /></div>
                   <div className="text-sm"><p className="font-semibold text-white">Product Sync</p><p className="text-xs text-[var(--txt-secondary)]">2:00 PM - 3:00 PM</p></div>
                 </div>
                 <div className="text-xs font-bold text-[var(--accent)] bg-[var(--accent)]/10 px-2 py-1 rounded">AI Attending</div>
               </div>
               <div className="glass-card p-4 rounded-xl flex items-center justify-between opacity-80">
                 <div className="flex items-center gap-3">
                   <div className="p-2 rounded-lg bg-orange-500/20 text-orange-400"><Mail className="w-4 h-4" /></div>
                   <div className="text-sm"><p className="font-semibold text-white">Investor Update</p><p className="text-xs text-[var(--txt-secondary)]">Drafted by AI</p></div>
                 </div>
               </div>
             </div>
          </div>
          
          {/* Floating Elements */}
          <motion.div 
            animate={{ y: [-10, 10, -10] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -right-12 top-10 z-20 glass-card p-4 rounded-xl shadow-xl flex items-center gap-3 w-48 hidden md:flex"
          >
            <Sparkles className="w-6 h-6 text-[var(--accent)]" />
            <div className="text-xs font-medium">Schedule conflict resolved automatically</div>
          </motion.div>
        </motion.div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 relative">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="font-display text-3xl md:text-5xl font-bold text-white mb-4">Supercharge Your Productivity</h2>
            <p className="text-[var(--txt-secondary)] max-w-2xl mx-auto">Auralis brings all your workflow scattered pieces into one smart AI brain.</p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { title: 'AI Meetings', desc: 'AI attends, transcribes, and generates action items automatically.', icon: Calendar, color: 'from-blue-500 to-[var(--primary)]' },
              { title: 'Smart Emails', desc: 'Drafts, summarizes, and prioritizes your inbox seamlessly.', icon: Mail, color: 'from-purple-500 to-pink-500' },
              { title: 'Task Automation', desc: 'Kanban boards that update themselves based on your context.', icon: CheckCircle, color: 'from-[var(--accent)] to-teal-400' },
              { title: 'Digital Twin', desc: 'Predictive analytics on your work patterns and habits.', icon: Bot, color: 'from-orange-400 to-red-500' },
            ].map((feature, i) => (
              <motion.div 
                key={i}
                whileHover={{ y: -8, scale: 1.02 }}
                className="premium-card p-6 flex flex-col items-start text-left group"
              >
                <div className={`p-3 rounded-2xl mb-6 bg-gradient-to-br ${feature.color} shadow-lg text-white`}>
                  <feature.icon className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-white mb-3 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-[var(--primary)] group-hover:to-[var(--accent)] transition-all">
                  {feature.title}
                </h3>
                <p className="text-[var(--txt-secondary)] text-sm leading-relaxed">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section id="how-it-works" className="py-24 bg-[var(--bg-card)]/30 border-y border-[var(--glass-border)]">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="font-display text-3xl md:text-5xl font-bold text-white mb-4">How Auralis Works</h2>
          </div>
          <div className="flex flex-col md:flex-row justify-center items-center gap-8 md:gap-12 relative">
            {/* Logic line for desktop */}
            <div className="hidden md:block absolute top-1/2 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-[var(--primary)] to-transparent opacity-20 -translate-y-1/2" />
            
            {[
              { step: '01', title: 'Connect Accounts', text: 'Sync your Google Workspace, Outlook, and Notion in one click.' },
              { step: '02', title: 'AI Learns Behavior', text: 'It discreetly analyzes how you write, schedule, and prioritize.' },
              { step: '03', title: 'Automates Life', text: 'Enjoy a customized digital worker doing the heavy lifting 24/7.' }
            ].map((item, i) => (
              <div key={i} className="relative z-10 flex flex-col items-center text-center max-w-xs">
                <div className="w-16 h-16 rounded-2xl premium-card flex items-center justify-center font-display font-bold text-2xl text-[var(--accent)] mb-6 shadow-[0_0_30px_rgba(0,212,170,0.2)]">
                  {item.step}
                </div>
                <h3 className="text-xl font-bold text-white mb-3">{item.title}</h3>
                <p className="text-[var(--txt-secondary)] text-sm">{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      
      {/* CTA Section */}
      <section className="py-24 relative overflow-hidden">
        <div className="max-w-4xl mx-auto px-4 text-center relative z-10">
          <h2 className="font-display text-4xl md:text-6xl font-bold text-white mb-8">Start your AI assistant today</h2>
          <p className="text-xl text-[var(--txt-secondary)] mb-10 max-w-2xl mx-auto">
            Join thousands of professionals saving a day a week with Auralis.
          </p>
          <button onClick={() => navigate('/login')} className="btn-gradient px-12 py-5 text-lg w-full sm:w-auto font-bold uppercase tracking-wide">
            Get Started For Free
          </button>
        </div>
        {/* Glow Effects */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[var(--primary)]/20 blur-[120px] rounded-full pointer-events-none" />
      </section>
      
      <footer className="py-10 border-t border-[var(--glass-border)] text-center text-[var(--txt-secondary)] text-sm">
        <p>&copy; {new Date().getFullYear()} Auralis Inc. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default LandingPage;
