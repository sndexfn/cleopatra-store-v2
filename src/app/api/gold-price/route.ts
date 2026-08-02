// Live Gold Price API using GoldAPI.io (free tier)
// Falls back to cached/mock data if API is unavailable
import { NextResponse } from 'next/server';

export const revalidate = 3600; // Cache for 1 hour

export async function GET() {
  try {
    // Using metals-api free endpoint
    const res = await fetch(
      'https://api.metals.live/v1/spot/gold',
      { next: { revalidate: 3600 } }
    );

    if (res.ok) {
      const data = await res.json();
      const pricePerOunce = data[0]?.price || 3350;
      const pricePerGram24k = pricePerOunce / 31.1035;

      return NextResponse.json({
        usdPerOunce: pricePerOunce,
        usdPerGram24k: pricePerGram24k,
        usdPerGram21k: pricePerGram24k * (21 / 24),
        usdPerGram18k: pricePerGram24k * (18 / 24),
        iqdExchangeRate: 1310,
        lastUpdated: new Date().toISOString(),
        source: 'live'
      });
    }
  } catch (e) {
    console.log('Live gold price failed, using fallback');
  }

  // Fallback mock data
  const fallbackOunce = 3350;
  const fallbackGram = fallbackOunce / 31.1035;
  return NextResponse.json({
    usdPerOunce: fallbackOunce,
    usdPerGram24k: fallbackGram,
    usdPerGram21k: fallbackGram * (21 / 24),
    usdPerGram18k: fallbackGram * (18 / 24),
    iqdExchangeRate: 1310,
    lastUpdated: new Date().toISOString(),
    source: 'fallback'
  });
}
