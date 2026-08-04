"use client";
import { useEffect, useState } from 'react';
import { supabase, getProducts, Product } from '@/lib/supabase';
import Link from 'next/link';
import { Package, ShoppingCart, Settings, TrendingUp, Scale, Coins, ShieldCheck, Users } from 'lucide-react';
import { gramsToMithqal, formatCurrency } from '@/lib/goldPrice';

export default function AdminPage() {
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalOrders: 0,
    goldGrams: 0,
    goldMithqals: 0,
    silverGrams: 0,
    totalGoldMakingUSD: 0,
    totalSilverMakingUSD: 0,
    inStockCount: 0,
    outOfStockCount: 0
  });

  useEffect(() => {
    async function fetchStats() {
      let productsList: Product[] = [];
      let ordersCount = 0;

      // 1. Fetch products
      try {
        productsList = await getProducts();
        // Since getProducts might only return active/inStock items, let's try getting all products if supabase is ready
        if (supabase) {
          const { data } = await supabase.from('products').select('*');
          if (data && data.length > 0) {
            productsList = data as Product[];
          }
        }
      } catch (e) {
        console.error("Error fetching admin products list", e);
      }

      // 2. Fetch orders count
      try {
        if (supabase) {
          const { count } = await supabase.from('orders').select('*', { count: 'exact', head: true });
          ordersCount = count || 0;
        } else {
          ordersCount = 3; // Mock orders count
        }
      } catch (e) {
        console.error("Error fetching admin orders count", e);
      }

      // 3. Perform calculations
      let goldGrams = 0;
      let silverGrams = 0;
      let totalGoldMakingUSD = 0;
      let totalSilverMakingUSD = 0;
      let inStockCount = 0;
      let outOfStockCount = 0;

      productsList.forEach(p => {
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

      setStats({
        totalProducts: productsList.length,
        totalOrders: ordersCount,
        goldGrams,
        goldMithqals: gramsToMithqal(goldGrams),
        silverGrams,
        totalGoldMakingUSD,
        totalSilverMakingUSD,
        inStockCount,
        outOfStockCount
      });
    }

    fetchStats();
  }, []);

  const cards = [
    { label: 'المنتجات المسجلة', value: stats.totalProducts, icon: <Package size={28} />, href: '/admin/products', color: 'var(--gold-primary)' },
    { label: 'إجمالي الطلبات المستلمة', value: stats.totalOrders, icon: <ShoppingCart size={28} />, href: '/admin/orders', color: '#10b981' },
    { label: 'إعدادات المنصة', value: '✏️', icon: <Settings size={28} />, href: '/admin/settings', color: '#6366f1' },
  ];

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
    padding: '1.25rem',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '0.25rem'
  };

  return (
    <div style={{ direction: 'rtl' }}>
      <h1 style={{ fontSize: '2.2rem', color: 'var(--gold-pale)', marginBottom: '0.5rem', fontWeight: 800 }}>مرحباً بك، مدير كليوباترا 👑</h1>
      <p style={{ color: 'var(--text-muted)', marginBottom: '2.5rem' }}>لوحة التحكم وإدارة المخزون المالي والأوزان للذهب والفضة</p>

      {/* Main Stats Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem', marginBottom: '3rem' }}>
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

      {/* Stock, Weight & Money Dashboard */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem', marginBottom: '3rem' }}>

        {/* Gold Inventory Stats */}
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '16px', padding: '1.5rem' }}>
          <h2 style={sectionHeaderStyle}>
            <Coins size={20} color="var(--gold-primary)" /> جرد مخزون الذهب (عالي الدقة)
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div style={statItemStyle}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>وزن الذهب الكلي (غرام)</span>
              <span style={{ fontSize: '1.4rem', color: '#fff', fontWeight: 700 }}>{stats.goldGrams.toFixed(2)} غرام</span>
            </div>
            <div style={statItemStyle}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>وزن الذهب (بالمثقال)</span>
              <span style={{ fontSize: '1.4rem', color: 'var(--gold-primary)', fontWeight: 700 }}>{stats.goldMithqals.toFixed(2)} مثقال</span>
            </div>
            <div style={{ ...statItemStyle, gridColumn: 'span 2' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>إجمالي صياغة الذهب في المعرض</span>
              <span style={{ fontSize: '1.4rem', color: '#10b981', fontWeight: 700 }}>{formatCurrency(stats.totalGoldMakingUSD, 'USD')}</span>
            </div>
          </div>
        </div>

        {/* Silver Inventory Stats */}
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '16px', padding: '1.5rem' }}>
          <h2 style={sectionHeaderStyle}>
            <Scale size={20} color="#cbd5e1" /> جرد مخزون الفضة
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div style={statItemStyle}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>وزن الفضة الكلي (غرام)</span>
              <span style={{ fontSize: '1.4rem', color: '#fff', fontWeight: 700 }}>{stats.silverGrams.toFixed(2)} غرام</span>
            </div>
            <div style={statItemStyle}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>وزن الفضة (بالمثقال)</span>
              <span style={{ fontSize: '1.4rem', color: '#94a3b8', fontWeight: 700 }}>{(stats.silverGrams / 5).toFixed(2)} مثقال</span>
            </div>
            <div style={{ ...statItemStyle, gridColumn: 'span 2' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>إجمالي صياغة الفضة في المعرض</span>
              <span style={{ fontSize: '1.4rem', color: '#10b981', fontWeight: 700 }}>{formatCurrency(stats.totalSilverMakingUSD, 'USD')}</span>
            </div>
          </div>
        </div>

        {/* Status Breakdown & Quick Reports */}
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '16px', padding: '1.5rem', gridColumn: 'span 2' }}>
          <h2 style={sectionHeaderStyle}>
            <ShieldCheck size={20} color="#10b981" /> حالة مخزون المحل
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1.25rem' }}>
            <div style={{ ...statItemStyle, borderRight: '4px solid #10b981' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>المتوفر للعرض</span>
              <span style={{ fontSize: '1.5rem', color: '#10b981', fontWeight: 700 }}>{stats.inStockCount} قطع</span>
            </div>
            <div style={{ ...statItemStyle, borderRight: '4px solid #ef4444' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>القطع المنتهية (المحجوزة)</span>
              <span style={{ fontSize: '1.5rem', color: '#ef4444', fontWeight: 700 }}>{stats.outOfStockCount} قطع</span>
            </div>
            <div style={{ ...statItemStyle, borderRight: '4px solid var(--gold-primary)', gridColumn: 'span 2' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>القيمة الإجمالية لأجور الصياغة (ذهب + فضة)</span>
              <span style={{ fontSize: '1.6rem', color: 'var(--gold-primary)', fontWeight: 800 }}>{formatCurrency(stats.totalGoldMakingUSD + stats.totalSilverMakingUSD, 'USD')}</span>
            </div>
          </div>
        </div>

      </div>

      {/* Navigation and Quick Links */}
      <div style={{ padding: '1.5rem', background: 'var(--bg-card)', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
        <h3 style={{ color: 'var(--gold-pale)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700 }}>
          <TrendingUp size={20} /> روابط سريعة
        </h3>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <Link href="/admin/products" style={{ padding: '0.6rem 1.2rem', background: 'rgba(197,168,92,0.1)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--gold-primary)', fontSize: '0.9rem', textDecoration: 'none' }}>+ إضافة منتج جديد</Link>
          <Link href="/admin/settings" style={{ padding: '0.6rem 1.2rem', background: 'rgba(99,102,241,0.1)', border: '1px solid var(--border-color)', borderRadius: '8px', color: '#818cf8', fontSize: '0.9rem', textDecoration: 'none' }}>✏️ تعديل أسعار الذهب والفضة</Link>
          <Link href="/admin/workers" style={{ padding: '0.6rem 1.2rem', background: 'rgba(16,185,129,0.1)', border: '1px solid var(--border-color)', borderRadius: '8px', color: '#10b981', fontSize: '0.9rem', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.35rem' }}><Users size={16} /> إدارة موظفي المعرض</Link>
          <Link href="/" target="_blank" style={{ padding: '0.6rem 1.2rem', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-secondary)', fontSize: '0.9rem', textDecoration: 'none' }}>↗ عرض موقع كليوباترا</Link>
        </div>
      </div>
    </div>
  );
}
