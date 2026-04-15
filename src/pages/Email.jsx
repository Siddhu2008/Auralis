import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Mail, Inbox, Send, Edit3, Trash2, Search, Star, 
  Sparkles, CornerLeftUp, MoreVertical, Paperclip, Loader2, X, RotateCcw
} from 'lucide-react';
import PageTitle from '../components/PageTitle';
import { apiFetch } from '../api';
import { useToast } from '../components/ui/ToastProvider';
import { format } from 'date-fns';

export default function Email() {
  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const [composeData, setComposeData] = useState({ to: '', subject: '', body: '' });
  const [activeFolder, setActiveFolder] = useState('inbox');
  const [selectedEmailId, setSelectedEmailId] = useState(null);
  const [emails, setEmails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [replyText, setReplyText] = useState('');
  const [sending, setSending] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const { addToast } = useToast();

  const fetchEmails = async () => {
    try {
      const res = await apiFetch('/api/email/list?limit=50');
      const data = await res.json();
      if (res.ok) {
        setEmails(data.emails || data || []);
      }
    } catch(e) {
      console.error(e);
      addToast({ type: 'error', title: 'Error', message: 'Failed to fetch emails.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmails();
  }, []);

  const handleAction = async (id, action) => {
    try {
      const res = await apiFetch('/api/email/action', {
        method: 'POST',
        body: JSON.stringify({ email_id: id, action })
      });
      if (res.ok) {
        const data = await res.json();
        // Update local state
        setEmails(emails.map(e => e.id === id ? data.email : e));
        if (action === 'delete') {
           if (selectedEmailId === id) setSelectedEmailId(null);
           addToast({ type: 'success', title: 'Deleted', message: 'Email moved to trash.' });
        }
      }
    } catch(e) {
      console.error(e);
    }
  };

  const handleSelectEmail = (id) => {
    setSelectedEmailId(id);
    const email = emails.find(e => e.id === id);
    if (email && email.unread) {
      handleAction(id, 'read');
    }
  };

  const handleSendReply = async () => {
    const selectedEmail = emails.find(e => e.id === selectedEmailId);
    if (!replyText || !selectedEmail) return;
    setSending(true);
    try {
      const res = await apiFetch('/api/email/send', {
        method: 'POST',
        body: JSON.stringify({
          to: selectedEmail.sender_email || selectedEmail.sender,
          subject: `Re: ${selectedEmail.subject}`,
          body: replyText
        })
      });
      if (res.ok) {
        addToast({ type: 'success', title: 'Sent', message: 'Email reply sent successfully.' });
        setReplyText('');
        fetchEmails();
      }
    } catch(e) {
      addToast({ type: 'error', title: 'Error', message: 'Failed to send reply.' });
    } finally {
      setSending(false);
    }
  };

  const handleSendCompose = async () => {
    if (!composeData.to || !composeData.subject || !composeData.body) {
      addToast({ type: 'warning', title: 'Missing Info', message: 'Recipient, Subject and Body are required.' });
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(composeData.to)) {
      addToast({ type: 'error', title: 'Invalid Recipient', message: 'Please enter a valid email address.' });
      return;
    }

    setSending(true);
    try {
      const res = await apiFetch('/api/email/send', {
        method: 'POST',
        body: JSON.stringify({ ...composeData, approved: true })
      });
      if (res.ok) {
        const data = await res.json();
        addToast({ type: 'success', title: 'Sent', message: 'Email sent successfully.' });
        setIsComposeOpen(false);
        setComposeData({ to: '', subject: '', body: '' });
        await fetchEmails();
        setActiveFolder('sent');
        if (data.email) setSelectedEmailId(data.email.id);
      } else {
        const err = await res.json();
        throw new Error(err.error || 'Failed to send email');
      }
    } catch(e) {
      addToast({ type: 'error', title: 'Error', message: e.message || 'Failed to send email.' });
    } finally {
      setSending(false);
    }
  };

  const filteredEmails = emails.filter(email => {
    const searchLow = searchTerm.toLowerCase();
    const matchesSearch = 
      (email.subject || '').toLowerCase().includes(searchLow) ||
      (email.body || '').toLowerCase().includes(searchLow) ||
      (email.sender || '').toLowerCase().includes(searchLow) ||
      (email.recipient || '').toLowerCase().includes(searchLow);

    if (!matchesSearch && searchTerm) return false;

    if (activeFolder === 'trash') return email.is_deleted;
    if (email.is_deleted) return false;

    if (activeFolder === 'starred') return email.is_starred;
    if (activeFolder === 'sent') return email.direction === 'outgoing';
    if (activeFolder === 'inbox') return email.direction === 'incoming';
    
    return true;
  });

  const folders = [
    { id: 'inbox', label: 'Inbox', icon: Inbox, count: emails.filter(e => e.direction === 'incoming' && e.unread && !e.is_deleted).length },
    { id: 'sent', label: 'Sent', icon: Send },
    { id: 'starred', label: 'Starred', icon: Star, count: emails.filter(e => e.is_starred && !e.is_deleted).length },
    { id: 'trash', label: 'Trash', icon: Trash2 },
  ];

  const currentEmail = emails.find(e => e.id === selectedEmailId);

  // Body Linkification
  const renderBody = (text) => {
    if (!text) return null;
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    return text.split(urlRegex).map((part, i) => {
      if (part.match(urlRegex)) {
        return <a key={i} href={part} target="_blank" rel="noopener noreferrer" className="text-[var(--primary)] hover:underline break-all">{part}</a>;
      }
      return part;
    });
  };

  return (
    <div className="h-[calc(100vh-140px)] flex flex-col lg:flex-row gap-4 lg:gap-6 px-2">
      <PageTitle title="Email Intelligence" />
      
      {/* Mobile: Folder tabs + Compose */}
      <div className="flex lg:hidden items-center gap-2 overflow-x-auto scrollbar-none pb-1 shrink-0">
        <button onClick={() => setIsComposeOpen(true)} className="btn-gradient px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shrink-0 shadow-lg">
          <Edit3 className="w-3.5 h-3.5" /> Compose
        </button>
        {folders.map(folder => {
          const Icon = folder.icon;
          const isActive = activeFolder === folder.id;
          return (
            <button 
              key={folder.id}
              onClick={() => { setActiveFolder(folder.id); setSelectedEmailId(null); }}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap shrink-0 ${
                isActive ? 'bg-[var(--primary)]/10 text-[var(--primary)] border border-[var(--primary)]/20' : 'text-[var(--txt-secondary)] bg-white/5 border border-transparent'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {folder.label}
              {folder.count > 0 && (
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${isActive ? 'bg-[var(--primary)] text-white' : 'bg-white/10'}`}>
                  {folder.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Desktop Sidebar: Folders */}
      <div className="hidden lg:flex w-64 flex-col gap-6">
        <button onClick={() => setIsComposeOpen(true)} className="btn-gradient w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg hover:scale-[1.02] transition-transform">
          <Edit3 className="w-5 h-5" /> Compose
        </button>

        <nav className="flex-1 space-y-2">
          {folders.map(folder => {
            const Icon = folder.icon;
            const isActive = activeFolder === folder.id;
            return (
              <button 
                key={folder.id}
                onClick={() => { setActiveFolder(folder.id); setSelectedEmailId(null); }}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all ${
                  isActive ? 'bg-[var(--primary)]/10 text-[var(--primary)] font-semibold border border-[var(--primary)]/20' : 'text-[var(--txt-secondary)] hover:bg-white/5 hover:text-white border border-transparent'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-5 h-5" />
                  {folder.label}
                </div>
                {folder.count > 0 && (
                  <span className={`text-xs px-2 py-0.5 rounded-full ${isActive ? 'bg-[var(--primary)] text-white' : 'bg-white/10'}`}>
                    {folder.count}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Email List */}
      <div className="w-full lg:w-96 flex flex-col premium-card rounded-2xl overflow-hidden shadow-2xl shrink-0">
        <div className="p-4 border-b border-[var(--glass-border)] flex items-center gap-3 bg-[var(--bg-main)]">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[var(--txt-secondary)] absolute left-3 top-1/2 -translate-y-1/2" />
            <input 
              type="text" 
              placeholder="Search emails..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[var(--bg-card)] border border-[var(--glass-border)] rounded-lg py-2 pl-9 pr-4 text-sm outline-none focus:border-[var(--primary)] transition-all text-white"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-custom bg-[var(--bg-main)] relative">
          {loading ? (
             <div className="absolute inset-0 flex items-center justify-center">
                 <Loader2 className="w-6 h-6 animate-spin text-[var(--primary)]" />
             </div>
          ) : filteredEmails.length === 0 ? (
             <div className="p-8 text-center text-[var(--txt-secondary)]">
                 No emails found.
             </div>
          ) : filteredEmails.map((email) => (
            <div 
              key={email.id} 
              onClick={() => handleSelectEmail(email.id)}
              className={`p-4 border-b border-[var(--glass-border)] cursor-pointer transition-all hover:bg-[var(--bg-card)] ${selectedEmailId === email.id ? 'bg-[var(--primary)]/5 border-l-4 border-l-[var(--primary)]' : 'border-l-4 border-l-transparent'}`}
            >
              <div className="flex justify-between items-baseline mb-1">
                <h4 className={`text-sm ${email.unread ? 'font-bold text-white' : 'font-medium text-[var(--txt-secondary)]'} truncate pr-2`}>
                  {email.direction === 'outgoing' ? `To: ${email.recipient}` : (email.sender || email.sender_email || 'Unknown Sender')}
                </h4>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button 
                    onClick={(e) => { e.stopPropagation(); handleAction(email.id, email.is_starred ? 'unstar' : 'star'); }}
                    className={`p-1 hover:bg-white/10 rounded-md transition-colors ${email.is_starred ? 'text-yellow-400' : 'text-[var(--txt-secondary)] hover:text-white'}`}
                  >
                    <Star className={`w-3.5 h-3.5 ${email.is_starred ? 'fill-yellow-400' : ''}`} />
                  </button>
                  <button 
                    onClick={(e) => { e.stopPropagation(); handleAction(email.id, email.is_deleted ? 'undelete' : 'delete'); }}
                    className={`p-1 hover:bg-white/10 rounded-md transition-colors ${email.is_deleted ? 'text-emerald-400' : 'text-[var(--txt-secondary)] hover:text-red-400'}`}
                  >
                    {email.is_deleted ? <RotateCcw className="w-3.5 h-3.5" /> : <Trash2 className="w-3.5 h-3.5" />}
                  </button>
                  <span className="text-xs text-[var(--txt-secondary)] ml-1">
                    {email.created_at && !isNaN(new Date(email.created_at).getTime()) ? format(new Date(email.created_at), 'MMM d') : ''}
                  </span>
                </div>
              </div>
              <p className={`text-sm mb-1 truncate ${email.unread ? 'font-semibold text-white' : 'text-[var(--txt-secondary)]'}`}>
                {email.subject}
              </p>
              <p className="text-xs text-[var(--txt-secondary)] line-clamp-2">
                {email.summary || email.body?.substring(0, 100)}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Email Viewer */}
      <div className="hidden md:flex flex-1 flex-col premium-card rounded-2xl overflow-hidden shadow-2xl">
        {currentEmail ? (
          <>
            <div className="p-6 border-b border-[var(--glass-border)] bg-[var(--bg-main)] flex justify-between items-start shrink-0">
              <div>
                <h2 className="text-xl font-bold text-white mb-2 leading-tight">{currentEmail.subject}</h2>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[var(--primary)] to-[var(--accent)] flex items-center justify-center text-white font-bold text-lg shrink-0">
                    {(currentEmail.sender || currentEmail.recipient || "U").charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-semibold text-white text-sm">
                      {currentEmail.direction === 'outgoing' ? `To: ${currentEmail.recipient}` : (currentEmail.sender || currentEmail.sender_email)}
                    </p>
                    <p className="text-xs text-[var(--txt-secondary)]">
                      {currentEmail.direction === 'outgoing' ? 'from me' : 'to me'} • {currentEmail.created_at && !isNaN(new Date(currentEmail.created_at).getTime()) ? format(new Date(currentEmail.created_at), 'PPp') : ''}
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex gap-2 text-[var(--txt-secondary)]">
                 <button 
                  onClick={() => handleAction(currentEmail.id, currentEmail.is_starred ? 'unstar' : 'star')} 
                  className={`p-2 hover:bg-white/5 rounded-lg transition-colors ${currentEmail.is_starred ? 'text-yellow-400 shadow-[0_0_10px_rgba(251,191,36,0.2)]' : ''}`}
                 >
                   <Star className={`w-5 h-5 ${currentEmail.is_starred ? 'fill-yellow-400 text-yellow-400' : ''}`} />
                 </button>
                 <button 
                  onClick={() => handleAction(currentEmail.id, currentEmail.is_deleted ? 'undelete' : 'delete')} 
                  className="p-2 hover:bg-white/5 hover:text-red-400 rounded-lg transition-colors"
                 >
                   <Trash2 className="w-5 h-5" />
                 </button>
                 <button className="p-2 hover:bg-white/5 rounded-lg transition-colors"><MoreVertical className="w-5 h-5" /></button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 bg-[var(--bg-main)] scrollbar-custom">
              {/* AI Summary Block */}
              {currentEmail.summary && (
                <div className="mb-8 p-4 rounded-xl bg-[var(--primary)]/10 border border-[var(--primary)]/20 flex gap-4 items-start shadow-inner">
                  <div className="bg-[var(--primary)]/20 p-2 rounded-lg shrink-0">
                    <Sparkles className="w-5 h-5 text-[var(--primary)]" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-[var(--primary)] uppercase tracking-wider mb-1">Assistant Intelligence</h4>
                    <p className="text-sm text-white/90 leading-relaxed">{currentEmail.summary}</p>
                  </div>
                </div>
              )}

              {/* Email Body */}
              <div className="text-white/80 text-sm leading-relaxed whitespace-pre-wrap font-sans break-words pb-8">
                {renderBody(currentEmail.body)}
              </div>
            </div>

            {/* Smart Reply Section */}
            {currentEmail.direction === 'incoming' && (
              <div className="p-6 border-t border-[var(--glass-border)] bg-[var(--bg-card)] shrink-0">
                <div className="flex gap-2 mb-4 overflow-x-auto scrollbar-none pb-1">
                  {(["I will look into this.", "Could we schedule a time?", "Approved."]).map((sugg, i) => (
                    <button 
                      key={i} 
                      onClick={() => setReplyText(sugg)}
                      className="whitespace-nowrap px-4 py-2 rounded-full border border-[var(--glass-border)] text-xs font-medium text-[var(--txt-primary)] bg-[var(--bg-main)] hover:border-[var(--primary)] hover:text-white transition-all flex items-center gap-2 group"
                    >
                      <Sparkles className="w-3 h-3 text-[var(--primary)] opacity-0 group-hover:opacity-100 transition-opacity" />
                      {sugg}
                    </button>
                  ))}
                </div>
                
                <div className="bg-[var(--bg-main)] border border-[var(--glass-border)] rounded-xl flex items-end p-2 focus-within:border-[var(--primary)]/50 transition-colors shadow-inner">
                  <textarea 
                    placeholder="Draft a reply..." 
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    className="flex-1 bg-transparent border-none outline-none text-sm p-2 resize-none h-12 max-h-48 text-white scrollbar-custom"
                  />
                  <div className="flex gap-2 p-1 shrink-0">
                    <button className="p-2 text-[var(--txt-secondary)] hover:text-white transition-colors rounded-lg hover:bg-white/5">
                      <Paperclip className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={handleSendReply}
                      disabled={sending || !replyText}
                      className={`p-2 rounded-lg text-white transition-transform active:scale-95 ${replyText ? 'btn-gradient' : 'bg-slate-700 opacity-50 cursor-not-allowed'}`}
                    >
                      {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-[var(--txt-secondary)] bg-[var(--bg-main)]">
            <Mail className="w-16 h-16 mb-4 opacity-20" />
            <p className="font-medium">Select an email to view intelligence</p>
          </div>
        )}
      </div>

      {/* Compose Modal */}
      {isComposeOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-md p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="w-full max-w-2xl premium-card rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
          >
            <div className="p-4 bg-[var(--bg-card)] border-b border-[var(--glass-border)] flex justify-between items-center">
              <h3 className="font-bold text-white flex items-center gap-2 text-lg">
                <Edit3 className="w-5 h-5 text-[var(--primary)]" />
                New Message
              </h3>
              <button onClick={() => setIsComposeOpen(false)} className="p-2 hover:bg-white/10 rounded-lg text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4 overflow-y-auto">
              <div>
                <label className="block text-xs font-bold text-[var(--txt-secondary)] uppercase mb-2">Recipient</label>
                <input 
                  type="email" 
                  value={composeData.to}
                  onChange={(e) => setComposeData({...composeData, to: e.target.value})}
                  placeholder="recipient@example.com"
                  className="w-full bg-[var(--bg-main)] border border-[var(--glass-border)] rounded-xl py-3 px-4 text-white outline-none focus:border-[var(--primary)]/50 transition-all placeholder:text-white/20"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-[var(--txt-secondary)] uppercase mb-2">Subject</label>
                <input 
                  type="text" 
                  value={composeData.subject}
                  onChange={(e) => setComposeData({...composeData, subject: e.target.value})}
                  placeholder="Topic of discussion"
                  className="w-full bg-[var(--bg-main)] border border-[var(--glass-border)] rounded-xl py-3 px-4 text-white outline-none focus:border-[var(--primary)]/50 transition-all placeholder:text-white/20"
                />
              </div>
              <div className="flex-1">
                <label className="block text-xs font-bold text-[var(--txt-secondary)] uppercase mb-2">Message Body</label>
                <textarea 
                  value={composeData.body}
                  onChange={(e) => setComposeData({...composeData, body: e.target.value})}
                  placeholder="Write your professional message here..."
                  className="w-full bg-[var(--bg-main)] border border-[var(--glass-border)] rounded-xl py-4 px-4 text-white outline-none focus:border-[var(--primary)]/50 transition-all min-h-[300px] resize-none scrollbar-custom placeholder:text-white/20"
                />
              </div>
            </div>
            <div className="p-4 bg-[var(--bg-card)] border-t border-[var(--glass-border)] flex justify-end gap-3">
               <button onClick={() => setIsComposeOpen(false)} className="px-6 py-2.5 rounded-xl font-semibold text-white/70 hover:bg-white/5 transition-all">
                 Cancel
               </button>
               <button 
                onClick={handleSendCompose}
                disabled={sending || !composeData.to || !composeData.subject}
                className="btn-gradient px-8 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-lg disabled:opacity-50"
               >
                 {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                 Send Email
               </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
