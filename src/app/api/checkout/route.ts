import { NextResponse } from 'next/server';
import { Product } from '@/lib/supabase';

type OrderItem = {
  product: Product;
  quantity: number;
};

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { customer, items } = body;

    // TODO: Connect to Supabase and save the order
    
    // Telegram Notification logic
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;

    if (botToken && chatId) {
      let message = `🛒 *طلب جديد من متجر كليوباترا*\n\n`;
      message += `👤 *الزبون:* ${customer.name}\n`;
      message += `📞 *الهاتف:* ${customer.phone}\n`;
      message += `📍 *العنوان:* ${customer.address}\n\n`;
      message += `🛍️ *المنتجات:*\n`;
      
      items.forEach((item: OrderItem, index: number) => {
        message += `${index + 1}. ${item.product.name} (عيار ${item.product.karat}) x${item.quantity}\n`;
        message += `   الوزن: ${item.product.weightGrams}غ | الصياغة: $${item.product.makingChargeUSD}\n`;
      });

      // Send to telegram
      await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: message,
          parse_mode: 'Markdown'
        })
      });
    } else {
      console.log('Telegram bot tokens not configured. Order logged:', body);
    }

    return NextResponse.json({ success: true, message: 'Order created successfully' });
  } catch (error) {
    console.error('Checkout Error:', error);
    return NextResponse.json({ success: false, error: 'Failed to process order' }, { status: 500 });
  }
}
