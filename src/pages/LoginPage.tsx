import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, ArrowRight, CheckCircle2, Database, ShieldCheck } from 'lucide-react';
import { 
  loginUser, 
  registerUser, 
  getRememberedCredentials, 
  saveRememberedCredentials, 
  getStoredUsers, 
  StoredUser 
} from '../services/authService';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [storedUsersList, setStoredUsersList] = useState<StoredUser[]>([]);
  const [showStorageData, setShowStorageData] = useState(false);

  useEffect(() => {
    // Load remembered credentials from LocalStorage
    const remembered = getRememberedCredentials();
    if (remembered.remember && remembered.email) {
      setEmail(remembered.email);
      if (remembered.password) setPassword(remembered.password);
      setRememberMe(true);
    }
    setStoredUsersList(getStoredUsers());
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMessage(null);

    if (isSignUp) {
      const result = registerUser(email, password);
      if (result.success) {
        saveRememberedCredentials(email, password, rememberMe);
        setStatusMessage({ type: 'success', text: result.message });
        setStoredUsersList(getStoredUsers());
        setTimeout(() => {
          navigate('/');
        }, 1200);
      } else {
        setStatusMessage({ type: 'error', text: result.message });
      }
    } else {
      const result = loginUser(email, password);
      if (result.success) {
        saveRememberedCredentials(email, password, rememberMe);
        setStatusMessage({ type: 'success', text: result.message });
        setStoredUsersList(getStoredUsers());
        setTimeout(() => {
          navigate('/');
        }, 1000);
      } else {
        setStatusMessage({ type: 'error', text: result.message });
      }
    }
  };

  return (
    <section className="min-h-screen bg-slate-50/50 pt-28 pb-20 px-4 sm:px-6 lg:px-8 flex flex-col items-center justify-center">
      <div className="w-full max-w-md space-y-8">
        
        {/* Section Header (Exact Match to User Screenshot) */}
        <div className="w-full flex flex-col items-center text-center space-y-3">
          <h1 className="domine-bold text-3xl sm:text-4xl md:text-5xl font-bold leading-tight text-slate-900">
            {isSignUp ? 'Create Account' : 'Welcome Back!'}
          </h1>

          {/* Underline Bar with Centered Green Accent */}
          <div className="relative w-36 sm:w-48 h-[2px] bg-slate-200">
            <div className="absolute left-1/2 -translate-x-1/2 -top-[1px] h-[4px] w-16 sm:w-20 bg-[#249144] rounded-full"></div>
          </div>

          <p className="text-sm sm:text-base text-slate-500 font-sans leading-relaxed">
            {isSignUp ? 'Sign up to save translations and contribute' : 'Please sign in to your account'}
          </p>
        </div>

        {/* Login Form Card (Exact Match to User Screenshot) */}
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xl overflow-hidden">
          
          <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-5">
            
            {/* Status Alert */}
            {statusMessage && (
              <div className={`p-3.5 rounded-2xl text-xs font-semibold flex items-center gap-2 animate-in fade-in duration-200 ${statusMessage.type === 'success' ? 'bg-green-50 border border-green-200 text-[#14532d]' : 'bg-red-50 border border-red-200 text-red-700'}`}>
                {statusMessage.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-[#249144] flex-shrink-0" /> : null}
                <span>{statusMessage.text}</span>
              </div>
            )}

            {/* Email Address */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#249144]/30 focus:border-[#249144] transition"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-3 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#249144]/30 focus:border-[#249144] transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between text-xs pt-1">
              <label className="flex items-center gap-2 text-slate-600 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 text-[#249144] focus:ring-[#249144]/30 accent-[#249144] cursor-pointer"
                />
                <span>Remember me</span>
              </label>
              <a
                href="#forgot"
                onClick={(e) => {
                  e.preventDefault();
                  alert('Password recovery: please contact administrator at alfanshaikh902@gmail.com');
                }}
                className="text-[#249144] font-semibold hover:underline"
              >
                Forgot password?
              </a>
            </div>

            {/* Sign In CTA Button */}
            <button
              type="submit"
              className="w-full py-3.5 bg-gradient-to-r from-[#249144] to-[#1e7e34] hover:from-[#1e7e34] hover:to-[#166534] text-white font-bold rounded-xl text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
            >
              <span>{isSignUp ? 'Create Account' : 'Sign In'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>

          </form>

          {/* Card Footer (Exact Match to User Screenshot) */}
          <div className="bg-slate-50/80 border-t border-slate-100 p-4 text-center text-xs text-slate-500">
            <span>{isSignUp ? 'Already have an account?' : "Don't have an account?"} </span>
            <button
              type="button"
              onClick={() => {
                setIsSignUp(!isSignUp);
                setStatusMessage(null);
              }}
              className="text-[#249144] font-bold hover:underline cursor-pointer ml-1"
            >
              {isSignUp ? 'Sign in' : 'Sign up'}
            </button>
          </div>

        </div>

        {/* LocalStorage Data Explorer / Persistence Badge */}
        <div className="text-center space-y-2">
          <button
            onClick={() => setShowStorageData(!showStorageData)}
            className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-600 transition"
          >
            <Database className="w-3.5 h-3.5 text-[#249144]" />
            <span>LocalStorage Persistence: {storedUsersList.length} Stored Accounts</span>
          </button>

          {showStorageData && (
            <div className="bg-white rounded-2xl border border-slate-200 p-4 text-left shadow-md space-y-2 animate-in fade-in duration-200 max-h-48 overflow-y-auto">
              <p className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                Accounts Saved in Browser LocalStorage:
              </p>
              <div className="space-y-1.5">
                {storedUsersList.map((u, i) => (
                  <div key={i} className="text-xs p-2 bg-slate-50 rounded-xl flex items-center justify-between">
                    <div>
                      <span className="font-semibold text-slate-800">{u.email}</span>
                      <span className="text-[10px] text-slate-400 block">Role: {u.role || 'Contributor'}</span>
                    </div>
                    <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">Stored</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

      </div>
    </section>
  );
};
