import React, { useState, useMemo, useEffect } from 'react';
import { useAppStore } from '../store';
import { t } from '../i18n';
import { Calendar, Download, Boxes, Save, Search } from 'lucide-react';
import * as XLSX from 'xlsx';

export const InventoryPage: React.FC = () => {
  const { language, products, purchases, sales, dishes, inventoryAudits, saveInventoryAudit } = useAppStore();
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [actualBalances, setActualBalances] = useState<Record<string, string>>({});
  const [alertMessage, setAlertMessage] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const formatUnit = (unit: string) => {
    const translated = t(language, `unit_${unit}`);
    return translated === `unit_${unit}` ? unit : translated;
  };

  const getGrossQuantity = (netQuantity: number, lossPercentage: number = 0): number => {
    const validLoss = Math.min(Math.max(lossPercentage, 0), 99);
    return netQuantity / (1 - (validLoss / 100));
  };

  // Pre-fill actual balances if an audit already exists for the selected date
  useEffect(() => {
    const currentAudit = inventoryAudits.find(a => a.date === selectedDate);
    if (currentAudit) {
      const prefilled = Object.entries(currentAudit.balances).reduce((acc, [k, v]) => {
        acc[k] = String(v);
        return acc;
      }, {} as Record<string, string>);
      setActualBalances(prefilled);
    } else {
      setActualBalances({});
    }
  }, [selectedDate, inventoryAudits]);

  const inventoryData = useMemo(() => {
    // 1. Find the most recent audit strictly BEFORE the selected date
    const prevAudits = inventoryAudits
      .filter(a => a.date < selectedDate)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    const lastAudit = prevAudits.length > 0 ? prevAudits[0] : null;
    const lastAuditDate = lastAudit ? lastAudit.date : null;

    // 2. Filter records only within the current "period" 
    // (after lastAuditDate up to selectedDate)
    const windowPurchases = purchases.filter(p => {
      if (p.date > selectedDate) return false;
      if (lastAuditDate && p.date <= lastAuditDate) return false;
      return true;
    });

    const windowSales = sales.filter(s => {
      if (s.date > selectedDate) return false;
      if (lastAuditDate && s.date <= lastAuditDate) return false;
      return true;
    });

    // 3. Sum purchases for the period
    const purchasedMap: Record<string, number> = {};
    windowPurchases.forEach(p => {
      purchasedMap[p.productId] = (purchasedMap[p.productId] || 0) + p.quantity;
    });

    // 4. Sum consumption for the period (Sales * Dish Ingredients Gross)
    const consumedMap: Record<string, number> = {};
    windowSales.forEach(s => {
      const dish = dishes.find(d => d.id === s.dishId);
      if (dish) {
        dish.ingredients.forEach(ing => {
          const grossQty = getGrossQuantity(ing.quantity, ing.lossPercentage || 0);
          consumedMap[ing.productId] = (consumedMap[ing.productId] || 0) + (grossQty * s.quantity);
        });
      }
    });

    return products.map((prod, index) => {
      // 5. Build the row data
      const startingBalance = lastAudit && lastAudit.balances[prod.id] !== undefined 
        ? lastAudit.balances[prod.id] 
        : 0;
      
      const purchased = purchasedMap[prod.id] || 0;
      const consumed = consumedMap[prod.id] || 0;
      const expectedBalance = startingBalance + purchased - consumed;

      return {
        ...prod,
        index: index + 1,
        startingBalance,
        purchases: purchased,
        consumption: consumed,
        expectedBalance,
      };
    });
  }, [selectedDate, products, purchases, sales, dishes, inventoryAudits]);

  const filteredInventoryData = useMemo(() => {
    if (!searchQuery.trim()) return inventoryData;
    const query = searchQuery.toLowerCase().trim();
    return inventoryData.filter(item => item.name.toLowerCase().includes(query));
  }, [inventoryData, searchQuery]);

  const handleActualChange = (productId: string, value: string) => {
    setActualBalances(prev => ({
      ...prev,
      [productId]: value
    }));
  };

  const handleSaveInventory = () => {
    const balancesToSave: Record<string, number> = {};
    inventoryData.forEach(item => {
      const val = actualBalances[item.id];
      if (val !== undefined && val !== '') {
        balancesToSave[item.id] = Number(val);
      } else {
        // Default to Expected Balance if nothing entered to prevent zeroing out
        balancesToSave[item.id] = item.expectedBalance;
      }
    });

    saveInventoryAudit({ date: selectedDate, balances: balancesToSave });
    
    // Update local inputs to reflect saved defaults
    const updatedInputs = Object.keys(balancesToSave).reduce((acc, k) => {
      acc[k] = String(balancesToSave[k]);
      return acc;
    }, {} as Record<string, string>);
    setActualBalances(updatedInputs);

    setAlertMessage(t(language, 'inventorySavedSuccess'));
  };

  const handleExport = () => {
    const dataToExport = inventoryData.map(item => {
      const actualVal = actualBalances[item.id] !== undefined && actualBalances[item.id] !== '' 
        ? Number(actualBalances[item.id]) 
        : item.expectedBalance;
      
      const diff = actualVal - item.expectedBalance;
      
      let statusStr = '';
      if (diff < -0.005) statusStr = t(language, 'deficit');
      else if (diff > 0.005) statusStr = t(language, 'surplus');
      else statusStr = t(language, 'match');

      return {
        '#': item.index,
        [t(language, 'productName')]: item.name,
        [t(language, 'unit')]: formatUnit(item.unit),
        [t(language, 'startingBalance')]: Number(item.startingBalance.toFixed(3)),
        [t(language, 'purchasesColumn')]: Number(item.purchases.toFixed(3)),
        [t(language, 'consumption')]: Number(item.consumption.toFixed(3)),
        [t(language, 'expectedBalance')]: Number(item.expectedBalance.toFixed(3)),
        [t(language, 'actualBalance')]: Number(actualVal.toFixed(3)),
        [t(language, 'difference')]: Number(diff.toFixed(3)),
        [t(language, 'status')]: statusStr,
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, t(language, 'inventory'));
    XLSX.writeFile(workbook, `Inventory_${selectedDate}.xlsx`);
  };

  return (
    <div className="p-4 sm:p-6 max-w-[1400px] mx-auto w-full space-y-6">
      
      {/* Control Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center bg-white p-6 rounded-2xl shadow-sm border border-gray-200 gap-4">
        <div className="flex items-center space-x-4">
          <div className="bg-brand-100 p-3 rounded-xl shrink-0">
            <Boxes className="w-6 h-6 text-brand-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">{t(language, 'inventoryForDate')}</h2>
            <p className="text-sm text-gray-500 mt-0.5">Rolling period calculations based on selected date</p>
          </div>
        </div>
        
        <div className="flex flex-wrap items-center w-full lg:w-auto gap-3">
          <div className="relative flex-grow sm:flex-none">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Calendar className="w-4 h-4 text-gray-400" />
            </div>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-300 rounded-xl text-sm font-medium text-gray-700 focus:bg-white focus:ring-2 focus:ring-brand-500 focus:border-brand-500 shadow-sm transition-colors"
            />
          </div>
          <button
            onClick={handleExport}
            className="flex-1 sm:flex-none flex justify-center items-center px-4 py-2 bg-white border border-gray-300 rounded-xl text-sm font-medium text-gray-700 hover:bg-brand-50 hover:text-brand-700 hover:border-brand-200 transition-all shadow-sm whitespace-nowrap"
          >
            <Download className="w-4 h-4 mr-2" />
            {t(language, 'exportExcel')}
          </button>
          <button
            onClick={handleSaveInventory}
            className="flex-1 sm:flex-none flex justify-center items-center px-6 py-2 bg-brand-600 border border-transparent rounded-xl text-sm font-bold text-white hover:bg-brand-700 transition-all shadow-sm whitespace-nowrap active:scale-95"
          >
            <Save className="w-4 h-4 mr-2" />
            {t(language, 'saveInventory')}
          </button>
        </div>
      </div>

      {/* Search Filter */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <Search className="w-5 h-5 text-gray-400" />
        </div>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={t(language, 'productName') + '...'}
          className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-2xl text-sm font-medium text-gray-700 placeholder-gray-400 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 shadow-sm transition-colors"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        )}
      </div>

      {/* Inventory Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[1000px]">
            <thead className="bg-slate-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-4 text-center text-xs font-bold text-slate-500 w-12 tracking-wider">#</th>
                <th className="px-4 py-4 text-xs font-bold text-slate-500 tracking-wider uppercase">{t(language, 'productName')}</th>
                <th className="px-4 py-4 text-xs font-bold text-slate-500 tracking-wider uppercase">{t(language, 'unit')}</th>
                <th className="px-4 py-4 text-right text-xs font-bold text-slate-500 tracking-wider uppercase">{t(language, 'startingBalance')}</th>
                <th className="px-4 py-4 text-right text-xs font-bold text-blue-600 tracking-wider uppercase">{t(language, 'purchasesColumn')}</th>
                <th className="px-4 py-4 text-right text-xs font-bold text-amber-600 tracking-wider uppercase">{t(language, 'consumption')}</th>
                <th className="px-4 py-4 text-right text-xs font-bold text-slate-800 tracking-wider uppercase bg-slate-100/50">{t(language, 'expectedBalance')}</th>
                <th className="px-4 py-4 text-right text-xs font-bold text-slate-800 tracking-wider uppercase">{t(language, 'actualBalance')}</th>
                <th className="px-4 py-4 text-right text-xs font-bold text-slate-500 tracking-wider uppercase">{t(language, 'difference')}</th>
                <th className="px-4 py-4 text-center text-xs font-bold text-slate-500 tracking-wider uppercase">{t(language, 'status')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredInventoryData.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-6 py-16 text-center">
                     <div className="flex flex-col items-center justify-center text-gray-500">
                      <Boxes className="w-10 h-10 text-gray-300 mb-3" />
                      <span className="text-base font-medium text-gray-700">
                        {searchQuery.trim() ? (language === 'ka' ? 'პროდუქტი ვერ მოიძებნა' : 'No products found') : t(language, 'noProducts')}
                      </span>
                      <p className="text-sm mt-1">
                        {searchQuery.trim() ? (language === 'ka' ? 'სცადეთ სხვა საძიებო სიტყვა' : 'Try a different search term') : 'Add products via Purchases to start tracking inventory.'}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredInventoryData.map((item) => {
                  const actualStr = actualBalances[item.id];
                  const hasActual = actualStr !== undefined && actualStr !== '';
                  const actualVal = hasActual ? Number(actualStr) : item.expectedBalance; // Compare against expected if blank
                  const diff = actualVal - item.expectedBalance;
                  
                  // Use small threshold to handle floating point imprecision
                  const isDeficit = diff < -0.005;
                  const isSurplus = diff > 0.005;
                  const isMatch = !isDeficit && !isSurplus;

                  return (
                    <tr key={item.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-4 py-3 text-center text-sm font-medium text-slate-400">
                        {item.index}
                      </td>
                      <td className="px-4 py-3 text-sm font-bold text-slate-900">
                        {item.name}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-500">
                        <span className="px-2 py-0.5 bg-slate-100 rounded-md border border-slate-200 font-medium">
                          {formatUnit(item.unit)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right text-sm text-slate-500 font-medium">
                        {item.startingBalance.toFixed(3)}
                      </td>
                      <td className="px-4 py-3 text-right text-sm font-bold text-blue-600/80">
                        {item.purchases > 0 ? `+${item.purchases.toFixed(3)}` : '0.000'}
                      </td>
                      <td className="px-4 py-3 text-right text-sm font-bold text-amber-600/80">
                        {item.consumption > 0 ? `-${item.consumption.toFixed(3)}` : '0.000'}
                      </td>
                      <td className="px-4 py-3 text-right text-sm font-black text-slate-800 bg-slate-100/50">
                        {item.expectedBalance.toFixed(3)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <input
                          type="number"
                          step="0.001"
                          placeholder={item.expectedBalance.toFixed(3)}
                          value={actualStr !== undefined ? actualStr : ''}
                          onChange={(e) => handleActualChange(item.id, e.target.value)}
                          className={`w-28 px-2.5 py-1.5 text-right border rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 text-sm font-bold transition-all ${
                            hasActual ? 'bg-white border-slate-300 shadow-sm text-slate-900' : 'bg-transparent border-transparent hover:bg-white hover:border-slate-200 text-slate-400 placeholder-slate-300'
                          }`}
                        />
                      </td>
                      <td className="px-4 py-3 text-right text-sm font-bold">
                        {hasActual || isMatch ? (
                          <span className={isDeficit ? 'text-red-600' : isSurplus ? 'text-green-600' : 'text-slate-400'}>
                            {diff > 0 ? '+' : ''}{diff.toFixed(3)}
                          </span>
                        ) : (
                          <span className="text-slate-300">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {hasActual || isMatch ? (
                          <div className={`inline-flex items-center px-2 py-1 rounded text-[11px] font-bold uppercase tracking-wider ${
                            isDeficit 
                              ? 'bg-red-100 text-red-700 border border-red-200' 
                              : isSurplus 
                                ? 'bg-green-100 text-green-700 border border-green-200' 
                                : 'bg-slate-100 text-slate-500 border border-slate-200'
                          }`}>
                            {isDeficit ? t(language, 'deficit') : isSurplus ? t(language, 'surplus') : t(language, 'match')}
                          </div>
                        ) : (
                          <span className="text-slate-300">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

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