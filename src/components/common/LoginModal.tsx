import React, { useState, useEffect } from 'react';
import { X, Mail, Lock, Eye, EyeOff, ArrowRight, CheckCircle2 } from 'lucide-react';
import { 
  loginUser, 
  registerUser, 
  getRememberedCredentials, 
  saveRememberedCredentials 
} from '../../services/authService';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose }) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (isOpen) {
      const remembered = getRememberedCredentials();
      if (remembered.remember && remembered.email) {
        setEmail(remembered.email);
        if (remembered.password) setPassword(remembered.password);
        setRememberMe(true);
      }
      setStatusMessage(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMessage(null);

    if (isSignUp) {
      const result = registerUser(email, password);
      if (result.success) {
        saveRememberedCredentials(email, password, rememberMe);
        setStatusMessage({ type: 'success', text: result.message });
        setTimeout(() => {
          onClose();
        }, 1200);
      } else {
        setStatusMessage({ type: 'error', text: result.message });
      }
    } else {
      const result = loginUser(email, password);
      if (result.success) {
        saveRememberedCredentials(email, password, rememberMe);
        setStatusMessage({ type: 'success', text: result.message });
        setTimeout(() => {
          onClose();
        }, 1000);
      } else {
        setStatusMessage({ type: 'error', text: result.message });
      }
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition z-10"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header (Exact Match to User Screenshot) */}
        <div className="pt-8 pb-4 px-6 sm:px-8 text-center space-y-2">
          <h2 className="domine-bold text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">
            {isSignUp ? 'Create Account' : 'Welcome Back!'}
          </h2>

          {/* Underline Bar with Centered Green Accent */}
          <div className="relative w-32 sm:w-40 h-[2px] bg-slate-200 mx-auto">
            <div className="absolute left-1/2 -translate-x-1/2 -top-[1px] h-[4px] w-14 sm:w-16 bg-[#249144] rounded-full"></div>
          </div>

          <p className="text-xs sm:text-sm text-slate-500 font-sans leading-relaxed pt-1">
            {isSignUp ? 'Sign up to save translations and datasets' : 'Please sign in to your account'}
          </p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="px-6 sm:px-8 pb-6 space-y-4">
          
          {/* Status Alert */}
          {statusMessage && (
            <div className={`p-3 rounded-xl text-xs font-semibold flex items-center gap-2 animate-in fade-in duration-200 ${statusMessage.type === 'success' ? 'bg-green-50 border border-green-200 text-[#14532d]' : 'bg-red-50 border border-red-200 text-red-700'}`}>
              {statusMessage.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-[#249144] flex-shrink-0" /> : null}
              <span>{statusMessage.text}</span>
            </div>
          )}

          {/* Email Address */}
          <div className="space-y-1">
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
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#249144]/30 focus:border-[#249144] transition"
              />
            </div>
          </div>

          {/* Password */}
          <div className="space-y-1">
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
                className="w-full pl-10 pr-10 py-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#249144]/30 focus:border-[#249144] transition"
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
          <div className="flex items-center justify-between text-xs pt-0.5">
            <label className="flex items-center gap-2 text-slate-600 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-3.5 h-3.5 rounded border-slate-300 text-[#249144] focus:ring-[#249144]/30 accent-[#249144] cursor-pointer"
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
            className="w-full py-3 bg-gradient-to-r from-[#249144] to-[#1e7e34] hover:from-[#1e7e34] hover:to-[#166534] text-white font-bold rounded-xl text-sm shadow-md transition flex items-center justify-center gap-2 cursor-pointer active:scale-98"
          >
            <span>{isSignUp ? 'Create Account' : 'Sign In'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>

        </form>

        {/* Modal Bottom Strip (Exact Match to User Screenshot) */}
        <div className="bg-slate-50 border-t border-slate-100 p-4 text-center text-xs text-slate-500">
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
    </div>
  );
};
