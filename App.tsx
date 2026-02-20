import React, { useState } from 'react';
import { Routes, Route, Navigate, Outlet, useParams, useLocation } from 'react-router-dom';
import { useAppStore } from './store';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { LoginPage } from './pages/LoginPage';
import { ProductsPage } from './pages/ProductsPage';
import { PurchasesPage } from './pages/PurchasesPage';
import { DashboardPage } from './pages/DashboardPage';
import { SalesPage } from './pages/SalesPage';
import { InventoryPage } from './pages/InventoryPage';
import { MenuPage } from './pages/MenuPage';
import { SettingsPage } from './pages/SettingsPage';
import { InstructionsPage } from './pages/InstructionsPage';
import { AiAnalyticsPage } from './pages/AiAnalyticsPage';
import { t } from './i18n';
import { Lock, ShieldCheck, AlertCircle } from 'lucide-react';

// First Time Password Change Screen
const FirstLoginScreen: React.FC = () => {
  const { language, changePassword } = useAppStore();
  
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setError(t(language, 'passwordMismatch'));
      return;
    }
    if (newPassword.length < 4) {
      setError(language === 'ka' ? 'პაროლი უნდა შეიცავდეს მინიმუმ 4 სიმბოლოს.' : 'Password must be at least 4 characters long.');
      return;
    }
    
    // Calling changePassword updates the store, automatically triggering a re-render
    // and allowing the user to pass through the RequireAuth guard.
    changePassword(newPassword);
  };

  return (
    <div className="fixed inset-0 z-[200] bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-brand-600 text-white shadow-lg shadow-brand-500/30 mb-4 animate-bounce">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-2">
            {t(language, 'firstLoginWelcome')}
          </h1>
          <p className="text-slate-500 font-medium">
            {t(language, 'firstLoginDesc')}
          </p>
        </div>

        <div className="bg-white rounded-3xl shadow-xl border border-slate-100 p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">
                {t(language, 'newPassword')}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="w-5 h-5 text-slate-400" />
                </div>
                <input
                  type="password"
                  required
                  autoFocus
                  value={newPassword}
                  onChange={(e) => {
                    setNewPassword(e.target.value);
                    setError('');
                  }}
                  className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium transition-all outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white"
                  placeholder="••••••"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">
                {t(language, 'confirmPassword')}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="w-5 h-5 text-slate-400" />
                </div>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    setError('');
                  }}
                  className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium transition-all outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white"
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
              className="w-full flex justify-center items-center px-4 py-3.5 bg-brand-600 text-white rounded-xl text-base font-bold hover:bg-brand-700 transition-all shadow-md hover:shadow-lg active:scale-[0.98]"
            >
              {t(language, 'setNewPasswordBtn')}
            </button>
            
          </form>
        </div>
      </div>
    </div>
  );
};

// Auth Guard Component
const RequireAuth: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isFirstLogin } = useAppStore();
  const location = useLocation();

  if (!isAuthenticated) {
    // Redirect them to the /login page, but save the current location they were trying to go to
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If this is the user's first login, force them to change their password.
  // By rendering FirstLoginScreen instead of {children}, we guarantee they cannot navigate away.
  if (isFirstLogin) {
    return <FirstLoginScreen />;
  }

  return <>{children}</>;
};

// Layout wrapper component
const AppLayout: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { restaurantId } = useParams<{ restaurantId: string }>();

  // Strict validation: ID must be exactly 9 or 11 digits
  const isValidId = restaurantId && /^(\d{9}|\d{11})$/.test(restaurantId);

  if (!isValidId) {
    // Redirect to a default valid 9-digit ID if the current one is invalid
    return <Navigate to="/HORECA/COSTCONTROL/123456789/dashboard" replace />;
  }

  return (
    <div className="flex h-screen w-full bg-gray-50 overflow-hidden">
      <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Header onMenuClick={() => setIsSidebarOpen(true)} />
        <main className="flex-1 overflow-y-auto overflow-x-hidden relative">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <Routes>
      {/* Public Route */}
      <Route path="/login" element={<LoginPage />} />

      {/* Main route pattern requiring an ID, protected by RequireAuth */}
      <Route 
        path="/HORECA/COSTCONTROL/:restaurantId" 
        element={
          <RequireAuth>
            <AppLayout />
          </RequireAuth>
        }
      >
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="products" element={<ProductsPage />} />
        <Route path="purchases" element={<PurchasesPage />} />
        <Route path="menu" element={<MenuPage />} />
        <Route path="sales" element={<SalesPage />} />
        <Route path="inventory" element={<InventoryPage />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="instructions" element={<InstructionsPage />} />
        <Route path="ai-analytics" element={<AiAnalyticsPage />} />
      </Route>
      
      {/* Catch-all - Redirects to the protected dashboard, which will then redirect to login if not authenticated */}
      <Route path="*" element={<Navigate to="/HORECA/COSTCONTROL/123456789/dashboard" replace />} />
    </Routes>
  );
};

export default App;