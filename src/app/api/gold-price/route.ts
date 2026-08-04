import { NextResponse } from 'next/server';

export const revalidate = 3600; // Cache for 1 hour

export async function GET() {
  const apiKey = '9b5a028a93764a3689bae8306f68b729';

  try {
    // Fetch Gold (XAU) in USD
    const goldRes = await fetch('https://www.goldapi.io/api/XAU/USD', {
      headers: {
        'x-access-token': apiKey,
        'Content-Type': 'application/json'
      },
      next: { revalidate: 3600 }
    });

    // Fetch Silver (XAG) in USD
    const silverRes = await fetch('https://www.goldapi.io/api/XAG/USD', {
      headers: {
        'x-access-token': apiKey,
        'Content-Type': 'application/json'
      },
      next: { revalidate: 3600 }
    });

    let goldPricePerOunce = 2450; // Fallback
    let silverPricePerOunce = 28.5; // Fallback

    if (goldRes.ok) {
      const goldData = await goldRes.json();
      if (goldData && goldData.price) {
        goldPricePerOunce = goldData.price;
      }
    }

    if (silverRes.ok) {
      const silverData = await silverRes.json();
      if (silverData && silverData.price) {
        silverPricePerOunce = silverData.price;
      }
    }

    const usdPerGram24k = goldPricePerOunce / 31.1035;
    const usdPerGram21k = usdPerGram24k * (21 / 24);
    const usdPerGram18k = usdPerGram24k * (18 / 24);
    const usdPerGramSilver = silverPricePerOunce / 31.1035;

    return NextResponse.json({
      usdPerOunce: goldPricePerOunce,
      usdPerGram24k,
      usdPerGram21k,
      usdPerGram18k,
      usdPerGramSilver,
      iqdExchangeRate: 1310,
      lastUpdated: new Date().toISOString(),
      source: 'goldapi.io'
    });

  } catch (e) {
    console.error('Error fetching from goldapi.io:', e);
  }

  // Robust Fallback mock data
  const fallbackOunce = 2450;
  const fallbackGram = fallbackOunce / 31.1035;
  return NextResponse.json({
    usdPerOunce: fallbackOunce,
    usdPerGram24k: fallbackGram,
    usdPerGram21k: fallbackGram * (21 / 24),
    usdPerGram18k: fallbackGram * (18 / 24),
    usdPerGramSilver: 28.5 / 31.1035,
    iqdExchangeRate: 1310,
    lastUpdated: new Date().toISOString(),
    source: 'fallback'
  });
}
