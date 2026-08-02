import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Lazy client - only created when env vars are available
export const supabase = supabaseUrl && supabaseAnonKey
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

export async function getProducts(): Promise<Product[]> {
  if (!supabase) return MOCK_PRODUCTS;
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
    return MOCK_PRODUCTS;
  }
}

export async function getProductById(id: string): Promise<Product | undefined> {
  if (!supabase) return MOCK_PRODUCTS.find(p => p.id === id);
  try {
    const { data, error } = await supabase.from('products').select('*').eq('id', id).single();
    if (error || !data) {
      return MOCK_PRODUCTS.find(p => p.id === id);
    }
    return data as Product;
  } catch (err) {
    return MOCK_PRODUCTS.find(p => p.id === id);
  }
}
