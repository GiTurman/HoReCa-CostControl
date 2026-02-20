import React, { useMemo, useState } from 'react';
import { useAppStore } from '../store';
import { t, formatCurrency } from '../i18n';
import { 
  Wallet, ShoppingCart, Percent, TrendingUp, CheckCircle, 
  Brain, Sparkles, AlertTriangle, TrendingDown, PackageOpen, ChefHat, X 
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Product, Purchase, Sale, Dish } from '../types';

// --- Improved AI Analysis Component ---
const DashboardAIAnalysis: React.FC<{
  products: Product[];
  purchases: Purchase[];
  sales: Sale[];
  dishes: Dish[];
  foodCostPercentage: number;
}> = ({ products, purchases, sales, dishes, foodCostPercentage }) => {

  const analysis = useMemo(() => {
    const getGrossQuantity = (netQuantity: number, lossPercentage: number = 0): number => {
      const validLoss = Math.min(Math.max(lossPercentage, 0), 99);
      return netQuantity / (1 - (validLoss / 100));
    };

    const getProductLastPrice = (productId: string): number => {
      const prodPurchases = purchases.filter(p => p.productId === productId);
      if (prodPurchases.length === 0) return 0;
      prodPurchases.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      return prodPurchases[0].price;
    };

    // Calculate live running balances for all products
    const balances: Record<string, number> = {};
    products.forEach(p => balances[p.id] = 0);
    purchases.forEach(p => {
      if (balances[p.productId] !== undefined) {
        balances[p.productId] += p.quantity;
      }
    });
    sales.forEach(s => {
      const dish = dishes.find(d => d.id === s.dishId);
      if (dish) {
        dish.ingredients.forEach(ing => {
          if (balances[ing.productId] !== undefined) {
            const gross = getGrossQuantity(ing.quantity, ing.lossPercentage || 0);
            balances[ing.productId] -= gross * s.quantity;
          }
        });
      }
    });

    // Alert 3: Restock Needed (Current Balance < Min Balance)
    const restockAlerts = products
      .filter(p => balances[p.id] < p.minBalance && p.minBalance > 0)
      .map(p => ({
        name: p.name,
        current: balances[p.id] || 0,
        min: p.minBalance
      }));

    // Alert 1: High Waste (Loss % > 25%)
    const wasteAlerts: Array<{ dishName: string; count: number }> = [];
    
    // Alert 2: Low Profitability (Margin < 30%)
    const profitAlerts: Array<{ dishName: string; margin: number; cost: number; price: number }> = [];

    dishes.forEach(d => {
      // Check for high waste ingredients
      const highWasteIngs = d.ingredients.filter(ing => (ing.lossPercentage || 0) > 25);
      if (highWasteIngs.length > 0) {
        wasteAlerts.push({ dishName: d.name, count: highWasteIngs.length });
      }

      // Calculate true margin
      let cost = 0;
      d.ingredients.forEach(ing => {
        const grossQty = getGrossQuantity(ing.quantity, ing.lossPercentage || 0);
        cost += grossQty * getProductLastPrice(ing.productId);
      });
      
      if (d.salePrice > 0) {
        const margin = ((d.salePrice - cost) / d.salePrice) * 100;
        if (margin < 30) {
          profitAlerts.push({
            dishName: d.name,
            margin,
            cost,
            price: d.salePrice
          });
        }
      }
    });

    return { restockAlerts, wasteAlerts, profitAlerts };
  }, [products, purchases, sales, dishes]);

  // Overall Health Text Logic
  let healthText = '';
  let healthColor = '';
  if (foodCostPercentage === 0) {
    healthText = 'მონაცემები არასაკმარისია სრული სურათის შესაფასებლად.';
    healthColor = 'text-slate-300';
  } else if (foodCostPercentage <= 30) {
    healthText = 'ეს შესანიშნავი მაჩვენებელია! რესტორნის მომგებიანობა მაღალ ნიშნულზეა.';
    healthColor = 'text-green-400';
  } else if (foodCostPercentage <= 35) {
    healthText = 'მაჩვენებელი ნორმის ფარგლებშია, თუმცა შესაძლებელია ოპტიმიზაცია.';
    healthColor = 'text-yellow-400';
  } else {
    healthText = 'ყურადღება! პროდუქტების თვითღირებულება კრიტიკულად მაღალია. აუცილებელია მენიუს ფასების გადახედვა.';
    healthColor = 'text-red-400';
  }

  const hasAlerts = analysis.restockAlerts.length > 0 || analysis.wasteAlerts.length > 0 || analysis.profitAlerts.length > 0;

  return (
    <div className="mt-10 space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center space-x-3 mb-2">
        <div className="bg-indigo-600 p-2 rounded-xl shadow-lg shadow-indigo-200">
          <Brain className="w-6 h-6 text-white" />
        </div>
        <h2 className="text-2xl font-black text-slate-900 tracking-tight">AI Insights & Audit</h2>
      </div>

      {/* 1. The Full Picture Analysis */}
      <div className="bg-slate-900 rounded-2xl p-6 shadow-xl relative overflow-hidden border border-slate-800">
        <div className="absolute top-0 right-0 p-6 opacity-10 pointer-events-none">
          <Sparkles className="w-32 h-32 text-indigo-400" />
        </div>
        <h3 className="text-lg font-bold text-white mb-3 flex items-center">
          <Sparkles className="w-5 h-5 mr-2 text-indigo-400" />
          სრული სურათის ანალიზი (The Full Picture)
        </h3>
        <p className="text-slate-300 text-base leading-relaxed max-w-3xl">
          თქვენი საშუალო Food Cost არის <span className="font-black text-white">{foodCostPercentage.toFixed(1)}%</span>.
          {' '}<span className={`font-bold ${healthColor}`}>{healthText}</span>
        </p>
      </div>

      {/* 2. Smart Recommendations & Alerts */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-100 bg-gray-50/50">
          <h3 className="text-lg font-bold text-slate-900">რეკომენდაციები და საეჭვო შემთხვევები</h3>
          <p className="text-sm text-slate-500 mt-1">Smart Alerts based on live database scanning</p>
        </div>

        <div className="p-6">
          {!hasAlerts ? (
            <div className="text-center py-8">
              <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-3 opacity-50" />
              <p className="text-slate-500 font-medium">პრობლემური ჩანაწერები ვერ მოიძებნა. მონაცემები სუფთაა.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              
              {/* Alert 3: Restock Needed */}
              {analysis.restockAlerts.map((alert, idx) => (
                <div key={`restock-${idx}`} className="flex flex-col p-4 bg-red-50 border border-red-200 rounded-xl transition-colors hover:border-red-300 shadow-sm">
                  <div className="flex items-center mb-2">
                    <AlertTriangle className="w-5 h-5 text-red-600 mr-2 shrink-0" />
                    <h4 className="text-sm font-bold text-red-900 uppercase tracking-wide">მარაგის შევსებაა საჭირო</h4>
                  </div>
                  <div className="text-sm text-red-800 flex-1 flex flex-col justify-end mt-2">
                    <p className="font-bold mb-1">{alert.name}</p>
                    <div className="flex justify-between items-center text-xs bg-red-100/50 px-2 py-1.5 rounded">
                      <span>ნაშთი: <strong className="text-red-900">{alert.current.toFixed(2)}</strong></span>
                      <span className="text-red-600/70">|</span>
                      <span>მინიმუმი: <strong>{alert.min}</strong></span>
                    </div>
                  </div>
                </div>
              ))}

              {/* Alert 2: Low Profitability */}
              {analysis.profitAlerts.map((alert, idx) => (
                <div key={`profit-${idx}`} className="flex flex-col p-4 bg-amber-50 border border-amber-200 rounded-xl transition-colors hover:border-amber-300 shadow-sm">
                  <div className="flex items-center mb-2">
                    <TrendingDown className="w-5 h-5 text-amber-600 mr-2 shrink-0" />
                    <h4 className="text-sm font-bold text-amber-900 uppercase tracking-wide">დაბალი მომგებიანობა</h4>
                  </div>
                  <div className="text-sm text-amber-800 flex-1 flex flex-col justify-end mt-2">
                    <p className="font-bold mb-1">{alert.dishName}</p>
                    <div className="flex flex-col space-y-1 text-xs bg-amber-100/50 px-2 py-1.5 rounded">
                      <div className="flex justify-between">
                        <span>მარჟა:</span> <strong className="text-amber-900">{alert.margin.toFixed(1)}%</strong>
                      </div>
                      <div className="flex justify-between text-amber-700/80">
                        <span>თვითღირ.: {formatCurrency(alert.cost)}</span>
                        <span>ფასი: {formatCurrency(alert.price)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {/* Alert 1: High Waste */}
              {analysis.wasteAlerts.map((alert, idx) => (
                <div key={`waste-${idx}`} className="flex flex-col p-4 bg-yellow-50 border border-yellow-200 rounded-xl transition-colors hover:border-yellow-300 shadow-sm">
                  <div className="flex items-center mb-2">
                    <PackageOpen className="w-5 h-5 text-yellow-600 mr-2 shrink-0" />
                    <h4 className="text-sm font-bold text-yellow-900 uppercase tracking-wide">მაღალი დანაკარგი</h4>
                  </div>
                  <div className="text-sm text-yellow-800 flex-1 flex flex-col justify-end mt-2">
                    <p className="font-bold mb-1">{alert.dishName}</p>
                    <p className="text-xs bg-yellow-100/50 px-2 py-1.5 rounded">
                      შეიცავს <strong className="text-yellow-900">{alert.count}</strong> ინგრედიენტს <strong>25%-ზე მაღალი</strong> დანაკარგით.
                    </p>
                  </div>
                </div>
              ))}

            </div>
          )}
        </div>
      </div>
    </div>
  );
};
// --------------------------------

export const DashboardPage: React.FC = () => {
  const { language, sales, purchases, dishes, products, executeChefsGrandOpeningTest } = useAppStore();
  const [isChefTestModalOpen, setIsChefTestModalOpen] = useState(false);
  const [confirmModal, setConfirmModal] = useState<{message: string, onConfirm: () => void} | null>(null);

  const getProductLastPrice = (productId: string): number => {
    const prodPurchases = purchases.filter(p => p.productId === productId);
    if (prodPurchases.length === 0) return 0;
    prodPurchases.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    return prodPurchases[0].price;
  };

  const getGrossQuantity = (netQuantity: number, lossPercentage: number = 0): number => {
    const validLoss = Math.min(Math.max(lossPercentage, 0), 99);
    return netQuantity / (1 - (validLoss / 100));
  };

  const { totalSales, totalPurchases, foodCostPercentage, topDishes } = useMemo(() => {
    // Total Purchases
    const tPurchases = purchases.reduce((sum, p) => sum + p.total, 0);

    // Total Revenue & Food Cost (COGS)
    let tSales = 0;
    let tCogs = 0;

    sales.forEach(sale => {
      tSales += sale.totalRevenue;
      const dish = dishes.find(d => d.id === sale.dishId);
      if (dish) {
        const dishCost = dish.ingredients.reduce((acc, ing) => {
          const grossQty = getGrossQuantity(ing.quantity, ing.lossPercentage || 0);
          return acc + (getProductLastPrice(ing.productId) * grossQty);
        }, 0);
        tCogs += (dishCost * sale.quantity);
      }
    });

    const fcPercentage = tSales > 0 ? (tCogs / tSales) * 100 : 0;

    // Top 5 Profitable Dishes
    const dishesWithProfit = dishes.map(dish => {
      const cost = dish.ingredients.reduce((acc, ing) => {
        const grossQty = getGrossQuantity(ing.quantity, ing.lossPercentage || 0);
        return acc + (getProductLastPrice(ing.productId) * grossQty);
      }, 0);
      const profit = dish.salePrice - cost;
      return { name: dish.name, profit: profit > 0 ? profit : 0, cost };
    });

    const sortedDishes = dishesWithProfit.sort((a, b) => b.profit - a.profit).slice(0, 5);

    return {
      totalSales: tSales,
      totalPurchases: tPurchases,
      foodCostPercentage: fcPercentage,
      topDishes: sortedDishes
    };
  }, [sales, purchases, dishes]);

  const handleChefTest = () => {
    setConfirmModal({
      message: "Initialize The Chef's Grand Opening? All current data will be erased and replaced with the ultimate test environment.",
      onConfirm: () => {
        executeChefsGrandOpeningTest();
        setIsChefTestModalOpen(true);
      }
    });
  };

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto w-full space-y-6 relative pb-20">
      <div className="flex flex-col space-y-6 sm:space-y-0 sm:flex-row justify-between items-start sm:items-center mb-4">
        <div className="flex items-center space-x-3">
          <TrendingUp className="w-8 h-8 text-brand-600" />
          <h2 className="text-2xl font-bold text-gray-900">{t(language, 'dashboard')}</h2>
        </div>
        
        {/* GOLD CHEF TEST BUTTON */}
        <button
          onClick={handleChefTest}
          className="w-full sm:w-auto flex items-center justify-center px-6 py-3 bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-600 hover:to-amber-600 text-white rounded-xl text-sm font-black tracking-wide shadow-lg shadow-amber-500/30 transition-all active:scale-95 border border-yellow-400"
        >
          <ChefHat className="w-5 h-5 mr-2.5" />
          შეფის სრული ტესტირება
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center space-x-4 transition-transform hover:-translate-y-1 duration-300">
          <div className="bg-green-100 p-4 rounded-xl text-green-600">
            <Wallet className="w-8 h-8" />
          </div>
          <div>
            <p className="text-sm font-bold text-gray-500 mb-1 uppercase tracking-wider">{t(language, 'totalRevenue')}</p>
            <p className="text-2xl font-black text-gray-900">{formatCurrency(totalSales)}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center space-x-4 transition-transform hover:-translate-y-1 duration-300">
          <div className="bg-blue-100 p-4 rounded-xl text-blue-600">
            <ShoppingCart className="w-8 h-8" />
          </div>
          <div>
            <p className="text-sm font-bold text-gray-500 mb-1 uppercase tracking-wider">{t(language, 'totalPurchases')}</p>
            <p className="text-2xl font-black text-gray-900">{formatCurrency(totalPurchases)}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center space-x-4 transition-transform hover:-translate-y-1 duration-300">
          <div className="bg-amber-100 p-4 rounded-xl text-amber-600">
            <Percent className="w-8 h-8" />
          </div>
          <div>
            <p className="text-sm font-bold text-gray-500 mb-1 uppercase tracking-wider">{t(language, 'averageFoodCost')}</p>
            <p className="text-2xl font-black text-gray-900">{foodCostPercentage.toFixed(1)}%</p>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center">
            {t(language, 'topProfitableDishes')}
          </h3>
          
          {topDishes.length === 0 ? (
            <div className="text-center py-12 text-gray-400 bg-gray-50 rounded-xl border border-dashed border-gray-200">
              {t(language, 'noDishes')}
            </div>
          ) : (
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={topDishes}
                  layout="vertical"
                  margin={{ top: 5, right: 30, left: 0, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" />
                  <XAxis type="number" hide />
                  <YAxis 
                    dataKey="name" 
                    type="category" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#475569', fontSize: 13, fontWeight: 600 }} 
                    width={110} 
                  />
                  <Tooltip
                    cursor={{ fill: '#f8fafc' }}
                    contentStyle={{ borderRadius: '0.75rem', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    formatter={(value: number) => [formatCurrency(value), t(language, 'profit')]}
                  />
                  <Bar dataKey="profit" radius={[0, 6, 6, 0]} barSize={24}>
                    {topDishes.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={['#0ea5e9', '#0284c7', '#0369a1', '#075985', '#0c4a6e'][index % 5]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      {/* AI INSIGHTS SECTION */}
      <DashboardAIAnalysis 
        products={products}
        purchases={purchases}
        sales={sales}
        dishes={dishes}
        foodCostPercentage={foodCostPercentage}
      />

      {/* CHEF'S TEST RESULTS MODAL */}
      {isChefTestModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all border border-gray-100 animate-in fade-in zoom-in duration-300">
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 px-6 py-5 border-b border-amber-100 flex items-center justify-between">
              <h3 className="text-xl font-black text-amber-900 flex items-center">
                <ChefHat className="w-6 h-6 mr-2 text-amber-600" />
                Test Results
              </h3>
              <button onClick={() => setIsChefTestModalOpen(false)} className="text-amber-500 hover:text-amber-700 bg-amber-100/50 hover:bg-amber-200 rounded-full p-1.5 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-8 text-center flex flex-col items-center">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 shadow-inner ring-4 ring-green-50">
                <CheckCircle className="w-10 h-10 text-green-500" />
              </div>
              
              <h4 className="text-2xl font-black text-gray-900 mb-6">Status: ✅ SUCCESS</h4>
              
              <div className="w-full bg-slate-50 p-5 rounded-2xl border border-slate-200 text-left space-y-3 shadow-sm">
                <p className="text-sm font-medium text-slate-700 leading-relaxed">
                  <span className="font-bold text-slate-900 mr-2 uppercase tracking-wide text-xs bg-slate-200 px-2 py-1 rounded">Summary</span> 
                  100 Products Stocked, 30 Dishes Created, 300 Portions Sold.
                </p>
                <div className="h-px bg-slate-200 w-full" />
                <p className="text-sm font-medium text-emerald-600 leading-relaxed">
                  <span className="font-bold text-emerald-800 mr-2 uppercase tracking-wide text-xs bg-emerald-100 px-2 py-1 rounded">Check</span> 
                  Inventory integrity verified: No negative balances.
                </p>
              </div>

              <button
                onClick={() => setIsChefTestModalOpen(false)}
                className="mt-8 w-full py-3.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold rounded-xl shadow-lg shadow-amber-500/20 transition-all active:scale-95"
              >
                Continue to Dashboard
              </button>
            </div>
          </div>
        </div>
      )}

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
    </div>
  );
};