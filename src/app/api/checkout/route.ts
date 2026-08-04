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
      let message = `🛒 *طلب جديد من متجر كليوباترا الملكي*\n\n`;
      message += `👤 *اسم العميل:* ${customer.name}\n`;
      message += `📞 *رقم الهاتف:* ${customer.phone}\n`;
      message += `📍 *المحافظة:* ${customer.city || 'غير محدد'}\n`;
      message += `🏠 *تفاصيل العنوان:* ${customer.address}\n`;
      if (customer.notes) {
        message += `📝 *ملاحظات التوصيل:* ${customer.notes}\n`;
      }
      message += `\n🛍️ *تفاصيل الطلب:*\n`;
      
      let totalGrams = 0;
      let totalMithqals = 0;

      items.forEach((item: OrderItem, index: number) => {
        const grams = item.product.weightGrams * item.quantity;
        const mithqals = grams / 5;
        totalGrams += grams;
        totalMithqals += mithqals;

        message += `🔹 *${index + 1}. ${item.product.name}*\n`;
        message += `   • المعدن: ${item.product.metal === 'silver' ? 'فضة' : `ذهب عيار ${item.product.karat}`}\n`;
        message += `   • الكمية: ${item.quantity}\n`;
        message += `   • الوزن: ${grams.toFixed(2)} غرام (${mithqals.toFixed(2)} مثقال)\n`;
        message += `   • أجرة الصياغة: $${(item.product.makingChargeUSD * item.quantity).toFixed(2)}\n\n`;
      });

      message += `📊 *ملخص الجرد الكلي للمندوب:*\n`;
      message += `• الوزن الإجمالي: ${totalGrams.toFixed(2)} غرام (${totalMithqals.toFixed(2)} مثقال)\n`;
      if (body.grandTotalUSD) {
        const grandTotalIQD = body.grandTotalUSD * (body.exchangeRate || 1310);
        message += `💰 *المبلغ المطلوب عند التسليم:*\n`;
        message += `   👉 *${grandTotalIQD.toLocaleString('ar-IQ')} دينار عراقي*\n`;
        message += `   👉 *( ~$${body.grandTotalUSD.toFixed(2)} دولار أمريكي )*\n`;
      }

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
