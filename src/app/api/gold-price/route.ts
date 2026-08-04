// Live Gold Price API using site_settings when available
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const revalidate = 3600; // Cache for 1 hour

export async function GET() {
  try {
    // Read admin-configured settings from DB
    let settings: any = {};
    try {
      if (supabase) {
        const { data } = await supabase.from('site_settings').select('*');
        if (data) data.forEach((r: any) => (settings[r.key] = r.value));
      }
    } catch (e) {
      console.log('Failed to read site_settings for gold price', e);
    }

    // If manager manually provided a price per gram (override), use it
    if (settings.manual_price_usd_per_gram) {
      const gram = parseFloat(settings.manual_price_usd_per_gram);
      const iqdRate = settings.iqd_exchange_rate ? parseFloat(settings.iqd_exchange_rate) : 1310;
      return NextResponse.json({
        usdPerOunce: gram * 31.1035,
        usdPerGram24k: gram,
        usdPerGram21k: gram * (21/24),
        usdPerGram18k: gram * (18/24),
        iqdExchangeRate: iqdRate,
        lastUpdated: new Date().toISOString(),
        source: 'manual-override'
      });
    }

    // If manager provided an API endpoint and key, call it
    if (settings.gold_api_endpoint && settings.gold_api_key) {
      try {
        const url = settings.gold_api_endpoint;
        const res = await fetch(url, { headers: { 'x-api-key': settings.gold_api_key }, next: { revalidate: 3600 } });
        if (res.ok) {
          const data = await res.json();
          // Expecting response to include price per ounce or per gram
          // Try to detect common shapes
          const pricePerOunce = data.usdPerOunce || data.price || data.gold?.price || data[0]?.price;
          const pricePerGram24k = data.usdPerGram24k || (pricePerOunce ? pricePerOunce / 31.1035 : null) || data.usdPerGram;
          const iqdRate = settings.iqd_exchange_rate ? parseFloat(settings.iqd_exchange_rate) : (data.iqdExchangeRate || 1310);

          if (pricePerGram24k) {
            return NextResponse.json({
              usdPerOunce: pricePerOunce || pricePerGram24k * 31.1035,
              usdPerGram24k: pricePerGram24k,
              usdPerGram21k: pricePerGram24k * (21/24),
              usdPerGram18k: pricePerGram24k * (18/24),
              iqdExchangeRate: iqdRate,
              lastUpdated: new Date().toISOString(),
              source: 'manager-api'
            });
          }
        }
      } catch (e) {
        console.log('Manager provided gold API failed, falling back', e);
      }
    }

    // Attempt default public endpoint
    try {
      const res = await fetch('https://api.metals.live/v1/spot/gold', { next: { revalidate: 3600 } });
      if (res.ok) {
        const data = await res.json();
        const pricePerOunce = data[0]?.price || 3350;
        const pricePerGram24k = pricePerOunce / 31.1035;

        const iqdRate = settings.iqd_exchange_rate ? parseFloat(settings.iqd_exchange_rate) : 1310;

        return NextResponse.json({
          usdPerOunce: pricePerOunce,
          usdPerGram24k: pricePerGram24k,
          usdPerGram21k: pricePerGram24k * (21 / 24),
          usdPerGram18k: pricePerGram24k * (18 / 24),
          iqdExchangeRate: iqdRate,
          lastUpdated: new Date().toISOString(),
          source: 'live'
        });
      }
    } catch (e) {
      console.log('Live gold price failed, using fallback');
    }
  } catch (e) {
    console.error('Gold price error', e);
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
