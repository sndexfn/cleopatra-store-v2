"use client";
import { useEffect, useState } from 'react';
import { supabase, getProducts, Product } from '@/lib/supabase';
import { getLiveGoldPrices, formatIQD, formatUSD, gramsToMithqal } from '@/lib/goldPrice';
import { Scale, Coins, ShieldCheck, Landmark, Check } from 'lucide-react';

export default function StockPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [prices, setPrices] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Cash Register State
  const [cashUSD, setCashUSD] = useState<number>(0);
  const [cashIQD, setCashIQD] = useState<number>(0);
  const [isEditingCash, setIsEditingCash] = useState(false);
  const [inputUSD, setInputUSD] = useState('0');
  const [inputIQD, setInputIQD] = useState('0');

  useEffect(() => {
    async function load() {
      // 1. Fetch gold/silver market prices
      const livePrices = await getLiveGoldPrices();
      setPrices(livePrices);

      // 2. Fetch products
      let list: Product[] = [];
      try {
        if (supabase) {
          const { data } = await supabase.from('products').select('*');
          if (data) list = data as Product[];
        } else {
          list = await getProducts();
        }
      } catch (e) {
        console.error("Error fetching stock products", e);
      }
      setProducts(list);

      // 3. Load Cash Drawer from local storage
      if (typeof window !== 'undefined') {
        const savedUSD = localStorage.getItem('cleopatra_cash_usd');
        const savedIQD = localStorage.getItem('cleopatra_cash_iqd');
        if (savedUSD) {
          setCashUSD(parseFloat(savedUSD));
          setInputUSD(savedUSD);
        }
        if (savedIQD) {
          setCashIQD(parseFloat(savedIQD));
          setInputIQD(savedIQD);
        }
      }

      setLoading(false);
    }
    load();
  }, []);

  const handleSaveCash = () => {
    const usdVal = parseFloat(inputUSD) || 0;
    const iqdVal = parseFloat(inputIQD) || 0;
    setCashUSD(usdVal);
    setCashIQD(iqdVal);
    if (typeof window !== 'undefined') {
      localStorage.setItem('cleopatra_cash_usd', String(usdVal));
      localStorage.setItem('cleopatra_cash_iqd', String(iqdVal));
    }
    setIsEditingCash(false);
  };

  // Perform accurate calculations
  let goldGrams = 0;
  let silverGrams = 0;
  let totalGoldMakingUSD = 0;
  let totalSilverMakingUSD = 0;
  let inStockCount = 0;
  let outOfStockCount = 0;

  products.forEach(p => {
    if (p.inStock) {
      inStockCount++;
    } else {
      outOfStockCount++;
    }

    const metal = p.metal || 'gold';
    if (metal === 'silver') {
      silverGrams += p.weightGrams;
      totalSilverMakingUSD += p.makingChargeUSD;
    } else {
      goldGrams += p.weightGrams;
      totalGoldMakingUSD += p.makingChargeUSD;
    }
  });

  // Calculate dynamic asset portfolio valuation (Metal Weight * Spot Gram Price + Making Charges)
  let totalStockValuationUSD = 0;
  if (prices) {
    const goldValueUSD = goldGrams * prices.usdPerGram21k + totalGoldMakingUSD;
    const silverValueUSD = silverGrams * (prices.usdPerGramSilver || 1) + totalSilverMakingUSD;
    totalStockValuationUSD = goldValueUSD + silverValueUSD;
  }

  // Combined Drawer Cash + Inventory Valuation
  const exchangeRate = prices?.iqdExchangeRate || 1310;
  const cashUSDInIQD = cashUSD * exchangeRate;
  const totalCombinedCashIQD = cashUSDInIQD + cashIQD;
  const totalCombinedCashUSD = cashUSD + (cashIQD / exchangeRate);

  const totalBusinessValueUSD = totalStockValuationUSD + totalCombinedCashUSD;
  const totalBusinessValueIQD = (totalStockValuationUSD * exchangeRate) + totalCombinedCashIQD;

  const cardStyle = (_color: string): React.CSSProperties => ({
    background: 'var(--bg-card)',
    border: `1px solid var(--border-color)`,
    borderRadius: '16px',
    padding: '1.5rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
    position: 'relative',
    overflow: 'hidden'
  });

  const sectionHeaderStyle = {
    fontSize: '1.2rem',
    color: 'var(--gold-pale)',
    borderBottom: '1px solid var(--border-color)',
    paddingBottom: '0.5rem',
    marginBottom: '1rem',
    fontWeight: 700,
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem'
  };

  const statItemStyle = {
    background: 'rgba(255, 255, 255, 0.02)',
    border: '1px solid var(--border-color)',
    borderRadius: '10px',
    padding: '1rem',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '0.25rem'
  };

  if (loading) return <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '3rem' }}>جاري تحميل المخزون المالي...</p>;

  return (
    <div style={{ direction: 'rtl' }}>
      <h1 style={{ fontSize: '1.8rem', color: 'var(--gold-pale)', marginBottom: '0.4rem', fontWeight: 800 }}>💰 جرد المخزون والمالية المعمق</h1>
      <p style={{ color: 'var(--text-muted)', marginBottom: '2.5rem', fontSize: '0.9rem' }}>جرد عالي الدقة لأوزان الذهب والفضة، أجور الصياغة، وحساب الخزنة اليدوية بالدينار والدولار</p>

      {/* Grid for weights and cash drawer */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>

        {/* Gold Weight Card */}
        <div style={cardStyle('#c5a85c')}>
          <h2 style={sectionHeaderStyle}>
            <Coins size={20} color="var(--gold-primary)" /> جرد مخزون الذهب (عيار 21)
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div style={statItemStyle}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>الوزن الكلي (غرام)</span>
              <span style={{ fontSize: '1.3rem', color: '#fff', fontWeight: 700 }}>{goldGrams.toFixed(2)} غ</span>
            </div>
            <div style={statItemStyle}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>الوزن (مثقال)</span>
              <span style={{ fontSize: '1.3rem', color: 'var(--gold-primary)', fontWeight: 700 }}>{gramsToMithqal(goldGrams).toFixed(2)} مثقال</span>
            </div>
            <div style={{ ...statItemStyle, gridColumn: 'span 2' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>إجمالي صياغة الذهب المتوفر</span>
              <span style={{ fontSize: '1.3rem', color: '#10b981', fontWeight: 700 }}>{formatUSD(totalGoldMakingUSD)}</span>
            </div>
          </div>
        </div>

        {/* Silver Weight Card */}
        <div style={cardStyle('#94a3b8')}>
          <h2 style={sectionHeaderStyle}>
            <Scale size={20} color="#94a3b8" /> جرد مخزون الفضة
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div style={statItemStyle}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>الوزن الكلي (غرام)</span>
              <span style={{ fontSize: '1.3rem', color: '#fff', fontWeight: 700 }}>{silverGrams.toFixed(2)} غ</span>
            </div>
            <div style={statItemStyle}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>الوزن (مثقال)</span>
              <span style={{ fontSize: '1.3rem', color: '#cbd5e1', fontWeight: 700 }}>{(silverGrams / 5).toFixed(2)} مثقال</span>
            </div>
            <div style={{ ...statItemStyle, gridColumn: 'span 2' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>إجمالي صياغة الفضة المتوفر</span>
              <span style={{ fontSize: '1.3rem', color: '#10b981', fontWeight: 700 }}>{formatUSD(totalSilverMakingUSD)}</span>
            </div>
          </div>
        </div>

        {/* Manual Cash Drawer Register Card */}
        <div style={{ ...cardStyle('#10b981'), gridColumn: 'span 1' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', marginBottom: '1rem' }}>
            <h2 style={{ ...sectionHeaderStyle, borderBottom: 'none', marginBottom: 0, paddingBottom: 0 }}>
              <Landmark size={20} color="#10b981" /> صندوق الخزنة اليدوي (Cash)
            </h2>
            <button
              onClick={() => {
                if (isEditingCash) handleSaveCash();
                else setIsEditingCash(true);
              }}
              style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: '6px', color: '#10b981', padding: '0.25rem 0.6rem', cursor: 'pointer', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              {isEditingCash ? <Check size={14} /> : <Landmark size={14} />}
              {isEditingCash ? 'حفظ الخزنة' : 'تعديل الخزنة'}
            </button>
          </div>

          {isEditingCash ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>النقود الورقية بالدولار ($)</label>
                <input
                  type="number"
                  value={inputUSD}
                  onChange={e => setInputUSD(e.target.value)}
                  style={{ width: '100%', padding: '0.5rem 0.75rem', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '6px', color: '#fff', outline: 'none' }}
                />
              </div>
              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>النقود الورقية بالدينار العراقي (IQD)</label>
                <input
                  type="number"
                  value={inputIQD}
                  onChange={e => setInputIQD(e.target.value)}
                  style={{ width: '100%', padding: '0.5rem 0.75rem', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '6px', color: '#fff', outline: 'none' }}
                />
              </div>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div style={statItemStyle}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>كاش دولاري ($)</span>
                <span style={{ fontSize: '1.25rem', color: '#10b981', fontWeight: 700 }}>{formatUSD(cashUSD)}</span>
              </div>
              <div style={statItemStyle}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>كاش عراقي (IQD)</span>
                <span style={{ fontSize: '1.25rem', color: '#10b981', fontWeight: 700 }}>{formatIQD(cashIQD)}</span>
              </div>
              <div style={{ ...statItemStyle, gridColumn: 'span 2', background: 'rgba(16,185,129,0.05)' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>مجموع النقد الكلي (كاش)</span>
                <span style={{ fontSize: '1.4rem', color: '#10b981', fontWeight: 800 }}>{formatIQD(totalCombinedCashIQD)}</span>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>~ {formatUSD(totalCombinedCashUSD)}</span>
              </div>
            </div>
          )}
        </div>

      </div>

      {/* Summary Financial Report Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' }}>

        {/* In Stock Breakdown */}
        <div style={{ ...statItemStyle, borderRight: '4px solid #10b981' }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}><ShieldCheck size={16} color="#10b981" /> حالة المعرض الحالية</span>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem' }}>
            <div>
              <p style={{ fontSize: '1.4rem', color: '#10b981', fontWeight: 700, margin: 0 }}>{inStockCount} قطع</p>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>جاهزة للعرض والبيع</span>
            </div>
            <div style={{ borderLeft: '1px solid var(--border-color)', paddingLeft: '1rem', marginLeft: '1rem' }}>
              <p style={{ fontSize: '1.4rem', color: '#ef4444', fontWeight: 700, margin: 0 }}>{outOfStockCount} قطع</p>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>محجوزة / مباعة</span>
            </div>
          </div>
        </div>

        {/* Inventory Stock Valuation */}
        <div style={{ ...statItemStyle, borderRight: '4px solid var(--gold-primary)' }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}><Coins size={16} color="var(--gold-primary)" /> قيمة المخزون الحالي (الوزن + الصياغة)</span>
          <span style={{ fontSize: '1.5rem', color: 'var(--gold-primary)', fontWeight: 800, marginTop: '0.5rem' }}>{formatIQD(totalStockValuationUSD * exchangeRate)}</span>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>~ {formatUSD(totalStockValuationUSD)}</span>
        </div>

        {/* Combined Overall Business Value */}
        <div style={{ ...statItemStyle, borderRight: '4px solid #6366f1', background: 'rgba(99,102,241,0.03)' }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}><Landmark size={16} color="#818cf8" /> القيمة الكلية لأعمال كليوباترا (بضاعة + كاش)</span>
          <span style={{ fontSize: '1.6rem', color: '#818cf8', fontWeight: 800, marginTop: '0.4rem' }}>{formatIQD(totalBusinessValueIQD)}</span>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>~ {formatUSD(totalBusinessValueUSD)}</span>
        </div>

      </div>

      {/* Live Market Spot Prices Banner */}
      {prices && (
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '1.25rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '2.5rem' }}>
          <div>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block' }}>مؤشرات الأسعار العالمية المعتمدة حالياً بالمعرض</span>
            <span style={{ fontSize: '1rem', color: 'var(--gold-pale)', fontWeight: 700 }}>سعر الذهب والفضة (محدث لحظياً)</span>
          </div>
          <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
            <div style={{ textAlign: 'right' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>سعر مثقال الذهب 21 (شراء)</span>
              <span style={{ fontSize: '1.1rem', color: 'var(--gold-primary)', fontWeight: 700 }}>{formatIQD(prices.usdPerGram21k * 5 * exchangeRate)}</span>
            </div>
            <div style={{ textAlign: 'right' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>سعر غرام الفضة</span>
              <span style={{ fontSize: '1.1rem', color: '#cbd5e1', fontWeight: 700 }}>{formatIQD((prices.usdPerGramSilver || 1) * exchangeRate)}</span>
            </div>
            <div style={{ textAlign: 'right' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>سعر صرف الدولار الجمركي</span>
              <span style={{ fontSize: '1.1rem', color: '#10b981', fontWeight: 700 }}>1$ = {formatIQD(exchangeRate).replace('IQD', '')} د.ع</span>
            </div>
          </div>
        </div>
      )}

      {/* Products Table */}
      <div style={{ background: 'var(--bg-card)', borderRadius: '16px', border: '1px solid var(--border-color)', overflow: 'hidden' }}>
        <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h3 style={{ color: 'var(--gold-pale)', fontSize: '1.15rem', fontWeight: 700 }}>📊 السجل التفصيلي للمصوغات المتوفرة</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.78rem', margin: '0.2rem 0 0 0' }}>قائمة بكل قطعة، عيارها، وزنها بالجرام والمثقال، وتكلفتها السوقية المباشرة</p>
          </div>
          <span style={{ fontSize: '0.8rem', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', padding: '0.35rem 0.75rem', borderRadius: '8px', color: 'var(--text-secondary)' }}>
            مجموع القطع: {products.length}
          </span>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right' }}>
            <thead>
              <tr style={{ background: 'rgba(197,168,92,0.04)' }}>
                {['المنتج مصوراً واسمه', 'المعدن والعيار', 'الوزن (غ)', 'بالمثقال', 'أجور الصياغة ($)', 'السعر بالدينار (IQD)', 'السعر بالدولار ($)', 'الحالة'].map(h => (
                  <th key={h} style={{ padding: '1rem', color: 'var(--gold-primary)', fontSize: '0.85rem', fontWeight: 600, borderBottom: '1px solid var(--border-color)', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {products.map((p, i) => {
                const metal = p.metal || 'gold';
                const baseGramPrice = prices ? (metal === 'silver' ? (prices.usdPerGramSilver || 1) : prices.usdPerGram21k) : 0;
                const priceUSD = (baseGramPrice * p.weightGrams) + p.makingChargeUSD;
                const priceIQD = priceUSD * exchangeRate;

                // Safe extraction of first image url from comma separated list
                const imageList = p.imageUrl ? p.imageUrl.split(',').map(s => s.trim()).filter(Boolean) : [];
                const displayImg = imageList[0] || '/logo.jpg';

                return (
                  <tr key={p.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)', transition: 'background 0.2s' }} onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.015)')} onMouseLeave={e => (e.currentTarget.style.background = i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)')}>
                    <td style={{ padding: '0.85rem 1rem', color: '#fff', fontSize: '0.9rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <img src={displayImg} alt="" style={{ width: '40px', height: '40px', borderRadius: '8px', objectFit: 'cover', border: '1px solid var(--border-color)' }} onError={e => { (e.target as HTMLImageElement).src = '/logo.jpg'; }} />
                        <span style={{ fontWeight: 600 }}>{p.name}</span>
                      </div>
                    </td>
                    <td style={{ padding: '0.85rem 1rem', color: 'var(--gold-primary)', fontSize: '0.85rem', fontWeight: 600 }}>
                      {metal === 'silver' ? 'فضة نقية' : `ذهب عيار ${p.karat}`}
                    </td>
                    <td style={{ padding: '0.85rem 1rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{p.weightGrams} غ</td>
                    <td style={{ padding: '0.85rem 1rem', color: 'var(--text-muted)', fontSize: '0.82rem' }}>{(p.weightGrams / 5).toFixed(2)} م</td>
                    <td style={{ padding: '0.85rem 1rem', color: '#10b981', fontSize: '0.85rem', fontWeight: 600 }}>{formatUSD(p.makingChargeUSD)}</td>
                    <td style={{ padding: '0.85rem 1rem', color: 'var(--gold-primary)', fontSize: '0.9rem', fontWeight: 700, whiteSpace: 'nowrap' }}>{prices ? formatIQD(priceIQD) : '...'}</td>
                    <td style={{ padding: '0.85rem 1rem', color: 'var(--text-muted)', fontSize: '0.82rem', whiteSpace: 'nowrap' }}>{prices ? formatUSD(priceUSD) : '...'}</td>
                    <td style={{ padding: '0.85rem 1rem' }}>
                      <span style={{ background: p.inStock ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)', color: p.inStock ? '#10b981' : '#ef4444', padding: '0.3rem 0.65rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700 }}>
                        {p.inStock ? 'متوفر' : 'محجوز'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr style={{ background: 'rgba(197,168,92,0.06)', borderTop: '2px solid var(--border-color)', fontWeight: 700 }}>
                <td style={{ padding: '1rem', color: 'var(--gold-primary)', fontSize: '0.9rem' }}>المجموع الكلي</td>
                <td style={{ padding: '1rem' }}>—</td>
                <td style={{ padding: '1rem', color: '#fff' }}>{(goldGrams + silverGrams).toFixed(2)} غ</td>
                <td style={{ padding: '1rem', color: '#fff' }}>{((goldGrams + silverGrams) / 5).toFixed(2)} م</td>
                <td style={{ padding: '1rem', color: '#10b981' }}>{formatUSD(totalGoldMakingUSD + totalSilverMakingUSD)}</td>
                <td style={{ padding: '1rem', color: 'var(--gold-primary)', fontSize: '1rem', whiteSpace: 'nowrap' }}>{prices ? formatIQD(totalStockValuationUSD * exchangeRate) : '...'}</td>
                <td style={{ padding: '1rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>{formatUSD(totalStockValuationUSD)}</td>
                <td style={{ padding: '1rem', color: 'var(--text-muted)', fontSize: '0.8rem' }}>{inStockCount} متوفر</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}
