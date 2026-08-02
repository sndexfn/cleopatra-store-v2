import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const ADMIN_EMAIL = 'cleopatrah1975@gmail.com';

export function isAdmin(email?: string | null): boolean {
  if (!email) return false;
  return email.toLowerCase() === ADMIN_EMAIL.toLowerCase();
}

export type Product = {
  id: string;
  name: string;
  description: string;
  karat: 18 | 21 | 24;
  weightGrams: number;
  makingChargeUSD: number;
  imageUrl: string;
  inStock: boolean;
};

export const MOCK_PRODUCTS: Product[] = [
  {
    id: "prod_1",
    name: "قلادة كليوباترا الملكية",
    description: "قلادة ذهبية عيار 21 مصممة بتفاصيل فرعونية دقيقة تعكس الفخامة.",
    karat: 21,
    weightGrams: 25.5,
    makingChargeUSD: 150,
    imageUrl: "https://images.unsplash.com/photo-1599643478514-4a73229b1fbf?q=80&w=800&auto=format&fit=crop",
    inStock: true,
  },
  {
    id: "prod_2",
    name: "خاتم الألماس والذهب",
    description: "خاتم عيار 18 مرصع بأحجار كريمة تصميم إيطالي عصري.",
    karat: 18,
    weightGrams: 8.2,
    makingChargeUSD: 85,
    imageUrl: "https://images.unsplash.com/photo-1605100804763-247f67b2548e?q=80&w=800&auto=format&fit=crop",
    inStock: true,
  },
  {
    id: "prod_3",
    name: "سوار الذهب الخالص",
    description: "سوار عيار 24 غاية في النقاء والبساطة، مناسب للمناسبات الفخمة.",
    karat: 24,
    weightGrams: 40.0,
    makingChargeUSD: 200,
    imageUrl: "https://images.unsplash.com/photo-1611591437281-460bfbe1220a?q=80&w=800&auto=format&fit=crop",
    inStock: true,
  },
  {
    id: "prod_4",
    name: "طقم زفاف الزمرد",
    description: "طقم كامل مكون من قلادة وأقراط وخاتم عيار 21.",
    karat: 21,
    weightGrams: 110.5,
    makingChargeUSD: 600,
    imageUrl: "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?q=80&w=800&auto=format&fit=crop",
    inStock: true,
  }
];

// Helper functions for mock database in localStorage
function getLocalStorageData(table: string): any[] {
  if (typeof window === 'undefined') return [];
  const val = localStorage.getItem(`cleopatra_mock_db_${table}`);
  if (val) {
    try {
      return JSON.parse(val);
    } catch (e) {
      return [];
    }
  }

  // Initial seeding of mock data
  if (table === 'products') {
    return MOCK_PRODUCTS;
  }
  if (table === 'site_settings') {
    return [
      { key: 'story_text', label: 'قصة المحل (صفحة من نحن)', value: `تأسس متجر كليوباترا للمجوهرات عام 1975 على يد صاحبه الذي حمل معه حلماً بتقديم أفخر أنواع الذهب والمجوهرات لأبناء العراق. على مدار خمسة عقود، أصبحنا الوجهة الأولى للعائلات والأفراد الباحثين عن الجودة والأصالة.\n\nنلتزم بتقديم ذهب حقيقي بأعيار موثوقة (18، 21، 24) مع شهادات ضمان لكل قطعة، وأسعار شفافة محسوبة وفق سعر الذهب العالمي اللحظي.` },
      { key: 'stats_years', label: 'عدد سنوات الخبرة', value: '+50' },
      { key: 'stats_customers', label: 'عدد الزبائن', value: '+10K' },
      { key: 'stats_karat_count', label: 'عدد الأعيار المتوفرة', value: '3' },
    ];
  }
  if (table === 'orders') {
    return [
      {
        id: 'order_1',
        created_at: new Date(Date.now() - 3600000 * 5).toISOString(),
        customer_name: 'علي كريم أحمد',
        customer_email: 'ali.kareem@gmail.com',
        customer_phone: '07701234567',
        total_usd: 1250.50,
        status: 'pending',
        items: [
          { name: 'قلادة كليوباترا الملكية', quantity: 1, price: 1250.50 }
        ]
      },
      {
        id: 'order_2',
        created_at: new Date(Date.now() - 3600000 * 24).toISOString(),
        customer_name: 'سارة محمد',
        customer_email: 'sara.m@gmail.com',
        customer_phone: '07812345678',
        total_usd: 480.00,
        status: 'delivered',
        items: [
          { name: 'خاتم الألماس والذهب', quantity: 1, price: 480.00 }
        ]
      }
    ];
  }
  return [];
}

