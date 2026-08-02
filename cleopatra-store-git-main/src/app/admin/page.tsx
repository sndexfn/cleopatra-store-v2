"use client";
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { Package, ShoppingCart, Settings, TrendingUp } from 'lucide-react';

export default function AdminPage() {
  const [stats, setStats] = useState({ products: 0, orders: 0 });

  useEffect(() => {
    async function fetchStats() {
      if (!supabase) return;
      const [{ count: pc }, { count: oc }] = await Promise.all([
        supabase.from('products').select('*', { count: 'exact', head: true }),
        supabase.from('orders').select('*', { count: 'exact', head: true }),
      ]);
      setStats({ products: pc || 0, orders: oc || 0 });
    }
    fetchStats();
  }, []);

  const cards = [
    { label: 'المنتجات المعروضة', value: stats.products, icon: <Package size={28} />, href: '/admin/products', color: 'var(--gold-primary)' },
    { label: 'الطلبات', value: stats.orders, icon: <ShoppingCart size={28} />, href: '/admin/orders', color: '#10b981' },
    { label: 'إعدادات الموقع', value: '✏️', icon: <Settings size={28} />, href: '/admin/settings', color: '#6366f1' },
  ];

  return (
    <div>
      <h1 style={{ fontSize: '2rem', color: 'var(--gold-pale)', marginBottom: '0.5rem' }}>مرحباً بك، مدير كليوباترا 👑</h1>
      <p style={{ color: 'var(--text-muted)', marginBottom: '2.5rem' }}>تحكم بكل شيء من هنا</p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem' }}>
        {cards.map(card => (
          <Link key={card.href} href={card.href} style={{ textDecoration: 'none' }}>
            <div style={{ background: 'var(--bg-card)', padding: '2rem', borderRadius: '12px', border: '1px solid var(--border-color)', cursor: 'pointer', transition: 'all 0.2s', display: 'flex', flexDirection: 'column', gap: '1rem' }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = card.color)}
              onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border-color)')}>
              <div style={{ color: card.color }}>{card.icon}</div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{card.label}</p>
              <p style={{ fontSize: '2.2rem', color: card.color, fontWeight: 700 }}>{card.value}</p>
            </div>
          </Link>
        ))}
      </div>

      <div style={{ marginTop: '3rem', padding: '1.5rem', background: 'var(--bg-card)', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
        <h3 style={{ color: 'var(--gold-pale)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <TrendingUp size={20} /> روابط سريعة
        </h3>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <Link href="/admin/products" style={{ padding: '0.6rem 1.2rem', background: 'rgba(197,168,92,0.1)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--gold-primary)', fontSize: '0.9rem' }}>+ إضافة منتج جديد</Link>
          <Link href="/admin/settings" style={{ padding: '0.6rem 1.2rem', background: 'rgba(99,102,241,0.1)', border: '1px solid var(--border-color)', borderRadius: '8px', color: '#818cf8', fontSize: '0.9rem' }}>✏️ تعديل قصتنا</Link>
          <Link href="/admin/settings" style={{ padding: '0.6rem 1.2rem', background: 'rgba(16,185,129,0.1)', border: '1px solid var(--border-color)', borderRadius: '8px', color: '#10b981', fontSize: '0.9rem' }}>🖼️ تغيير خلفية الموقع</Link>
          <Link href="/" target="_blank" style={{ padding: '0.6rem 1.2rem', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>↗ عرض الموقع</Link>
        </div>
      </div>
    </div>
  );
}
