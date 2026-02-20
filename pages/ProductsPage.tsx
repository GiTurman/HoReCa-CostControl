import React, { useState } from 'react';
import { useAppStore } from '../store';
import { t } from '../i18n';
import { Download, Search, Check, Edit2 } from 'lucide-react';
import * as XLSX from 'xlsx';

export const ProductsPage: React.FC = () => {
  const { language, products, updateProductMinBalance } = useAppStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<number>(0);

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatUnit = (unit: string) => {
    const translated = t(language, `unit_${unit}`);
    return translated === `unit_${unit}` ? unit : translated;
  };

  const handleExport = () => {
    const dataToExport = products.map(p => ({
      [t(language, 'productName')]: p.name,
      [t(language, 'category')]: p.category,
      [t(language, 'unit')]: formatUnit(p.unit),
      [t(language, 'minBalance')]: p.minBalance,
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, t(language, 'products'));
    XLSX.writeFile(workbook, `Products_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const startEdit = (id: string, currentVal: number) => {
    setEditingId(id);
    setEditValue(currentVal);
  };

  const saveEdit = (id: string) => {
    updateProductMinBalance(id, editValue);
    setEditingId(null);
  };

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto w-full">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 space-y-4 sm:space-y-0">
        <h2 className="text-2xl font-bold text-gray-900">{t(language, 'products')}</h2>
        
        <div className="flex items-center space-x-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder={t(language, 'search')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-brand-500 focus:border-brand-500"
            />
          </div>
          <button
            onClick={handleExport}
            className="flex items-center px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors shadow-sm"
          >
            <Download className="w-4 h-4 mr-2" />
            {t(language, 'exportExcel')}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t(language, 'productName')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t(language, 'category')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t(language, 'unit')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t(language, 'minBalance')}</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">{t(language, 'actions')}</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-sm text-gray-500">
                    {t(language, 'noProducts')}
                  </td>
                </tr>
              ) : (
                filteredProducts.map((product) => (
                  <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{product.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {product.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatUnit(product.unit)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {editingId === product.id ? (
                        <input
                          type="number"
                          value={editValue}
                          onChange={(e) => setEditValue(Number(e.target.value))}
                          className="w-24 px-2 py-1 border border-brand-300 rounded focus:ring-brand-500 focus:border-brand-500"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') saveEdit(product.id);
                            if (e.key === 'Escape') setEditingId(null);
                          }}
                        />
                      ) : (
                        <span className={`font-semibold ${product.minBalance > 0 ? 'text-green-600' : 'text-gray-400'}`}>
                          {product.minBalance}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      {editingId === product.id ? (
                        <button
                          onClick={() => saveEdit(product.id)}
                          className="text-green-600 hover:text-green-900 inline-flex items-center p-1 rounded-md hover:bg-green-50"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                      ) : (
                        <button
                          onClick={() => startEdit(product.id, product.minBalance)}
                          className="text-indigo-600 hover:text-indigo-900 inline-flex items-center p-1 rounded-md hover:bg-indigo-50"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};