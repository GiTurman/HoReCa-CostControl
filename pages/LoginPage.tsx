import React, { useState } from 'react';
import { Navigate, useNavigate, useLocation } from 'react-router-dom';
import { useAppStore } from '../store';
import { t } from '../i18n';
import { Lock, ArrowRight, AlertCircle, ChefHat } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { language, login, isAuthenticated } = useAppStore();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  // Determine where to send the user after a successful login.
  // If they were intercepted by RequireAuth, send them back to their requested URL.
  const from = location.state?.from?.pathname || '/HORECA/COSTCONTROL/123456789/dashboard';

  // If already authenticated, redirect to the app securely
  if (isAuthenticated) {
    return <Navigate to={from} replace />;
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const success = login(password);
    if (success) {
      navigate(from, { replace: true });
    } else {
      setError(t(language, 'invalidPassword'));
      setPassword('');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Logo / Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-brand-600 text-white shadow-lg shadow-brand-500/30 mb-4">
            <ChefHat className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-2">
            {t(language, 'appTitle')}
          </h1>
          <p className="text-slate-500 font-medium">
            {t(language, 'loginSubtitle')}
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-3xl shadow-xl border border-slate-100 p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">
                {t(language, 'enterPassword')}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="w-5 h-5 text-slate-400" />
                </div>
                <input
                  type="password"
                  required
                  autoFocus
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError('');
                  }}
                  className={`w-full pl-12 pr-4 py-3.5 bg-slate-50 border rounded-xl text-slate-900 font-medium transition-all outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white ${
                    error ? 'border-red-300 focus:ring-red-500' : 'border-slate-200'
                  }`}
                  placeholder="••••••"
                />
              </div>
              {error && (
                <div className="flex items-center mt-3 text-red-600 text-sm font-medium animate-in fade-in slide-in-from-top-1">
                  <AlertCircle className="w-4 h-4 mr-1.5 shrink-0" />
                  {error}
                </div>
              )}
            </div>

            <button
              type="submit"
              className="w-full flex justify-center items-center px-4 py-3.5 bg-brand-600 text-white rounded-xl text-base font-bold hover:bg-brand-700 transition-all shadow-md hover:shadow-lg active:scale-[0.98] group"
            >
              {t(language, 'loginButton')}
              <ArrowRight className="w-5 h-5 ml-2 opacity-70 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
            </button>
            
          </form>
        </div>
      </div>
    </div>
  );
};
