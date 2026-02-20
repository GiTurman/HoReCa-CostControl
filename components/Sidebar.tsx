import React, { useState } from 'react';
import { NavLink, useNavigate, useParams } from 'react-router-dom';
import { useAppStore } from '../store';
import { t } from '../i18n';
import { 
  LayoutDashboard, 
  Utensils, 
  TrendingUp, 
  ShoppingCart, 
  Package, 
  Boxes,
  X,
  Trash2,
  Settings,
  BookOpen,
  LineChart,
  LogOut
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, setIsOpen }) => {
  const { language, clearAllData, logout } = useAppStore();
  const { restaurantId } = useParams<{ restaurantId: string }>();
  const navigate = useNavigate();
  const [confirmModal, setConfirmModal] = useState<{message: string, onConfirm: () => void} | null>(null);
  const [alertMessage, setAlertMessage] = useState<string | null>(null);

  const basePath = `/HORECA/COSTCONTROL/${restaurantId}`;

  const navItems = [
    { path: `${basePath}/dashboard`, label: t(language, 'dashboard'), icon: LayoutDashboard },
    { path: `${basePath}/menu`, label: t(language, 'menu'), icon: Utensils },
    { path: `${basePath}/sales`, label: t(language, 'sales'), icon: TrendingUp },
    { path: `${basePath}/purchases`, label: t(language, 'purchases'), icon: ShoppingCart },
    { path: `${basePath}/inventory`, label: t(language, 'inventory'), icon: Package },
    { path: `${basePath}/products`, label: t(language, 'products'), icon: Boxes },
    { path: `${basePath}/ai-analytics`, label: t(language, 'aiInsights'), icon: LineChart },
  ];

  const bottomNavItems = [
    { path: `${basePath}/settings`, label: language === 'ka' ? 'პარამეტრები' : 'Settings', icon: Settings },
    { path: `${basePath}/instructions`, label: language === 'ka' ? 'ინსტრუქცია' : 'Guide', icon: BookOpen },
  ];

  const handleClearData = () => {
    setConfirmModal({
      message: 'WARNING: Are you sure you want to completely Reset for Production? This will permanently wipe ALL DATA from the system.',
      onConfirm: () => {
        clearAllData();
        // Explicitly wipe the localStorage layer to guarantee zero artifacts
        localStorage.removeItem('cost-control-storage');
        
        setAlertMessage('System successfully reset for production use. Reloading...');
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      }
    });
  };

  const handleLogout = () => {
    logout();
    setIsOpen(false);
    navigate('/login', { replace: true });
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-20 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-30 w-64 bg-slate-900 text-slate-300 flex flex-col h-full transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="h-16 flex items-center justify-between px-6 border-b border-slate-800 shrink-0">
          <h1 className="text-white font-bold text-lg truncate" title={t(language, 'appTitle')}>
            {t(language, 'appTitle')}
          </h1>
          <button 
            className="md:hidden text-slate-400 hover:text-white transition-colors"
            onClick={() => setIsOpen(false)}
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <nav className="flex-1 overflow-y-auto py-4">
          <ul className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.path}>
                  <NavLink
                    to={item.path}
                    onClick={() => setIsOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center px-6 py-3 text-sm font-medium transition-colors ${
                        isActive
                          ? 'bg-brand-600 text-white'
                          : 'hover:bg-slate-800 hover:text-white'
                      }`
                    }
                  >
                    <Icon className="w-5 h-5 mr-3" />
                    {item.label}
                  </NavLink>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Bottom Navigation (Settings & Guide) */}
        <div className="mt-auto pb-2">
          <ul className="space-y-1">
            {bottomNavItems.map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.path}>
                  <NavLink
                    to={item.path}
                    onClick={() => setIsOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center px-6 py-3 text-sm font-medium transition-colors ${
                        isActive
                          ? 'bg-brand-600 text-white'
                          : 'hover:bg-slate-800 hover:text-white'
                      }`
                    }
                  >
                    <Icon className="w-5 h-5 mr-3" />
                    {item.label}
                  </NavLink>
                </li>
              );
            })}
          </ul>
        </div>

        {/* System Settings & Actions */}
        <div className="p-4 border-t border-slate-800 space-y-3">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center px-4 py-2.5 bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white rounded-lg text-sm font-bold transition-colors shadow-sm"
          >
            <LogOut className="w-4 h-4 mr-2" />
            {t(language, 'logout')}
          </button>
          
          <button
            onClick={handleClearData}
            className="w-full flex items-center justify-center px-4 py-2 bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded-lg text-sm font-medium transition-colors border border-red-500/20 mt-2"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Reset for Production
          </button>
          <div className="text-xs text-slate-500 text-center mt-2">
            ID: {restaurantId}
          </div>
        </div>
      </aside>

      {/* Modals */}
      {confirmModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 transform transition-all">
            <h3 className="text-lg font-bold text-gray-900 mb-2">ყურადღება / Warning</h3>
            <p className="text-sm text-gray-600 mb-6">{confirmModal.message}</p>
            <div className="flex space-x-3">
              <button onClick={() => setConfirmModal(null)} className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-medium">Cancel</button>
              <button onClick={() => { confirmModal.onConfirm(); setConfirmModal(null); }} className="flex-1 px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 font-bold">Confirm</button>
            </div>
          </div>
        </div>
      )}

      {alertMessage && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 transform transition-all text-center">
            <h3 className="text-lg font-bold text-gray-900 mb-2">შეტყობინება / Notification</h3>
            <p className="text-sm text-gray-600 mb-6">{alertMessage}</p>
            <button onClick={() => setAlertMessage(null)} className="w-full px-4 py-2 bg-brand-600 text-white rounded-xl hover:bg-brand-700 font-bold">OK</button>
          </div>
        </div>
      )}
    </>
  );
};