function setLocalStorageData(table: string, data: any[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(`cleopatra_mock_db_${table}`, JSON.stringify(data));
}

// Chainable mock builder for queries
class MockBuilder {
  table: string;
  filters: Array<{ field: string; value: any }> = [];
  orderField: string | null = null;
  orderAscending = true;
  isSingle = false;
  isCount = false;

  constructor(table: string) {
    this.table = table;
  }

  select(fields?: string, options?: { count?: string; head?: boolean }) {
    if (options?.count === 'exact' && options?.head === true) {
      this.isCount = true;
    }
    return this;
  }

  eq(field: string, value: any) {
    this.filters.push({ field, value });
    return this;
  }

  order(field: string, options?: { ascending?: boolean }) {
    this.orderField = field;
    this.orderAscending = options?.ascending ?? true;
    return this;
  }

  single() {
    this.isSingle = true;
    return this;
  }

  // Await support for the chain
  async then(onfulfilled?: (value: any) => any, onrejected?: (reason: any) => any) {
    try {
      const data = await this.execute();
      if (onfulfilled) return onfulfilled(data);
      return data;
    } catch (err) {
      if (onrejected) return onrejected(err);
      throw err;
    }
  }

  async execute() {
    let list = getLocalStorageData(this.table);

    // Apply filters
    for (const filter of this.filters) {
      list = list.filter((item: any) => item[filter.field] === filter.value);
    }

    // Apply sorting
    if (this.orderField) {
      list = [...list].sort((a: any, b: any) => {
        const valA = a[this.orderField!];
        const valB = b[this.orderField!];
        if (valA < valB) return this.orderAscending ? -1 : 1;
        if (valA > valB) return this.orderAscending ? 1 : -1;
        return 0;
      });
    }

    if (this.isCount) {
      return { data: null, error: null, count: list.length };
    }

    if (this.isSingle) {
      return { data: list[0] || null, error: list[0] ? null : new Error('Not found') };
    }

    return { data: list, error: null };
  }

  async insert(payload: any) {
    let list = getLocalStorageData(this.table);
    const newItems = Array.isArray(payload) ? payload : [payload];
    const preparedItems = newItems.map(item => ({
      id: item.id || 'mock_' + Math.random().toString(36).substr(2, 9),
      created_at: item.created_at || new Date().toISOString(),
      ...item
    }));
    list = [...preparedItems, ...list];
    setLocalStorageData(this.table, list);
    return { data: Array.isArray(payload) ? preparedItems : preparedItems[0], error: null };
  }

  async update(payload: any) {
    let list = getLocalStorageData(this.table);
    list = list.map((item: any) => {
      const matches = this.filters.every(f => item[f.field] === f.value);
      if (matches) {
        return { ...item, ...payload };
      }
      return item;
    });
    setLocalStorageData(this.table, list);
    return { data: null, error: null };
  }

  async upsert(payload: any, _options?: any) {
    let list = getLocalStorageData(this.table);
    const items = Array.isArray(payload) ? payload : [payload];
    for (const item of items) {
      const index = list.findIndex((x: any) => x.key === item.key);
      if (index > -1) {
        list[index] = { ...list[index], ...item };
      } else {
        list.push(item);
      }
    }
    setLocalStorageData(this.table, list);
    return { data: payload, error: null };
  }

  async delete() {
    let list = getLocalStorageData(this.table);
    list = list.filter((item: any) => {
      const matches = this.filters.every(f => item[f.field] === f.value);
      return !matches;
    });
    setLocalStorageData(this.table, list);
    return { data: null, error: null };
  }
}

const listeners: Array<(event: string, session: any) => void> = [];

const mockAuth = {
  signInWithOtp: async ({ email, options }: any) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('cleopatra_mock_pending_email', email);
      if (options?.data?.full_name) {
        localStorage.setItem('cleopatra_mock_pending_fullname', options.data.full_name);
      }
    }
    return { data: null, error: null };
  },

  verifyOtp: async ({ email, token, _type }: any) => {
    if (typeof window === 'undefined') return { data: { session: null }, error: new Error('Window not defined') };
    const pendingEmail = localStorage.getItem('cleopatra_mock_pending_email') || email;
    const pendingFullName = localStorage.getItem('cleopatra_mock_pending_fullname') || email.split('@')[0];

    const mockSession = {
      user: {
        id: 'mock_user_' + Math.random().toString(36).substr(2, 9),
        email: pendingEmail,
        user_metadata: {
          full_name: pendingFullName
        }
      },
      expires_at: Math.floor(Date.now() / 1000) + 3600
    };

    localStorage.setItem('cleopatra_mock_session', JSON.stringify(mockSession));

    // Notify auth listeners
    listeners.forEach(cb => {
      try {
        cb('SIGNED_IN', mockSession);
      } catch (e) {
        console.error(e);
      }
    });

    return { data: { session: mockSession }, error: null };
  },

  getSession: async () => {
    if (typeof window === 'undefined') return { data: { session: null }, error: null };
    const sessionStr = localStorage.getItem('cleopatra_mock_session');
    if (sessionStr) {
      try {
        const session = JSON.parse(sessionStr);
        return { data: { session }, error: null };
      } catch (e) {
        return { data: { session: null }, error: null };
      }
    }
    return { data: { session: null }, error: null };
  },

  onAuthStateChange: (callback: (event: string, session: any) => void) => {
    listeners.push(callback);
    if (typeof window !== 'undefined') {
      const sessionStr = localStorage.getItem('cleopatra_mock_session');
      if (sessionStr) {
        try {
          const session = JSON.parse(sessionStr);
          callback('INITIAL_SESSION', session);
        } catch (e) {
          callback('INITIAL_SESSION', null);
        }
      } else {
        callback('INITIAL_SESSION', null);
      }
    } else {
      callback('INITIAL_SESSION', null);
    }

    return {
      data: {
        subscription: {
          unsubscribe: () => {
            const index = listeners.indexOf(callback);
            if (index > -1) {
              listeners.splice(index, 1);
            }
          }
        }
      }
    };
  },

  signOut: async () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('cleopatra_mock_session');
      localStorage.removeItem('cleopatra_mock_pending_email');
      localStorage.removeItem('cleopatra_mock_pending_fullname');
    }
    listeners.forEach(cb => {
      try {
        cb('SIGNED_OUT', null);
      } catch (e) {
        console.error(e);
      }
    });
    return { error: null };
  }
};

