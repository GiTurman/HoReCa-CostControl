import React from 'react';
import { useAppStore } from '../store';
import { Languages, Menu as MenuIcon } from 'lucide-react';

interface HeaderProps {
  onMenuClick: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onMenuClick }) => {
  const { language, setLanguage } = useAppStore();

  const toggleLanguage = () => {
    setLanguage(language === 'ka' ? 'en' : 'ka');
  };

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 sm:px-6 shrink-0 sticky top-0 z-10">
      <div className="flex items-center">
        <button 
          onClick={onMenuClick}
          className="md:hidden p-2 -ml-2 text-gray-500 hover:bg-gray-100 rounded-md transition-colors"
        >
          <MenuIcon className="w-6 h-6" />
        </button>
      </div>
      
      <div className="flex items-center space-x-4">
        <button
          onClick={toggleLanguage}
          className="flex items-center px-3 py-1.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
        >
          <Languages className="w-4 h-4 mr-2" />
          {language === 'ka' ? 'EN' : 'ქარ'}
        </button>
      </div>
    </header>
  );
};
