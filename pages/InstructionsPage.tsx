import React from 'react';
import { useAppStore } from '../store';
import { t } from '../i18n';
import { BookOpen, ShoppingCart, ChefHat, TrendingUp, Boxes, Brain } from 'lucide-react';

export const InstructionsPage: React.FC = () => {
  const { language } = useAppStore();

  const instructions = [
    {
      id: 'purchases',
      title: t(language, 'instPurchasesTitle'),
      desc: t(language, 'instPurchasesDesc'),
      icon: ShoppingCart,
      colorClass: 'text-blue-600',
      bgClass: 'bg-blue-100',
      borderClass: 'border-blue-200'
    },
    {
      id: 'menu',
      title: t(language, 'instMenuTitle'),
      desc: t(language, 'instMenuDesc'),
      icon: ChefHat,
      colorClass: 'text-brand-600',
      bgClass: 'bg-brand-100',
      borderClass: 'border-brand-200'
    },
    {
      id: 'sales',
      title: t(language, 'instSalesTitle'),
      desc: t(language, 'instSalesDesc'),
      icon: TrendingUp,
      colorClass: 'text-emerald-600',
      bgClass: 'bg-emerald-100',
      borderClass: 'border-emerald-200'
    },
    {
      id: 'inventory',
      title: t(language, 'instInventoryTitle'),
      desc: t(language, 'instInventoryDesc'),
      icon: Boxes,
      colorClass: 'text-amber-600',
      bgClass: 'bg-amber-100',
      borderClass: 'border-amber-200'
    },
    {
      id: 'ai',
      title: t(language, 'instAiTitle'),
      desc: t(language, 'instAiDesc'),
      icon: Brain,
      colorClass: 'text-indigo-600',
      bgClass: 'bg-indigo-100',
      borderClass: 'border-indigo-200'
    }
  ];

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto w-full space-y-6">
      <div className="flex items-center space-x-3 mb-6">
        <div className="bg-slate-800 p-2.5 rounded-xl shadow-md">
          <BookOpen className="w-6 h-6 text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900 tracking-tight">{t(language, 'instructions')}</h2>
          <p className="text-sm text-gray-500 mt-0.5">{t(language, 'instructionsDesc')}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {instructions.map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.id} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
              <div className="flex items-start gap-4">
                <div className={`p-3 rounded-xl shrink-0 border ${item.bgClass} ${item.colorClass} ${item.borderClass}`}>
                  <Icon className="w-6 h-6" />
                </div>
                <div className="flex-1 mt-1">
                  <h3 className="text-lg font-bold text-gray-900 mb-2">{item.title}</h3>
                  <p className="text-slate-600 leading-relaxed text-sm sm:text-base">
                    {item.desc}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer Info Box */}
      <div className="mt-8 bg-slate-50 border border-slate-200 rounded-2xl p-6 text-center">
        <p className="text-sm text-slate-500 font-medium">
          {language === 'ka' 
            ? 'რესტორნის მართვის პროგრამული უზრუნველყოფა განკუთვნილია ზუსტი აღრიცხვისა და ხარჯების მინიმიზაციისთვის.' 
            : 'The restaurant management software is designed for accurate accounting and cost minimization.'}
        </p>
      </div>
    </div>
  );
};