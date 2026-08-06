"use client";

import { useUIStore } from "@/lib/uiStore";
import { useCartStore } from "@/lib/store";
import styles from "./Drawers.module.css";
import { X, Trash2, User, Phone, Mail, MapPin, CheckCircle, LogOut, LayoutDashboard } from "lucide-react";
import { getLiveGoldPrices, calculateFinalPrice, formatCurrency, GoldPrices } from "@/lib/goldPrice";
import { useEffect, useState } from "react";
import { supabase, isAdmin } from "@/lib/supabase";
import { useRouter } from "next/navigation";

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
  interface CustomUser {
    id: string;
    email?: string;
    user_metadata?: {
      full_name?: string;
    };
  }
  const [user, setUser] = useState<CustomUser | null>(null);
  const [isAdminUser, setIsAdminUser] = useState(false);
  const router = useRouter();

  useEffect(() => {
    getLiveGoldPrices().then(setPrices);
    if (supabase) {
      supabase.auth.getSession().then(({ data: { session } }) => {
        const u = session?.user;
        setUser(u ? { id: u.id, email: u.email, user_metadata: u.user_metadata } : null);
        setIsAdminUser(isAdmin(u?.email));
      });
      const { data: listener } = supabase.auth.onAuthStateChange((_e, session) => {
        const u = session?.user;
        setUser(u ? { id: u.id, email: u.email, user_metadata: u.user_metadata } : null);
        setIsAdminUser(isAdmin(u?.email));
      });
      return () => listener.subscription.unsubscribe();
    }
  }, []);

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
            ) : items.map(item => {
              const itemImages = item.product.imageUrl ? item.product.imageUrl.split(',').map(s => s.trim()).filter(Boolean) : [];
              const displayImg = itemImages[0] || '/logo.jpg';
              return (
                <div key={item.product.id} className={styles.cartItem}>
                  <img src={displayImg} alt={item.product.name} width={60} height={60} className={styles.itemImage} style={{ objectFit: 'cover', borderRadius: '8px' }} onError={e => { (e.target as HTMLImageElement).src = '/logo.jpg'; }} />
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
              );
            })}
          </div>
          {items.length > 0 && (
            <div className={styles.drawerFooter}>
              <div className={styles.totalRow}>
                <span>الإجمالي</span>
                <span style={{ color: 'var(--gold-primary)', fontWeight: 700 }}>{formatCurrency(grandTotalUSD, 'USD')}</span>
              </div>
              <button className={styles.checkoutBtn} onClick={() => { closeCart(); router.push('/checkout'); }}>إتمام الشراء ←</button>
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
            {/* User Info */}
            {user && (
              <div style={{ background: 'rgba(197,168,92,0.08)', borderRadius: '10px', padding: '1rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(197,168,92,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <User size={20} color="var(--gold-primary)" />
                </div>
                <div>
                  <p style={{ color: 'var(--gold-primary)', fontWeight: 600, fontSize: '0.95rem', marginBottom: '0.2rem' }}>
                    {user.user_metadata?.full_name || user.email?.split('@')[0]}
                  </p>
                  <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.75rem', direction: 'ltr' }}>{user.email}</p>
                </div>
              </div>
            )}

            {/* Nav Links */}
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              {[
                { href: '/', label: '🏠 الرئيسية' },
                { href: '/shop', label: '💍 المتجر' },
                { href: '/about', label: '📖 من نحن' },
              ].map(item => (
                <li key={item.href}>
                  <a href={item.href} onClick={closeMenu} style={{ display: 'block', padding: '0.85rem 1rem', color: 'var(--text-light)', textDecoration: 'none', borderRadius: '8px', fontSize: '1.05rem', transition: 'background 0.2s' }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                    {item.label}
                  </a>
                </li>
              ))}

              {/* Admin Link */}
              {isAdminUser && (
                <li>
                  <a href="/admin" onClick={closeMenu} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.85rem 1rem', color: 'var(--gold-primary)', textDecoration: 'none', borderRadius: '8px', fontSize: '1.05rem', background: 'rgba(197,168,92,0.08)' }}>
                    <LayoutDashboard size={18} /> لوحة التحكم
                  </a>
                </li>
              )}
            </ul>

            {/* Divider */}
            <div style={{ height: '1px', background: 'rgba(255,255,255,0.08)', margin: '1.5rem 0' }} />

            {/* Login / Logout */}
            {user ? (
              <button
                onClick={async () => {
                  if (supabase) await supabase.auth.signOut();
                  setUser(null);
                  closeMenu();
                  router.push('/');
                  router.refresh();
                }}
                style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', padding: '0.9rem', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '10px', color: '#ef4444', cursor: 'pointer', fontSize: '1rem', fontFamily: 'inherit', fontWeight: 600, transition: 'all 0.2s' }}
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(239,68,68,0.2)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'rgba(239,68,68,0.1)')}
              >
                <LogOut size={18} /> تسجيل الخروج
              </button>
            ) : (
              <a href="/login" onClick={closeMenu}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', padding: '0.9rem', background: 'var(--gold-primary)', borderRadius: '10px', color: '#000', textDecoration: 'none', fontSize: '1rem', fontWeight: 700 }}>
                <User size={18} /> تسجيل الدخول
              </a>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
