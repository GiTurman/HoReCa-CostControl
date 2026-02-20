import React, { useMemo, useState } from 'react';
import { useAppStore } from '../store';
import { t, formatCurrency } from '../i18n';
import { 
  BrainCircuit, LineChart as LineChartIcon, ShieldAlert, AlertCircle, PackageOpen, 
  CheckCircle, TrendingUp, TrendingDown, Users, SearchX, ArchiveX, Scale, Download, Search, Filter 
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import * as XLSX from 'xlsx';

export const AiAnalyticsPage: React.FC = () => {
  const { language, products, purchases, sales, dishes, inventoryAudits } = useAppStore();

  // Filters State
  const [priceSearchTerm, setPriceSearchTerm] = useState('');
  const [priceTrendFilter, setPriceTrendFilter] = useState<'all' | 'increase' | 'decrease'>('all');
  const [anomalyTypeFilter, setAnomalyTypeFilter] = useState<'all' | 'critical' | 'warning' | 'info'>('all');

  const CHART_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

  const priceChartDataAndLines = useMemo(() => {
    const topProducts = products
      .map(p => {
        const totalSpend = purchases
          .filter(pur => pur.productId === p.id)
          .reduce((sum, pur) => sum + pur.total, 0);
        return { ...p, totalSpend };
      })
      .filter(p => p.totalSpend > 0)
      .sort((a, b) => b.totalSpend - a.totalSpend)
      .slice(0, 5);

    if (topProducts.length === 0) return { data: [], lines: [] };

    const sortedDates = [...new Set(purchases.map(p => p.date))].sort();

    const data = sortedDates.map(date => {
      const point: any = { date };
      topProducts.forEach(tp => {
        const pur = purchases.find(p => p.productId === tp.id && p.date === date);
        if (pur) {
          point[tp.name] = pur.price;
        }
      });
      return point;
    });

    return { data, lines: topProducts.map(tp => tp.name) };
  }, [products, purchases]);

  const priceStats = useMemo(() => {
    const statsArray: Array<{ id: string; name: string; avgPrice: number; lastPrice: number; diffPercent: number }> = [];

    products.forEach(p => {
      const pPurchases = purchases
        .filter(pur => pur.productId === p.id)
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      
      if (pPurchases.length > 0) {
        const sumPrice = pPurchases.reduce((sum, pur) => sum + pur.price, 0);
        const avgPrice = sumPrice / pPurchases.length;
        const lastPrice = pPurchases[pPurchases.length - 1].price;
        
        let diffPercent = 0;
        if (avgPrice > 0) {
          diffPercent = ((lastPrice - avgPrice) / avgPrice) * 100;
        }

        statsArray.push({
          id: p.id,
          name: p.name,
          avgPrice,
          lastPrice,
          diffPercent
        });
      }
    });

    return statsArray.sort((a, b) => b.diffPercent - a.diffPercent);
  }, [products, purchases]);

  const filteredPriceStats = useMemo(() => {
    return priceStats.filter(stat => {
      const matchesSearch = stat.name.toLowerCase().includes(priceSearchTerm.toLowerCase());
      const matchesTrend = 
        priceTrendFilter === 'all' ? true :
        priceTrendFilter === 'increase' ? stat.diffPercent > 0 :
        priceTrendFilter === 'decrease' ? stat.diffPercent < 0 : true;
      return matchesSearch && matchesTrend;
    });
  }, [priceStats, priceSearchTerm, priceTrendFilter]);

  const anomalies = useMemo(() => {
    const alerts: Array<{ id: string; type: 'warning' | 'critical' | 'info'; title: string; desc: string; icon: any }> = [];

    const getGrossQuantity = (netQuantity: number, lossPercentage: number = 0): number => {
      const validLoss = Math.min(Math.max(lossPercentage, 0), 99);
      return netQuantity / (1 - (validLoss / 100));
    };

    const balances: Record<string, number> = {};
    const consumedMap: Record<string, number> = {};
    products.forEach(p => { balances[p.id] = 0; consumedMap[p.id] = 0; });
    
    purchases.forEach(p => { balances[p.productId] += p.quantity; });
    
    sales.forEach(s => {
      const dish = dishes.find(d => d.id === s.dishId);
      if (dish) {
        dish.ingredients.forEach(ing => {
          const grossQty = getGrossQuantity(ing.quantity, ing.lossPercentage || 0);
          balances[ing.productId] -= (grossQty * s.quantity);
          consumedMap[ing.productId] += (grossQty * s.quantity);
        });
      }
    });

    const firstPurchaseDate = purchases.length > 0 
      ? new Date(Math.min(...purchases.map(p => new Date(p.date).getTime()))) 
      : new Date();
    const daysSinceFirst = Math.max(30, (new Date().getTime() - firstPurchaseDate.getTime()) / (1000 * 3600 * 24));

    if (inventoryAudits.length > 0) {
      const sortedAudits = [...inventoryAudits].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      const latestAudit = sortedAudits[0];
      const prevAudit = sortedAudits[1] || null;

      products.forEach(p => {
        const startingBal = prevAudit && prevAudit.balances[p.id] !== undefined ? prevAudit.balances[p.id] : 0;
        
        const windowPurchases = purchases.filter(pur => pur.productId === p.id && pur.date <= latestAudit.date && (!prevAudit || pur.date > prevAudit.date));
        const purchased = windowPurchases.reduce((sum, pur) => sum + pur.quantity, 0);

        let consumed = 0;
        const windowSales = sales.filter(s => s.date <= latestAudit.date && (!prevAudit || s.date > prevAudit.date));
        windowSales.forEach(s => {
          const dish = dishes.find(d => d.id === s.dishId);
          if (dish) {
            const ing = dish.ingredients.find(i => i.productId === p.id);
            if (ing) {
              consumed += getGrossQuantity(ing.quantity, ing.lossPercentage) * s.quantity;
            }
          }
        });

        const expected = startingBal + purchased - consumed;
        const actual = latestAudit.balances[p.id];

        if (actual !== undefined && expected > 0) {
          const missing = expected - actual;
          const percentMissing = (missing / expected) * 100;
          
          // Anomaly Detection: Actual Stock - Expected Stock > 5% variance
          if (missing > 5 && percentMissing > 5) {
            alerts.push({
              id: `shrinkage-${p.id}`,
              type: 'critical',
              title: t(language, 'shrinkageTitle'),
              desc: t(language, 'shrinkageDesc', { 
                product: p.name, 
                actual: actual.toFixed(2), 
                expected: expected.toFixed(2), 
                missing: missing.toFixed(2) 
              }),
              icon: SearchX
            });
          }
        }
      });
    }

    products.forEach(p => {
      const pPurchases = purchases
        .filter(pur => pur.productId === p.id)
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      const len = pPurchases.length;
      
      if (len >= 2) {
        const lastPrice = pPurchases[len - 1].price;
        const prevPrice = pPurchases[len - 2].price;
        // Adjusted Price Audit threshold: strictly > 10%
        if (prevPrice > 0 && lastPrice > prevPrice * 1.10) {
          const percentIncrease = (((lastPrice - prevPrice) / prevPrice) * 100).toFixed(1);
          alerts.push({
            id: `jump-${p.id}`,
            type: 'critical',
            title: `${p.name} - ${t(language, 'priceJumpTitle')}`,
            desc: t(language, 'priceJumpDesc', { percent: percentIncrease, prev: formatCurrency(prevPrice), curr: formatCurrency(lastPrice) }),
            icon: AlertCircle
          });
        }
      }

      if (len >= 3) {
        const oldestOfLastThreePrice = pPurchases[len - 3].price;
        const newestPrice = pPurchases[len - 1].price;
        if (oldestOfLastThreePrice > 0 && newestPrice > oldestOfLastThreePrice * 1.10) {
           const percentIncrease = (((newestPrice - oldestOfLastThreePrice) / oldestOfLastThreePrice) * 100).toFixed(1);
           alerts.push({
            id: `inflation-${p.id}`,
            type: 'warning',
            title: t(language, 'supplierRecommendation'),
            desc: t(language, 'inflationAlertDesc', { percent: percentIncrease, product: p.name }),
            icon: Users
          });
        }
      }

      const currentStock = balances[p.id] || 0;
      const totalConsumed = consumedMap[p.id] || 0;
      
      if (currentStock >= 5 && totalConsumed === 0) {
        alerts.push({
          id: `dead-${p.id}`,
          type: 'info',
          title: `${p.name} - ${t(language, 'deadStockTitle')}`,
          desc: t(language, 'deadStockDesc', { qty: currentStock.toFixed(2) }),
          icon: PackageOpen
        });
      } else if (totalConsumed > 0) {
        const dailyConsumption = totalConsumed / daysSinceFirst;
        if (currentStock > (dailyConsumption * 90) && currentStock > 10) {
          alerts.push({
            id: `overstock-${p.id}`,
            type: 'warning',
            title: t(language, 'overstockTitle'),
            desc: t(language, 'overstockDesc', { product: p.name, stock: currentStock.toFixed(2) }),
            icon: ArchiveX
          });
        }
      }
    });

    dishes.forEach(dish => {
      dish.ingredients.forEach(ing => {
        const prod = products.find(p => p.id === ing.productId);
        if (prod && (prod.unit === 'piece' || prod.unit === 'pack') && ing.quantity < 0.25) {
          if (!alerts.some(a => a.id === `mismatch-${prod.id}`)) {
             alerts.push({
                id: `mismatch-${prod.id}`,
                type: 'warning',
                title: t(language, 'mismatchTitle'),
                desc: t(language, 'mismatchDesc', { product: prod.name, unit: t(language, `unit_${prod.unit}`) || prod.unit, qty: ing.quantity }),
                icon: Scale
             });
          }
        }
      });
    });

    return alerts;
  }, [products, purchases, sales, dishes, inventoryAudits, language]);

  const filteredAnomalies = useMemo(() => {
    if (anomalyTypeFilter === 'all') return anomalies;
    return anomalies.filter(a => a.type === anomalyTypeFilter);
  }, [anomalies, anomalyTypeFilter]);

  // EXPORT FUNCTIONS
  const handleExportPrices = () => {
    const dataToExport = filteredPriceStats.map(stat => ({
      [t(language, 'productName')]: stat.name,
      [t(language, 'avgPrice')]: Number(stat.avgPrice.toFixed(2)),
      [t(language, 'lastPrice')]: Number(stat.lastPrice.toFixed(2)),
      [t(language, 'trend')]: `${stat.diffPercent > 0 ? '+' : ''}${stat.diffPercent.toFixed(1)}%`
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, t(language, 'priceGainersLosers').substring(0, 31));
    XLSX.writeFile(workbook, `Price_Trends_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const handleExportAnomalies = () => {
    const dataToExport = filteredAnomalies.map(anomaly => ({
      [t(language, 'severity')]: t(language, `filter${anomaly.type.charAt(0).toUpperCase() + anomaly.type.slice(1)}`),
      [t(language, 'productName')]: anomaly.title,
      [t(language, 'description')]: anomaly.desc
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, t(language, 'auditAnomalies').substring(0, 31));
    XLSX.writeFile(workbook, `Audit_Anomalies_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  return (
    <div className="p-4 sm:p-6 max-w-[1400px] mx-auto w-full space-y-6">
      
      {/* Header */}
      <div className="flex items-center space-x-3 mb-6">
        <div className="bg-indigo-100 p-2.5 rounded-xl">
          <BrainCircuit className="w-6 h-6 text-indigo-600" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900 tracking-tight">{t(language, 'aiInsights')}</h2>
          <p className="text-sm text-gray-500 mt-0.5">{t(language, 'aiInsightsDesc')}</p>
        </div>
      </div>

      <div className="flex flex-col space-y-8">
        
        {/* Section 1: Price Trends Chart (Full Width) */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 flex flex-col h-[450px]">
          <div className="p-5 border-b border-gray-100 bg-gray-50/50 flex items-center shrink-0">
            <LineChartIcon className="w-5 h-5 text-gray-500 mr-2" />
            <h3 className="text-lg font-bold text-gray-900">{t(language, 'priceAnalysis')}</h3>
          </div>
          
          <div className="p-6 flex-1 flex flex-col min-h-0">
            <h4 className="text-sm font-semibold text-gray-700 mb-4 text-center">{t(language, 'topProductsChart')}</h4>
            
            {priceChartDataAndLines.lines.length === 0 ? (
              <div className="flex-1 flex items-center justify-center border-2 border-dashed border-gray-200 rounded-xl">
                <p className="text-gray-400 font-medium">{t(language, 'noChartData')}</p>
              </div>
            ) : (
              <div className="flex-1 w-full min-h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={priceChartDataAndLines.data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis 
                      dataKey="date" 
                      tick={{ fill: '#64748b', fontSize: 12 }} 
                      axisLine={false} 
                      tickLine={false}
                      dy={10}
                    />
                    <YAxis 
                      tick={{ fill: '#64748b', fontSize: 12 }} 
                      axisLine={false} 
                      tickLine={false} 
                      tickFormatter={(val) => formatCurrency(val)}
                    />
                    <Tooltip 
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                      labelStyle={{ fontWeight: 'bold', color: '#0f172a', marginBottom: '8px' }}
                    />
                    <Legend wrapperStyle={{ paddingTop: '10px', fontSize: '12px', fontWeight: 500 }} />
                    
                    {priceChartDataAndLines.lines.map((lineName, idx) => (
                      <Line 
                        key={lineName}
                        type="monotone" 
                        dataKey={lineName} 
                        stroke={CHART_COLORS[idx % CHART_COLORS.length]} 
                        strokeWidth={3}
                        dot={{ r: 4, strokeWidth: 2 }}
                        activeDot={{ r: 6 }}
                        connectNulls={true}
                      />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>

        {/* Section 2: Price Gainers & Losers Smart Table (Full Width) */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 flex flex-col">
          <div className="p-5 border-b border-gray-100 bg-gray-50/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center">
              <TrendingUp className="w-5 h-5 text-gray-500 mr-2" />
              <h3 className="text-lg font-bold text-gray-900">{t(language, 'priceGainersLosers')}</h3>
            </div>
            <div className="flex flex-wrap items-center w-full sm:w-auto gap-3">
              <div className="relative flex-grow sm:flex-none">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder={t(language, 'search')}
                  value={priceSearchTerm}
                  onChange={(e) => setPriceSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-brand-500 focus:border-brand-500 transition-shadow"
                />
              </div>
              <div className="relative flex-grow sm:flex-none">
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <select
                  value={priceTrendFilter}
                  onChange={(e) => setPriceTrendFilter(e.target.value as any)}
                  className="w-full pl-9 pr-8 py-2 border border-gray-300 rounded-lg text-sm focus:ring-brand-500 focus:border-brand-500 bg-white appearance-none cursor-pointer"
                >
                  <option value="all">{t(language, 'filterAll')}</option>
                  <option value="increase">{t(language, 'filterIncreased')}</option>
                  <option value="decrease">{t(language, 'filterDecreased')}</option>
                </select>
              </div>
              <button
                onClick={handleExportPrices}
                className="flex items-center justify-center px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors shadow-sm w-full sm:w-auto"
              >
                <Download className="w-4 h-4 mr-2" />
                {t(language, 'exportExcel')}
              </button>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-white">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">{t(language, 'productName')}</th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">{t(language, 'avgPrice')}</th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">{t(language, 'lastPrice')}</th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">{t(language, 'trend')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {filteredPriceStats.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-sm text-gray-500">
                      {t(language, 'noChartData')}
                    </td>
                  </tr>
                ) : (
                  filteredPriceStats.map((stat) => {
                    const isCostIncrease = stat.diffPercent > 0;
                    const isCostDecrease = stat.diffPercent < 0;
                    
                    return (
                      <tr key={stat.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">{stat.name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 text-right">{formatCurrency(stat.avgPrice)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900 text-right">{formatCurrency(stat.lastPrice)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <div className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${isCostIncrease ? 'bg-red-100 text-red-700' : isCostDecrease ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                            {isCostIncrease && <TrendingUp className="w-3.5 h-3.5 mr-1" />}
                            {isCostDecrease && <TrendingDown className="w-3.5 h-3.5 mr-1" />}
                            {!isCostIncrease && !isCostDecrease && <span className="mr-1">-</span>}
                            
                            {Math.abs(stat.diffPercent).toFixed(1)}%
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Section 3: Audit & Anomalies (Full Width with Grid Cards) */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
          <div className="p-5 border-b border-gray-100 bg-gray-50/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center">
              <ShieldAlert className="w-5 h-5 text-gray-500 mr-2" />
              <h3 className="text-lg font-bold text-gray-900">{t(language, 'auditAnomalies')}</h3>
            </div>
            <div className="flex flex-wrap items-center w-full sm:w-auto gap-3">
              <div className="relative flex-grow sm:flex-none">
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <select
                  value={anomalyTypeFilter}
                  onChange={(e) => setAnomalyTypeFilter(e.target.value as any)}
                  className="w-full pl-9 pr-8 py-2 border border-gray-300 rounded-lg text-sm focus:ring-brand-500 focus:border-brand-500 bg-white appearance-none cursor-pointer"
                >
                  <option value="all">{t(language, 'filterAll')}</option>
                  <option value="critical">{t(language, 'filterCritical')}</option>
                  <option value="warning">{t(language, 'filterWarning')}</option>
                  <option value="info">{t(language, 'filterInfo')}</option>
                </select>
              </div>
              <button
                onClick={handleExportAnomalies}
                className="flex items-center justify-center px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors shadow-sm w-full sm:w-auto"
              >
                <Download className="w-4 h-4 mr-2" />
                {t(language, 'exportExcel')}
              </button>
            </div>
          </div>
          
          <div className="p-6 bg-slate-50/30">
            {filteredAnomalies.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="bg-green-50 p-4 rounded-full mb-4">
                  <CheckCircle className="w-10 h-10 text-green-400" />
                </div>
                <p className="text-gray-500 font-medium">{t(language, 'noAnomalies')}</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {filteredAnomalies.map((anomaly) => {
                  const Icon = anomaly.icon;
                  const isCritical = anomaly.type === 'critical';
                  const isWarning = anomaly.type === 'warning';
                  
                  return (
                    <div 
                      key={anomaly.id} 
                      className={`flex flex-col p-4 rounded-xl border ${isCritical ? 'bg-red-50 border-red-200 shadow-sm' : isWarning ? 'bg-amber-50 border-amber-200 shadow-sm' : 'bg-white border-slate-200 shadow-sm'}`}
                    >
                      <div className="flex items-start mb-3">
                        <div className={`p-2 rounded-lg shrink-0 mr-3 ${isCritical ? 'bg-red-100' : isWarning ? 'bg-amber-100' : 'bg-slate-100'}`}>
                          <Icon className={`w-5 h-5 ${isCritical ? 'text-red-600' : isWarning ? 'text-amber-600' : 'text-slate-600'}`} />
                        </div>
                        <h4 className={`text-sm font-bold uppercase tracking-wide mt-1 ${isCritical ? 'text-red-900' : isWarning ? 'text-amber-900' : 'text-slate-900'}`}>
                          {anomaly.title}
                        </h4>
                      </div>
                      <p className={`text-sm leading-relaxed flex-1 ${isCritical ? 'text-red-800' : isWarning ? 'text-amber-800' : 'text-slate-600'}`}>
                        {anomaly.desc}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};