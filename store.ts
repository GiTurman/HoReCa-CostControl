import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Product, Purchase, Sale, Dish, Language, InventoryAudit, Ingredient, ActivityLog } from './types';

interface AppState {
  language: Language;
  username: string;
  password: string;
  isAuthenticated: boolean;
  isFirstLogin: boolean;
  products: Product[];
  purchases: Purchase[];
  sales: Sale[];
  dishes: Dish[];
  inventoryAudits: InventoryAudit[];
  activityLogs: ActivityLog[];
  setLanguage: (lang: Language) => void;
  login: (inputPassword: string) => boolean;
  logout: () => void;
  changePassword: (newPassword: string) => void;
  updatePassword: (current: string, newPass: string) => boolean;
  addLog: (action: string, details: string) => void;
  clearLogs: () => void;
  updateProductMinBalance: (id: string, minBalance: number) => void;
  addPurchase: (purchase: Omit<Purchase, 'id' | 'total' | 'productId'> & { productName: string, unit: string, category: string, code?: string }) => void;
  editPurchase: (id: string, purchase: Omit<Purchase, 'id' | 'total' | 'productId'> & { productName: string, unit: string, category: string, code?: string }) => void;
  bulkAddPurchases: (purchases: Array<Omit<Purchase, 'id' | 'total' | 'productId'> & { productName: string, unit: string, category: string, code?: string }>) => void;
  deletePurchase: (id: string) => void;
  addSale: (sale: Omit<Sale, 'id' | 'totalRevenue'>) => void;
  editSale: (id: string, sale: Omit<Sale, 'id' | 'totalRevenue'>) => void;
  deleteSale: (id: string) => void;
  addProduct: (product: Product) => void;
  addDish: (dish: Dish) => void;
  editDish: (id: string, dish: Dish) => void;
  deleteDish: (id: string) => void;
  saveInventoryAudit: (audit: Omit<InventoryAudit, 'id'>) => void;
  clearAllData: () => void;
  restoreData: (data: Partial<AppState>) => void;
  executeChefsGrandOpeningTest: () => void;
}

const generateId = () => Math.random().toString(36).substring(2, 11);

