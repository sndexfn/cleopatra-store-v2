"use client";
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { getLiveGoldPrices, formatIQD, formatUSD } from '@/lib/goldPrice';
import { TrendingUp, DollarSign, ShoppingBag, Package, RefreshCw, Weight } from 'lucide-react';

export default function FinancePage() {
  const [products, setProducts] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [prices, setPrices] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    setRefreshing(true);
    const [p, , prodRes, ordRes] = await Promise.all([
      getLiveGoldPrices(),
      Promise.resolve(null),
      supabase ? supabase.from('products').select('*') : Promise.resolve({ data: [] }),
      supabase ? supabase.from('orders').select('*').order('created_at', { ascending: false }) : Promise.resolve({ data: [] }),
    ]);
    setPrices(p);
    setProducts((prodRes as any)?.data || []);
    setOrders((ordRes as any)?.data || []);
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => { load(); }, []);

  // ===== CALCULATIONS =====
  const totalGrams = products.reduce((s, p) => s + (p.weightGrams || 0) * (p.inStock ? 1 : 0), 0);
  const totalMithqal = totalGrams / 5;
  const stockValueUSD = prices ? products.filter(p => p.inStock).reduce((s, p) => s + (prices.usdPerGram21k * p.weightGrams) + p.makingChargeUSD, 0) : 0;
  const stockValueIQD = stockValueUSD * (prices?.iqdExchangeRate || 1310);

  const totalRevUSD = orders.filter(o => o.status === 'delivered').reduce((s, o) => s + (o.total_usd || 0), 0);
  const pendingRevUSD = orders.filter(o => o.status === 'pending').reduce((s, o) => s + (o.total_usd || 0), 0);
  const totalOrders = orders.length;
  const pendingOrders = orders.filter(o => o.status === 'pending').length;
  const deliveredOrders = orders.filter(o => o.status === 'delivered').length;

  const card = (color: string): React.CSSProperties => ({
    background: 'var(--bg-card)', border: `1px solid ${color}25`,
    borderRadius: '14px', padding: '1.25rem',
  });

  if (loading) return (
    <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--gold-primary)' }}>
      <div style={{ width: '40px', height: '40px', border: '3px solid rgba(197,168,92,0.2)', borderTopColor: 'var(--gold-primary)', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 1rem' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <p>جاري تحميل البيانات المالية...</p>
    </div>
  );

  return (
    <div style={{ paddingBottom: '3rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.75rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <h1 style={{ fontSize: 'clamp(1.3rem,4vw,1.8rem)', color: 'var(--gold-pale)' }}>💰 اللوحة المالية والمخزون</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>نظرة شاملة على المال والذهب</p>
        </div>
        <button onClick={load} disabled={refreshing}
          style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: 'rgba(197,168,92,0.1)', border: '1px solid var(--border-color)', color: 'var(--gold-primary)', borderRadius: '10px', padding: '0.6rem 1.1rem', cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.85rem' }}>
          <RefreshCw size={14} style={{ animation: refreshing ? 'spin 0.8s linear infinite' : 'none' }} /> تحديث
        </button>
      </div>

      {/* Gold Price Banner */}
      {prices && (
        <div style={{ background: 'linear-gradient(135deg,rgba(197,168,92,0.12),rgba(138,111,45,0.08))', border: '1px solid var(--border-color)', borderRadius: '14px', padding: '1.25rem', marginBottom: '1.5rem', display: 'flex', flexWrap: 'wrap', gap: '1.5rem', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <TrendingUp size={20} color="var(--gold-primary)" />
            <span style={{ color: 'var(--gold-pale)', fontWeight: 700, fontSize: '0.9rem' }}>سعر الذهب الحالي</span>
          </div>
          <div><p style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>غرام عيار 21</p><p style={{ color: 'var(--gold-primary)', fontWeight: 700 }}>{formatIQD(prices.usdPerGram21k * prices.iqdExchangeRate)}</p></div>
          <div><p style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>مثقال (5غ) عيار 21</p><p style={{ color: 'var(--gold-primary)', fontWeight: 700 }}>{formatIQD(prices.usdPerGram21k * 5 * prices.iqdExchangeRate)}</p></div>
          <div><p style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>سعر الأوقية</p><p style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>{formatUSD(prices.usdPerOunce)}</p></div>
          <div><p style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>سعر الصرف</p><p style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>{(prices.iqdExchangeRate || 1310).toLocaleString()} د.ع / $</p></div>
        </div>
      )}

      {/* ===== STOCK SECTION ===== */}
      <h2 style={{ color: 'var(--gold-pale)', fontSize: '1.1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <Package size={18} /> المخزون
      </h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(155px,1fr))', gap: '0.875rem', marginBottom: '1.75rem' }}>
        {[
          { label: 'إجمالي المنتجات', value: products.length, sub: `${products.filter(p=>p.inStock).length} متاح`, color: '#c5a85c', icon: <Package size={20}/> },
          { label: 'الوزن المتاح', value: `${totalGrams.toFixed(1)}غ`, sub: `${totalMithqal.toFixed(2)} مثقال`, color: '#f59e0b', icon: <Weight size={20}/> },
          { label: 'قيمة المخزون', value: formatIQD(stockValueIQD), sub: formatUSD(stockValueUSD), color: '#10b981', icon: <DollarSign size={20}/> },
        ].map((c,i)=>(
          <div key={i} style={card(c.color)}>
            <div style={{ color: c.color, marginBottom: '0.5rem' }}>{c.icon}</div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginBottom: '0.25rem' }}>{c.label}</p>
            <p style={{ fontSize: 'clamp(1rem,3vw,1.5rem)', color: c.color, fontWeight: 800, lineHeight: 1.2 }}>{c.value}</p>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.72rem', marginTop: '0.2rem' }}>{c.sub}</p>
          </div>
        ))}
      </div>

      {/* ===== STOCK TABLE ===== */}
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '14px', overflow: 'hidden', marginBottom: '2rem' }}>
        <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ color: 'var(--gold-pale)', fontSize: '0.95rem' }}>تفاصيل المخزون</h3>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '600px' }}>
            <thead>
              <tr style={{ background: 'rgba(197,168,92,0.05)' }}>
                {['المنتج', 'العيار', 'الوزن', 'المثقال', 'الأجرة', 'سعر البيع IQD', 'سعر البيع $', 'الحالة'].map(h => (
                  <th key={h} style={{ padding: '0.65rem 0.875rem', color: 'var(--gold-primary)', textAlign: 'right', fontSize: '0.75rem', borderBottom: '1px solid var(--border-color)', fontWeight: 600, whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {products.map((p, i) => {
                const priceUSD = prices ? (prices.usdPerGram21k * p.weightGrams) + p.makingChargeUSD : 0;
                const priceIQD = priceUSD * (prices?.iqdExchangeRate || 1310);
                return (
                  <tr key={p.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)' }}>
                    <td style={{ padding: '0.6rem 0.875rem', color: 'var(--text-secondary)', fontSize: '0.82rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        {p.imageUrl && <img src={p.imageUrl.split(',')[0] || '/logo.jpg'} alt="" style={{ width: '28px', height: '28px', borderRadius: '5px', objectFit: 'cover' }} onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />}
                        <span style={{ maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</span>
                      </div>
                    </td>
                    <td style={{ padding: '0.6rem 0.875rem', color: 'var(--gold-primary)', fontSize: '0.82rem', fontWeight: 600 }}>{p.karat}</td>
                    <td style={{ padding: '0.6rem 0.875rem', color: 'var(--text-secondary)', fontSize: '0.82rem' }}>{p.weightGrams}غ</td>
                    <td style={{ padding: '0.6rem 0.875rem', color: 'var(--text-muted)', fontSize: '0.78rem' }}>{(p.weightGrams / 5).toFixed(2)}</td>
                    <td style={{ padding: '0.6rem 0.875rem', color: 'var(--text-muted)', fontSize: '0.78rem' }}>${p.makingChargeUSD}</td>
                    <td style={{ padding: '0.6rem 0.875rem', color: 'var(--gold-primary)', fontSize: '0.82rem', fontWeight: 600, whiteSpace: 'nowrap' }}>{prices ? formatIQD(priceIQD) : '...'}</td>
                    <td style={{ padding: '0.6rem 0.875rem', color: 'var(--text-muted)', fontSize: '0.78rem', whiteSpace: 'nowrap' }}>{prices ? formatUSD(priceUSD) : '...'}</td>
                    <td style={{ padding: '0.6rem 0.875rem' }}>
                      <span style={{ background: p.inStock ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)', color: p.inStock ? '#10b981' : '#ef4444', padding: '0.2rem 0.55rem', borderRadius: '5px', fontSize: '0.72rem', fontWeight: 600 }}>
                        {p.inStock ? 'متاح' : 'نفذ'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr style={{ background: 'rgba(197,168,92,0.06)', borderTop: '2px solid var(--border-color)' }}>
                <td colSpan={2} style={{ padding: '0.75rem 0.875rem', color: 'var(--gold-primary)', fontWeight: 700, fontSize: '0.85rem' }}>الإجمالي</td>
                <td style={{ padding: '0.75rem 0.875rem', color: 'var(--gold-primary)', fontWeight: 700, fontSize: '0.85rem' }}>{totalGrams.toFixed(2)}غ</td>
                <td style={{ padding: '0.75rem 0.875rem', color: 'var(--gold-primary)', fontWeight: 700, fontSize: '0.85rem' }}>{totalMithqal.toFixed(2)}</td>
                <td colSpan={2} style={{ padding: '0.75rem 0.875rem', color: 'var(--gold-primary)', fontWeight: 700, fontSize: '0.85rem' }}>{formatIQD(stockValueIQD)}</td>
                <td style={{ padding: '0.75rem 0.875rem', color: 'var(--gold-primary)', fontWeight: 700, fontSize: '0.85rem' }}>{formatUSD(stockValueUSD)}</td>
                <td style={{ padding: '0.75rem 0.875rem', color: 'var(--text-muted)', fontSize: '0.78rem' }}>{products.filter(p => p.inStock).length}/{products.length}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* ===== SALES SECTION ===== */}
      <h2 style={{ color: 'var(--gold-pale)', fontSize: '1.1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <ShoppingBag size={18} /> المبيعات والطلبات
      </h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(155px,1fr))', gap: '0.875rem', marginBottom: '1.5rem' }}>
        {[
          { label: 'إجمالي الطلبات', value: totalOrders, sub: '', color: '#6366f1' },
          { label: 'طلبات معلقة', value: pendingOrders, sub: formatIQD(pendingRevUSD * (prices?.iqdExchangeRate||1310)), color: '#f59e0b' },
          { label: 'طلبات مسلّمة', value: deliveredOrders, sub: '', color: '#10b981' },
          { label: 'إيرادات مسلّمة', value: formatIQD(totalRevUSD * (prices?.iqdExchangeRate||1310)), sub: formatUSD(totalRevUSD), color: '#c5a85c' },
        ].map((c,i)=>(
          <div key={i} style={card(c.color)}>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginBottom: '0.25rem' }}>{c.label}</p>
            <p style={{ fontSize: 'clamp(1rem,3vw,1.5rem)', color: c.color, fontWeight: 800 }}>{c.value}</p>
            {c.sub && <p style={{ color: 'var(--text-muted)', fontSize: '0.72rem', marginTop: '0.2rem' }}>{c.sub}</p>}
          </div>
        ))}
      </div>

      {/* Recent orders mini table */}
      {orders.length > 0 && (
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '14px', overflow: 'hidden' }}>
          <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between' }}>
            <h3 style={{ color: 'var(--gold-pale)', fontSize: '0.95rem' }}>آخر الطلبات</h3>
            <a href="/admin/orders" style={{ color: 'var(--gold-primary)', fontSize: '0.8rem' }}>عرض الكل ←</a>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '480px' }}>
              <thead>
                <tr style={{ background: 'rgba(197,168,92,0.04)' }}>
                  {['العميل', 'المبلغ IQD', 'المبلغ $', 'الحالة', 'التاريخ'].map(h => (
                    <th key={h} style={{ padding: '0.6rem 0.875rem', color: 'var(--gold-primary)', textAlign: 'right', fontSize: '0.75rem', borderBottom: '1px solid var(--border-color)', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {orders.slice(0, 8).map(o => {
                  const statusC: Record<string, string> = { pending: '#f59e0b', confirmed: '#6366f1', shipped: '#3b82f6', delivered: '#10b981', cancelled: '#ef4444' };
                  const statusL: Record<string, string> = { pending: '⏳ معلق', confirmed: '✅ مؤكد', shipped: '🚚 شحن', delivered: '📦 تسليم', cancelled: '❌ ملغي' };
                  return (
                    <tr key={o.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                      <td style={{ padding: '0.6rem 0.875rem', color: 'var(--text-secondary)', fontSize: '0.82rem' }}>{o.customer_name || '—'}</td>
                      <td style={{ padding: '0.6rem 0.875rem', color: 'var(--gold-primary)', fontSize: '0.82rem', fontWeight: 600, whiteSpace: 'nowrap' }}>{o.total_iqd ? formatIQD(o.total_iqd) : formatIQD((o.total_usd||0) * (prices?.iqdExchangeRate||1310))}</td>
                      <td style={{ padding: '0.6rem 0.875rem', color: 'var(--text-muted)', fontSize: '0.78rem' }}>{formatUSD(o.total_usd || 0)}</td>
                      <td style={{ padding: '0.6rem 0.875rem' }}>
                        <span style={{ background: `${statusC[o.status]||'#666'}15`, color: statusC[o.status]||'#666', padding: '0.2rem 0.5rem', borderRadius: '5px', fontSize: '0.72rem', fontWeight: 600 }}>
                          {statusL[o.status]||o.status}
                        </span>
                      </td>
                      <td style={{ padding: '0.6rem 0.875rem', color: 'var(--text-muted)', fontSize: '0.75rem', whiteSpace: 'nowrap' }}>{new Date(o.created_at).toLocaleDateString('ar-IQ')}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
