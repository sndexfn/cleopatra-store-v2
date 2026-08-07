"use client";
import { useEffect, useState } from 'react';
import { supabase, getProducts, Product } from '@/lib/supabase';
import Link from 'next/link';
import { Package, ShoppingCart, Settings, TrendingUp, Scale, Coins, ShieldCheck, Users } from 'lucide-react';
import { gramsToMithqal, formatCurrency } from '@/lib/goldPrice';
import styles from './page.module.css';

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

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>مرحباً بك، مدير كلياباترا 👑</h1>
      <p className={styles.subtitle}>لوحة التحكم وإدارة المخزون المالي والأوزان للذهب والفضة</p>

      {/* Main Stats Row */}
      <div className={styles.cardsGrid}>
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
      <div className={styles.dashboardGrid}>

        {/* Gold Inventory Stats */}
        <div className={styles.cardBox}>
          <h2 className={styles.sectionHeader}>
            <Coins size={20} color="var(--gold-primary)" /> جرد مخزون الذهب (عالي الدقة)
          </h2>
          <div className={styles.statItemGrid}>
            <div className={styles.statItem}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>وزن الذهب الكلي (غرام)</span>
              <span style={{ fontSize: '1.4rem', color: '#fff', fontWeight: 700 }}>{stats.goldGrams.toFixed(2)} غرام</span>
            </div>
            <div className={styles.statItem}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>وزن الذهب (بالمثقال)</span>
              <span style={{ fontSize: '1.4rem', color: 'var(--gold-primary)', fontWeight: 700 }}>{stats.goldMithqals.toFixed(2)} مثقال</span>
            </div>
            <div className={`${styles.statItem} ${styles.statItemFull}`}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>إجمالي صياغة الذهب في المعرض</span>
              <span style={{ fontSize: '1.4rem', color: '#10b981', fontWeight: 700 }}>{formatCurrency(stats.totalGoldMakingUSD, 'USD')}</span>
            </div>
          </div>
        </div>

        {/* Silver Inventory Stats */}
        <div className={styles.cardBox}>
          <h2 className={styles.sectionHeader}>
            <Scale size={20} color="#cbd5e1" /> جرد مخزون الفضة
          </h2>
          <div className={styles.statItemGrid}>
            <div className={styles.statItem}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>وزن الفضة الكلي (غرام)</span>
              <span style={{ fontSize: '1.4rem', color: '#fff', fontWeight: 700 }}>{stats.silverGrams.toFixed(2)} غرام</span>
            </div>
            <div className={styles.statItem}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>وزن الفضة (بالمثقال)</span>
              <span style={{ fontSize: '1.4rem', color: '#94a3b8', fontWeight: 700 }}>{(stats.silverGrams / 5).toFixed(2)} مثقال</span>
            </div>
            <div className={`${styles.statItem} ${styles.statItemFull}`}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>إجمالي صياغة الفضة في المعرض</span>
              <span style={{ fontSize: '1.4rem', color: '#10b981', fontWeight: 700 }}>{formatCurrency(stats.totalSilverMakingUSD, 'USD')}</span>
            </div>
          </div>
        </div>

        {/* Status Breakdown & Quick Reports */}
        <div className={`${styles.cardBox} ${styles.spanTwo}`}>
          <h2 className={styles.sectionHeader}>
            <ShieldCheck size={20} color="#10b981" /> حالة مخزون المحل
          </h2>
          <div className={styles.statusBreakdownGrid}>
            <div className={`${styles.statItem} ${styles.borderSuccess}`}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>المتوفر للعرض</span>
              <span style={{ fontSize: '1.5rem', color: '#10b981', fontWeight: 700 }}>{stats.inStockCount} قطع</span>
            </div>
            <div className={`${styles.statItem} ${styles.borderError}`}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>القطع المنتهية (المحجوزة)</span>
              <span style={{ fontSize: '1.5rem', color: '#ef4444', fontWeight: 700 }}>{stats.outOfStockCount} قطع</span>
            </div>
            <div className={`${styles.statItem} ${styles.borderGold} ${styles.statItemFull}`}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>القيمة الإجمالية لأجور الصياغة (ذهب + فضة)</span>
              <span style={{ fontSize: '1.6rem', color: 'var(--gold-primary)', fontWeight: 800 }}>{formatCurrency(stats.totalGoldMakingUSD + stats.totalSilverMakingUSD, 'USD')}</span>
            </div>
          </div>
        </div>

      </div>

      {/* Navigation and Quick Links */}
      <div className={styles.quickLinksBox}>
        <h3 className={styles.quickLinksTitle}>
          <TrendingUp size={20} /> روابط سريعة
        </h3>
        <div className={styles.quickLinksRow}>
          <Link href="/admin/products" className={styles.linkBtn} style={{ background: 'rgba(197,168,92,0.1)', color: 'var(--gold-primary)' }}>+ إضافة منتج جديد</Link>
          <Link href="/admin/finance" className={styles.linkBtn} style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981' }}>📊 لوحة الأرباح والمالية</Link>
          <Link href="/admin/settings" className={styles.linkBtn} style={{ background: 'rgba(99,102,241,0.1)', color: '#818cf8' }}>✏️ تعديل أسعار الذهب والفضة</Link>
          <Link href="/admin/workers" className={styles.linkBtn} style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981', display: 'flex', alignItems: 'center', gap: '0.35rem' }}><Users size={16} /> إدارة موظفي المعرض</Link>
          <Link href="/" target="_blank" className={styles.linkBtn} style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--text-secondary)' }}>↗ عرض موقع كليوباترا</Link>
        </div>
      </div>
    </div>
  );
}
