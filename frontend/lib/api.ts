import type { Category, Product, ProductSpec, CartItem, Order, User, CatIcon, ProductTag } from './types';

const BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080';

const swatchMap: Record<string, string> = {};

async function req<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(BASE + path, {
    ...init,
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...init?.headers },
  });
  if (res.status === 204) return undefined as T;
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw Object.assign(new Error(body.error ?? res.statusText), { status: res.status });
  return body as T;
}

// --- Mappers ---

function mapCategory(r: Record<string, any>): Category {
  return {
    id: r.id ?? '',
    title: r.title ?? '',
    swatch: r.swatch ?? '#e8e3d8',
    icon: r.icon ?? '',
    imageUrl: r.image_url ?? '',
    sortOrder: r.sort_order ?? 0,
  };
}

function mapSpec(r: Record<string, any>): ProductSpec {
  return { key: r.key, value: r.value };
}

function mapProduct(r: Record<string, any>): Product {
  return {
    id: r.id ?? '',
    sku: r.sku ?? '',
    title: r.title ?? '',
    sub: r.sub ?? '',
    categoryId: r.category_id ?? '',
    catLabel: r.cat_label ?? '',
    swatch: swatchMap[r.category_id] ?? '#e8e3d8',
    unit: r.unit ?? '',
    unitDetail: r.unit_detail ?? '',
    price: Number(r.price ?? 0),
    oldPrice: r.old_price != null ? Number(r.old_price) : null,
    priceBox: r.price_box != null && r.price_box > 0 ? Number(r.price_box) : null,
    boxQty: r.box_qty ?? 0,
    stock: r.stock ?? 0,
    stockUnit: r.stock_unit ?? '',
    eta: r.eta ?? '',
    rating: Number(r.rating ?? 0),
    reviews: r.reviews ?? 0,
    tag: (r.tag as ProductTag) ?? null,
    imageUrl: r.image_url ?? '',
    specs: (r.specs ?? []).map(mapSpec),
  };
}

function mapCartItem(r: Record<string, any>): CartItem {
  return { id: r.id, productId: r.product_id, qty: r.qty, asPallet: r.as_pallet ?? false };
}

function mapOrder(r: Record<string, any>): Order {
  return {
    id: r.id,
    status: r.status ?? '',
    statusKind: r.status_kind ?? 'pending',
    itemsCount: r.items_count ?? 0,
    total: Number(r.total ?? 0),
    eta: r.eta ?? null,
    contactName: r.contact_name ?? '',
    contactPhone: r.contact_phone ?? '',
    address: r.address ?? '',
    createdAt: r.created_at ?? '',
  };
}

function mapUser(r: Record<string, any>): User {
  return {
    id: r.id,
    phone: r.phone ?? '',
    email: r.email ?? null,
    name: r.name ?? '',
    isB2b: r.is_b2b ?? false,
    isAdmin: r.is_admin ?? false,
    company: r.company ?? null,
    createdAt: r.created_at ?? '',
  };
}

// --- API ---

