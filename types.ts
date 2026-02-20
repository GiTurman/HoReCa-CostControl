export type Language = 'ka' | 'en';

export type Unit = string;

export interface Product {
  id: string;
  code?: string;
  name: string;
  unit: string;
  category: string;
  minBalance: number;
}

export interface Purchase {
  id: string;
  date: string;
  productId: string;
  quantity: number;
  price: number;
  total: number;
}

export interface Ingredient {
  productId: string;
  quantity: number;
  lossPercentage?: number;
}

export interface Dish {
  id: string;
  name: string;
  category: string;
  ingredients: Ingredient[];
  salePrice: number;
}

export interface Sale {
  id: string;
  date: string;
  dishId: string;
  quantity: number;
  totalRevenue: number;
}

export interface InventoryAudit {
  id: string;
  date: string;
  balances: Record<string, number>;
}

export interface ActivityLog {
  id: string;
  timestamp: string;
  action: string;
  details: string;
  user: string;
}
