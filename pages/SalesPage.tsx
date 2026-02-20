import React, { useState, useMemo } from 'react';
import { useAppStore } from '../store';
import { Sale } from '../types';
import { t, formatCurrency } from '../i18n';
import { Plus, Download, ChevronDown, ChevronRight, TrendingUp, Receipt, Store, Trash2, Edit2, X } from 'lucide-react';
import * as XLSX from 'xlsx';

export const SalesPage: React.FC = () => {
  const { language, addSale, editSale, deleteSale, sales, dishes } = useAppStore();
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    dishId: '',
    quantity: '',
  });

  const [editingSale, setEditingSale] = useState<Sale | null>(null);
  const [editFormData, setEditFormData] = useState({
    date: '', dishId: '', quantity: ''
  });

  const [expandedDates, setExpandedDates] = useState<Record<string, boolean>>({});

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleEditInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setEditFormData((prev) => ({ ...prev, [name]: value }));
  };

  const selectedDish = useMemo(() => dishes.find(d => d.id === formData.dishId), [dishes, formData.dishId]);
  const editSelectedDish = useMemo(() => dishes.find(d => d.id === editFormData.dishId), [dishes, editFormData.dishId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.dishId || !formData.quantity) return;

    addSale({
      date: formData.date,
      dishId: formData.dishId,
      quantity: Number(formData.quantity),
    });

    setFormData((prev) => ({
      ...prev,
      dishId: '',
      quantity: '',
    }));
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSale || !editFormData.dishId || !editFormData.quantity) return;

    editSale(editingSale.id, {
      date: editFormData.date,
      dishId: editFormData.dishId,
      quantity: Number(editFormData.quantity),
    });

    setEditingSale(null);
  };

  const getDishName = (dishId: string) => {
    return dishes.find(d => d.id === dishId)?.name || 'Unknown Dish';
  };

  const openEditSale = (sale: Sale) => {
    setEditingSale(sale);
    setEditFormData({
      date: sale.date,
      dishId: sale.dishId,
      quantity: sale.quantity.toString()
    });
  };

  const handleExport = () => {
    const dataToExport = sales.map(s => ({
      [t(language, 'date')]: s.date,
      [t(language, 'dishName')]: getDishName(s.dishId),
      [t(language, 'quantity')]: s.quantity,
      [t(language, 'revenue')]: s.totalRevenue,
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, t(language, 'sales'));
    XLSX.writeFile(workbook, `Sales_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const toggleDate = (date: string) => {
    setExpandedDates(prev => ({ ...prev, [date]: !prev[date] }));
  };

  const groupedSales = useMemo(() => {
    const groups: Record<string, Sale[]> = {};
    const sortedSales = [...sales].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    sortedSales.forEach(s => {
      if (!groups[s.date]) groups[s.date] = [];
      groups[s.date].push(s);
    });
    return groups;
  }, [sales]);

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto w-full space-y-6">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 tracking-tight">{t(language, 'sales')}</h2>
          <p className="text-sm text-gray-500 mt-1">Record daily sales and track revenue</p>
        </div>
        
        <div className="mt-4 sm:mt-0 flex w-full sm:w-auto">
          <button
            onClick={handleExport}
            className="flex-1 sm:flex-none flex justify-center items-center px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-brand-50 hover:text-brand-700 hover:border-brand-200 transition-all shadow-sm"
          >
            <Download className="w-4 h-4 mr-2" />
            {t(language, 'exportExcel')}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Manual Form Section */}
        <div className="lg:col-span-1">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 sticky top-20">
            <h3 className="text-lg font-bold text-gray-900 mb-5 flex items-center pb-3 border-b border-gray-100">
              <div className="bg-brand-100 p-1.5 rounded-lg mr-3">
                <Plus className="w-5 h-5 text-brand-600" />
              </div>
              {t(language, 'addSale')}
            </h3>
            
            {dishes.length === 0 ? (
              <div className="p-5 bg-amber-50 rounded-xl border border-amber-200 text-sm text-amber-800 flex flex-col items-center text-center">
                <Store className="w-8 h-8 text-amber-400 mb-2" />
                <span className="font-medium">{t(language, 'noDishesWarning')}</span>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">{t(language, 'date')}</label>
                  <input
                    type="date"
                    name="date"
                    required
                    value={formData.date}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-brand-500 focus:border-brand-500 sm:text-sm transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">{t(language, 'dishName')}</label>
                  <select
                    name="dishId"
                    required
                    value={formData.dishId}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-brand-500 focus:border-brand-500 sm:text-sm transition-colors"
                  >
                    <option value="" disabled>{t(language, 'selectDish')}</option>
                    {dishes.map(d => (
                      <option key={d.id} value={d.id}>{d.name} ({formatCurrency(d.salePrice)})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">{t(language, 'quantity')}</label>
                  <input
                    type="number"
                    name="quantity"
                    min="1"
                    step="1"
                    required
                    value={formData.quantity}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-brand-500 focus:border-brand-500 sm:text-sm transition-colors"
                  />
                </div>

                {/* Total Calculation Display */}
                <div className={`mt-2 p-4 rounded-xl border flex justify-between items-center transition-all ${
                  formData.quantity && selectedDish ? 'bg-brand-50 border-brand-200' : 'bg-gray-50 border-gray-200 opacity-50'
                }`}>
                  <span className="text-sm font-medium text-gray-600">{t(language, 'revenue')}:</span>
                  <span className="text-xl font-bold text-gray-900">
                    {formatCurrency((Number(formData.quantity) || 0) * (selectedDish?.salePrice || 0))}
                  </span>
                </div>

                <button
                  type="submit"
                  className="w-full mt-2 py-2.5 px-4 rounded-xl shadow-sm text-sm font-bold text-white bg-brand-600 hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 transition-all active:scale-[0.98]"
                >
                  {t(language, 'save')}
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Archive Section */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden h-full">
            <div className="p-5 border-b border-gray-100 flex items-center bg-white sticky top-0 z-10">
              <div className="bg-slate-100 p-2 rounded-lg mr-3">
                <TrendingUp className="w-5 h-5 text-slate-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">{t(language, 'salesArchive')}</h3>
            </div>
            
            <div className="divide-y divide-gray-100">
              {Object.keys(groupedSales).length === 0 ? (
                <div className="p-12 text-center flex flex-col items-center justify-center">
                  <div className="bg-gray-50 p-4 rounded-full mb-4">
                    <Receipt className="w-8 h-8 text-gray-400" />
                  </div>
                  <h4 className="text-gray-900 font-medium">{t(language, 'noSales')}</h4>
                  <p className="text-sm text-gray-500 mt-1">Sales records will appear here.</p>
                </div>
              ) : (
                (Object.entries(groupedSales) as [string, Sale[]][]).map(([date, dateSales]) => {
                  const isExpanded = expandedDates[date] !== false; // Default true (expanded)
                  const dailyTotal = dateSales.reduce((sum, s) => sum + s.totalRevenue, 0);

                  return (
                    <div key={date} className="bg-white group">
                      <button
                        onClick={() => toggleDate(date)}
                        className="w-full px-5 py-4 flex items-center justify-between hover:bg-slate-50 transition-colors focus:outline-none"
                      >
                        <div className="flex items-center space-x-3">
                          <div className={`p-1 rounded transition-colors ${isExpanded ? 'bg-slate-200' : 'bg-slate-100 group-hover:bg-slate-200'}`}>
                            {isExpanded ? (
                              <ChevronDown className="w-4 h-4 text-slate-600" />
                            ) : (
                              <ChevronRight className="w-4 h-4 text-slate-600" />
                            )}
                          </div>
                          <span className="font-bold text-gray-800 tracking-tight">{date}</span>
                          <span className="text-xs font-medium text-slate-500 px-2.5 py-0.5 bg-slate-100 border border-slate-200 rounded-full">
                            {dateSales.length} items
                          </span>
                        </div>
                        <span className="font-bold text-gray-900">{formatCurrency(dailyTotal)}</span>
                      </button>

                      {isExpanded && (
                        <div className="px-5 pb-5">
                          <div className="border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                            <table className="min-w-full divide-y divide-gray-200">
                              <thead className="bg-gray-50/80">
                                <tr>
                                  <th className="px-5 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">{t(language, 'dishName')}</th>
                                  <th className="px-5 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">{t(language, 'quantity')}</th>
                                  <th className="px-5 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">{t(language, 'revenue')}</th>
                                  <th className="px-5 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider w-[80px]">{t(language, 'actionsShort')}</th>
                                </tr>
                              </thead>
                              <tbody className="bg-white divide-y divide-gray-100">
                                {dateSales.map((sale) => (
                                  <tr key={sale.id} className="hover:bg-slate-50/80 transition-colors">
                                    <td className="px-5 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                                      {getDishName(sale.dishId)}
                                    </td>
                                    <td className="px-5 py-3 whitespace-nowrap text-sm text-gray-600 text-right">
                                      <span className="font-medium text-gray-900">{sale.quantity}</span>
                                    </td>
                                    <td className="px-5 py-3 whitespace-nowrap text-sm font-bold text-gray-900 text-right bg-gray-50/30">
                                      {formatCurrency(sale.totalRevenue)}
                                    </td>
                                    <td className="px-5 py-3 whitespace-nowrap text-right">
                                      <div className="flex gap-2 justify-end items-center">
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            openEditSale(sale);
                                          }}
                                          className="text-blue-500 hover:text-blue-700 hover:bg-blue-50 p-1 rounded transition-colors"
                                          title={t(language, 'edit')}
                                        >
                                          <Edit2 className="w-4 h-4" />
                                        </button>
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setItemToDelete(sale.id);
                                          }}
                                          className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1 rounded transition-colors"
                                          title={t(language, 'delete')}
                                        >
                                          <Trash2 className="w-4 h-4" />
                                        </button>
                                      </div>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Edit Sale Modal */}
      {editingSale && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm flex flex-col transform transition-all">
            <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-900 flex items-center">
                <Edit2 className="w-5 h-5 mr-2 text-blue-600" />
                {t(language, 'edit')}
              </h3>
              <button onClick={() => setEditingSale(null)} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">
              <form onSubmit={handleEditSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">{t(language, 'date')}</label>
                  <input
                    type="date"
                    name="date"
                    required
                    value={editFormData.date}
                    onChange={handleEditInputChange}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-brand-500 sm:text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">{t(language, 'dishName')}</label>
                  <select
                    name="dishId"
                    required
                    value={editFormData.dishId}
                    onChange={handleEditInputChange}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-brand-500 sm:text-sm"
                  >
                    <option value="" disabled>{t(language, 'selectDish')}</option>
                    {dishes.map(d => (
                      <option key={d.id} value={d.id}>{d.name} ({formatCurrency(d.salePrice)})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">{t(language, 'quantity')}</label>
                  <input
                    type="number"
                    name="quantity"
                    min="1"
                    step="1"
                    required
                    value={editFormData.quantity}
                    onChange={handleEditInputChange}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-brand-500 sm:text-sm"
                  />
                </div>

                {/* Total Calculation Display */}
                <div className={`mt-2 p-4 rounded-xl border flex justify-between items-center transition-all ${
                  editFormData.quantity && editSelectedDish ? 'bg-brand-50 border-brand-200' : 'bg-gray-50 border-gray-200 opacity-50'
                }`}>
                  <span className="text-sm font-medium text-gray-600">{t(language, 'revenue')}:</span>
                  <span className="text-xl font-bold text-gray-900">
                    {formatCurrency((Number(editFormData.quantity) || 0) * (editSelectedDish?.salePrice || 0))}
                  </span>
                </div>

                <div className="flex space-x-3 pt-4 border-t border-gray-100 mt-6">
                  <button
                    type="button"
                    onClick={() => setEditingSale(null)}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-medium transition-colors focus:outline-none"
                  >
                    {t(language, 'cancel')}
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-bold shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  >
                    {t(language, 'save')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {itemToDelete && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 transform transition-all">
            <h3 className="text-lg font-bold text-gray-900 mb-2">ყურადღება / Warning</h3>
            <p className="text-sm text-gray-600 mb-6">ნამდვილად გსურთ წაშლა? / Are you sure you want to delete?</p>
            <div className="flex space-x-3">
              <button onClick={() => setItemToDelete(null)} className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-medium">{t(language, 'cancel')}</button>
              <button onClick={() => { deleteSale(itemToDelete); setItemToDelete(null); }} className="flex-1 px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 font-bold">{t(language, 'delete')}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};