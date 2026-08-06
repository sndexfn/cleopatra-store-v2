// This handles gold and silver price calculations with global database and local manager overrides
import { supabase } from './supabase';

export type GoldPrices = {
  usdPerOunce: number;
  usdPerGram24k: number;
  usdPerGram21k: number;
  usdPerGram18k: number;
  usdPerGramSilver: number;
  iqdExchangeRate: number; 
  lastUpdated: string;
};

// Mithqal unit is exactly 5 grams
export const MITHQAL_GRAMS = 5;

export async function getLiveGoldPrices(): Promise<GoldPrices> {
  let apiPrices: GoldPrices = {
    usdPerOunce: 2450,
    usdPerGram24k: 2450 / 31.1035,
    usdPerGram21k: (2450 / 31.1035) * (21 / 24),
    usdPerGram18k: (2450 / 31.1035) * (18 / 24),
    usdPerGramSilver: 28.5 / 31.1035,
    iqdExchangeRate: 1310,
    lastUpdated: new Date().toISOString(),
  };

  try {
    const res = await fetch('/api/gold-price');
    if (res.ok) {
      apiPrices = await res.json();
    }
  } catch {
    console.log('Using fallback gold prices');
  }

  // 1. First Priority: Load global database overrides from Supabase (for ALL public visitors)
  if (supabase) {
    try {
      const { data, error } = await supabase.from('site_settings').select('*');
      if (!error && data && data.length > 0) {
        interface SiteSettingRow {
          key: string;
          value: string;
        }
        const obj: Record<string, string> = {};
        data.forEach((row: SiteSettingRow) => { obj[row.key] = row.value; });

        const overrideExchangeRate = obj.override_exchange_rate;
        const iqdRate = overrideExchangeRate ? parseFloat(overrideExchangeRate) : apiPrices.iqdExchangeRate;
        apiPrices.iqdExchangeRate = iqdRate;

        let overrideApplied = false;

        if (obj.override_gold_21k_iqd_per_gram) {
          const gold21kIQD = parseFloat(obj.override_gold_21k_iqd_per_gram);
          apiPrices.usdPerGram21k = gold21kIQD / iqdRate;
          apiPrices.usdPerGram24k = apiPrices.usdPerGram21k * (24 / 21);
          apiPrices.usdPerGram18k = apiPrices.usdPerGram21k * (18 / 21);
          overrideApplied = true;
        }
        if (obj.override_silver_iqd_per_gram) {
          apiPrices.usdPerGramSilver = parseFloat(obj.override_silver_iqd_per_gram) / iqdRate;
          overrideApplied = true;
        }

        if (overrideApplied) {
          return apiPrices;
        }
      }
    } catch (dbError) {
      console.error("Error reading global gold price overrides from DB:", dbError);
    }
  }

  // 2. Second Priority: Fallback to local manager overrides from localStorage if present
  if (typeof window !== 'undefined') {
    const overrideGold21kIQD = localStorage.getItem('override_gold_21k_iqd_per_gram');
    const overrideSilverIQD = localStorage.getItem('override_silver_iqd_per_gram');
    const overrideExchangeRate = localStorage.getItem('override_exchange_rate');

    const iqdRate = overrideExchangeRate ? parseFloat(overrideExchangeRate) : apiPrices.iqdExchangeRate;
    apiPrices.iqdExchangeRate = iqdRate;

    if (overrideGold21kIQD) {
      const gold21kIQD = parseFloat(overrideGold21kIQD);
      apiPrices.usdPerGram21k = gold21kIQD / iqdRate;
      apiPrices.usdPerGram24k = apiPrices.usdPerGram21k * (24 / 21);
      apiPrices.usdPerGram18k = apiPrices.usdPerGram21k * (18 / 21);
    }
    if (overrideSilverIQD) {
      apiPrices.usdPerGramSilver = parseFloat(overrideSilverIQD) / iqdRate;
    }
  }

  return apiPrices;
}

export function calculateFinalPrice(
  weightGrams: number, 
  karat: 18 | 21 | 24, 
  makingChargeUSD: number, 
  prices: GoldPrices,
  metal: 'gold' | 'silver' = 'gold'
) {
  let gramPrice = 0;
  if (metal === 'silver') {
    gramPrice = prices.usdPerGramSilver;
  } else {
    // We only sell 21 karat gold as per user requirement. If for some reason it's not 21, default to 21.
    gramPrice = prices.usdPerGram21k;
  }

  const totalUSD = (gramPrice * weightGrams) + makingChargeUSD;
  const totalIQD = totalUSD * prices.iqdExchangeRate;

  return { totalUSD, totalIQD };
}

export function formatCurrency(amount: number, currency: 'USD' | 'IQD') {
  if (currency === 'USD') {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  } else {
    // IQD usually has no decimal places
    return new Intl.NumberFormat('ar-IQ', { style: 'currency', currency: 'IQD', maximumFractionDigits: 0 }).format(amount)
      .replace('IQD', 'د.ع')
      .replace('د.ع.‏', 'د.ع');
  }
}

// Converts weight in grams to Mithqal (1 Mithqal = 5 Grams)
export function gramsToMithqal(grams: number): number {
  return grams / MITHQAL_GRAMS;
}

// Convenience aliases
export function formatUSD(amount: number): string {
  return '$' + new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount);
}

export function formatIQD(amount: number): string {
  return new Intl.NumberFormat('ar-IQ', { maximumFractionDigits: 0 }).format(amount) + ' د.ع';
}
