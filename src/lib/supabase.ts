/* eslint-disable @typescript-eslint/no-explicit-any */
import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const isPlaceholder = (val: string) => {
  const v = val.toLowerCase();
  return !v || v.includes('placeholder') || v.includes('your-') || v.includes('dummy') || v.includes('example');
};

const isMockEnabled = isPlaceholder(supabaseUrl) || isPlaceholder(supabaseAnonKey);

const realSupabase = !isMockEnabled && supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

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
  videoUrl?: string | null;
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
    videoUrl: null,
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
    videoUrl: null,
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
    videoUrl: null,
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
    videoUrl: null,
    inStock: true,
  }
];

function getStoredItems(table: string): any[] {
  if (typeof window === 'undefined') return [];
  const val = localStorage.getItem(`cleopatra_${table}`);
  if (val) {
    try {
      return JSON.parse(val);
    } catch {
      return [];
    }
  }
  if (table === 'products') {
    localStorage.setItem(`cleopatra_products`, JSON.stringify(MOCK_PRODUCTS));
    return MOCK_PRODUCTS;
  }
  if (table === 'site_settings') {
    const defaultSettings = [
      { key: 'story_text', value: `تأسس متجر كليوباترا للمجوهرات عام 1975 على يد صاحبه الذي حمل معه حلماً بتقديم أفخر أنواع الذهب والمجوهرات لأبناء العراق. على مدار خمسة عقود، أصبحنا الوجهة الأولى للعائلات والأفراد الباحثين عن الجودة والأصالة.\n\nنلتزم بتقديم ذهب حقيقي بأعيار موثوقة (18، 21، 24) مع شهادات ضمان لكل قطعة، وأسعار شفافة محسوبة وفق سعر الذهب العالمي اللحظي.` },
      { key: 'stats_years', value: '+50' },
      { key: 'stats_customers', value: '+10K' },
      { key: 'stats_karat_count', value: '3' },
      { key: 'hero_bg_url', value: '' },
    ];
    localStorage.setItem(`cleopatra_site_settings`, JSON.stringify(defaultSettings));
    return defaultSettings;
  }
  return [];
}

