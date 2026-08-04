"use client";
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { getLiveGoldPrices, formatIQD, formatUSD } from '@/lib/goldPrice';
import { Package, TrendingUp, Weight, DollarSign } from 'lucide-react';

export default function StockPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [prices, setPrices] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [p] = await Promise.all([getLiveGoldPrices()]);
      setPrices(p);
      if (supabase) {
        const { data } = await supabase.from('products').select('*').order('name');
        setProducts(data || []);
      }
      setLoading(false);
    }
    load();
  }, []);

  const totalGrams = products.reduce((s, p) => s + (p.weightGrams || 0), 0);
  const totalMithqal = totalGrams / 5;
  const totalValueUSD = prices ? products.reduce((s, p) => {
    const gram = prices.usdPerGram21k;
    return s + (gram * (p.weightGrams || 0)) + (p.makingChargeUSD || 0);
  }, 0) : 0;
  const inStock = products.filter(p => p.inStock).length;

  const cardStyle = (color: string): React.CSSProperties => ({
    background: 'var(--bg-card)', border: `1px solid ${color}30`, borderRadius: '14px',
    padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem',
  });

  return (
    <div>
      <h1 style={{ fontSize: '1.75rem', color: 'var(--gold-pale)', marginBottom: '0.4rem' }}>📦 المخزون</h1>
      <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>نظرة شاملة على جميع المنتجات والأوزان والقيم</p>

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        <div style={cardStyle('#c5a85c')}>
          <Package size={22} color="var(--gold-primary)" />
          <p style={{ color: 'var(--text-muted)', fontSize: '0.83rem' }}>إجمالي المنتجات</p>
          <p style={{ fontSize: '2rem', color: 'var(--gold-primary)', fontWeight: 800 }}>{products.length}</p>
          <p style={{ color: '#10b981', fontSize: '0.8rem' }}>{inStock} متاح</p>
        </div>
        <div style={cardStyle('#f59e0b')}>
          <Weight size={22} color="#f59e0b" />
          <p style={{ color: 'var(--text-muted)', fontSize: '0.83rem' }}>إجمالي الوزن</p>
          <p style={{ fontSize: '1.8rem', color: '#f59e0b', fontWeight: 800 }}>{totalGrams.toFixed(2)}غ</p>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{totalMithqal.toFixed(2)} مثقال</p>
        </div>
        <div style={cardStyle('#10b981')}>
          <DollarSign size={22} color="#10b981" />
          <p style={{ color: 'var(--text-muted)', fontSize: '0.83rem' }}>القيمة الإجمالية (USD)</p>
          <p style={{ fontSize: '1.5rem', color: '#10b981', fontWeight: 800 }}>{formatUSD(totalValueUSD)}</p>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{prices ? formatIQD(totalValueUSD * prices.iqdExchangeRate) : '...'}</p>
        </div>
        <div style={cardStyle('#6366f1')}>
          <TrendingUp size={22} color="#6366f1" />
          <p style={{ color: 'var(--text-muted)', fontSize: '0.83rem' }}>سعر المثقال 21</p>
          <p style={{ fontSize: '1.5rem', color: '#6366f1', fontWeight: 800 }}>{prices ? formatIQD(prices.iqdPerMithqal21k) : '...'}</p>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{prices ? formatUSD(prices.usdPerMithqal21k) : '...'}</p>
        </div>
      </div>

      {/* Products Table */}
      {loading ? (
        <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '3rem' }}>جاري التحميل...</p>
      ) : (
        <div style={{ background: 'var(--bg-card)', borderRadius: '14px', border: '1px solid var(--border-color)', overflow: 'hidden' }}>
          <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border-color)' }}>
            <h3 style={{ color: 'var(--gold-pale)' }}>تفاصيل المخزون الكاملة</h3>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'rgba(197,168,92,0.05)' }}>
                  {['المنتج','العيار','الوزن (غ)','المثقال','أجرة $','السعر IQD','السعر $','الحالة'].map(h => (
                    <th key={h} style={{ padding: '0.75rem 1rem', color: 'var(--gold-primary)', textAlign: 'right', fontSize: '0.8rem', borderBottom: '1px solid var(--border-color)', fontWeight: 600, whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {products.map((p, i) => {
                  const priceUSD = prices ? (prices.usdPerGram21k * p.weightGrams) + p.makingChargeUSD : 0;
                  const priceIQD = prices ? priceUSD * prices.iqdExchangeRate : 0;
                  return (
                    <tr key={p.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)' }}>
                      <td style={{ padding: '0.7rem 1rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          {p.imageUrl && <img src={p.imageUrl} alt="" style={{ width: '32px', height: '32px', borderRadius: '6px', objectFit: 'cover' }} onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />}
                          {p.name}
                        </div>
                      </td>
                      <td style={{ padding: '0.7rem 1rem', color: 'var(--gold-primary)', fontSize: '0.85rem', fontWeight: 600 }}>{p.karat}</td>
                      <td style={{ padding: '0.7rem 1rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{p.weightGrams}</td>
                      <td style={{ padding: '0.7rem 1rem', color: 'var(--text-muted)', fontSize: '0.82rem' }}>{(p.weightGrams / 5).toFixed(2)}</td>
                      <td style={{ padding: '0.7rem 1rem', color: 'var(--text-muted)', fontSize: '0.82rem' }}>${p.makingChargeUSD}</td>
                      <td style={{ padding: '0.7rem 1rem', color: 'var(--gold-primary)', fontSize: '0.85rem', fontWeight: 600, whiteSpace: 'nowrap' }}>{prices ? formatIQD(priceIQD) : '...'}</td>
                      <td style={{ padding: '0.7rem 1rem', color: 'var(--text-muted)', fontSize: '0.8rem', whiteSpace: 'nowrap' }}>{prices ? formatUSD(priceUSD) : '...'}</td>
                      <td style={{ padding: '0.7rem 1rem' }}>
                        <span style={{ background: p.inStock ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)', color: p.inStock ? '#10b981' : '#ef4444', padding: '0.25rem 0.6rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 600 }}>
                          {p.inStock ? 'متاح' : 'نفذ'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr style={{ background: 'rgba(197,168,92,0.06)', borderTop: '2px solid var(--border-color)' }}>
                  <td colSpan={2} style={{ padding: '0.875rem 1rem', color: 'var(--gold-primary)', fontWeight: 700 }}>الإجمالي</td>
                  <td style={{ padding: '0.875rem 1rem', color: 'var(--gold-primary)', fontWeight: 700 }}>{totalGrams.toFixed(2)}غ</td>
                  <td style={{ padding: '0.875rem 1rem', color: 'var(--gold-primary)', fontWeight: 700 }}>{totalMithqal.toFixed(2)}</td>
                  <td colSpan={2} style={{ padding: '0.875rem 1rem', color: 'var(--gold-primary)', fontWeight: 700 }}>{prices ? formatIQD(totalValueUSD * prices.iqdExchangeRate) : '...'}</td>
                  <td style={{ padding: '0.875rem 1rem', color: 'var(--gold-primary)', fontWeight: 700 }}>{formatUSD(totalValueUSD)}</td>
                  <td style={{ padding: '0.875rem 1rem', color: 'var(--text-muted)', fontSize: '0.8rem' }}>{inStock} / {products.length}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
