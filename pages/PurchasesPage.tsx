import React, { useState, useMemo, useRef } from 'react';
import { useAppStore } from '../store';
import { Purchase } from '../types';
import { t, formatCurrency } from '../i18n';
import { Plus, Download, ChevronDown, ChevronRight, Receipt, Upload, PackageOpen, FileSpreadsheet, Trash2, Edit2, X } from 'lucide-react';
import * as XLSX from 'xlsx';

export const PurchasesPage: React.FC = () => {
  const { language, addPurchase, editPurchase, bulkAddPurchases, deletePurchase, purchases, products } = useAppStore();
  
  // Date state specifically for the bulk Excel import
  const [importDate, setImportDate] = useState(new Date().toISOString().split('T')[0]);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const [alertMessage, setAlertMessage] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    code: '',
    productName: '',
    unit: 'kg',
    customUnit: '',
    quantity: '',
    price: '',
    category: 'General',
  });

  const [editingPurchase, setEditingPurchase] = useState<Purchase | null>(null);
  const [editFormData, setEditFormData] = useState({
    date: '', code: '', productName: '', unit: 'kg', customUnit: '', quantity: '', price: '', category: ''
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [expandedDates, setExpandedDates] = useState<Record<string, boolean>>({});

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleEditInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setEditFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.productName || !formData.quantity || !formData.price) return;

    const finalUnit = formData.unit === 'other' ? formData.customUnit.trim() : formData.unit;

    addPurchase({
      date: formData.date,
      code: formData.code.trim(),
      productName: formData.productName.trim(),
      unit: finalUnit,
      quantity: Number(formData.quantity),
      price: Number(formData.price),
      category: formData.category.trim() || 'General',
    });

    setFormData((prev) => ({
      ...prev,
      code: '',
      productName: '',
      quantity: '',
      price: '',
      customUnit: '',
    }));
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPurchase || !editFormData.productName || !editFormData.quantity || !editFormData.price) return;

    const finalUnit = editFormData.unit === 'other' ? editFormData.customUnit.trim() : editFormData.unit;

    editPurchase(editingPurchase.id, {
      date: editFormData.date,
      code: editFormData.code.trim(),
      productName: editFormData.productName.trim(),
      unit: finalUnit,
      quantity: Number(editFormData.quantity),
      price: Number(editFormData.price),
      category: editFormData.category.trim() || 'General',
    });

    setEditingPurchase(null);
  };

  const formatUnit = (unit: string) => {
    const translated = t(language, `unit_${unit}`);
    return translated === `unit_${unit}` ? unit : translated;
  };

  const getProductInfo = (productId: string) => {
    const p = products.find(prod => prod.id === productId);
    return {
      name: p?.name || 'Unknown',
      unit: p?.unit || '',
      code: p?.code || '',
      category: p?.category || 'General'
    };
  };

  const openEditModal = (e: React.MouseEvent, purchase: Purchase) => {
    e.stopPropagation();
    const info = getProductInfo(purchase.productId);
    setEditingPurchase(purchase);
    const isStandardUnit = ['kg', 'liter', 'piece', 'pack'].includes(info.unit);
    
    setEditFormData({
      date: purchase.date,
      code: info.code || '',
      productName: info.name,
      unit: isStandardUnit ? info.unit : 'other',
      customUnit: isStandardUnit ? '' : info.unit,
      quantity: purchase.quantity.toString(),
      price: purchase.price.toString(),
      category: info.category,
    });
  };

  const handleExport = () => {
    let rowIndex = 1;
    const sortedPurchases = [...purchases].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    const dataToExport = sortedPurchases.map(p => {
      const info = getProductInfo(p.productId);
      return {
        [t(language, 'date')]: p.date,
        '#': rowIndex++,
        [t(language, 'code')]: info.code || '',
        [t(language, 'productName')]: info.name,
        [t(language, 'unit')]: formatUnit(info.unit),
        [t(language, 'quantity')]: p.quantity,
        [t(language, 'price')]: p.price,
        [t(language, 'total')]: p.total,
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, t(language, 'purchases'));
    XLSX.writeFile(workbook, `Purchases_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        
        const data = XLSX.utils.sheet_to_json<any[]>(ws, { header: 1 });

        const bulkData: any[] = [];

        for (let i = 0; i < data.length; i++) {
          const row = data[i];
          if (!row || row.length < 5) continue;

          const codeRaw = row[0];
          const nameRaw = row[1];
          const unitRaw = row[2];
          const qtyRaw = row[3];
          const priceRaw = row[4];

          const qty = parseFloat(qtyRaw);
          const price = parseFloat(priceRaw);

          if (isNaN(qty) || isNaN(price) || !nameRaw) continue; 

          const parsedUnit = (unitRaw || 'kg').toString().trim();
          const lowerUnit = parsedUnit.toLowerCase();
          const unitMapper: Record<string, string> = {
            'კგ': 'kg', 'ლიტრი': 'liter', 'ცალი': 'piece', 'შეკვრა': 'pack', 'სხვა': 'other',
          };
          const unit = unitMapper[lowerUnit] || parsedUnit;

          bulkData.push({
            date: importDate,
            code: (codeRaw || '').toString().trim(),
            productName: nameRaw.toString().trim(),
            unit: unit,
            quantity: qty,
            price: price,
            category: 'General'
          });
        }

        if (bulkData.length > 0) {
          bulkAddPurchases(bulkData);
          setAlertMessage(t(language, 'importSuccess', { count: bulkData.length }));
        } else {
          setAlertMessage(t(language, 'importEmpty'));
        }
      } catch (error) {
        console.error("Error parsing Excel:", error);
        setAlertMessage(t(language, 'importError'));
      }
    };
    reader.readAsBinaryString(file);
    e.target.value = ''; 
  };

  const toggleDate = (date: string) => {
    setExpandedDates(prev => ({ ...prev, [date]: !prev[date] }));
  };

  const groupedPurchases = useMemo(() => {
    const groups: Record<string, Purchase[]> = {};
    const sortedPurchases = [...purchases].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    sortedPurchases.forEach(p => {
      if (!groups[p.date]) groups[p.date] = [];
      groups[p.date].push(p);
    });
    return groups;
  }, [purchases]);

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto w-full space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 tracking-tight">{t(language, 'purchases')}</h2>
          <p className="text-sm text-gray-500 mt-1">{t(language, 'purchasesDesc')}</p>
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
        
        {/* Left Column: Import & Manual Forms */}
        <div className="lg:col-span-1 flex flex-col gap-6">
          
          {/* Import Section */}
          <div className="bg-brand-50 p-6 rounded-2xl shadow-sm border border-brand-200">
            <h3 className="text-lg font-bold text-brand-900 mb-4 flex items-center">
              <FileSpreadsheet className="w-5 h-5 mr-2 text-brand-600" />
              {t(language, 'importSection')}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-brand-800 mb-1.5">{t(language, 'importDate')}</label>
                <input
                  type="date"
                  value={importDate}
                  onChange={(e) => setImportDate(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-brand-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 sm:text-sm"
                />
              </div>
              
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleImportFile} 
                accept=".xlsx, .xls" 
                className="hidden" 
              />
              <button
                onClick={handleImportClick}
                className="w-full flex justify-center items-center px-4 py-2.5 bg-brand-600 text-white rounded-xl text-sm font-bold hover:bg-brand-700 transition-all shadow-sm active:scale-95"
              >
                <Upload className="w-4 h-4 mr-2" />
                {t(language, 'selectFileImport')}
              </button>
              <p className="text-xs text-brand-700/80 leading-tight">
                {t(language, 'importMappingHint')}
              </p>
            </div>
          </div>

          {/* Manual Form Section */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
            <h3 className="text-lg font-bold text-gray-900 mb-5 flex items-center pb-3 border-b border-gray-100">
              <Plus className="w-5 h-5 text-gray-500 mr-2" />
              {t(language, 'manualEntry')}
            </h3>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">{t(language, 'date')}</label>
                  <input
                    type="date"
                    name="date"
                    required
                    value={formData.date}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-brand-500 sm:text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">{t(language, 'code')}</label>
                  <input
                    type="text"
                    name="code"
                    placeholder="e.g. 001"
                    value={formData.code}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-brand-500 sm:text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">{t(language, 'productName')}</label>
                <input
                  type="text"
                  name="productName"
                  required
                  placeholder="e.g. Tomato"
                  value={formData.productName}
                  onChange={handleInputChange}
                  list="products-list"
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-brand-500 sm:text-sm"
                />
                <datalist id="products-list">
                  {products.map(p => <option key={p.id} value={p.name} />)}
                </datalist>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 sm:col-span-1 flex flex-col space-y-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-0.5">{t(language, 'unit')}</label>
                  <select
                    name="unit"
                    value={formData.unit}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-brand-500 sm:text-sm"
                  >
                    <option value="kg">{t(language, 'unit_kg')}</option>
                    <option value="liter">{t(language, 'unit_liter')}</option>
                    <option value="piece">{t(language, 'unit_piece')}</option>
                    <option value="pack">{t(language, 'unit_pack')}</option>
                    <option value="other">{t(language, 'unit_other')}</option>
                  </select>
                  {formData.unit === 'other' && (
                    <input
                      type="text"
                      name="customUnit"
                      value={formData.customUnit}
                      onChange={handleInputChange}
                      placeholder={t(language, 'customUnitPlaceholder')}
                      required
                      className="w-full px-3 py-2 bg-gray-50 border border-brand-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-brand-500 sm:text-sm"
                    />
                  )}
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">{t(language, 'category')}</label>
                  <input
                    type="text"
                    name="category"
                    required
                    value={formData.category}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-brand-500 sm:text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">{t(language, 'quantity')}</label>
                  <input
                    type="number"
                    name="quantity"
                    min="0"
                    step="0.01"
                    required
                    value={formData.quantity}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-brand-500 sm:text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">{t(language, 'price')} (Unit)</label>
                  <input
                    type="number"
                    name="price"
                    min="0"
                    step="0.01"
                    required
                    value={formData.price}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-brand-500 sm:text-sm"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full mt-2 py-2.5 px-4 rounded-xl shadow-sm text-sm font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-200 transition-all active:scale-[0.98]"
              >
                {t(language, 'save')}
              </button>
            </form>
          </div>
        </div>

        {/* Right Column: Spreadsheet Archive Section */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden h-full">
            <div className="p-5 border-b border-gray-100 flex items-center bg-white sticky top-0 z-10">
              <div className="bg-slate-100 p-2 rounded-lg mr-3">
                <Receipt className="w-5 h-5 text-slate-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">{t(language, 'purchaseArchive')}</h3>
            </div>
            
            <div className="divide-y divide-gray-100 bg-slate-50 p-4">
              {Object.keys(groupedPurchases).length === 0 ? (
                <div className="p-12 text-center flex flex-col items-center justify-center bg-white rounded-xl border border-gray-200">
                  <div className="bg-gray-50 p-4 rounded-full mb-4">
                    <PackageOpen className="w-8 h-8 text-gray-400" />
                  </div>
                  <h4 className="text-gray-900 font-medium">{t(language, 'noPurchases')}</h4>
                  <p className="text-sm text-gray-500 mt-1">{t(language, 'startAddingPurchases')}</p>
                </div>
              ) : (
                (Object.entries(groupedPurchases) as [string, Purchase[]][]).map(([date, datePurchases]) => {
                  const isExpanded = expandedDates[date] !== false;
                  const dailyTotal = datePurchases.reduce((sum, p) => sum + p.total, 0);

                  return (
                    <div key={date} className="bg-white border border-gray-300 mb-4 rounded shadow-sm overflow-hidden">
                      <button
                        onClick={() => toggleDate(date)}
                        className="w-full px-4 py-2 flex items-center justify-between bg-slate-200 hover:bg-slate-300 transition-colors focus:outline-none border-b border-gray-300"
                      >
                        <div className="flex items-center space-x-3">
                          {isExpanded ? (
                            <ChevronDown className="w-4 h-4 text-slate-700" />
                          ) : (
                            <ChevronRight className="w-4 h-4 text-slate-700" />
                          )}
                          <span className="font-bold text-slate-800 text-sm">{date}</span>
                        </div>
                        <span className="font-bold text-slate-900 text-sm">{formatCurrency(dailyTotal)}</span>
                      </button>

                      {isExpanded && (
                        <div className="overflow-x-auto">
                          {/* Dense Accounting Spreadsheet Table */}
                          <table className="min-w-full border-collapse text-xs text-left font-mono">
                            <thead className="bg-slate-100 text-slate-700">
                              <tr>
                                <th className="border border-slate-300 px-2 py-1.5 w-8 text-center">#</th>
                                <th className="border border-slate-300 px-2 py-1.5 uppercase tracking-wide">{t(language, 'code')}</th>
                                <th className="border border-slate-300 px-2 py-1.5 uppercase tracking-wide">{t(language, 'productName')}</th>
                                <th className="border border-slate-300 px-2 py-1.5 text-center uppercase tracking-wide">{t(language, 'unit')}</th>
                                <th className="border border-slate-300 px-2 py-1.5 text-right uppercase tracking-wide">{t(language, 'quantity')}</th>
                                <th className="border border-slate-300 px-2 py-1.5 text-right uppercase tracking-wide">{t(language, 'price')}</th>
                                <th className="border border-slate-300 px-2 py-1.5 text-right uppercase tracking-wide bg-slate-200/50">{t(language, 'total')}</th>
                                <th className="border border-slate-300 px-2 py-1.5 text-center w-[80px] uppercase tracking-wide">{t(language, 'actionsShort')}</th>
                              </tr>
                            </thead>
                            <tbody className="bg-white">
                              {datePurchases.map((purchase, index) => {
                                const info = getProductInfo(purchase.productId);
                                return (
                                  <tr key={purchase.id} className="hover:bg-blue-50/50 transition-colors">
                                    <td className="border border-slate-200 px-2 py-1 text-center text-slate-400">{index + 1}</td>
                                    <td className="border border-slate-200 px-2 py-1 font-semibold text-slate-700">{info.code || '-'}</td>
                                    <td className="border border-slate-200 px-2 py-1 font-sans font-medium text-slate-900 truncate max-w-[150px]">{info.name}</td>
                                    <td className="border border-slate-200 px-2 py-1 text-center text-slate-500 font-sans">{formatUnit(info.unit)}</td>
                                    <td className="border border-slate-200 px-2 py-1 text-right text-slate-700">{purchase.quantity}</td>
                                    <td className="border border-slate-200 px-2 py-1 text-right text-slate-700">{formatCurrency(purchase.price)}</td>
                                    <td className="border border-slate-200 px-2 py-1 text-right font-bold text-slate-900 bg-slate-50/50">{formatCurrency(purchase.total)}</td>
                                    <td className="border border-slate-200 px-1 py-1 text-center">
                                      <div className="flex gap-2 justify-center items-center">
                                        <button 
                                          onClick={(e) => openEditModal(e, purchase)}
                                          className="text-blue-500 hover:text-blue-700 p-1 rounded transition-colors"
                                          title={t(language, 'edit')}
                                        >
                                          <Edit2 className="w-3.5 h-3.5 mx-auto" />
                                        </button>
                                        <button 
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setItemToDelete(purchase.id);
                                          }}
                                          className="text-red-500 hover:text-red-700 p-1 rounded transition-colors"
                                          title={t(language, 'delete')}
                                        >
                                          <Trash2 className="w-3.5 h-3.5 mx-auto" />
                                        </button>
                                      </div>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
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

      {/* Edit Purchase Modal */}
      {editingPurchase && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg flex flex-col transform transition-all">
            <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-900 flex items-center">
                <Edit2 className="w-5 h-5 mr-2 text-blue-600" />
                {t(language, 'edit')}
              </h3>
              <button onClick={() => setEditingPurchase(null)} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">
              <form onSubmit={handleEditSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
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
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">{t(language, 'code')}</label>
                    <input
                      type="text"
                      name="code"
                      placeholder="e.g. 001"
                      value={editFormData.code}
                      onChange={handleEditInputChange}
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-brand-500 sm:text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">{t(language, 'productName')}</label>
                  <input
                    type="text"
                    name="productName"
                    required
                    value={editFormData.productName}
                    onChange={handleEditInputChange}
                    list="edit-products-list"
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-brand-500 sm:text-sm"
                  />
                  <datalist id="edit-products-list">
                    {products.map(p => <option key={p.id} value={p.name} />)}
                  </datalist>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col space-y-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-0.5">{t(language, 'unit')}</label>
                    <select
                      name="unit"
                      value={editFormData.unit}
                      onChange={handleEditInputChange}
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-brand-500 sm:text-sm"
                    >
                      <option value="kg">{t(language, 'unit_kg')}</option>
                      <option value="liter">{t(language, 'unit_liter')}</option>
                      <option value="piece">{t(language, 'unit_piece')}</option>
                      <option value="pack">{t(language, 'unit_pack')}</option>
                      <option value="other">{t(language, 'unit_other')}</option>
                    </select>
                    {editFormData.unit === 'other' && (
                      <input
                        type="text"
                        name="customUnit"
                        value={editFormData.customUnit}
                        onChange={handleEditInputChange}
                        placeholder={t(language, 'customUnitPlaceholder')}
                        required
                        className="w-full px-3 py-2 bg-gray-50 border border-brand-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-brand-500 sm:text-sm"
                      />
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">{t(language, 'category')}</label>
                    <input
                      type="text"
                      name="category"
                      required
                      value={editFormData.category}
                      onChange={handleEditInputChange}
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-brand-500 sm:text-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">{t(language, 'quantity')}</label>
                    <input
                      type="number"
                      name="quantity"
                      min="0"
                      step="0.01"
                      required
                      value={editFormData.quantity}
                      onChange={handleEditInputChange}
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-brand-500 sm:text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">{t(language, 'price')} (Unit)</label>
                    <input
                      type="number"
                      name="price"
                      min="0"
                      step="0.01"
                      required
                      value={editFormData.price}
                      onChange={handleEditInputChange}
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-brand-500 sm:text-sm"
                    />
                  </div>
                </div>
                
                <div className="flex space-x-3 pt-4 border-t border-gray-100 mt-6">
                  <button
                    type="button"
                    onClick={() => setEditingPurchase(null)}
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
              <button onClick={() => { deletePurchase(itemToDelete); setItemToDelete(null); }} className="flex-1 px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 font-bold">{t(language, 'delete')}</button>
            </div>
          </div>
        </div>
      )}

      {/* Alert Modal */}
      {alertMessage && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 transform transition-all text-center">
            <h3 className="text-lg font-bold text-gray-900 mb-2">შეტყობინება / Notification</h3>
            <p className="text-sm text-gray-600 mb-6">{alertMessage}</p>
            <button onClick={() => setAlertMessage(null)} className="w-full px-4 py-2 bg-brand-600 text-white rounded-xl hover:bg-brand-700 font-bold">OK</button>
          </div>
        </div>
      )}
    </div>
  );
};