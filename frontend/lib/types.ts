export type Mode = 'b2c' | 'b2b';

export interface Category {
  id: string;
  title: string;
  count: number;
  swatch: string;
  icon: string;
}

export interface Product {
  id: string;
  sku: string;
  title: string;
  sub: string;
  cat: string;
  catLabel: string;
  unit: string;
  unitDetail: string;
  price: number;
  oldPrice: number | null;
  pricePallet: number;
  palletQty: number;
  stock: number;
  stockUnit: string;
  eta: string;
  rating: number;
  reviews: number;
  tag: string | null;
  specs: [string, string][];
}

export interface CartItem {
  id: string;
  qty: number;
  asPallet: boolean;
}

export interface Order {
  id: string;
  date: string;
  status: string;
  statusKind: 'progress' | 'done' | 'pending';
  items: number;
  total: number;
  eta: string | null;
}

export interface Promo {
  id: string;
  title: string;
  sub: string;
  accent: boolean;
}

export interface FilterData {
  thickness: string[];
  density: string[];
  brands: string[];
  flammable: string[];
}

export interface StoreData {
  brand: { name: string; tagline: string; address: string; phone: string };
  categories: Category[];
  products: Product[];
  promos: Promo[];
  orders: Order[];
  cart: CartItem[];
  filters: FilterData;
}
