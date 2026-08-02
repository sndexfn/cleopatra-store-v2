// This handles gold price calculations

export type GoldPrices = {
  usdPerOunce: number;
  usdPerGram24k: number;
  usdPerGram21k: number;
  usdPerGram18k: number;
  iqdExchangeRate: number; 
  lastUpdated: string;
};

export async function getLiveGoldPrices(): Promise<GoldPrices> {
  try {
    const res = await fetch('/api/gold-price', { next: { revalidate: 3600 } });
    if (res.ok) {
      return await res.json();
    }
  } catch {
    console.log('Using fallback gold prices');
  }
  // Fallback
  const fallbackOunce = 3350;
  const fallbackGram = fallbackOunce / 31.1035;
  return {
    usdPerOunce: fallbackOunce,
    usdPerGram24k: fallbackGram,
    usdPerGram21k: fallbackGram * (21 / 24),
    usdPerGram18k: fallbackGram * (18 / 24),
    iqdExchangeRate: 1310,
    lastUpdated: new Date().toISOString(),
  };
}

export function calculateFinalPrice(
  weightGrams: number, 
  karat: 18 | 21 | 24, 
  makingChargeUSD: number, 
  prices: GoldPrices
) {
  let gramPrice = 0;
  if (karat === 24) gramPrice = prices.usdPerGram24k;
  if (karat === 21) gramPrice = prices.usdPerGram21k;
  if (karat === 18) gramPrice = prices.usdPerGram18k;

  const totalUSD = (gramPrice * weightGrams) + makingChargeUSD;
  const totalIQD = totalUSD * prices.iqdExchangeRate;

  return { totalUSD, totalIQD };
}

export function formatCurrency(amount: number, currency: 'USD' | 'IQD') {
  if (currency === 'USD') {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  } else {
    // IQD usually has no decimal places
    return new Intl.NumberFormat('ar-IQ', { style: 'currency', currency: 'IQD', maximumFractionDigits: 0 }).format(amount);
  }
}
