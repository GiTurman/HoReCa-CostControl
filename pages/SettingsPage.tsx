import React, { useState, useRef } from 'react';
import { useAppStore } from '../store';
import { t } from '../i18n';
import { Settings, User, Shield, Save, KeyRound, AlertCircle, CheckCircle2, History, ChevronDown, ChevronRight, Clock, Download, Trash2, HardDrive, DownloadCloud, UploadCloud } from 'lucide-react';
import * as XLSX from 'xlsx';

export const SettingsPage: React.FC = () => {
  const { language, username, updatePassword, activityLogs, clearLogs, restoreData } = useAppStore();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // State for collapsible activity log
  const [isLogsExpanded, setIsLogsExpanded] = useState(false);

  const [alert, setAlert] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [confirmModal, setConfirmModal] = useState<{ message: string; onConfirm: () => void } | null>(null);
  
  // Backup & Restore state
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pendingRestoreData, setPendingRestoreData] = useState<any>(null);

  const handlePasswordChange = (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      setAlert({ message: t(language, 'passwordMismatch'), type: 'error' });
      return;
    }

    const success = updatePassword(currentPassword, newPassword);

    if (success) {
      setAlert({ message: t(language, 'passwordChanged'), type: 'success' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } else {
      setAlert({ message: t(language, 'invalidCurrentPassword'), type: 'error' });
    }
  };

  // Helper to format timestamps based on active language
  const formatDateTime = (isoString: string) => {
    const d = new Date(isoString);
    return d.toLocaleString(language === 'ka' ? 'ka-GE' : 'en-US', {
      year: 'numeric', 
      month: 'short', 
      day: '2-digit',
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit'
    });
  };

  const handleExportLogs = () => {
    const dataToExport = activityLogs.map(log => ({
      [t(language, 'dateTime')]: formatDateTime(log.timestamp),
      [t(language, 'actionLabel')]: log.action,
      [t(language, 'detailsLabel')]: log.details,
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    // Excel sheet names cannot exceed 31 characters
    XLSX.utils.book_append_sheet(workbook, worksheet, t(language, 'activityHistoryTitle').substring(0, 31));
    XLSX.writeFile(workbook, `Activity_Logs_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const requestClearLogs = () => {
    setConfirmModal({
      message: t(language, 'confirmClearLogs'),
      onConfirm: () => {
        clearLogs();
        setAlert({ message: t(language, 'logsCleared'), type: 'success' });
      }
    });
  };

  // --- Backup & Restore Logic ---
  const handleBackupData = () => {
    const state = useAppStore.getState();
    const dataToExport = {
      products: state.products,
      purchases: state.purchases,
      sales: state.sales,
      dishes: state.dishes,
      inventoryAudits: state.inventoryAudits,
      activityLogs: state.activityLogs,
    };
    
    const jsonString = JSON.stringify(dataToExport, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `horeca_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const json = evt.target?.result as string;
        const parsedData = JSON.parse(json);
        
        // Show confirmation modal before overwriting
        setPendingRestoreData(parsedData);
        setConfirmModal({
          message: t(language, 'confirmRestoreData'),
          onConfirm: () => {
            restoreData(parsedData);
            setAlert({ message: t(language, 'dataRestored'), type: 'success' });
            setPendingRestoreData(null);
          }
        });

      } catch (error) {
        console.error("Failed to parse backup JSON", error);
        setAlert({ message: t(language, 'dataRestoreError'), type: 'error' });
      }
    };
    reader.readAsText(file);
    e.target.value = ''; // Reset input so the same file can be selected again if needed
  };

  // Keep UI clean by showing a maximum of 50 recent logs
  const recentLogs = activityLogs.slice(0, 50);

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto w-full space-y-6 pb-20">
      <div className="flex items-center space-x-3 mb-6">
        <div className="bg-brand-100 p-2.5 rounded-xl">
          <Settings className="w-6 h-6 text-brand-600" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900 tracking-tight">{t(language, 'settings')}</h2>
          <p className="text-sm text-gray-500 mt-0.5">{t(language, 'settingsDesc')}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        <div className="space-y-6">
          {/* Profile Card */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden h-fit">
            <div className="p-5 border-b border-gray-100 bg-gray-50/50 flex items-center">
              <User className="w-5 h-5 text-gray-500 mr-2" />
              <h3 className="text-lg font-bold text-gray-900">{t(language, 'profile')}</h3>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">{t(language, 'username')}</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <User className="w-4 h-4 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      readOnly
                      value={username}
                      className="w-full pl-10 pr-4 py-2.5 bg-gray-100 border border-gray-300 rounded-xl text-gray-600 font-medium sm:text-sm shadow-inner cursor-not-allowed"
                    />
                  </div>
                  <p className="mt-2 text-xs text-gray-500">
                    {language === 'ka' ? 'მომხმარებლის სახელის შეცვლა შეუძლებელია.' : 'Username cannot be changed.'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Backup & Restore Card */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden h-fit">
            <div className="p-5 border-b border-gray-100 bg-gray-50/50 flex items-center">
              <HardDrive className="w-5 h-5 text-gray-500 mr-2" />
              <h3 className="text-lg font-bold text-gray-900">{t(language, 'backupRestoreTitle')}</h3>
            </div>
            <div className="p-6">
              <p className="text-sm text-gray-500 mb-5 leading-relaxed">
                {t(language, 'backupRestoreDesc')}
              </p>
              
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={handleBackupData}
                  className="flex-1 flex justify-center items-center px-4 py-3 bg-indigo-50 text-indigo-700 rounded-xl text-sm font-bold hover:bg-indigo-100 transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 border border-indigo-200"
                >
                  <DownloadCloud className="w-4 h-4 mr-2" />
                  {t(language, 'backupData')}
                </button>
                
                <input 
                  type="file" 
                  accept=".json" 
                  ref={fileInputRef} 
                  onChange={handleFileChange} 
                  className="hidden" 
                />
                
                <button
                  onClick={triggerFileInput}
                  className="flex-1 flex justify-center items-center px-4 py-3 bg-white text-gray-700 rounded-xl text-sm font-bold hover:bg-gray-50 transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-gray-300 border border-gray-300"
                >
                  <UploadCloud className="w-4 h-4 mr-2" />
                  {t(language, 'restoreData')}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Security / Password Change Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden h-fit">
          <div className="p-5 border-b border-gray-100 bg-gray-50/50 flex items-center">
            <Shield className="w-5 h-5 text-gray-500 mr-2" />
            <h3 className="text-lg font-bold text-gray-900">{t(language, 'security')}</h3>
          </div>
          <div className="p-6">
            <form onSubmit={handlePasswordChange} className="space-y-5">
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">{t(language, 'currentPassword')}</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <KeyRound className="w-4 h-4 text-gray-400" />
                  </div>
                  <input
                    type="password"
                    required
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500 sm:text-sm transition-shadow shadow-sm"
                  />
                </div>
              </div>

              <div className="border-t border-gray-100 pt-5">
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">{t(language, 'newPassword')}</label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500 sm:text-sm transition-shadow shadow-sm mb-4"
                />

                <label className="block text-sm font-semibold text-gray-700 mb-1.5">{t(language, 'confirmPassword')}</label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500 sm:text-sm transition-shadow shadow-sm"
                />
              </div>

              <button
                type="submit"
                className="w-full flex justify-center items-center px-4 py-3 bg-brand-600 text-white rounded-xl text-sm font-bold hover:bg-brand-700 transition-all shadow-sm active:scale-95 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 mt-2"
              >
                <Save className="w-4 h-4 mr-2" />
                {t(language, 'changePassword')}
              </button>
            </form>
          </div>
        </div>

      </div>

      {/* Activity Log Viewer (Collapsible) */}
      <div className="bg-slate-50 border border-slate-200 rounded-2xl shadow-sm overflow-hidden mt-8 transition-all duration-300">
        <button
          onClick={() => setIsLogsExpanded(!isLogsExpanded)}
          className="w-full px-5 py-4 flex items-center justify-between hover:bg-slate-100/80 transition-colors focus:outline-none"
        >
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-xl transition-colors ${isLogsExpanded ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-200 text-slate-500'}`}>
              <History className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-slate-800">{t(language, 'activityHistoryTitle')}</h3>
          </div>
          <div className={`p-1.5 rounded-lg transition-colors ${isLogsExpanded ? 'bg-indigo-50 text-indigo-500' : 'text-slate-400'}`}>
            {isLogsExpanded ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
          </div>
        </button>

        {isLogsExpanded && (
          <div className="border-t border-slate-200 px-5 pb-5 pt-4">
            
            {/* Toolbar for Logs */}
            <div className="flex flex-col sm:flex-row justify-end items-center mb-4 space-y-3 sm:space-y-0 sm:space-x-3">
              <button
                onClick={handleExportLogs}
                disabled={activityLogs.length === 0}
                className="w-full sm:w-auto flex items-center justify-center px-4 py-2 bg-white border border-gray-300 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Download className="w-4 h-4 mr-2" />
                {t(language, 'exportExcel')}
              </button>
              <button
                onClick={requestClearLogs}
                disabled={activityLogs.length === 0}
                className="w-full sm:w-auto flex items-center justify-center px-4 py-2 bg-red-50 border border-red-200 rounded-xl text-sm font-medium text-red-600 hover:bg-red-100 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                {t(language, 'clearLogs')}
              </button>
            </div>

            <div className="overflow-x-auto bg-white rounded-xl border border-slate-200 shadow-sm">
              <table className="min-w-full divide-y divide-slate-100 text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-5 py-3 text-left font-bold text-slate-500 uppercase tracking-wider">{t(language, 'dateTime')}</th>
                    <th className="px-5 py-3 text-left font-bold text-slate-500 uppercase tracking-wider">{t(language, 'actionLabel')}</th>
                    <th className="px-5 py-3 text-left font-bold text-slate-500 uppercase tracking-wider">{t(language, 'detailsLabel')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {recentLogs.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="px-5 py-8 text-center text-slate-400">
                        <div className="flex flex-col items-center">
                          <Clock className="w-8 h-8 mb-2 opacity-30" />
                          <p className="font-medium">{t(language, 'noLogs')}</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    recentLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-5 py-3 whitespace-nowrap text-slate-500 font-medium">
                          {formatDateTime(log.timestamp)}
                        </td>
                        <td className="px-5 py-3 whitespace-nowrap font-bold text-slate-700">
                          {log.action}
                        </td>
                        <td className="px-5 py-3 text-slate-600">
                          {log.details}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
              {activityLogs.length > 50 && (
                <div className="bg-slate-50 p-3 text-center text-xs font-semibold text-slate-500 border-t border-slate-100">
                  Showing the 50 most recent logs out of {activityLogs.length} total entries.
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Reusable Confirmation Modal */}
      {confirmModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 transform transition-all text-center">
            <h3 className="text-lg font-bold text-gray-900 mb-2">ყურადღება / Warning</h3>
            <p className="text-sm text-gray-600 mb-6">{confirmModal.message}</p>
            <div className="flex space-x-3">
              <button 
                onClick={() => {
                  setConfirmModal(null);
                  setPendingRestoreData(null);
                }} 
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-medium transition-colors"
              >
                {t(language, 'cancel')}
              </button>
              <button 
                onClick={() => { confirmModal.onConfirm(); setConfirmModal(null); }} 
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 font-bold shadow-sm transition-all"
              >
                {pendingRestoreData ? (language === 'ka' ? 'აღდგენა' : 'Restore') : t(language, 'clearLogs')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Alert Modal */}
      {alert && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 transform transition-all text-center">
            {alert.type === 'success' ? (
              <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-3" />
            ) : (
              <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
            )}
            <h3 className="text-lg font-bold text-gray-900 mb-2">
              {alert.type === 'success' ? (language === 'ka' ? 'წარმატება' : 'Success') : (language === 'ka' ? 'შეცდომა' : 'Error')}
            </h3>
            <p className="text-sm text-gray-600 mb-6">{alert.message}</p>
            <button 
              onClick={() => setAlert(null)} 
              className={`w-full px-4 py-2.5 text-white rounded-xl font-bold shadow-sm transition-all active:scale-95 ${
                alert.type === 'success' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'
              }`}
            >
              OK
            </button>
          </div>
        </div>
      )}

    </div>
  );
};