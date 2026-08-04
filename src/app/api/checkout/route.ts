import { NextResponse } from 'next/server';
import { Product } from '@/lib/supabase';
import { supabase } from '@/lib/supabase';

type OrderItem = {
  product: Product;
  quantity: number;
};

function sanitizeText(s: string) {
  if (!s) return '';
  return String(s).replace(/\n/g, '\\n');
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { customer, items } = body;

    // Save order to supabase if available
    if (supabase) {
      try {
        await supabase.from('orders').insert({
          customer_name: customer.name,
          customer_email: customer.email,
          customer_phone: customer.phone,
          total_usd: body.total_usd || 0,
          status: 'pending',
          items: items,
        });
      } catch (e) {
        console.error('Failed to save order to DB', e);
      }
    }

    // Read telegram settings from site_settings
    let settings: any = {};
    try {
      if (supabase) {
        const { data } = await supabase.from('site_settings').select('*');
        if (data) data.forEach((r: any) => (settings[r.key] = r.value));
      }
    } catch (e) {
      console.log('Failed to read site_settings for checkout', e);
    }

    const botToken = settings.telegram_bot_token || process.env.TELEGRAM_BOT_TOKEN;
    const chatId = settings.telegram_chat_id || process.env.TELEGRAM_CHAT_ID;

    if (botToken && chatId) {
      let message = `🛒 طلب جديد من متجر كليوباترا\n\n`;
      message += `الزبون: ${sanitizeText(customer.name)}\n`;
      message += `الهاتف: ${sanitizeText(customer.phone)}\n`;
      message += `العنوان: ${sanitizeText(customer.address || '')}\n\n`;
      message += `المنتجات:\n`;

      items.forEach((item: OrderItem, index: number) => {
        message += `${index + 1}. ${item.product.name} (عيار ${item.product.karat}) x${item.quantity} - ${item.product.weightGrams}غ\n`;
      });

      try {
        await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ chat_id: chatId, text: message })
        });
      } catch (e) {
        console.error('Telegram send failed', e);
      }
    } else {
      console.log('Telegram bot tokens not configured. Order logged:', body);
    }

    return NextResponse.json({ success: true, message: 'Order created successfully' });
  } catch (error) {
    console.error('Checkout Error:', error);
    return NextResponse.json({ success: false, error: 'Failed to process order' }, { status: 500 });
  }
}
