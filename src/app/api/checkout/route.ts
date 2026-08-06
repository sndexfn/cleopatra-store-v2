import { NextResponse } from 'next/server';
import { Product, supabase } from '@/lib/supabase';

type OrderItem = {
  product: Product;
  quantity: number;
};

// Helper function to escape HTML special characters for safe Telegram delivery
function escapeHTML(str: string): string {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { customer, items, grandTotalUSD, exchangeRate } = body;

    // 1. Format order items for DB persistence
    const formattedItems = items.map((item: OrderItem) => {
      const perItemGrams = item.product.weightGrams;
      const totalItemGrams = perItemGrams * item.quantity;
      return {
        id: item.product.id,
        name: item.product.name,
        quantity: item.quantity,
        karat: item.product.karat,
        weightGrams: perItemGrams,
        totalGrams: totalItemGrams,
        makingChargeUSD: item.product.makingChargeUSD,
        price: item.product.makingChargeUSD * item.quantity // default to crafting charge or estimated base
      };
    });

    // 2. Connect to Supabase and save the order
    if (supabase) {
      const { error: dbErr } = await supabase.from('orders').insert({
        customer_name: customer.name,
        customer_email: customer.email || null,
        customer_phone: customer.phone,
        total_usd: grandTotalUSD || 0,
        status: 'pending',
        items: formattedItems
      });

      if (dbErr) {
        console.error('Failed to insert order into Supabase database:', dbErr);
      } else {
        console.log('Order successfully persisted in Supabase database.');
      }
    } else {
      console.log('Supabase offline/not configured. Order details:', body);
    }

    // 3. Telegram Notification logic using robust HTML formatting
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;

    if (botToken && chatId) {
      let message = `🛒 <b>طلب جديد من متجر كليوباترا الملكي</b>\n\n`;
      message += `👤 <b>اسم العميل:</b> ${escapeHTML(customer.name)}\n`;
      message += `📞 <b>رقم الهاتف:</b> ${escapeHTML(customer.phone)}\n`;
      message += `📍 <b>المحافظة:</b> ${escapeHTML(customer.city || 'غير محدد')}\n`;
      message += `🏠 <b>تفاصيل العنوان:</b> ${escapeHTML(customer.address)}\n`;
      if (customer.notes) {
        message += `📝 <b>ملاحظات التوصيل:</b> ${escapeHTML(customer.notes)}\n`;
      }
      message += `\n🛍️ <b>تفاصيل الطلب:</b>\n`;
      
      let totalGrams = 0;
      let totalMithqals = 0;

      items.forEach((item: OrderItem, index: number) => {
        const grams = item.product.weightGrams * item.quantity;
        const mithqals = grams / 5;
        totalGrams += grams;
        totalMithqals += mithqals;

        message += `🔹 <b>${index + 1}. ${escapeHTML(item.product.name)}</b>\n`;
        message += `   • المعدن: ${item.product.metal === 'silver' ? 'فضة' : `ذهب عيار ${item.product.karat}`}\n`;
        message += `   • الكمية: ${item.quantity}\n`;
        message += `   • الوزن: ${grams.toFixed(2)} غرام (${mithqals.toFixed(2)} مثقال)\n`;
        message += `   • أجرة الصياغة: $${(item.product.makingChargeUSD * item.quantity).toFixed(2)}\n\n`;
      });

      message += `📊 <b>ملخص الجرد الكلي للمندوب:</b>\n`;
      message += `• الوزن الإجمالي: ${totalGrams.toFixed(2)} غرام (${totalMithqals.toFixed(2)} مثقال)\n`;
      if (grandTotalUSD) {
        const activeExchangeRate = exchangeRate || 1310;
        const totalIQD = grandTotalUSD * activeExchangeRate;
        message += `💰 <b>المبلغ المطلوب عند التسليم:</b>\n`;
        message += `   👉 <b>${totalIQD.toLocaleString('ar-IQ')} دينار عراقي</b>\n`;
        message += `   👉 <b>( ~${grandTotalUSD.toFixed(2)} دولار أمريكي )</b>\n`;
      }

      // Send message to Telegram API with robust HTML parse mode
      const telegramResponse = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: message,
          parse_mode: 'HTML'
        })
      });

      if (!telegramResponse.ok) {
        const errorText = await telegramResponse.text();
        console.error('Telegram bot send message failed:', errorText);
      } else {
        console.log('Telegram order notification dispatched successfully.');
      }
    } else {
      console.log('Telegram bot tokens not configured. Order logged:', body);
    }

    return NextResponse.json({ success: true, message: 'Order processed successfully' });
  } catch (error) {
    console.error('Checkout Error:', error);
    return NextResponse.json({ success: false, error: 'Failed to process order' }, { status: 500 });
  }
}