function setStoredItems(table: string, items: any[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(`cleopatra_${table}`, JSON.stringify(items));
}

const mockStorageMap = new Map<string, string>();

class MockQueryBuilder implements PromiseLike<any> {
  private table: string;
  private action: 'select' | 'insert' | 'update' | 'delete' | 'upsert';
  private actionData: any = null;
  private filters: Array<{ field: string; value: any }> = [];
  private orderField: string | null = null;
  private orderAsc: boolean = true;
  private selectCountOnly: boolean = false;
  private isSingle: boolean = false;

  constructor(table: string, action: 'select' | 'insert' | 'update' | 'delete' | 'upsert' = 'select', actionData: any = null) {
    this.table = table;
    this.action = action;
    this.actionData = actionData;
  }

  select(columns?: string, options?: { count?: 'exact' | 'planned' | 'estimated'; head?: boolean }) {
    if (columns) {
      // no-op
    }
    if (options?.head && options?.count === 'exact') {
      this.selectCountOnly = true;
    }
    return this;
  }

  insert(data: any) {
    this.action = 'insert';
    this.actionData = data;
    return this;
  }

  update(data: any) {
    this.action = 'update';
    this.actionData = data;
    return this;
  }

  delete() {
    this.action = 'delete';
    return this;
  }

  upsert(data: any) {
    this.action = 'upsert';
    this.actionData = data;
    return this;
  }

  eq(field: string, value: any) {
    this.filters.push({ field, value });
    return this;
  }

  order(field: string, options?: { ascending?: boolean }) {
    this.orderField = field;
    this.orderAsc = options?.ascending !== false;
    return this;
  }

  single() {
    this.isSingle = true;
    return this;
  }

  async execute() {
    let items = [...getStoredItems(this.table)];

    if (this.action === 'select') {
      for (const filter of this.filters) {
        items = items.filter(item => {
          const itemValue = item[filter.field];
          if (typeof filter.value === 'boolean') {
            return !!itemValue === filter.value;
          }
          return String(itemValue) === String(filter.value);
        });
      }

      if (this.orderField) {
        items.sort((a, b) => {
          const valA = a[this.orderField!];
          const valB = b[this.orderField!];
          if (valA < valB) return this.orderAsc ? -1 : 1;
          if (valA > valB) return this.orderAsc ? 1 : -1;
          return 0;
        });
      }

      if (this.selectCountOnly) {
        return { data: null, count: items.length, error: null };
      }

      if (this.isSingle) {
        return { data: items[0] || null, error: items[0] ? null : { message: 'Not found' } };
      }

      return { data: items, count: items.length, error: null };
    }

    if (this.action === 'insert') {
      const payloads = Array.isArray(this.actionData) ? this.actionData : [this.actionData];
      const newItems = payloads.map(p => ({
        id: p.id || `mock_${this.table}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
        created_at: new Date().toISOString(),
        ...p
      }));
      items.push(...newItems);
      setStoredItems(this.table, items);
      return { data: Array.isArray(this.actionData) ? newItems : newItems[0], error: null };
    }

    if (this.action === 'update') {
      let updatedCount = 0;
      items = items.map(item => {
        const matches = this.filters.every(filter => String(item[filter.field]) === String(filter.value));
        if (matches) {
          updatedCount++;
          return { ...item, ...this.actionData };
        }
        return item;
      });
      setStoredItems(this.table, items);
      return { data: items, count: updatedCount, error: null };
    }

    if (this.action === 'delete') {
      const initialLength = items.length;
      items = items.filter(item => {
        const matches = this.filters.every(filter => String(item[filter.field]) === String(filter.value));
        return !matches;
      });
      setStoredItems(this.table, items);
      return { error: null, count: initialLength - items.length };
    }

    if (this.action === 'upsert') {
      const payloads = Array.isArray(this.actionData) ? this.actionData : [this.actionData];
      for (const p of payloads) {
        const index = items.findIndex(item => item.key === p.key || item.id === p.id);
        if (index > -1) {
          items[index] = { ...items[index], ...p };
        } else {
          items.push({
            id: p.id || `mock_${this.table}_${Date.now()}`,
            created_at: new Date().toISOString(),
            ...p
          });
        }
      }
      setStoredItems(this.table, items);
      return { data: this.actionData, error: null };
    }

    return { data: null, error: { message: 'Unsupported operation' } };
  }

  then<TResult1 = any, TResult2 = never>(
    onfulfilled?: ((value: any) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null
  ): PromiseLike<TResult1 | TResult2> {
    return this.execute().then(onfulfilled, onrejected);
  }
}

const authListeners = new Set<(event: string, session: any) => void>();

export const mockSupabase = {
  auth: {
    async signInWithOtp({ email, options }: { email: string; options?: any }) {
      if (typeof window !== 'undefined') {
        localStorage.setItem('cleopatra_pending_otp_email', email);
        const fullName = options?.data?.full_name || email.split('@')[0];
        localStorage.setItem('cleopatra_pending_fullname', fullName);
        const code = '123456';
        localStorage.setItem('cleopatra_pending_otp_code', code);
        alert(`📬 [وضع تجريبي] تم إرسال رمز تحقق (OTP) إلى بريدك الإلكتروني.\nالرمز هو: ${code}`);
      }
      return { error: null };
    },

    async verifyOtp({ email, token }: { email: string; token: string; type: string }) {
      if (typeof window === 'undefined') {
        return { data: { session: null }, error: { message: 'Window is not defined' } };
      }
      const pendingEmail = localStorage.getItem('cleopatra_pending_otp_email');
      const pendingCode = localStorage.getItem('cleopatra_pending_otp_code') || '123456';

      if (email === pendingEmail && token === pendingCode) {
        const fullName = localStorage.getItem('cleopatra_pending_fullname') || email.split('@')[0];
        const session = {
          user: {
            id: 'mock-user-123',
            email,
            user_metadata: {
              full_name: fullName
            }
          },
          access_token: 'mock-jwt-token',
          expires_at: Math.floor(Date.now() / 1000) + 3600
        };
        localStorage.setItem('cleopatra_session', JSON.stringify(session));
        authListeners.forEach(cb => cb('SIGNED_IN', session));
        return { data: { session }, error: null };
      }

      return { data: { session: null }, error: { message: 'الرمز غير صحيح أو انتهت صلاحيته' } };
    },

    async getSession() {
      if (typeof window === 'undefined') {
        return { data: { session: null }, error: null };
      }
      const val = localStorage.getItem('cleopatra_session');
      if (val) {
        try {
          return { data: { session: JSON.parse(val) }, error: null };
        } catch {
          return { data: { session: null }, error: null };
        }
      }
      return { data: { session: null }, error: null };
    },

    onAuthStateChange(callback: (event: string, session: any) => void) {
      authListeners.add(callback);
      this.getSession().then(({ data: { session } }) => {
        callback('INITIAL_SESSION', session);
      });
      return {
        data: {
          subscription: {
            unsubscribe() {
              authListeners.delete(callback);
            }
          }
        }
      };
    },

    async signOut() {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('cleopatra_session');
      }
      authListeners.forEach(cb => cb('SIGNED_OUT', null));
      return { error: null };
    }
  },

  from(table: string) {
    return new MockQueryBuilder(table);
  },

  storage: {
    from(bucket: string) {
      if (bucket) {
        // no-op
      }
      return {
        async upload(path: string, file: File) {
          return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => {
              const base64data = reader.result as string;
              const storageKey = 'cleopatra_storage_' + path;
              try {
                localStorage.setItem(storageKey, base64data);
              } catch (e) {
                console.warn("Storage quota exceeded, keeping in memory.", e);
              }
              mockStorageMap.set(path, base64data);
              resolve({ data: { path }, error: null });
            };
            reader.onerror = () => {
              resolve({ data: null, error: { message: 'Failed to read file' } });
            };
            reader.readAsDataURL(file);
          });
        },
        getPublicUrl(path: string) {
          const base64data = mockStorageMap.get(path) || (typeof window !== 'undefined' ? localStorage.getItem('cleopatra_storage_' + path) : '') || '';
          return { data: { publicUrl: base64data || '/logo.jpg' } };
        }
      };
    }
  }
};

const delegator = {
  get auth() {
    return realSupabase ? realSupabase.auth : mockSupabase.auth;
  },
  from(table: string) {
    return realSupabase ? realSupabase.from(table) : mockSupabase.from(table);
  },
  get storage() {
    return realSupabase ? realSupabase.storage : mockSupabase.storage;
  }
};

export const supabase = (realSupabase ? realSupabase : delegator) as unknown as SupabaseClient<any>;

export async function getProducts(): Promise<Product[]> {
  try {
    const { data, error } = await supabase.from('products').select('*').eq('inStock', true);
    if (error) {
      console.warn("Could not fetch from Supabase, returning mock data.");
      return MOCK_PRODUCTS;
    }
    if (data && data.length > 0) {
      return data as Product[];
    }
    return MOCK_PRODUCTS;
  } catch (err) {
    console.warn("Error in getProducts, returning mock data:", err);
    return MOCK_PRODUCTS;
  }
}

export async function getProductById(id: string): Promise<Product | undefined> {
  try {
    const { data, error } = await supabase.from('products').select('*').eq('id', id).single();
    if (error || !data) {
      return MOCK_PRODUCTS.find(p => p.id === id);
    }
    return data as Product;
  } catch (err) {
    console.warn("Error in getProductById, returning mock data:", err);
    return MOCK_PRODUCTS.find(p => p.id === id);
  }
}