// Standard Yield Formula: Net Quantity / (1 - LossPercentage / 100)
const getGrossQuantity = (netQuantity: number, lossPercentage: number = 0): number => {
  const validLoss = Math.min(Math.max(lossPercentage, 0), 99); // Prevent division by zero
  return netQuantity / (1 - (validLoss / 100));
};

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      language: 'ka',
      username: 'Administrator',
      password: '111979',
      isAuthenticated: false,
      isFirstLogin: true,
      products: [],
      purchases: [],
      sales: [],
      dishes: [],
      inventoryAudits: [],
      activityLogs: [],

      setLanguage: (lang) => set({ language: lang }),

      login: (inputPassword) => {
        const state = get();
        if (state.password === inputPassword) {
          set({ isAuthenticated: true });
          get().addLog('User Login', 'Successful authentication');
          return true;
        }
        return false;
      },

      logout: () => {
        set({ isAuthenticated: false });
        get().addLog('User Logout', 'User ended session');
      },

      changePassword: (newPassword) => {
        set({ password: newPassword, isFirstLogin: false });
        get().addLog('Password Changed', 'User updated initial password');
      },

      updatePassword: (current, newPass) => {
        const state = get();
        if (state.password === current) {
          set({ password: newPass, isFirstLogin: false });
          get().addLog('Password Changed', 'User manually updated password');
          return true;
        }
        return false;
      },

      addLog: (action, details) => set((state) => ({
        activityLogs: [
          {
            id: generateId(),
            timestamp: new Date().toISOString(),
            action,
            details,
            user: state.username
          },
          ...state.activityLogs
        ]
      })),

      clearLogs: () => set({ activityLogs: [] }),

      updateProductMinBalance: (id, minBalance) => {
        const product = get().products.find(p => p.id === id);
        set((state) => ({
          products: state.products.map(p => p.id === id ? { ...p, minBalance } : p)
        }));
        get().addLog('Min Balance Updated', `${product?.name || id} set to ${minBalance}`);
      },

      addProduct: (product) => {
        set((state) => ({ products: [...state.products, product] }));
        get().addLog('Product Created', `${product.name} (${product.unit})`);
      },

      addDish: (dish) => {
        set((state) => ({ dishes: [...state.dishes, dish] }));
        get().addLog('Dish Created', dish.name);
      },

      editDish: (id, dish) => {
        set((state) => ({ dishes: state.dishes.map(d => d.id === id ? dish : d) }));
        get().addLog('Dish Edited', dish.name);
      },

      deleteDish: (id) => {
        const dish = get().dishes.find(d => d.id === id);
        set((state) => ({ dishes: state.dishes.filter(d => d.id !== id) }));
        get().addLog('Dish Deleted', dish?.name || id);
      },

      deletePurchase: (id) => {
        const purchase = get().purchases.find(p => p.id === id);
        const product = get().products.find(p => p.id === purchase?.productId);
        set((state) => ({ purchases: state.purchases.filter(p => p.id !== id) }));
        get().addLog('Purchase Deleted', `${product?.name || 'Unknown'} x${purchase?.quantity || 0}`);
      },

      addSale: (saleData) => {
        const state = get();
        const dish = state.dishes.find(d => d.id === saleData.dishId);
        const totalRevenue = dish ? dish.salePrice * saleData.quantity : 0;

        const newSale: Sale = {
          id: generateId(),
          ...saleData,
          totalRevenue,
        };

        set((state) => ({ sales: [...state.sales, newSale] }));
        get().addLog('Sale Added', `${dish?.name || 'Unknown'} x${saleData.quantity}`);
      },

      editSale: (id, saleData) => {
        const dish = get().dishes.find(d => d.id === saleData.dishId);
        const totalRevenue = dish ? dish.salePrice * saleData.quantity : 0;
        
        set((state) => ({
          sales: state.sales.map(s => s.id === id ? { ...s, ...saleData, totalRevenue } : s)
        }));
        get().addLog('Sale Edited', `${dish?.name || 'Unknown'} x${saleData.quantity}`);
      },

      deleteSale: (id) => {
        const sale = get().sales.find(s => s.id === id);
        const dish = get().dishes.find(d => d.id === sale?.dishId);
        set((state) => ({ sales: state.sales.filter(s => s.id !== id) }));
        get().addLog('Sale Deleted', `${dish?.name || 'Unknown'} x${sale?.quantity || 0}`);
      },

      addPurchase: (purchaseData) => {
        const state = get();
        let existingProduct = state.products.find(
          p => p.name.toLowerCase() === purchaseData.productName.toLowerCase()
        );

        let newProducts = [...state.products];
        let productId = existingProduct?.id;

        if (!existingProduct) {
          productId = generateId();
          newProducts.push({
            id: productId,
            code: purchaseData.code,
            name: purchaseData.productName,
            unit: purchaseData.unit,
            category: purchaseData.category,
            minBalance: 0,
          });
        } else if (purchaseData.code && !existingProduct.code) {
          existingProduct.code = purchaseData.code;
        }

        const newPurchase: Purchase = {
          id: generateId(),
          date: purchaseData.date,
          productId: productId!,
          quantity: purchaseData.quantity,
          price: purchaseData.price,
          total: purchaseData.quantity * purchaseData.price,
        };

        set({
          products: newProducts,
          purchases: [...state.purchases, newPurchase],
        });
        
        get().addLog('Purchase Added', `${purchaseData.productName} x${purchaseData.quantity} ${purchaseData.unit}`);
      },

      editPurchase: (id, purchaseData) => {
        const state = get();
        let existingProduct = state.products.find(
          p => p.name.toLowerCase() === purchaseData.productName.toLowerCase()
        );

        let newProducts = [...state.products];
        let productId = existingProduct?.id;

        if (!existingProduct) {
          productId = generateId();
          newProducts.push({
            id: productId,
            code: purchaseData.code,
            name: purchaseData.productName,
            unit: purchaseData.unit,
            category: purchaseData.category,
            minBalance: 0,
          });
        } else if (purchaseData.code && !existingProduct.code) {
          existingProduct.code = purchaseData.code;
        }

        const updatedPurchases = state.purchases.map(p => 
          p.id === id ? {
            ...p,
            date: purchaseData.date,
            productId: productId!,
            quantity: purchaseData.quantity,
            price: purchaseData.price,
            total: purchaseData.quantity * purchaseData.price,
          } : p
        );

        set({
          products: newProducts,
          purchases: updatedPurchases,
        });

        get().addLog('Purchase Edited', `${purchaseData.productName} x${purchaseData.quantity} ${purchaseData.unit}`);
      },

      bulkAddPurchases: (bulkPurchases) => {
        const state = get();
        let newProducts = [...state.products];
        let newPurchases = [...state.purchases];

        bulkPurchases.forEach(purchaseData => {
          let existingProduct = newProducts.find(
            p => p.name.toLowerCase() === purchaseData.productName.toLowerCase()
          );

          let productId = existingProduct?.id;

          if (!existingProduct) {
            productId = generateId();
            newProducts.push({
              id: productId,
              code: purchaseData.code,
              name: purchaseData.productName,
              unit: purchaseData.unit,
              category: purchaseData.category || 'General',
              minBalance: 0,
            });
          } else if (purchaseData.code && !existingProduct.code) {
             existingProduct.code = purchaseData.code;
          }

          newPurchases.push({
            id: generateId(),
            date: purchaseData.date,
            productId: productId!,
            quantity: purchaseData.quantity,
            price: purchaseData.price,
            total: purchaseData.quantity * purchaseData.price,
          });
        });

        set({
          products: newProducts,
          purchases: newPurchases,
        });

        get().addLog('Bulk Import', `${bulkPurchases.length} purchases imported from Excel`);
      },

      saveInventoryAudit: (audit) => {
        const state = get();
        const existingIndex = state.inventoryAudits.findIndex(a => a.date === audit.date);
        const newAudits = [...state.inventoryAudits];
        
        if (existingIndex >= 0) {
          newAudits[existingIndex] = { ...newAudits[existingIndex], balances: audit.balances };
        } else {
          newAudits.push({ id: generateId(), ...audit });
        }
        
        set({ inventoryAudits: newAudits });
        get().addLog('Inventory Saved', `Audit for date ${audit.date}`);
      },

      clearAllData: () => {
        set({
          products: [],
          purchases: [],
          sales: [],
          dishes: [],
          inventoryAudits: [],
          activityLogs: []
        });
        get().addLog('System Wipe', 'All system data was completely wiped');
      },

      // Restores data from a backup JSON payload
      restoreData: (parsedData) => {
        set((state) => ({
          ...state,
          products: parsedData.products || state.products,
          purchases: parsedData.purchases || state.purchases,
          sales: parsedData.sales || state.sales,
          dishes: parsedData.dishes || state.dishes,
          inventoryAudits: parsedData.inventoryAudits || state.inventoryAudits,
          activityLogs: parsedData.activityLogs || state.activityLogs,
        }));
        get().addLog('System Restore', 'Database restored successfully from backup file');
      },

      // THE CHEF'S GRAND OPENING TEST
      executeChefsGrandOpeningTest: () => {
        const today = new Date().toISOString().split('T')[0];

        // Wipe clean first
        set({ products: [], purchases: [], sales: [], dishes: [], inventoryAudits: [], activityLogs: [] });

        // Step 1: 100 High-Quality Ingredients
        const meats = ['Ribeye', 'Tenderloin', 'Lamb Chops', 'Pork Belly', 'Chicken Breast', 'Duck Breast', 'Veal Chop', 'Wagyu Beef', 'Quail', 'Venison'];
        const fish = ['Sea Bass', 'Salmon', 'Tuna', 'Shrimp', 'Scallops', 'Octopus', 'Squid', 'Lobster', 'Crab', 'Caviar'];
        const veg = ['Tomato', 'Cucumber', 'Onion', 'Mushroom', 'Eggplant', 'Zucchini', 'Red Bell Pepper', 'Green Bell Pepper', 'Potato', 'Carrot', 'Broccoli', 'Cauliflower', 'Asparagus', 'Spinach', 'Garlic', 'Cherry Tomato', 'Artichoke', 'Sweet Potato', 'Leek', 'Celery'];
        const herbs = ['Basil', 'Parsley', 'Tarragon', 'Mint', 'Coriander', 'Dill', 'Rosemary', 'Thyme', 'Oregano', 'Lemongrass'];
        const cheese = ['Sulguni', 'Imeretian', 'Gouda', 'Parmesan', 'Roquefort', 'Cheddar', 'Mozzarella', 'Camembert', 'Brie', 'Feta'];
        const spices = ['Saffron', 'Black Pepper', 'Salt', 'Paprika', 'Cumin', 'Turmeric', 'Cinnamon', 'Nutmeg', 'Cardamom', 'Chili Powder'];
        const dry = ['Truffle Oil', 'Olive Oil', 'Butter', 'Cream 18%', 'Milk', 'Eggs', 'Flour', 'Sugar', 'Rice', 'Pasta', 'Honey', 'Balsamic Vinegar', 'Soy Sauce', 'Walnuts', 'Almonds', 'Pine Nuts', 'Lemon', 'Orange', 'Apple', 'Truffles', 'Coffee Beans', 'Vanilla Extract', 'Mustard', 'White Wine', 'Red Wine', 'Chicken Stock', 'Beef Stock', 'Fish Stock', 'Yeast', 'Baking Powder'];

        const rawItems = [
          ...meats.map(n => ({ n, c: 'Meat/Fish', p: Math.floor(Math.random() * 20) + 25 })), // 25-45 GEL
          ...fish.map(n => ({ n, c: 'Meat/Fish', p: Math.floor(Math.random() * 20) + 25 })), // 25-45 GEL
          ...veg.map(n => ({ n, c: 'Produce', p: Math.floor(Math.random() * 8) + 3 })), // 3-10 GEL
          ...herbs.map(n => ({ n, c: 'Produce', p: Math.floor(Math.random() * 10) + 5 })), // 5-15 GEL
          ...cheese.map(n => ({ n, c: 'Dry/Dairy', p: Math.floor(Math.random() * 15) + 15 })), // 15-30 GEL
          ...spices.map(n => ({ n, c: 'Dry/Dairy', p: Math.floor(Math.random() * 45) + 5 })), // 5-50 GEL
          ...dry.map(n => ({ n, c: 'Dry/Dairy', p: Math.floor(Math.random() * 20) + 5 })) // 5-25 GEL
        ];

        const generatedProducts: Product[] = [];
        const generatedPurchases: Purchase[] = [];

        rawItems.forEach((item, idx) => {
          const pId = `PROD-CHEF-${idx}`;
          const u = (item.n === 'Eggs' || item.n === 'Caviar' || item.n === 'Saffron') ? 'pack' : (item.n.includes('Oil') || item.n.includes('Wine') || item.n.includes('Stock') || item.n === 'Milk') ? 'liter' : 'kg';
          
          generatedProducts.push({
            id: pId,
            code: `C${1000 + idx}`,
            name: item.n,
            unit: u,
            category: item.c,
            minBalance: 5
          });

          // Exactly 100 Units of everything
          generatedPurchases.push({
            id: `PUR-CHEF-${idx}`,
            date: today,
            productId: pId,
            quantity: 100,
            price: item.p,
            total: 100 * item.p
          });
        });

        // Step 2: 30 Signature Dishes
        const adjectives = ["Truffle-infused", "Pan-seared", "Roasted", "Confit", "Grilled", "Braised", "Smoked", "Poached", "Caramelized", "Spicy"];
        const nouns = ["Medley", "Delight", "Fusion", "Symphony", "Trio", "Essence", "Plate", "Bowl", "Experience", "Creation"];
        const generatedDishes: Dish[] = [];

        for(let i=0; i<30; i++) {
          const numIngredients = Math.floor(Math.random() * 5) + 4; // 4 to 8
          const shuffledProducts = [...generatedProducts].sort(() => 0.5 - Math.random());
          const selectedProducts = shuffledProducts.slice(0, numIngredients);
          
          const ingredients: Ingredient[] = selectedProducts.map(sp => {
            let loss = 5;
            if (sp.category === 'Meat/Fish') loss = 25;
            if (sp.category === 'Produce') loss = Math.floor(Math.random() * 6) + 15; // 15-20%

            return {
              productId: sp.id,
              quantity: Number((Math.random() * 0.2 + 0.05).toFixed(3)), // 0.05 to 0.25 net weight
              lossPercentage: loss
            }
          });

          const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
          const noun = nouns[Math.floor(Math.random() * nouns.length)];
          const mainIngredient = selectedProducts[0].name;

          generatedDishes.push({
            id: `DISH-CHEF-${i}`,
            name: `${adj} ${mainIngredient} ${noun}`,
            category: 'Chef Signature',
            salePrice: Math.floor(Math.random() * 66) + 15, // 15 to 80 GEL
            ingredients
          });
        }

        // Step 3: Randomized Sales (15 dishes, 20 portions each)
        const generatedSales: Sale[] = [];
        const shuffledDishes = [...generatedDishes].sort(() => 0.5 - Math.random());
        const selectedDishes = shuffledDishes.slice(0, 15);

        selectedDishes.forEach((dish, idx) => {
          generatedSales.push({
            id: `SALE-CHEF-${idx}`,
            date: today,
            dishId: dish.id,
            quantity: 20,
            totalRevenue: 20 * dish.salePrice
          });
        });

        // Final Commit
        set({ 
          products: generatedProducts, 
          purchases: generatedPurchases, 
          dishes: generatedDishes, 
          sales: generatedSales, 
          inventoryAudits: [] 
        });

        get().addLog('System Test', 'Chef Grand Opening data generated successfully');
      },
    }),
    {
      name: 'cost-control-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);