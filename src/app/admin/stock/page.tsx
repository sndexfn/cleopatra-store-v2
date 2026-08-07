"use client";
import { useEffect, useState } from 'react';
import { supabase, Product } from '@/lib/supabase';
import { getLiveGoldPrices, formatIQD, formatUSD, GoldPrices } from '@/lib/goldPrice';
import { Package, TrendingUp, Weight, DollarSign } from 'lucide-react';
import styles from './page.module.css';

export default function StockPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [prices, setPrices] = useState<GoldPrices | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [p] = await Promise.all([getLiveGoldPrices()]);
      setPrices(p);
      if (supabase) {
        const { data } = await supabase.from('products').select('*').order('name');
        setProducts((data as Product[]) || []);
      }
      setLoading(false);
    }
    load();
  }, []);

  // Separate gold and silver calculations
  const goldProducts = products.filter(p => p.metal !== 'silver');
  const silverProducts = products.filter(p => p.metal === 'silver');

  const totalGoldGrams = goldProducts.reduce((s, p) => s + (p.weightGrams || 0), 0);
  const totalGoldMithqal = totalGoldGrams / 5;

  const totalSilverGrams = silverProducts.reduce((s, p) => s + (p.weightGrams || 0), 0);
  const totalSilverMithqal = totalSilverGrams / 5;

  // Correct calculation based on metal type
  const totalValueUSD = prices ? products.reduce((s, p) => {
    const gramPrice = p.metal === 'silver' ? prices.usdPerGramSilver : prices.usdPerGram21k;
    return s + (gramPrice * (p.weightGrams || 0)) + (p.makingChargeUSD || 0);
  }, 0) : 0;

  const inStock = products.filter(p => p.inStock).length;

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>📦 المخزون الكلي</h1>
      <p className={styles.subtitle}>نظرة شاملة ودقيقة على جميع المنتجات والأوزان والقيم التقديرية</p>

      {/* Summary Cards */}
      <div className={styles.summaryGrid}>
        <div className={styles.card} style={{ border: '1px solid rgba(197,168,92,0.25)' }}>
          <Package size={22} color="var(--gold-primary)" />
          <p className={styles.cardLabel}>إجمالي المنتجات</p>
          <p className={styles.cardValue} style={{ color: 'var(--gold-primary)' }}>{products.length}</p>
          <p className={styles.cardSub} style={{ color: '#10b981', fontWeight: 600 }}>{inStock} قطعة متوفرة بالمحل</p>
        </div>
        <div className={styles.card} style={{ border: '1px solid rgba(245,158,11,0.25)' }}>
          <Weight size={22} color="#f59e0b" />
          <p className={styles.cardLabel}>مخزون الذهب</p>
          <p className={styles.cardValue} style={{ color: '#f59e0b' }}>{totalGoldGrams.toFixed(1)}غ</p>
          <p className={styles.cardSub} style={{ color: 'var(--text-muted)' }}>{totalGoldMithqal.toFixed(2)} مثقال (عيار 21)</p>
        </div>
        <div className={styles.card} style={{ border: '1px solid rgba(203,213,225,0.25)' }}>
          <Weight size={22} color="#cbd5e1" />
          <p className={styles.cardLabel}>مخزون الفضة</p>
          <p className={styles.cardValue} style={{ color: '#cbd5e1' }}>{totalSilverGrams.toFixed(1)}غ</p>
          <p className={styles.cardSub} style={{ color: 'var(--text-muted)' }}>{totalSilverMithqal.toFixed(2)} مثقال</p>
        </div>
        <div className={styles.card} style={{ border: '1px solid rgba(16,185,129,0.25)' }}>
          <DollarSign size={22} color="#10b981" />
          <p className={styles.cardLabel}>القيمة الإجمالية (USD)</p>
          <p className={styles.cardValue} style={{ color: '#10b981' }}>{formatUSD(totalValueUSD)}</p>
          <p className={styles.cardSub} style={{ color: 'var(--text-muted)' }}>
            {prices ? formatIQD(totalValueUSD * prices.iqdExchangeRate) : '...'}
          </p>
        </div>
        <div className={styles.card} style={{ border: '1px solid rgba(99,102,241,0.25)' }}>
          <TrendingUp size={22} color="#6366f1" />
          <p className={styles.cardLabel}>سعر المثقال عيار 21</p>
          <p className={styles.cardValue} style={{ color: '#6366f1' }}>
            {prices ? formatIQD(prices.usdPerGram21k * 5 * prices.iqdExchangeRate) : '...'}
          </p>
          <p className={styles.cardSub} style={{ color: 'var(--text-muted)' }}>
            {prices ? formatUSD(prices.usdPerGram21k * 5) : '...'}
          </p>
        </div>
      </div>

      {/* Products Table */}
      {loading ? (
        <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '3rem' }}>جاري التحميل...</p>
      ) : (
        <div className={styles.tableCard}>
          <div className={styles.tableHeader}>
            <h3>تفاصيل المخزون الكاملة</h3>
          </div>
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr style={{ background: 'rgba(197,168,92,0.05)' }}>
                  {['المنتج','المعدن / العيار','الوزن (غ)','المثقال','أجرة $','السعر IQD','السعر $','الحالة'].map(h => (
                    <th key={h} className={styles.th}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {products.map((p, i) => {
                  const gramPrice = prices ? (p.metal === 'silver' ? prices.usdPerGramSilver : prices.usdPerGram21k) : 0;
                  const priceUSD = (gramPrice * (p.weightGrams || 0)) + (p.makingChargeUSD || 0);
                  const priceIQD = prices ? priceUSD * prices.iqdExchangeRate : 0;
                  return (
                    <tr key={p.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)' }}>
                      <td className={styles.td}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          {p.imageUrl && <img src={p.imageUrl} alt="" style={{ width: '32px', height: '32px', borderRadius: '6px', objectFit: 'cover' }} onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />}
                          <span>{p.name}</span>
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
                        <span style={{ background: p.inStock ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)', color: p.inStock ? '#10b981' : '#ef4444', padding: '0.25rem 0.6rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 600 }}>
                          {p.inStock ? 'متاح' : 'نفذ'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot className={styles.tfoot}>
                <tr>
                  <td colSpan={2} className={styles.tdFoot}>الإجمالي الكلي</td>
                  <td className={styles.tdFoot}>{(totalGoldGrams + totalSilverGrams).toFixed(2)}غ</td>
                  <td className={styles.tdFoot}>{((totalGoldGrams + totalSilverGrams) / 5).toFixed(2)}</td>
                  <td colSpan={2} className={styles.tdFoot}>{prices ? formatIQD(totalValueUSD * prices.iqdExchangeRate) : '...'}</td>
                  <td className={styles.tdFoot}>{formatUSD(totalValueUSD)}</td>
                  <td className={styles.tdFoot} style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{inStock} / {products.length}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
