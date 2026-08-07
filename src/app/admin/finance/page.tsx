"use client";
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { getLiveGoldPrices, formatIQD, formatUSD } from '@/lib/goldPrice';
import { TrendingUp, DollarSign, ShoppingBag, Package, RefreshCw, Weight } from 'lucide-react';
import styles from './page.module.css';

export default function FinancePage() {
  const [products, setProducts] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [prices, setPrices] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    setRefreshing(true);
    const [p, prodRes, ordRes] = await Promise.all([
      getLiveGoldPrices(),
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
  // Filter only in-stock products for physical inventory metrics
  const inStockProducts = products.filter(p => p.inStock);
  const goldProducts = inStockProducts.filter(p => p.metal !== 'silver');
  const silverProducts = inStockProducts.filter(p => p.metal === 'silver');

  const totalGoldGrams = goldProducts.reduce((s, p) => s + (p.weightGrams || 0), 0);
  const totalGoldMithqal = totalGoldGrams / 5;

  const totalSilverGrams = silverProducts.reduce((s, p) => s + (p.weightGrams || 0), 0);
  const totalSilverMithqal = totalSilverGrams / 5;

  // Correct calculation based on metal type (silver vs 21k gold)
  const stockValueUSD = prices ? inStockProducts.reduce((s, p) => {
    const gramPrice = p.metal === 'silver' ? prices.usdPerGramSilver : prices.usdPerGram21k;
    return s + (gramPrice * (p.weightGrams || 0)) + (p.makingChargeUSD || 0);
  }, 0) : 0;

  const stockValueIQD = stockValueUSD * (prices?.iqdExchangeRate || 1310);

  // Sales/Orders Calculations
  const totalRevUSD = orders.filter(o => o.status === 'delivered').reduce((s, o) => s + (o.total_usd || 0), 0);
  const pendingRevUSD = orders.filter(o => o.status === 'pending').reduce((s, o) => s + (o.total_usd || 0), 0);
  const totalOrders = orders.length;
  const pendingOrders = orders.filter(o => o.status === 'pending').length;
  const deliveredOrders = orders.filter(o => o.status === 'delivered').length;

  if (loading) return (
    <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--gold-primary)' }}>
      <div style={{ width: '40px', height: '40px', border: '3px solid rgba(197,168,92,0.2)', borderTopColor: 'var(--gold-primary)', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 1rem' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <p>جاري تحميل البيانات المالية...</p>
    </div>
  );

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.headerRow}>
        <div>
          <h1 className={styles.title}>💰 اللوحة المالية والمخزون</h1>
          <p className={styles.subtitle}>نظرة شاملة ودقيقة على المال والذهب والفضة</p>
        </div>
        <button onClick={load} disabled={refreshing} className={styles.refreshBtn}>
          <RefreshCw size={14} style={{ animation: refreshing ? 'spin 0.8s linear infinite' : 'none' }} /> تحديث
        </button>
      </div>

      {/* Gold & Silver Prices Banner */}
      {prices && (
        <div className={styles.priceBanner}>
          <div className={styles.bannerTitleRow}>
            <TrendingUp size={18} color="var(--gold-primary)" />
            <span style={{ color: 'var(--gold-pale)', fontWeight: 700, fontSize: '0.85rem' }}>الأسعار الحالية</span>
          </div>
          <div>
            <p className={styles.bannerItemLabel}>غرام ذهب 21</p>
            <p className={styles.bannerItemValue}>{formatIQD(prices.usdPerGram21k * prices.iqdExchangeRate)}</p>
          </div>
          <div>
            <p className={styles.bannerItemLabel}>مثقال ذهب 21</p>
            <p className={styles.bannerItemValue}>{formatIQD(prices.usdPerGram21k * 5 * prices.iqdExchangeRate)}</p>
          </div>
          <div>
            <p className={styles.bannerItemLabel}>غرام الفضة</p>
            <p className={styles.bannerItemValueSecondary}>{formatIQD(prices.usdPerGramSilver * prices.iqdExchangeRate)}</p>
          </div>
          <div>
            <p className={styles.bannerItemLabel}>سعر الصرف</p>
            <p className={styles.bannerItemValueSecondary}>{(prices.iqdExchangeRate || 1310).toLocaleString()} د.ع / $</p>
          </div>
        </div>
      )}

      {/* ===== STOCK SECTION ===== */}
      <h2 className={styles.sectionTitle}>
        <Package size={18} /> جرد المخزون المتوفر
      </h2>
      <div className={styles.statsGrid}>
        <div className={styles.card}>
          <div className={styles.cardIcon} style={{ color: '#c5a85c' }}><Package size={20}/></div>
          <p className={styles.cardLabel}>إجمالي المنتجات</p>
          <p className={styles.cardValue} style={{ color: '#c5a85c' }}>{products.length}</p>
          <p className={styles.cardSub}>{inStockProducts.length} متوفر حالياً للعرض</p>
        </div>
        <div className={styles.card}>
          <div className={styles.cardIcon} style={{ color: '#f59e0b' }}><Weight size={20}/></div>
          <p className={styles.cardLabel}>الذهب المتوفر</p>
          <p className={styles.cardValue} style={{ color: '#f59e0b' }}>{totalGoldGrams.toFixed(1)}غ</p>
          <p className={styles.cardSub}>{totalGoldMithqal.toFixed(2)} مثقال (عيار 21)</p>
        </div>
        <div className={styles.card}>
          <div className={styles.cardIcon} style={{ color: '#cbd5e1' }}><Weight size={20}/></div>
          <p className={styles.cardLabel}>الفضة المتوفرة</p>
          <p className={styles.cardValue} style={{ color: '#cbd5e1' }}>{totalSilverGrams.toFixed(1)}غ</p>
          <p className={styles.cardSub}>{totalSilverMithqal.toFixed(2)} مثقال (عيار الفضة)</p>
        </div>
        <div className={styles.card}>
          <div className={styles.cardIcon} style={{ color: '#10b981' }}><DollarSign size={20}/></div>
          <p className={styles.cardLabel}>القيمة الكلية للمخزون</p>
          <p className={styles.cardValue} style={{ color: '#10b981' }}>{formatIQD(stockValueIQD)}</p>
          <p className={styles.cardSub}>{formatUSD(stockValueUSD)} (معدن + صياغة)</p>
        </div>
      </div>

      {/* ===== STOCK LIST DETAILS ===== */}
      <div className={styles.tableCard}>
        <div className={styles.tableHeaderRow}>
          <h3 className={styles.tableHeaderTitle}>تفاصيل قطع المخزون المتوفرة بالمحل ({inStockProducts.length} قطعة)</h3>
        </div>

        {/* Desktop View */}
        <div className={styles.desktopTableContainer}>
          <div style={{ overflowX: 'auto' }}>
            <table className={styles.table}>
              <thead>
                <tr style={{ background: 'rgba(197,168,92,0.05)' }}>
                  {['المنتج', 'المعدن / العيار', 'الوزن', 'المثقال', 'الأجرة', 'سعر البيع IQD', 'سعر البيع $', 'الحالة'].map(h => (
                    <th key={h} className={styles.th}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {inStockProducts.map((p, i) => {
                  const gramPrice = p.metal === 'silver' ? prices?.usdPerGramSilver : prices?.usdPerGram21k;
                  const priceUSD = prices ? (gramPrice * (p.weightGrams || 0)) + (p.makingChargeUSD || 0) : 0;
                  const priceIQD = priceUSD * (prices?.iqdExchangeRate || 1310);
                  return (
                    <tr key={p.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)' }}>
                      <td className={styles.td}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          {p.imageUrl && <img src={p.imageUrl} alt="" style={{ width: '28px', height: '28px', borderRadius: '5px', objectFit: 'cover' }} onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />}
                          <span style={{ maxWidth: '140px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</span>
                        </div>
                      </td>
                      <td className={styles.td} style={{ color: 'var(--gold-primary)', fontWeight: 600 }}>
                        {p.metal === 'silver' ? 'فضة' : `ذهب عيار ${p.karat || 21}`}
                      </td>
                      <td className={styles.td}>{p.weightGrams}غ</td>
                      <td className={styles.td} style={{ color: 'var(--text-muted)' }}>{(p.weightGrams / 5).toFixed(2)}</td>
                      <td className={styles.td} style={{ color: 'var(--text-muted)' }}>${p.makingChargeUSD}</td>
                      <td className={styles.td} style={{ color: 'var(--gold-primary)', fontWeight: 600, whiteSpace: 'nowrap' }}>{prices ? formatIQD(priceIQD) : '...'}</td>
                      <td className={styles.td} style={{ color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{prices ? formatUSD(priceUSD) : '...'}</td>
                      <td className={styles.td}>
                        <span style={{ background: 'rgba(16,185,129,0.12)', color: '#10b981', padding: '0.2rem 0.55rem', borderRadius: '5px', fontSize: '0.72rem', fontWeight: 600 }}>
                          متوفر
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot className={styles.tfoot}>
                <tr>
                  <td colSpan={2} className={styles.tdFoot}>الإجمالي المتوفر</td>
                  <td className={styles.tdFoot}>{inStockProducts.reduce((s, p) => s + (p.weightGrams || 0), 0).toFixed(2)}غ</td>
                  <td className={styles.tdFoot}>{(inStockProducts.reduce((s, p) => s + (p.weightGrams || 0), 0) / 5).toFixed(2)}</td>
                  <td colSpan={2} className={styles.tdFoot}>{formatIQD(stockValueIQD)}</td>
                  <td className={styles.tdFoot}>{formatUSD(stockValueUSD)}</td>
                  <td className={styles.tdFoot} style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>{inStockProducts.length} قطعة</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Mobile View */}
        <div className={styles.mobileCardsContainer}>
          {inStockProducts.map(p => {
            const gramPrice = p.metal === 'silver' ? prices?.usdPerGramSilver : prices?.usdPerGram21k;
            const priceUSD = prices ? (gramPrice * (p.weightGrams || 0)) + (p.makingChargeUSD || 0) : 0;
            const priceIQD = priceUSD * (prices?.iqdExchangeRate || 1310);
            return (
              <div key={p.id} className={styles.mobileProdCard}>
                {p.imageUrl && (
                  <img src={p.imageUrl} alt="" className={styles.mobileProdImg} onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                )}
                <div className={styles.mobileProdInfo}>
                  <p className={styles.mobileProdName}>{p.name}</p>
                  <div className={styles.mobileProdMetaRow}>
                    <span className={styles.mobileProdKarat}>{p.metal === 'silver' ? 'فضة' : `ذهب عيار ${p.karat || 21}`}</span>
                    <span>•</span>
                    <span>الوزن: {p.weightGrams}غ ({(p.weightGrams / 5).toFixed(1)} مثقال)</span>
                    <span>•</span>
                    <span>أجرة: ${p.makingChargeUSD}</span>
                  </div>
                  <div className={styles.mobileProdPriceRow}>
                    <span className={styles.mobileProdPriceIQD}>{prices ? formatIQD(priceIQD) : '...'}</span>
                    <span className={styles.mobileProdPriceUSD}>{prices ? formatUSD(priceUSD) : '...'}</span>
                  </div>
                </div>
              </div>
            );
          })}

          <div className={styles.mobileTotalSummary}>
            <div className={styles.mobileTotalRow}>
              <span className={styles.mobileTotalLabel}>الذهب المتوفر:</span>
              <span className={styles.mobileTotalVal}>{totalGoldGrams.toFixed(1)}غ ({totalGoldMithqal.toFixed(2)} مثقال)</span>
            </div>
            <div className={styles.mobileTotalRow}>
              <span className={styles.mobileTotalLabel}>الفضة المتوفرة:</span>
              <span className={styles.mobileTotalVal}>{totalSilverGrams.toFixed(1)}غ ({totalSilverMithqal.toFixed(2)} مثقال)</span>
            </div>
            <div className={styles.mobileTotalRow}>
              <span className={styles.mobileTotalLabel}>إجمالي القيمة التقديرية (IQD):</span>
              <span className={styles.mobileTotalVal}>{formatIQD(stockValueIQD)}</span>
            </div>
            <div className={styles.mobileTotalRow}>
              <span className={styles.mobileTotalLabel}>إجمالي القيمة التقديرية ($):</span>
              <span className={styles.mobileTotalVal}>{formatUSD(stockValueUSD)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ===== SALES SECTION ===== */}
      <h2 className={styles.sectionTitle}>
        <ShoppingBag size={18} /> المبيعات والطلبات المستلمة
      </h2>
      <div className={styles.statsGrid}>
        <div className={styles.card} style={{ borderColor: 'rgba(99,102,241,0.25)' }}>
          <p className={styles.cardLabel}>إجمالي الطلبات</p>
          <p className={styles.cardValue} style={{ color: '#818cf8' }}>{totalOrders}</p>
          <p className={styles.cardSub}>منذ انطلاق الموقع</p>
        </div>
        <div className={styles.card} style={{ borderColor: 'rgba(245,158,11,0.25)' }}>
          <p className={styles.cardLabel}>طلبات معلقة</p>
          <p className={styles.cardValue} style={{ color: '#f59e0b' }}>{pendingOrders}</p>
          <p className={styles.cardSub}>بقيمة قيد الانتظار: {formatIQD(pendingRevUSD * (prices?.iqdExchangeRate || 1310))}</p>
        </div>
        <div className={styles.card} style={{ borderColor: 'rgba(16,185,129,0.25)' }}>
          <p className={styles.cardLabel}>طلبات مسلّمة ومكتملة</p>
          <p className={styles.cardValue} style={{ color: '#10b981' }}>{deliveredOrders}</p>
          <p className={styles.cardSub}>بنسبة نجاح {totalOrders ? ((deliveredOrders/totalOrders)*100).toFixed(0) : 0}%</p>
        </div>
        <div className={styles.card} style={{ borderColor: 'rgba(197,168,92,0.25)' }}>
          <p className={styles.cardLabel}>إجمالي إيرادات المبيعات</p>
          <p className={styles.cardValue} style={{ color: 'var(--gold-primary)' }}>{formatIQD(totalRevUSD * (prices?.iqdExchangeRate || 1310))}</p>
          <p className={styles.cardSub}>{formatUSD(totalRevUSD)} (للطلبات المسلمة فقط)</p>
        </div>
      </div>

      {/* Recent orders mini table */}
      {orders.length > 0 && (
        <div className={styles.tableCard}>
          <div className={styles.tableHeaderRow}>
            <h3 className={styles.tableHeaderTitle}>آخر الطلبات المستلمة (تحديث تلقائي)</h3>
            <a href="/admin/orders" style={{ color: 'var(--gold-primary)', fontSize: '0.8rem', fontWeight: 600 }}>عرض الكل ←</a>
          </div>

          {/* Desktop View */}
          <div className={styles.desktopTableContainer}>
            <div style={{ overflowX: 'auto' }}>
              <table className={styles.table}>
                <thead>
                  <tr style={{ background: 'rgba(197,168,92,0.04)' }}>
                    {['العميل', 'رقم الهاتف', 'المبلغ IQD', 'المبلغ $', 'الحالة', 'التاريخ'].map(h => (
                      <th key={h} className={styles.th}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {orders.slice(0, 8).map(o => {
                    const statusC: Record<string, string> = { pending: '#f59e0b', confirmed: '#6366f1', shipped: '#3b82f6', delivered: '#10b981', cancelled: '#ef4444' };
                    const statusL: Record<string, string> = { pending: '⏳ معلق', confirmed: '✅ مؤكد', shipped: '🚚 شحن', delivered: '📦 تسليم', cancelled: '❌ ملغي' };
                    return (
                      <tr key={o.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                        <td className={styles.td}>{o.customer_name || '—'}</td>
                        <td className={styles.td} style={{ direction: 'ltr', textAlign: 'right' }}>{o.customer_phone || '—'}</td>
                        <td className={styles.td} style={{ color: 'var(--gold-primary)', fontWeight: 600, whiteSpace: 'nowrap' }}>{o.total_iqd ? formatIQD(o.total_iqd) : formatIQD((o.total_usd||0) * (prices?.iqdExchangeRate||1310))}</td>
                        <td className={styles.td} style={{ color: 'var(--text-muted)' }}>{formatUSD(o.total_usd || 0)}</td>
                        <td className={styles.td}>
                          <span style={{ background: `${statusC[o.status]||'#666'}15`, color: statusC[o.status]||'#666', padding: '0.2rem 0.5rem', borderRadius: '5px', fontSize: '0.72rem', fontWeight: 600 }}>
                            {statusL[o.status]||o.status}
                          </span>
                        </td>
                        <td className={styles.td} style={{ color: 'var(--text-muted)', fontSize: '0.75rem', whiteSpace: 'nowrap' }}>{new Date(o.created_at).toLocaleDateString('ar-IQ')}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile View */}
          <div className={styles.mobileCardsContainer}>
            {orders.slice(0, 6).map(o => {
              const statusC: Record<string, string> = { pending: '#f59e0b', confirmed: '#6366f1', shipped: '#3b82f6', delivered: '#10b981', cancelled: '#ef4444' };
              const statusL: Record<string, string> = { pending: ' معلق', confirmed: ' مؤكد', shipped: ' شحن', delivered: ' تسليم', cancelled: ' ملغي' };
              const totalIQD = o.total_iqd ? o.total_iqd : (o.total_usd||0) * (prices?.iqdExchangeRate||1310);
              return (
                <div key={o.id} className={styles.mobileProdCard}>
                  <div className={styles.mobileProdInfo}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <p className={styles.mobileProdName} style={{ color: 'var(--gold-pale)' }}>{o.customer_name || 'عميل مجهول'}</p>
                      <span style={{ background: `${statusC[o.status]||'#666'}15`, color: statusC[o.status]||'#666', padding: '0.15rem 0.4rem', borderRadius: '4px', fontSize: '0.68rem', fontWeight: 600 }}>
                        {statusL[o.status]||o.status}
                      </span>
                    </div>
                    <div className={styles.mobileProdMetaRow} style={{ marginTop: '0.15rem' }}>
                      <span>الهاتف: {o.customer_phone || '—'}</span>
                      <span>•</span>
                      <span>التاريخ: {new Date(o.created_at).toLocaleDateString('ar-IQ')}</span>
                    </div>
                    <div className={styles.mobileProdPriceRow} style={{ marginTop: '0.3rem' }}>
                      <span className={styles.mobileProdPriceIQD}>{formatIQD(totalIQD)}</span>
                      <span className={styles.mobileProdPriceUSD}>{formatUSD(o.total_usd || 0)}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
