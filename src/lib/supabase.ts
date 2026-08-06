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
  metal?: 'gold' | 'silver';
};

export const MOCK_PRODUCTS: Product[] = [
  {
    id: "prod_1",
    name: "قلادة كليوباترا الملكية",
    description: "قلادة ذهبية عيار 21 مصممة بتفاصيل فرعونية دقيقة تعكس الفخامة الأصيلة.",
    karat: 21, weightGrams: 25.5, makingChargeUSD: 150,
    imageUrl: "https://images.unsplash.com/photo-1599643478514-4a73229b1fbf?q=80&w=800&auto=format&fit=crop",
    inStock: true,
    metal: 'gold',
  },
  {
    id: "prod_2",
    name: "خاتم الفضة النقي",
    description: "خاتم فضة إيطالي مرصع بأحجار الزركون اللامعة بتصميم ناعم وجذاب.",
    karat: 21, weightGrams: 8.2, makingChargeUSD: 25,
    imageUrl: "https://images.unsplash.com/photo-1605100804763-247f67b2548e?q=80&w=800&auto=format&fit=crop",
    inStock: true,
    metal: 'silver',
  },
  {
    id: "prod_3",
    name: "سوار الفضة الملكي",
    description: "سوار فضة منقوش باليد بتفاصيل شرقية فاخرة تناسب كافة الأذواق.",
    karat: 21, weightGrams: 15.0, makingChargeUSD: 35,
    imageUrl: "https://images.unsplash.com/photo-1611591437281-460bfbe1220a?q=80&w=800&auto=format&fit=crop",
    inStock: true,
    metal: 'silver',
  },
  {
    id: "prod_4",
    name: "طقم زفاف الملكة",
    description: "طقم كامل من قلادة وأقراط وخاتم عيار 21 للعروس المميزة.",
    karat: 21, weightGrams: 110.5, makingChargeUSD: 600,
    imageUrl: "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?q=80&w=800&auto=format&fit=crop",
    inStock: true,
    metal: 'gold',
  },
  {
    id: "prod_5",
    name: "أقراط الذهب الكلاسيكية",
    description: "أقراط ذهب عيار 21 بتصميم كلاسيكي أنيق يناسب جميع المناسبات.",
    karat: 21, weightGrams: 6.5, makingChargeUSD: 60,
    imageUrl: "https://images.unsplash.com/photo-1588444837495-c6cfeb53f32d?q=80&w=800&auto=format&fit=crop",
    inStock: true,
    metal: 'gold',
  },
  {
    id: "prod_6",
    name: "قلادة الفضة الناعمة",
    description: "سلسلة وقلادة فضة بتصميم رقيق وعصري يضفي لمعاناً جميلاً.",
    karat: 21, weightGrams: 12.0, makingChargeUSD: 18,
    imageUrl: "https://images.unsplash.com/photo-1617038260897-41a1f14a8ca0?q=80&w=800&auto=format&fit=crop",
    inStock: true,
    metal: 'silver',
  },
];

export async function getProducts(): Promise<Product[]> {
  if (!supabase) return MOCK_PRODUCTS;
  try {
    const { data, error } = await supabase.from('products').select('*').eq('inStock', true).order('created_at', { ascending: false });
    if (error || !data) return MOCK_PRODUCTS;
    // When Supabase is connected and successfully queried, return the real array (even if empty)
    // so the manager can start fresh with their own products.
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
