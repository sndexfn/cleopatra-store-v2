"use client";
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import styles from './page.module.css';
import Link from 'next/link';

export default function AdminStockPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchStock(); }, []);

  async function fetchStock() {
    setLoading(true);
    if (!supabase) { setLoading(false); return; }
    try {
      const { data } = await supabase.from('products').select('*').order('created_at', { ascending: false });
      setProducts(data || []);
    } catch (e) {
      console.error('Failed to fetch products', e);
    }
    setLoading(false);
  }

  function computeTotals() {
    const totals = products.reduce((acc, p) => {
      const qty = Number(p.quantity || 0);
      const weight = Number(p.weightGrams || 0) * qty;
      acc.totalItems += qty;
      acc.totalWeight += weight;
      return acc;
    }, { totalItems: 0, totalWeight: 0 });
    return totals;
  }

  const totals = computeTotals();

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h1 style={{ color: 'var(--gold-pale)' }}>إدارة المخزون</h1>
        <Link href="/admin/products" style={{ background: 'var(--gold-primary)', padding: '0.6rem 1rem', borderRadius: 8, color: '#000', fontWeight: 700 }}>+ إضافة منتج</Link>
      </div>

      <div style={{ marginBottom: '1rem', display: 'flex', gap: '1rem' }}>
        <div style={{ background: 'var(--bg-card)', padding: '1rem', borderRadius: 8, border: '1px solid var(--border-color)' }}>
          <div style={{ color: 'var(--text-secondary)' }}>إجمالي القطع</div>
          <div style={{ color: 'var(--gold-pale)', fontWeight: 700 }}>{totals.totalItems}</div>
        </div>
        <div style={{ background: 'var(--bg-card)', padding: '1rem', borderRadius: 8, border: '1px solid var(--border-color)' }}>
          <div style={{ color: 'var(--text-secondary)' }}>إجمالي الوزن (غ)</div>
          <div style={{ color: 'var(--gold-pale)', fontWeight: 700 }}>{totals.totalWeight}</div>
        </div>
      </div>

      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 12, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead style={{ background: 'rgba(255,255,255,0.02)' }}>
            <tr>
              <th style={{ textAlign: 'left', padding: '0.9rem' }}>الاسم</th>
              <th style={{ textAlign: 'left', padding: '0.9rem' }}>العيار</th>
              <th style={{ textAlign: 'left', padding: '0.9rem' }}>الوزن (غ)</th>
              <th style={{ textAlign: 'left', padding: '0.9rem' }}>الكمية</th>
              <th style={{ textAlign: 'left', padding: '0.9rem' }}>الحالة</th>
              <th style={{ textAlign: 'right', padding: '0.9rem' }}>إجراءات</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} style={{ padding: '1.5rem', color: 'var(--text-muted)' }}>جاري التحميل...</td></tr>
            ) : products.length === 0 ? (
              <tr><td colSpan={6} style={{ padding: '1.5rem', color: 'var(--text-muted)' }}>لا توجد منتجات.</td></tr>
            ) : products.map(p => (
              <tr key={p.id} style={{ borderTop: '1px solid rgba(255,255,255,0.02)' }}>
                <td style={{ padding: '0.85rem' }}>{p.name}</td>
                <td style={{ padding: '0.85rem' }}>{p.karat}</td>
                <td style={{ padding: '0.85rem' }}>{p.weightGrams}</td>
                <td style={{ padding: '0.85rem' }}>{p.quantity || 0}</td>
                <td style={{ padding: '0.85rem' }}>{p.inStock ? 'متوفر' : 'منفذ'}</td>
                <td style={{ padding: '0.85rem', textAlign: 'right' }}>
                  <Link href={`/admin/products/${p.id}`} style={{ marginRight: '0.5rem', color: 'var(--gold-primary)' }}>تفاصيل</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
