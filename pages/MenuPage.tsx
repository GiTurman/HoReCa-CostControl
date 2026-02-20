import React, { useState } from 'react';
import { useAppStore } from '../store';
import { Ingredient, Dish } from '../types';
import { t, formatCurrency } from '../i18n';
import { Plus, Download, X, Trash2, Edit2, UtensilsCrossed, ChefHat } from 'lucide-react';
import * as XLSX from 'xlsx';

export const MenuPage: React.FC = () => {
  const { language, dishes, products, purchases, addDish, editDish, deleteDish } = useAppStore();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDishId, setEditingDishId] = useState<string | null>(null);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const [alertMessage, setAlertMessage] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    category: 'Main Course',
    salePrice: '',
  });
  const [dishIngredients, setDishIngredients] = useState<Ingredient[]>([]);

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

  const calculateCostPrice = (ingredients: Ingredient[]): number => {
    return ingredients.reduce((total, ing) => {
      const grossQty = getGrossQuantity(ing.quantity, ing.lossPercentage || 0);
      return total + (getProductLastPrice(ing.productId) * grossQty);
    }, 0);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const addIngredientRow = () => {
    setDishIngredients([...dishIngredients, { productId: '', quantity: 0, lossPercentage: 0 }]);
  };

  const updateIngredient = (index: number, field: keyof Ingredient, value: string | number) => {
    const newIngredients = [...dishIngredients];
    newIngredients[index] = { ...newIngredients[index], [field]: value };
    setDishIngredients(newIngredients);
  };

  const removeIngredientRow = (index: number) => {
    setDishIngredients(dishIngredients.filter((_, i) => i !== index));
  };

  const openAddDish = () => {
    setEditingDishId(null);
    setFormData({ name: '', category: 'Main Course', salePrice: '' });
    setDishIngredients([]);
    setIsModalOpen(true);
  };

  const openEditDish = (e: React.MouseEvent, dish: Dish) => {
    e.stopPropagation();
    setEditingDishId(dish.id);
    setFormData({
      name: dish.name,
      category: dish.category,
      salePrice: dish.salePrice.toString()
    });
    setDishIngredients(dish.ingredients.map(ing => ({ ...ing })));
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.salePrice || dishIngredients.length === 0) return;

    const validIngredients = dishIngredients.filter(ing => ing.productId && ing.quantity > 0);
    if (validIngredients.length === 0) {
      setAlertMessage("Please add valid ingredients with quantities greater than 0.");
      return;
    }

    const newDish: Dish = {
      id: editingDishId || Math.random().toString(36).substring(2, 11),
      name: formData.name.trim(),
      category: formData.category.trim() || 'General',
      salePrice: Number(formData.salePrice),
      ingredients: validIngredients,
    };

    if (editingDishId) {
      editDish(editingDishId, newDish);
    } else {
      addDish(newDish);
    }

    setFormData({ name: '', category: 'Main Course', salePrice: '' });
    setDishIngredients([]);
    setIsModalOpen(false);
  };

  const handleExport = () => {
    const dataToExport = dishes.map(dish => {
      const costPrice = calculateCostPrice(dish.ingredients);
      const profit = dish.salePrice - costPrice;
      const margin = dish.salePrice > 0 ? ((profit / dish.salePrice) * 100).toFixed(1) + '%' : '0%';
      
      const ingredientsStr = dish.ingredients.map(ing => {
        const prod = products.find(p => p.id === ing.productId);
        const translatedUnit = prod ? t(language, `unit_${prod.unit}`) : '';
        const unitDisplay = translatedUnit === `unit_${prod?.unit}` ? prod?.unit : translatedUnit;
        return `${prod?.name || 'Unknown'} (${ing.quantity} ${unitDisplay}, Loss: ${ing.lossPercentage || 0}%)`;
      }).join(' | ');

      return {
        [t(language, 'dishName')]: dish.name,
        [t(language, 'category')]: dish.category,
        [t(language, 'costPrice')]: costPrice.toFixed(2),
        [t(language, 'salePrice')]: dish.salePrice.toFixed(2),
        [t(language, 'profit')]: profit.toFixed(2),
        [t(language, 'margin')]: margin,
        [t(language, 'ingredients')]: ingredientsStr,
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, t(language, 'menu'));
    XLSX.writeFile(workbook, `Menu_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const getAvailableProducts = (currentIndex: number) => {
    return products.filter(p => 
      !dishIngredients.some((ing, i) => i !== currentIndex && ing.productId === p.id)
    );
  };

  const currentCostPrice = calculateCostPrice(dishIngredients);
  const currentSalePrice = Number(formData.salePrice) || 0;
  const currentProfit = currentSalePrice - currentCostPrice;
  const currentMargin = currentSalePrice > 0 ? (currentProfit / currentSalePrice) * 100 : 0;

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto w-full space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 tracking-tight">{t(language, 'menu')}</h2>
          <p className="text-sm text-gray-500 mt-1">Manage your dishes and food costs</p>
        </div>
        <div className="mt-4 sm:mt-0 flex flex-wrap gap-3 w-full sm:w-auto">
          <button
            onClick={handleExport}
            className="flex-1 sm:flex-none flex items-center justify-center px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors shadow-sm"
          >
            <Download className="w-4 h-4 mr-2" />
            {t(language, 'exportExcel')}
          </button>

          <button
            onClick={openAddDish}
            className="flex-1 sm:flex-none flex items-center justify-center px-4 py-2 bg-brand-600 text-white rounded-lg text-sm font-medium hover:bg-brand-700 transition-all active:scale-95 shadow-sm"
          >
            <Plus className="w-4 h-4 mr-2" />
            {t(language, 'addDish')}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          {/* Dense Table Styling Applied Here */}
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50/80">
              <tr>
                <th className="px-3 py-2.5 text-left font-bold text-gray-500 uppercase tracking-wider">{t(language, 'dishName')}</th>
                <th className="px-3 py-2.5 text-left font-bold text-gray-500 uppercase tracking-wider">{t(language, 'category')}</th>
                <th className="px-3 py-2.5 text-right font-bold text-gray-500 uppercase tracking-wider">{t(language, 'costPrice')}</th>
                <th className="px-3 py-2.5 text-right font-bold text-gray-500 uppercase tracking-wider">{t(language, 'salePrice')}</th>
                <th className="px-3 py-2.5 text-right font-bold text-gray-500 uppercase tracking-wider">{t(language, 'profit')} / {t(language, 'margin')}</th>
                <th className="px-3 py-2.5 text-right font-bold text-gray-500 uppercase tracking-wider">{t(language, 'actions')}</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {dishes.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-3 py-16 text-center">
                    <div className="flex flex-col items-center justify-center space-y-3 text-gray-500">
                      <div className="bg-gray-50 p-4 rounded-full">
                        <UtensilsCrossed className="w-8 h-8 text-gray-400" />
                      </div>
                      <span className="text-base font-medium text-gray-900">{t(language, 'noDishes')}</span>
                      <p className="text-sm text-gray-500">Click "Add Dish" to build your menu and calculate costs.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                dishes.map((dish) => {
                  const cost = calculateCostPrice(dish.ingredients);
                  const profit = dish.salePrice - cost;
                  const margin = dish.salePrice > 0 ? (profit / dish.salePrice) * 100 : 0;

                  return (
                    <tr key={dish.id} className="hover:bg-gray-50/80 transition-colors group">
                      <td className="px-3 py-3 align-top">
                        <div className="font-bold text-gray-900 mb-1">{dish.name}</div>
                        <div className="space-y-1 mt-1">
                          {dish.ingredients.map((ing, idx) => {
                            const prod = products.find(p => p.id === ing.productId);
                            const unitDisplay = prod ? (t(language, `unit_${prod.unit}`) === `unit_${prod.unit}` ? prod.unit : t(language, `unit_${prod.unit}`)) : '';
                            return (
                              <div key={idx} className="text-[11px] text-gray-500 flex items-center bg-white border border-gray-100 rounded px-1.5 py-0.5 w-max">
                                <span className="font-medium text-gray-700 mr-2">{prod?.name || 'Unknown'}:</span>
                                <span>{ing.quantity} {unitDisplay}</span>
                                {ing.lossPercentage ? (
                                  <span className="ml-2 pl-2 border-l border-gray-200 text-amber-600 font-medium">
                                    {t(language, 'lossPercentage')}: {ing.lossPercentage}%
                                  </span>
                                ) : null}
                              </div>
                            );
                          })}
                        </div>
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap text-gray-500 align-top">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200 mt-0.5">
                          {dish.category}
                        </span>
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap text-gray-500 text-right align-top pt-4">
                        {formatCurrency(cost)}
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap font-bold text-gray-900 text-right align-top pt-4">
                        {formatCurrency(dish.salePrice)}
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap text-right align-top pt-4">
                        <div className={`font-bold ${profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {formatCurrency(profit)}
                        </div>
                        <div className={`text-[11px] mt-0.5 ${profit >= 0 ? 'text-green-600/70' : 'text-red-600/70'}`}>
                          {margin.toFixed(1)}%
                        </div>
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap text-right align-top pt-3">
                        <div className="flex gap-2 justify-end items-center opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                          <button
                            onClick={(e) => openEditDish(e, dish)}
                            className="p-1.5 text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                            title={t(language, 'edit')}
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setItemToDelete(dish.id);
                            }}
                            className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                            title={t(language, 'delete')}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
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

      {/* Add/Edit Dish Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col transform transition-all">
            <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between shrink-0 bg-white rounded-t-2xl">
              <h3 className="text-xl font-bold text-gray-900 flex items-center">
                {editingDishId ? (
                  <Edit2 className="w-5 h-5 mr-2 text-blue-600" />
                ) : (
                  <ChefHat className="w-6 h-6 mr-2 text-brand-600" />
                )}
                {editingDishId ? t(language, 'edit') : t(language, 'addDish')}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1 bg-gray-50/30">
              <form id="add-dish-form" onSubmit={handleSubmit} className="space-y-8">
                
                {/* Dish Basic Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">{t(language, 'dishName')}</label>
                    <input
                      type="text"
                      name="name"
                      required
                      placeholder="e.g. Caesar Salad"
                      value={formData.name}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500 sm:text-sm transition-shadow shadow-sm"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">{t(language, 'category')}</label>
                      <input
                        type="text"
                        name="category"
                        required
                        value={formData.category}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500 sm:text-sm transition-shadow shadow-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">{t(language, 'salePrice')}</label>
                      <div className="relative rounded-xl shadow-sm">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <span className="text-gray-500 sm:text-sm font-medium">₾</span>
                        </div>
                        <input
                          type="number"
                          name="salePrice"
                          min="0"
                          step="0.01"
                          required
                          value={formData.salePrice}
                          onChange={handleInputChange}
                          className="w-full pl-8 pr-4 py-2 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500 sm:text-sm transition-shadow shadow-sm"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Ingredients Section */}
                <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                  <div className="flex justify-between items-center mb-5 pb-3 border-b border-gray-100">
                    <div>
                      <h4 className="text-base font-bold text-gray-900">{t(language, 'ingredients')}</h4>
                      <p className="text-xs text-gray-500 mt-1">Set ingredients, their net weight, and standard loss</p>
                    </div>
                    <button
                      type="button"
                      onClick={addIngredientRow}
                      className="flex items-center text-sm px-3 py-1.5 bg-brand-50 text-brand-700 hover:bg-brand-100 rounded-lg font-medium transition-colors"
                    >
                      <Plus className="w-4 h-4 mr-1.5" />
                      {t(language, 'addIngredient')}
                    </button>
                  </div>
                  
                  {dishIngredients.length === 0 ? (
                    <div className="text-sm text-gray-500 p-8 bg-gray-50/50 rounded-xl border border-dashed border-gray-300 text-center flex flex-col items-center">
                      <UtensilsCrossed className="w-6 h-6 text-gray-300 mb-2" />
                      <p>No ingredients added yet.</p>
                      <p className="text-xs mt-1">Cost price cannot be calculated.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {dishIngredients.map((ing, index) => {
                        const selectedProduct = products.find(p => p.id === ing.productId);
                        const unit = selectedProduct ? (t(language, `unit_${selectedProduct.unit}`) === `unit_${selectedProduct.unit}` ? selectedProduct.unit : t(language, `unit_${selectedProduct.unit}`)) : '';
                        
                        const lastPrice = ing.productId ? getProductLastPrice(ing.productId) : 0;
                        const grossQty = getGrossQuantity(ing.quantity, ing.lossPercentage || 0);
                        const rowCost = lastPrice * grossQty;

                        return (
                          <div key={index} className="flex flex-wrap lg:flex-nowrap items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100 group hover:border-slate-300 transition-colors">
                            <div className="flex-1 min-w-[180px]">
                              <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">{t(language, 'productName')}</label>
                              <select
                                required
                                value={ing.productId}
                                onChange={(e) => updateIngredient(index, 'productId', e.target.value)}
                                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 sm:text-sm shadow-sm"
                              >
                                <option value="" disabled>{t(language, 'selectIngredient')}</option>
                                {getAvailableProducts(index).map(p => (
                                  <option key={p.id} value={p.id}>{p.name}</option>
                                ))}
                                {selectedProduct && (
                                  <option value={selectedProduct.id} className="hidden">{selectedProduct.name}</option>
                                )}
                              </select>
                            </div>

                            <div className="w-28 shrink-0">
                              <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider truncate" title={t(language, 'netWeight')}>{t(language, 'netWeight')}</label>
                              <div className="relative">
                                <input
                                  type="number"
                                  min="0.001"
                                  step="0.001"
                                  required
                                  value={ing.quantity || ''}
                                  onChange={(e) => updateIngredient(index, 'quantity', Number(e.target.value))}
                                  className="w-full pl-3 pr-8 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 sm:text-sm shadow-sm"
                                  placeholder="0.00"
                                />
                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-gray-400 font-bold uppercase">
                                  {unit || '-'}
                                </span>
                              </div>
                            </div>

                            <div className="w-24 shrink-0">
                              <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider truncate" title={t(language, 'lossPercentage')}>{t(language, 'lossPercentage')}</label>
                              <div className="relative">
                                <input
                                  type="number"
                                  min="0"
                                  max="99"
                                  step="0.1"
                                  value={ing.lossPercentage || ''}
                                  onChange={(e) => updateIngredient(index, 'lossPercentage', Number(e.target.value))}
                                  className="w-full pl-3 pr-6 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 sm:text-sm shadow-sm"
                                  placeholder="0"
                                />
                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-amber-500 font-bold">
                                  %
                                </span>
                              </div>
                            </div>

                            <div className="w-24 shrink-0 text-right pr-2">
                              <div className="text-xs font-semibold text-slate-400 mb-1 uppercase tracking-wider">Est. Cost</div>
                              <div className="text-sm font-bold text-gray-900">{formatCurrency(rowCost)}</div>
                            </div>
                            
                            <button
                              type="button"
                              onClick={() => removeIngredientRow(index)}
                              className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors mt-5 lg:mt-0"
                              title={t(language, 'remove')}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

              </form>
            </div>
            
            {/* Calculation Summary Footer */}
            <div className="bg-slate-900 px-6 py-5 rounded-b-2xl flex flex-col sm:flex-row justify-between items-center shrink-0">
              <div className="flex space-x-8 mb-4 sm:mb-0">
                <div>
                  <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider block mb-1">{t(language, 'costPrice')}</span>
                  <span className="text-xl font-bold text-white">{formatCurrency(currentCostPrice)}</span>
                </div>
                <div>
                  <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider block mb-1">{t(language, 'profit')} / {t(language, 'margin')}</span>
                  <div className="flex items-baseline space-x-2">
                    <span className={`text-xl font-bold ${currentProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {formatCurrency(currentProfit)}
                    </span>
                    <span className={`text-sm font-medium ${currentProfit >= 0 ? 'text-green-400/70' : 'text-red-400/70'}`}>
                      ({currentMargin.toFixed(1)}%)
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex space-x-3 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 sm:flex-none px-5 py-2.5 border border-slate-700 rounded-xl text-sm font-bold text-slate-300 hover:bg-slate-800 hover:text-white transition-colors focus:outline-none"
                >
                  {t(language, 'cancel')}
                </button>
                <button
                  type="submit"
                  form="add-dish-form"
                  className={`flex-1 sm:flex-none px-5 py-2.5 rounded-xl shadow-lg text-sm font-bold text-white transition-all active:scale-95 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 ${
                    editingDishId 
                      ? 'bg-blue-600 hover:bg-blue-500 focus:ring-blue-500' 
                      : 'bg-brand-600 hover:bg-brand-500 focus:ring-brand-500'
                  }`}
                >
                  {t(language, 'save')}
                </button>
              </div>
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
              <button onClick={() => { deleteDish(itemToDelete); setItemToDelete(null); }} className="flex-1 px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 font-bold">{t(language, 'delete')}</button>
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