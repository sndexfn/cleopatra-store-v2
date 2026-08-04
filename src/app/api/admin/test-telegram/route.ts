import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST() {
  try {
    // Read telegram settings from site_settings
    let settings: any = {};
    try {
      if (supabase) {
        const { data } = await supabase.from('site_settings').select('*');
        if (data) data.forEach((r: any) => (settings[r.key] = r.value));
      }
    } catch (e) {
      console.log('Failed to read site_settings for telegram test', e);
    }

    const botToken = settings.telegram_bot_token || process.env.TELEGRAM_BOT_TOKEN;
    const chatId = settings.telegram_chat_id || process.env.TELEGRAM_CHAT_ID;

    if (!botToken || !chatId) return NextResponse.json({ success: false, error: 'Bot token or chat id not configured' });

    const message = '🔔 اختبار: هذه رسالة اختبارية من لوحة إدارة كليوباترا.';

    try {
      const res = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: chatId, text: message })
      });
      const json = await res.json();
      if (!json.ok) return NextResponse.json({ success: false, error: JSON.stringify(json) });
      return NextResponse.json({ success: true });
    } catch (e) {
      console.error('Telegram test send failed', e);
      return NextResponse.json({ success: false, error: String(e) });
    }
  } catch (e) {
    console.error('Test Telegram error', e);
    return NextResponse.json({ success: false, error: String(e) });
  }
}
