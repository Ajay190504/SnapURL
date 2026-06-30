import React, { useState } from 'react';
import { Send, User, Mail, FileText, MessageSquare, Loader2, CheckCircle2 } from 'lucide-react';

export default function ContactUs() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !email || !subject || !message) return;

    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, email, subject, message }),
      });

      if (!response.ok) {
        throw new Error('Failed to submit message');
      }

      setSuccess(true);
      setName('');
      setEmail('');
      setSubject('');
      setMessage('');
    } catch (err) {
      setError(err.message || 'Could not connect to database');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-extrabold tracking-tight text-white">Contact Us</h2>
        <p className="text-brand-textMuted text-sm">Have feedback, questions, or issues? Send a message directly to our team.</p>
      </div>

      {success ? (
        <div className="glass-panel p-8 rounded-3xl text-center space-y-4 border border-teal-500/20 bg-teal-950/10 shadow-glow shadow-teal-500/5 animate-fade-in">
          <CheckCircle2 className="w-16 h-16 text-teal-400 mx-auto" />
          <h3 className="text-xl font-bold text-white">Message Submitted</h3>
          <p className="text-brand-textMuted text-sm max-w-md mx-auto">
            Thank you for reaching out! Your inquiry has been stored securely in our database and our engineering team has been notified.
          </p>
          <button
            onClick={() => setSuccess(false)}
            className="px-6 py-2.5 bg-white/5 hover:bg-white/10 rounded-xl text-sm font-semibold text-white transition-all"
          >
            Send Another Message
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="glass-panel p-6 md:p-8 rounded-3xl space-y-4 shadow-glow">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-brand-textMuted uppercase flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-blue-400" />
                Your Name
              </label>
              <input
                type="text"
                required
                placeholder="Ajay Sharma"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="glass-input w-full px-4 py-2.5 rounded-xl text-white text-sm"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-brand-textMuted uppercase flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-teal-400" />
                Email Address
              </label>
              <input
                type="email"
                required
                placeholder="ajay@gmail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="glass-input w-full px-4 py-2.5 rounded-xl text-white text-sm"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-brand-textMuted uppercase flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-purple-400" />
              Subject
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Cache Hit Ratio Query"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="glass-input w-full px-4 py-2.5 rounded-xl text-white text-sm"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-brand-textMuted uppercase flex items-center gap-1.5">
              <MessageSquare className="w-3.5 h-3.5 text-rose-400" />
              Your Message
            </label>
            <textarea
              required
              rows={4}
              placeholder="How can we help you today?"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="glass-input w-full px-4 py-2.5 rounded-xl text-white text-sm resize-none"
            />
          </div>

          {error && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-xs text-rose-400">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-primary hover:opacity-90 active:scale-95 text-white py-3.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 shadow-glow transition-all"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Sending Message...
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                Send Inquiry
              </>
            )}
          </button>
        </form>
      )}
    </div>
  );
}
