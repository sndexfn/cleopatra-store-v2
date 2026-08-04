"use client";
import { useEffect, useState } from 'react';
import styles from './page.module.css';
import Navbar from '@/components/Navbar';
import Link from 'next/link';
import { useCartStore } from '@/lib/store';
import { getLiveGoldPrices, calculateFinalPrice, formatCurrency } from '@/lib/goldPrice';
import { Trash2 } from 'lucide-react';

export default function CartPage() {
  const { items, updateQuantity, removeItem, clearCart } = useCartStore();
  const [prices, setPrices] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [form, setForm] = useState({ name: '', phone: '+964', city: '', address: '', notes: '' });
  const [orderDone, setOrderDone] = useState(false);

  useEffect(() => {
    setIsClient(true);
    getLiveGoldPrices().then(setPrices);
  }, []);

  if (!isClient) return null;

  let grandTotalUSD = 0;
  let grandTotalIQD = 0;

  if (prices) {
    items.forEach(item => {
      const itemPrice = calculateFinalPrice(item.product.weightGrams, item.product.karat, item.product.makingChargeUSD, prices);
      grandTotalUSD += itemPrice.totalUSD * item.quantity;
      grandTotalIQD += itemPrice.totalIQD * item.quantity;
    });
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customer: form, items, total_usd: grandTotalUSD })
      });
      const json = await res.json();
      if (json.success) {
        clearCart();
        setOrderDone(true);
      } else {
        alert('فشل إرسال الطلب. حاول مرة أخرى');
      }
    } catch (err) {
      console.error(err);
      alert('حدث خطأ أثناء إرسال الطلب');
    }
    setLoading(false);
  };

  return (
    <>
      <Navbar />
      <main className={styles.main}>
        <h1 className={styles.title}>إتمام الطلب</h1>

        <div className={styles.container}>
          <form className={styles.checkoutForm} onSubmit={handleSubmit}>
            <label className={styles.label}>الاسم الكامل</label>
            <input className={styles.input} value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />

            <label className={styles.label}>الهاتف</label>
            <input className={styles.input} value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} required />

            <label className={styles.label}>عنوان التوصيل</label>
            <textarea className={styles.textarea} value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} required />

            <label className={styles.label}>ملاحظات</label>
            <textarea className={styles.textarea} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />

            <button className={styles.confirmBtn} type="submit" disabled={loading || items.length === 0}>{loading ? 'جاري الإرسال...' : 'تأكيد الطلب'}</button>

            {orderDone && (
              <div className={styles.successBox}>
                <p>✅ تم إرسال طلبك! سيتواصل معك مندوبنا قريباً.</p>
                <Link href="/shop" className={styles.continueBtn}>العودة للمتجر</Link>
              </div>
            )}
          </form>

          <aside className={styles.summaryCard}>
            <h2 className={styles.summaryTitle}>ملخص الطلب</h2>
            <div className={styles.itemsList}>
              {items.length === 0 ? (
                <p style={{ color: 'var(--text-muted)' }}>لا توجد منتجات في السلة.</p>
              ) : items.map(item => {
                let itemTotalUSD = 0;
                if (prices) {
                  const itemPrice = calculateFinalPrice(item.product.weightGrams, item.product.karat, item.product.makingChargeUSD, prices);
                  itemTotalUSD = itemPrice.totalUSD;
                }
                return (
                  <div key={item.product.id} className={styles.cartItem}>
                    <img src={item.product.imageUrl} alt={item.product.name} className={styles.itemImage} />
                    <div className={styles.itemDetails}>
                      <h4 className={styles.itemName}>{item.product.name} × {item.quantity}</h4>
                      <p className={styles.itemMeta}>عيار {item.product.karat} | {item.product.weightGrams}غ</p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <p style={{ color: 'var(--gold-primary)', fontWeight: 700 }}>{prices ? formatCurrency(itemTotalUSD * item.quantity, 'USD') : '...'}</p>
                      <button onClick={() => removeItem(item.product.id)} className={styles.removeBtn} aria-label="حذف"><Trash2 size={16} /></button>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className={styles.summaryRow}>
              <span>الإجمالي (USD)</span>
              <span style={{ color: 'var(--gold-primary)', fontWeight: 700 }}>{formatCurrency(grandTotalUSD, 'USD')}</span>
            </div>
            <div className={styles.summaryRow}>
              <span>تقريباً (IQD)</span>
              <span style={{ color: 'var(--text-secondary)' }}>{formatCurrency(grandTotalIQD, 'IQD')}</span>
            </div>

            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.75rem' }}>الأسعار قابلة للتغير — تأكد من تأكيد الطلب لتحسب الأسعار النهائية.</p>
          </aside>
        </div>
      </main>
    </>
  );
}
