"use client";

import { useUIStore } from "@/lib/uiStore";
import { useCartStore } from "@/lib/store";
import styles from "./Drawers.module.css";
import { X, Trash2, User, Phone, Mail, MapPin, CheckCircle } from "lucide-react";
import { getLiveGoldPrices, calculateFinalPrice, formatCurrency, GoldPrices } from "@/lib/goldPrice";
import { useEffect, useState } from "react";
import Image from "next/image";
import { supabase } from "@/lib/supabase";

export default function Drawers() {
  const {
    isCartOpen, closeCart,
    isCheckoutOpen, openCheckout, closeCheckout,
    isMenuOpen, closeMenu
  } = useUIStore();
  const { items, updateQuantity, removeItem, clearCart } = useCartStore();
  const [prices, setPrices] = useState<GoldPrices | null>(null);
  const [orderDone, setOrderDone] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', phone: '', city: '', notes: '' });

  useEffect(() => {
    getLiveGoldPrices().then(setPrices);
  }, [isCartOpen, isCheckoutOpen]);

  let grandTotalUSD = 0;
  if (prices) {
    items.forEach(item => {
      const itemPrice = calculateFinalPrice(item.product.weightGrams, item.product.karat, item.product.makingChargeUSD, prices);
      grandTotalUSD += itemPrice.totalUSD * item.quantity;
    });
  }

  const handleOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const orderItems = items.map(item => ({
      id: item.product.id,
      name: item.product.name,
      quantity: item.quantity,
      karat: item.product.karat,
      price: prices ? calculateFinalPrice(item.product.weightGrams, item.product.karat, item.product.makingChargeUSD, prices).totalUSD : 0,
    }));

    if (supabase) {
      await supabase.from('orders').insert({
        customer_name: form.name,
        customer_email: form.email,
        customer_phone: form.phone,
        total_usd: grandTotalUSD,
        status: 'pending',
        items: orderItems,
      });
    }
    clearCart();
    setOrderDone(true);
    setLoading(false);
  };

  const inputStyle = {
    width: '100%', padding: '0.75rem 1rem', background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(197,168,92,0.2)', borderRadius: '8px',
    color: 'var(--text-light)', fontSize: '0.95rem', fontFamily: 'inherit', outline: 'none',
    boxSizing: 'border-box' as const,
  };

  return (
    <>
      {/* Cart Drawer */}
      <div className={`${styles.drawerOverlay} ${isCartOpen ? styles.open : ""}`} onClick={closeCart}>
        <div className={styles.drawerContent} onClick={e => e.stopPropagation()}>
          <div className={styles.drawerHeader}>
            <button className={styles.closeBtn} onClick={closeCart}><X /></button>
            <h2>سلة التسوق ({items.length})</h2>
          </div>
          <div className={styles.drawerBody}>
            {items.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem', color: 'rgba(255,255,255,0.4)' }}>
                <p style={{ fontSize: '3rem', marginBottom: '1rem' }}>🛒</p>
                <p>سلتك فارغة</p>
              </div>
            ) : items.map(item => (
              <div key={item.product.id} className={styles.cartItem}>
                <Image src={item.product.imageUrl} alt={item.product.name} width={60} height={60} className={styles.itemImage} />
                <div className={styles.itemDetails}>
                  <h4>{item.product.name}</h4>
                  <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)', marginBottom: '0.3rem' }}>عيار {item.product.karat}</p>
                  <div className={styles.qControl}>
                    <button onClick={() => updateQuantity(item.product.id, Math.max(1, item.quantity - 1))}>-</button>
                    <span>{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.product.id, item.quantity + 1)}>+</button>
                  </div>
                </div>
                <button onClick={() => removeItem(item.product.id)} className={styles.deleteBtn}><Trash2 size={16} /></button>
              </div>
            ))}
          </div>
          {items.length > 0 && (
            <div className={styles.drawerFooter}>
              <div className={styles.totalRow}>
                <span>الإجمالي</span>
                <span style={{ color: 'var(--gold-primary)', fontWeight: 700 }}>{formatCurrency(grandTotalUSD, 'USD')}</span>
              </div>
              <button className={styles.checkoutBtn} onClick={() => { closeCart(); openCheckout(); }}>إتمام الشراء ←</button>
            </div>
          )}
        </div>
      </div>

      {/* Checkout Drawer */}
      <div className={`${styles.drawerOverlay} ${isCheckoutOpen ? styles.open : ""}`} onClick={closeCheckout}>
        <div className={styles.drawerContent} onClick={e => e.stopPropagation()} style={{ maxWidth: '480px' }}>
          <div className={styles.drawerHeader}>
            <button className={styles.closeBtn} onClick={() => { closeCheckout(); setOrderDone(false); }}><X /></button>
            <h2>إتمام الشراء</h2>
          </div>
          <div className={styles.drawerBody}>
            {orderDone ? (
              /* Success State */
              <div style={{ textAlign: 'center', padding: '3rem 1rem' }}>
                <CheckCircle size={64} color="#10b981" style={{ marginBottom: '1rem' }} />
                <h3 style={{ color: '#10b981', fontSize: '1.5rem', marginBottom: '0.5rem' }}>تم إرسال طلبك!</h3>
                <p style={{ color: 'rgba(255,255,255,0.6)', marginBottom: '2rem' }}>سيتواصل معك فريقنا قريباً لتأكيد الطلب وترتيب التسليم.</p>
                <button onClick={() => { closeCheckout(); setOrderDone(false); setForm({ name: '', email: '', phone: '', city: '', notes: '' }); }}
                  style={{ background: 'var(--gold-primary)', color: '#000', border: 'none', borderRadius: '8px', padding: '0.75rem 2rem', cursor: 'pointer', fontWeight: 700, fontSize: '1rem', fontFamily: 'inherit' }}>
                  العودة للمتجر
                </button>
              </div>
            ) : (
              /* Order Form */
              <form onSubmit={handleOrder} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {/* Order Summary */}
                <div style={{ background: 'rgba(197,168,92,0.08)', borderRadius: '10px', padding: '1rem', marginBottom: '0.5rem' }}>
                  <h4 style={{ color: 'var(--gold-primary)', marginBottom: '0.75rem', fontSize: '0.95rem' }}>ملخص الطلب</h4>
                  {items.map(item => (
                    <div key={item.product.id} style={{ display: 'flex', justifyContent: 'space-between', color: 'rgba(255,255,255,0.7)', fontSize: '0.85rem', marginBottom: '0.3rem' }}>
                      <span>{item.product.name} × {item.quantity}</span>
                      <span style={{ color: 'var(--gold-primary)' }}>
                        {prices ? formatCurrency(calculateFinalPrice(item.product.weightGrams, item.product.karat, item.product.makingChargeUSD, prices).totalUSD * item.quantity, 'USD') : '...'}
                      </span>
                    </div>
                  ))}
                  <div style={{ borderTop: '1px solid rgba(197,168,92,0.2)', marginTop: '0.75rem', paddingTop: '0.75rem', display: 'flex', justifyContent: 'space-between', fontWeight: 700 }}>
                    <span style={{ color: 'rgba(255,255,255,0.8)' }}>الإجمالي</span>
                    <span style={{ color: 'var(--gold-primary)', fontSize: '1.1rem' }}>{formatCurrency(grandTotalUSD, 'USD')}</span>
                  </div>
                </div>

                {/* Customer Info */}
                <h4 style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.95rem', marginBottom: '0' }}>بيانات التواصل</h4>

                <div style={{ position: 'relative' }}>
                  <User size={16} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(197,168,92,0.6)' }} />
                  <input required style={{ ...inputStyle, paddingRight: '2.5rem' }} placeholder="الاسم الكامل *" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
                </div>

                <div style={{ position: 'relative' }}>
                  <Phone size={16} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(197,168,92,0.6)' }} />
                  <input required style={{ ...inputStyle, paddingRight: '2.5rem' }} placeholder="رقم الهاتف * (07xx xxx xxxx)" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
                </div>

                <div style={{ position: 'relative' }}>
                  <Mail size={16} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(197,168,92,0.6)' }} />
                  <input style={{ ...inputStyle, paddingRight: '2.5rem' }} placeholder="البريد الإلكتروني (اختياري)" type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} dir="ltr" />
                </div>

                <div style={{ position: 'relative' }}>
                  <MapPin size={16} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(197,168,92,0.6)' }} />
                  <input style={{ ...inputStyle, paddingRight: '2.5rem' }} placeholder="المدينة / المنطقة" value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))} />
                </div>

                <textarea
                  style={{ ...inputStyle, resize: 'vertical', minHeight: '80px' }}
                  placeholder="ملاحظات إضافية (اختياري)"
                  value={form.notes}
                  onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                  rows={3}
                />

                <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)', textAlign: 'center' }}>
                  💳 الدفع عند الاستلام — سيتواصل معك فريقنا لتأكيد الطلب
                </p>

                <button type="submit" disabled={loading}
                  style={{ background: loading ? 'rgba(197,168,92,0.5)' : 'var(--gold-primary)', color: '#000', border: 'none', borderRadius: '10px', padding: '1rem', cursor: loading ? 'not-allowed' : 'pointer', fontWeight: 700, fontSize: '1.05rem', fontFamily: 'inherit', transition: 'all 0.2s' }}>
                  {loading ? 'جاري إرسال الطلب...' : '✅ تأكيد الطلب'}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Menu Drawer */}
      <div className={`${styles.drawerOverlay} ${isMenuOpen ? styles.open : ""}`} onClick={closeMenu}>
        <div className={styles.drawerContent} onClick={e => e.stopPropagation()}>
          <div className={styles.drawerHeader}>
            <button className={styles.closeBtn} onClick={closeMenu}><X /></button>
            <h2>القائمة</h2>
          </div>
          <div className={styles.drawerBody}>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '1rem', fontSize: '1.2rem' }}>
              <li><a href="/" style={{ color: 'var(--text-light)', textDecoration: 'none' }}>الرئيسية</a></li>
              <li><a href="/shop" style={{ color: 'var(--text-light)', textDecoration: 'none' }}>المتجر</a></li>
              <li><a href="/about" style={{ color: 'var(--text-light)', textDecoration: 'none' }}>من نحن</a></li>
              <li><a href="/login" style={{ color: 'var(--gold-primary)', textDecoration: 'none' }}>تسجيل الدخول</a></li>
            </ul>
          </div>
        </div>
      </div>
    </>
  );
}
