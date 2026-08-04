"use client";
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import styles from './page.module.css';

export default function AdminProductDetail({ params }: { params: { id: string } }) {
  const { id } = params;
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [stockAdjust, setStockAdjust] = useState(0);
  const router = useRouter();

  useEffect(() => { fetchProduct(); }, [id]);

  async function fetchProduct() {
    setLoading(true);
    if (!supabase) { setLoading(false); return; }
    try {
      const { data } = await supabase.from('products').select('*').eq('id', id).single();
      setProduct(data || null);
    } catch (e) { console.error(e); }
    setLoading(false);
  }

  async function applyStockAdjust(e: React.FormEvent) {
    e.preventDefault();
    if (!supabase || !product) return;
    try {
      const newQty = (Number(product.quantity || 0) + Number(stockAdjust));
      await supabase.from('products').update({ quantity: newQty }).eq('id', id);
      setStockAdjust(0);
      fetchProduct();
    } catch (e) { console.error(e); }
  }

  if (loading) return <p style={{ color: 'var(--text-muted)' }}>جاري التحميل...</p>;
  if (!product) return <p style={{ color: 'var(--text-muted)' }}>لم يتم العثور على المنتج.</p>;

  return (
    <div>
      <button onClick={() => router.back()} style={{ marginBottom: '1rem' }}>← رجوع</button>
      <h1 style={{ color: 'var(--gold-pale)' }}>{product.name}</h1>
      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '1.5rem', marginTop: '1rem' }}>
        <div style={{ background: 'var(--bg-card)', padding: '1rem', borderRadius: 8 }}>
          <img src={product.imageUrl} alt={product.name} style={{ width: '100%', borderRadius: 8, objectFit: 'cover' }} />
          <div style={{ marginTop: '0.75rem' }}>
            <div style={{ color: 'var(--text-secondary)' }}>العيار</div>
            <div style={{ color: 'var(--gold-pale)', fontWeight: 700 }}>{product.karat}</div>
            <div style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>الوزن (غ)</div>
            <div style={{ color: 'var(--text-primary)', fontWeight: 700 }}>{product.weightGrams}</div>
            <div style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>الكمية المتوفرة</div>
            <div style={{ color: 'var(--text-primary)', fontWeight: 700 }}>{product.quantity || 0}</div>
          </div>
        </div>

        <div style={{ background: 'var(--bg-card)', padding: '1rem', borderRadius: 8 }}>
          <h3 style={{ color: 'var(--gold-primary)' }}>تفاصيل المنتج</h3>
          <p style={{ color: 'var(--text-secondary)' }}>{product.description}</p>

          <form onSubmit={applyStockAdjust} style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <input type="number" value={stockAdjust} onChange={e => setStockAdjust(Number(e.target.value))} style={{ padding: '0.6rem', borderRadius: 8, border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)' }} />
            <button style={{ background: 'var(--gold-primary)', padding: '0.6rem 0.9rem', borderRadius: 8, color: '#000', fontWeight: 700 }}>تطبيق</button>
          </form>
        </div>
      </div>
    </div>
  );
}