export const api = {
  async getCategories(): Promise<Category[]> {
    const data = await req<{ items: Record<string, any>[] }>('/api/v1/categories');
    const cats = (data.items ?? []).map(mapCategory);
    cats.forEach(c => { swatchMap[c.id] = c.swatch; });
    return cats;
  },

  async getProducts(params: { category_id?: string; limit?: number; offset?: number; sort?: string } = {}): Promise<{ items: Product[]; total: number }> {
    const q = new URLSearchParams();
    if (params.category_id) q.set('category_id', params.category_id);
    if (params.limit != null) q.set('limit', String(params.limit));
    if (params.offset != null) q.set('offset', String(params.offset));
    if (params.sort) q.set('sort', params.sort);
    const data = await req<{ items: Record<string, any>[]; total: number }>(`/api/v1/products?${q}`);
    return { items: (data.items ?? []).map(mapProduct), total: data.total ?? 0 };
  },

  async getProduct(id: string): Promise<Product> {
    const r = await req<Record<string, any>>(`/api/v1/products/${id}`);
    return mapProduct(r);
  },

  async getCart(): Promise<CartItem[]> {
    const data = await req<{ items: Record<string, any>[] }>('/api/v1/cart');
    return (data.items ?? []).map(mapCartItem);
  },

  async addCartItem(productId: string, qty: number, asPallet = false): Promise<CartItem> {
    const r = await req<Record<string, any>>('/api/v1/cart/items', {
      method: 'POST',
      body: JSON.stringify({ product_id: productId, qty, as_pallet: asPallet }),
    });
    return mapCartItem(r);
  },

  async updateCartItem(id: string, qty: number): Promise<void> {
    await req<void>(`/api/v1/cart/items/${id}`, { method: 'PATCH', body: JSON.stringify({ qty }) });
  },

  async removeCartItem(id: string): Promise<void> {
    await req<void>(`/api/v1/cart/items/${id}`, { method: 'DELETE' });
  },

  async createOrder(data: { contact_name: string; contact_phone: string; address: string; guest_email?: string }): Promise<Order> {
    const r = await req<Record<string, any>>('/api/v1/orders', { method: 'POST', body: JSON.stringify(data) });
    return mapOrder(r);
  },

  async getOrders(): Promise<Order[]> {
    const data = await req<{ items: Record<string, any>[] }>('/api/v1/orders');
    return (data.items ?? []).map(mapOrder);
  },

  async register(phone: string, email: string, name: string, password: string): Promise<void> {
    await req<unknown>('/api/v1/auth/register', { method: 'POST', body: JSON.stringify({ phone, email, name, password }) });
  },

  async login(phone: string, password: string): Promise<void> {
    await req<unknown>('/api/v1/auth/login', { method: 'POST', body: JSON.stringify({ phone, password }) });
  },

  async logout(): Promise<void> {
    await req<void>('/api/v1/auth/logout', { method: 'POST' });
  },

  async getProfile(): Promise<User> {
    const r = await req<Record<string, any>>('/api/v1/profile');
    return mapUser(r);
  },

  async updateProfile(data: { name?: string; email?: string }): Promise<void> {
    await req<void>('/api/v1/profile', { method: 'PATCH', body: JSON.stringify(data) });
  },

  // Admin
  async adminUpload(file: File): Promise<string> {
    const form = new FormData();
    form.append('file', file);
    const res = await fetch(BASE + '/api/v1/admin/upload', {
      method: 'POST',
      credentials: 'include',
      body: form,
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) throw Object.assign(new Error(body.error ?? res.statusText), { status: res.status });
    return body.url as string;
  },

  async adminGetBrands(): Promise<string[]> {
    const data = await req<{ items: string[] }>('/api/v1/admin/brands');
    return data.items ?? [];
  },

  async adminCreateCategory(data: {
    title: string; swatch: string; icon: CatIcon;
    image_url?: string; sort_order?: number;
  }): Promise<Category> {
    const r = await req<Record<string, any>>('/api/v1/admin/categories', {
      method: 'POST', body: JSON.stringify(data),
    });
    return mapCategory(r);
  },

  async adminListOrders(params: { limit?: number; offset?: number } = {}): Promise<{ items: Order[]; total: number }> {
    const q = new URLSearchParams();
    if (params.limit != null) q.set('limit', String(params.limit));
    if (params.offset != null) q.set('offset', String(params.offset));
    const data = await req<{ items: Record<string, any>[]; total: number }>(`/api/v1/admin/orders?${q}`);
    return { items: (data.items ?? []).map(mapOrder), total: data.total ?? 0 };
  },

  async adminUpdateOrderStatus(id: string, statusKind: string, status: string): Promise<Order> {
    const r = await req<Record<string, any>>(`/api/v1/admin/orders/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status_kind: statusKind, status }),
    });
    return mapOrder(r);
  },

  async adminUpdateCategory(id: string, data: {
    title: string; swatch?: string; icon?: string;
    image_url?: string; sort_order?: number;
  }): Promise<Category> {
    const r = await req<Record<string, any>>(`/api/v1/admin/categories/${id}`, {
      method: 'PATCH', body: JSON.stringify(data),
    });
    return mapCategory(r);
  },

  async adminDeleteCategory(id: string): Promise<void> {
    await req<void>(`/api/v1/admin/categories/${id}`, { method: 'DELETE' });
  },

  async adminUpdateProduct(id: string, data: {
    title: string; sub?: string;
    category_id?: string;
    unit: string;
    price: number;
    price_box?: number | null; box_qty?: number;
    stock?: number; stock_unit?: string;
    tag?: string; image_url?: string;
    specs?: { key: string; value: string }[];
  }): Promise<Product> {
    const r = await req<Record<string, any>>(`/api/v1/admin/products/${id}`, {
      method: 'PATCH', body: JSON.stringify(data),
    });
    return mapProduct(r);
  },

  async adminDeleteProduct(id: string): Promise<void> {
    await req<void>(`/api/v1/admin/products/${id}`, { method: 'DELETE' });
  },

  async adminCreateProduct(data: {
    sku: string; title: string; sub?: string;
    category_id?: string; brand?: string;
    unit: string; unit_detail?: string;
    price: number; old_price?: number | null;
    price_box?: number | null; box_qty?: number;
    stock?: number; stock_unit?: string; eta?: string;
    rating?: number; tag?: string; image_url?: string;
    specs?: { key: string; value: string }[];
  }): Promise<Product> {
    const r = await req<Record<string, any>>('/api/v1/admin/products', {
      method: 'POST', body: JSON.stringify(data),
    });
    return mapProduct(r);
  },
};