const mockStorageBucket = {
  upload: async (path: string, file: File, _options?: any) => {
    let url = '';
    try {
      url = URL.createObjectURL(file);
    } catch (e) {
      url = 'https://images.unsplash.com/photo-1599643478514-4a73229b1fbf?q=80&w=800&auto=format&fit=crop';
    }
    if (typeof window !== 'undefined') {
      const urlMap = JSON.parse(localStorage.getItem('cleopatra_mock_storage_urls') || '{}');
      urlMap[path] = url;
      localStorage.setItem('cleopatra_mock_storage_urls', JSON.stringify(urlMap));
    }
    return { data: { path }, error: null };
  },
  getPublicUrl: (path: string) => {
    let publicUrl = 'https://images.unsplash.com/photo-1599643478514-4a73229b1fbf?q=80&w=800&auto=format&fit=crop';
    if (typeof window !== 'undefined') {
      const urlMap = JSON.parse(localStorage.getItem('cleopatra_mock_storage_urls') || '{}');
      publicUrl = urlMap[path] || publicUrl;
    }
    return { data: { publicUrl } };
  }
};

const mockStorage = {
  from: (_bucket: string) => mockStorageBucket
};

const mockSupabase = {
  auth: mockAuth,
  from: (table: string) => new MockBuilder(table),
  storage: mockStorage
};

// Lazy client - only created when env vars are available, fallback to mock client otherwise
export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : (mockSupabase as any);

export async function getProducts(): Promise<Product[]> {
  if (!supabase) return MOCK_PRODUCTS;
  try {
    const { data, error } = await supabase.from('products').select('*').eq('inStock', true);
    if (error) {
      console.warn("Could not fetch from Supabase, returning fallback.");
      return getLocalStorageData('products');
    }
    if (data && data.length > 0) {
      return data as Product[];
    }
    return getLocalStorageData('products');
  } catch (err) {
    return getLocalStorageData('products');
  }
}

export async function getProductById(id: string): Promise<Product | undefined> {
  if (!supabase) return MOCK_PRODUCTS.find(p => p.id === id);
  try {
    const { data, error } = await supabase.from('products').select('*').eq('id', id).single();
    if (error || !data) {
      const localList = getLocalStorageData('products');
      return localList.find((p: any) => p.id === id);
    }
    return data as Product;
  } catch (err) {
    const localList = getLocalStorageData('products');
    return localList.find((p: any) => p.id === id);
  }
}
