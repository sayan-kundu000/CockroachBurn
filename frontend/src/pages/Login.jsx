import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Bug, Lock, User, ArrowRight, Shield, AlertCircle } from 'lucide-react';

export const Login = () => {
  const { login, quickLoginAs } = useAuth();
  const navigate = useNavigate();
  const [usernameOrEmail, setUsernameOrEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!usernameOrEmail || !password) {
      setError('Please provide username/email and password');
      return;
    }

    try {
      setSubmitting(true);
      setError('');
      await login(usernameOrEmail, password);
      navigate('/');
    } catch (err) {
      console.error('Login failed', err);
      setError(err.response?.data?.detail || 'Invalid username or password');
    } finally {
      setSubmitting(false);
    }
  };

  const handleQuickLogin = async (role) => {
    try {
      setSubmitting(true);
      setError('');
      await quickLoginAs(role);
      navigate('/');
    } catch (err) {
      console.error('Quick login failed', err);
      setError('Failed demo login');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4 relative overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute top-1/4 -left-20 w-80 h-80 bg-brand-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-20 w-80 h-80 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md bg-slate-900/90 border border-slate-800 rounded-3xl p-8 shadow-2xl relative z-10 backdrop-blur">
        {/* Logo & Header */}
        <div className="text-center mb-8">
          <div className="inline-flex w-14 h-14 rounded-2xl bg-gradient-to-tr from-brand-600 to-indigo-500 items-center justify-center text-3xl shadow-xl shadow-brand-500/25 mb-4">
            🐛
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-100">
            Welcome to BugTracker
          </h1>
          <p className="text-xs text-slate-400 mt-1.5">
            Industry-grade issue tracking inspired by Jira & Linear
          </p>
        </div>

        {error && (
          <div className="mb-5 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Demo Quick Logins */}
        <div className="mb-6 p-3.5 bg-slate-850/80 border border-slate-800 rounded-2xl">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-2.5 text-center">
            ⚡ Quick 1-Click Demo Login
          </span>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => handleQuickLogin('Admin')}
              className="py-1.5 px-2 rounded-xl text-xs font-semibold bg-purple-500/10 text-purple-300 border border-purple-500/20 hover:bg-purple-500/20 transition flex flex-col items-center"
            >
              <span className="text-sm">👑</span>
              <span>Admin</span>
            </button>
            <button
              type="button"
              onClick={() => handleQuickLogin('Developer')}
              className="py-1.5 px-2 rounded-xl text-xs font-semibold bg-blue-500/10 text-blue-300 border border-blue-500/20 hover:bg-blue-500/20 transition flex flex-col items-center"
            >
              <span className="text-sm">💻</span>
              <span>Developer</span>
            </button>
            <button
              type="button"
              onClick={() => handleQuickLogin('Viewer')}
              className="py-1.5 px-2 rounded-xl text-xs font-semibold bg-amber-500/10 text-amber-300 border border-amber-500/20 hover:bg-amber-500/20 transition flex flex-col items-center"
            >
              <span className="text-sm">👁️</span>
              <span>Viewer</span>
            </button>
          </div>
        </div>

        {/* Standard Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
              Username or Email
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                placeholder="admin or user@tracker.io"
                value={usernameOrEmail}
                onChange={(e) => setUsernameOrEmail(e.target.value)}
                className="w-full bg-slate-800/80 border border-slate-700 rounded-xl pl-9 pr-3.5 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500 transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-800/80 border border-slate-700 rounded-xl pl-9 pr-3.5 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500 transition"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-brand-600 hover:bg-brand-500 text-white font-semibold py-2.5 rounded-xl text-xs shadow-lg shadow-brand-600/30 transition flex items-center justify-center space-x-1.5 active:scale-95 disabled:opacity-50 mt-2"
          >
            <span>{submitting ? 'Authenticating...' : 'Sign In'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </form>

        <div className="mt-6 text-center text-xs text-slate-400">
          Don't have an account?{' '}
          <Link to="/register" className="text-brand-400 hover:text-brand-300 font-medium">
            Create account
          </Link>
        </div>
      </div>
    </div>
  );
};

