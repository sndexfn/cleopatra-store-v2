import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// Updated admin email
export const ADMIN_EMAIL = 'cleopatra.manger@gmail.com';

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
  videoUrl?: string;
  inStock: boolean;
  // metalType added: 'gold' | 'silver' (optional for backward compatibility)
  metalType?: 'gold' | 'silver';
};

export const MOCK_PRODUCTS: Product[] = [
  {
    id: "prod_1",
    name: "قلادة كليوباترا الملكية",
    description: "قلادة ذهبية عيار 21 مصممة بتفاصيل فرعونية دقيقة تعكس الفخامة الأصيلة.",
    karat: 21, weightGrams: 25.5, makingChargeUSD: 150,
    imageUrl: "https://images.unsplash.com/photo-1599643478514-4a73229b1fbf?q=80&w=800&auto=format&fit=crop",
    inStock: true,
    metalType: 'gold',
  },
  {
    id: "prod_2",
    name: "خاتم الألماس والذهب",
    description: "خاتم عيار 18 مرصع بأحجار كريمة بتصميم إيطالي عصري فاخر.",
    karat: 18, weightGrams: 8.2, makingChargeUSD: 85,
    imageUrl: "https://images.unsplash.com/photo-1605100804763-247f67b2548e?q=80&w=800&auto=format&fit=crop",
    inStock: true,
    metalType: 'gold',
  },
  {
    id: "prod_3",
    name: "سوار الذهب الخالص",
    description: "سوار عيار 24 غاية في النقاء والبساطة، مناسب للمناسبات الفخمة.",
    karat: 24, weightGrams: 40.0, makingChargeUSD: 200,
    imageUrl: "https://images.unsplash.com/photo-1611591437281-460bfbe1220a?q=80&w=800&auto=format&fit=crop",
    inStock: true,
    metalType: 'gold',
  },
  {
    id: "prod_4",
    name: "طقم زفاف الزمرد",
    description: "طقم كامل من قلادة وأقراط وخاتم عيار 21 للعروس المميزة.",
    karat: 21, weightGrams: 110.5, makingChargeUSD: 600,
    imageUrl: "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?q=80&w=800&auto=format&fit=crop",
    inStock: true,
    metalType: 'gold',
  },
  {
    id: "prod_5",
    name: "أقراط الذهب الكلاسيكية",
    description: "أقراط ذهب عيار 21 بتصميم كلاسيكي أنيق يناسب جميع المناسبات.",
    karat: 21, weightGrams: 6.5, makingChargeUSD: 60,
    imageUrl: "https://images.unsplash.com/photo-1588444837495-c6cfeb53f32d?q=80&w=800&auto=format&fit=crop",
    inStock: true,
    metalType: 'gold',
  },
  {
    id: "prod_6",
    name: "سلسلة الذهب الملكية",
    description: "سلسلة ذهب عيار 24 بتصميم ملكي فاخر، تضفي أناقة لا مثيل لها.",
    karat: 24, weightGrams: 55.0, makingChargeUSD: 350,
    imageUrl: "https://images.unsplash.com/photo-1617038260897-41a1f14a8ca0?q=80&w=800&auto=format&fit=crop",
    inStock: true,
    metalType: 'gold',
  },
];

export async function getProducts(): Promise<Product[]> {
  if (!supabase) return MOCK_PRODUCTS;
  try {
    const { data, error } = await supabase.from('products').select('*').eq('inStock', true).order('created_at', { ascending: false });
    if (error || !data || data.length === 0) return MOCK_PRODUCTS;
    return data as Product[];
  } catch {
    return MOCK_PRODUCTS;
  }
}

export async function getProductById(id: string): Promise<Product | undefined> {
  if (!supabase) return MOCK_PRODUCTS.find(p => p.id === id);
  try {
    const { data, error } = await supabase.from('products').select('*').eq('id', id).single();
    if (error || !data) return MOCK_PRODUCTS.find(p => p.id === id);
    return data as Product;
  } catch {
    return MOCK_PRODUCTS.find(p => p.id === id);
  }
}
