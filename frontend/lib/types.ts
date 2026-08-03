export type Mode = 'b2c' | 'b2b';

export type ProductTag = 'Хит' | 'Акция' | 'Новинка' | null;
export type ProductUnit = 'шт' | 'кор';
export type CatIcon = 'wool' | 'xps' | 'can' | 'tube' | 'roll' | 'block' | 'sheet' | 'tool';

export interface Category {
  id: string;
  title: string;
  swatch: string;
  icon: string;
  imageUrl: string;
  sortOrder: number;
  productsCount: number;
}

export interface ProductSpec {
  key: string;
  value: string;
}

export interface Product {
  id: string;
  sku: string;
  title: string;
  sub: string;
  categoryId: string;
  catLabel: string;
  swatch: string;
  unit: string;
  unitDetail: string;
  price: number;
  oldPrice: number | null;
  priceBox: number | null;
	  b2bDiscountPercent: number;
  boxQty: number;
  stock: number;
  stockUnit: string;
  eta: string;
  rating: number;
  reviews: number;
  tag: ProductTag;
  imageUrl: string;
  isActive: boolean;
  specs: ProductSpec[];
}

export interface CartItem {
  id: string;
  productId: string;
  qty: number;
  isBox: boolean;
  markdownItemId?: string;
  markdownPrice?: number;
}

export interface MarkdownItem {
  id: string;
  productId: string;
  qty: number;
  price: number;
  reason: string;
  createdAt: string;
}

export interface EnrichedCartItem extends CartItem {
  product: Product;
}

export interface OrderItem {
  id: string;
  productId: string;
  title: string;
  sku: string;
  unit: string;
  price: number;
  qty: number;
  total: number;
}

export interface Order {
  id: string;
  status: string;
  statusKind: 'pending' | 'progress' | 'done' | 'cancelled';
  itemsCount: number;
  total: number;
  eta: string | null;
  contactName: string;
  contactPhone: string;
  address: string;
  deliveryMethod: string;
  paymentMethod: string;
  comment: string;
  company: string;
  items: OrderItem[];
  createdAt: string;
}

export interface User {
  id: string;
  phone: string;
  email: string | null;
  name: string;
  isB2b: boolean;
  isAdmin: boolean;
  company: string | null;
  createdAt: string;
}

export interface Promo {
  id: string;
  title: string;
  sub: string;
  accent: boolean;
}
