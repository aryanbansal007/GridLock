import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_BASE } from '../lib/f1';

export default function AuthPage() {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({ username: '', email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setNotice(null);
    setLoading(true);

    const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
    try {
      const response = await fetch(`${API_BASE}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      if (response.ok) {
        if (isLogin) {
          localStorage.setItem('token', data.token);
          navigate('/dashboard');
        } else {
          setNotice('Account created — log in below.');
          setIsLogin(true);
          setFormData((f) => ({ ...f, username: '' }));
        }
      } else {
        setError(data.error || 'Something went wrong.');
      }
    } catch {
      setError('Could not reach the server. Is the backend running?');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-screen bg-[#050505] text-white flex">
      {/* Left: brand panel — hidden on small screens */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden items-center justify-center border-r border-white/5">
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: 'repeating-linear-gradient(45deg, #fff 0, #fff 1px, transparent 1px, transparent 14px)',
          }}
        />
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-[#e10600]/10 blur-3xl" />
        <div className="absolute bottom-0 right-0 w-md h-112 rounded-full bg-[#e10600]/5 blur-3xl" />

        <div className="relative z-10 px-16 max-w-lg">
          <div className="flex items-center gap-1 mb-6">
            <span className="font-mono text-3xl font-black tracking-tight uppercase text-white">GRID</span>
            <span className="font-mono text-3xl font-black tracking-tight uppercase text-[#e10600]">LOCK</span>
          </div>
          <h2 className="text-2xl font-bold leading-snug mb-4">
            Every lap. Every corner. <span className="text-[#e10600]">Every data point.</span>
          </h2>
          <p className="text-sm text-gray-500 leading-relaxed mb-10">
            Real telemetry, race replays, and an AI race engineer — built on the same timing
            data used by F1 broadcasts, not mocked or hand-authored.
          </p>
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: 'Telemetry Comparison', sub: 'Speed, throttle, RPM, DRS' },
              { label: 'Live Simulator', sub: 'Full race replay' },
              { label: 'Race Engineer AI', sub: 'Ask anything about F1' },
              { label: 'Season Standings', sub: 'Always up to date' },
            ].map((f) => (
              <div key={f.label} className="rounded-xl bg-white/2 border border-white/5 p-4">
                <div className="text-xs font-bold text-white mb-1">{f.label}</div>
                <div className="text-[11px] text-gray-600 font-mono">{f.sub}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right: form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          <div className="lg:hidden flex items-center gap-1 mb-8 justify-center">
            <span className="font-mono text-2xl font-black tracking-tight uppercase text-white">GRID</span>
            <span className="font-mono text-2xl font-black tracking-tight uppercase text-[#e10600]">LOCK</span>
          </div>

          <h1 className="text-xl font-black uppercase tracking-tight mb-1">
            {isLogin ? 'Welcome back' : 'Create your account'}
          </h1>
          <p className="text-sm text-gray-500 mb-8">
            {isLogin ? 'Log in to access the paddock.' : 'Join to save your Race Engineer chat history.'}
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <Field label="Username">
                <input
                  className="w-full bg-[#0d0e12] border border-white/10 rounded-lg px-4 py-3 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-[#e10600]/60 transition-colors"
                  placeholder="Your name"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  required
                />
              </Field>
            )}

            <Field label="Email">
              <input
                type="email"
                className="w-full bg-[#0d0e12] border border-white/10 rounded-lg px-4 py-3 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-[#e10600]/60 transition-colors"
                placeholder="you@example.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </Field>

            <Field label="Password">
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="w-full bg-[#0d0e12] border border-white/10 rounded-lg px-4 py-3 pr-11 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-[#e10600]/60 transition-colors"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-0 top-0 h-full w-11 flex items-center justify-center text-gray-500 hover:text-gray-300 transition-colors"
                >
                  {showPassword ? (
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17.94 17.94A10.94 10.94 0 0 1 12 20c-7 0-11-8-11-8a21.8 21.8 0 0 1 5.06-6.94M9.9 4.24A10.94 10.94 0 0 1 12 4c7 0 11 8 11 8a21.8 21.8 0 0 1-2.61 3.85M14.12 14.12a3 3 0 1 1-4.24-4.24" />
                      <path d="M1 1l22 22" />
                    </svg>
                  ) : (
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8Z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
            </Field>

            {error && (
              <div className="text-xs text-[#ff6b6b] bg-[#ff6b6b]/10 border border-[#ff6b6b]/20 rounded-lg px-3 py-2.5">
                {error}
              </div>
            )}
            {notice && (
              <div className="text-xs text-[#22c55e] bg-[#22c55e]/10 border border-[#22c55e]/20 rounded-lg px-3 py-2.5">
                {notice}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#e10600] hover:bg-[#c20500] disabled:opacity-50 disabled:cursor-not-allowed transition-colors rounded-lg py-3.5 text-sm font-bold uppercase tracking-wide"
            >
              {loading ? 'Please wait…' : isLogin ? 'Log In' : 'Create Account'}
            </button>
          </form>

          <p className="mt-6 text-sm text-gray-500 text-center">
            {isLogin ? "Don't have an account?" : 'Already have an account?'}{' '}
            <button
              onClick={() => { setIsLogin(!isLogin); setError(null); setNotice(null); }}
              className="text-white font-semibold hover:text-[#e10600] transition-colors"
            >
              {isLogin ? 'Register' : 'Log in'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1.5">{label}</span>
      {children}
    </label>
  );
}
