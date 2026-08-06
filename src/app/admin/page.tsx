"use client";
import { useEffect, useState } from 'react';
import { supabase, getProducts, Product } from '@/lib/supabase';
import Link from 'next/link';
import { Package, ShoppingCart, Settings, TrendingUp, Scale, Coins, ShieldCheck, Users, Landmark, ChevronLeft } from 'lucide-react';
import { formatCurrency } from '@/lib/goldPrice';

export default function AdminPage() {
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalOrders: 0,
    totalWorkers: 0,
    lastUpdate: '...'
  });

  useEffect(() => {
    async function fetchStats() {
      let productsList: Product[] = [];
      let ordersCount = 0;
      let workersCount = 3; // Fallback to length of default workers array

      // 1. Fetch products
      try {
        productsList = await getProducts();
        if (supabase) {
          const { data } = await supabase.from('products').select('*');
          if (data && data.length > 0) {
            productsList = data as Product[];
          }
        }
      } catch (e) {
        console.error("Error fetching admin page products list", e);
      }

      // 2. Fetch orders count
      try {
        if (supabase) {
          const { count } = await supabase.from('orders').select('*', { count: 'exact', head: true });
          ordersCount = count || 0;
        } else {
          ordersCount = 5; // Mock orders count
        }
      } catch (e) {
        console.error("Error fetching admin orders count", e);
      }

      // 3. Fetch workers count
      try {
        if (typeof window !== 'undefined') {
          const saved = localStorage.getItem('cleopatra_workers');
          if (saved) {
            const workers = JSON.parse(saved);
            workersCount = workers.length;
          }
        }
      } catch (e) {
        console.error("Error parsing admin workers count", e);
      }

      setStats({
        totalProducts: productsList.length,
        totalOrders: ordersCount,
        totalWorkers: workersCount,
        lastUpdate: new Date().toLocaleTimeString('ar-IQ', { hour: '2-digit', minute: '2-digit' })
      });
    }

    fetchStats();
  }, []);

  const menuSections = [
    {
      label: 'إدارة الكتالوج والمنتجات',
      desc: 'إضافة المنتجات، تعديل الأوزان، ورفع صور متعددة وفيديوهات بدقة عالية.',
      count: stats.totalProducts,
      countLabel: 'منتج مسجل',
      icon: <Package size={26} />,
      href: '/admin/products',
      color: 'var(--gold-primary)'
    },
    {
      label: 'الطلبات المستلمة والفواتير',
      desc: 'متابعة طلبات الشراء من زبائن الموقع الإلكتروني وتحديث حالتها خطوة بخطوة.',
      count: stats.totalOrders,
      countLabel: 'طلب مسجل',
      icon: <ShoppingCart size={26} />,
      href: '/admin/orders',
      color: '#10b981'
    },
    {
      label: 'صندوق الخزينة وجرد المخزون',
      desc: 'التقرير المالي المتكامل للذهب والفضة، وحساب الخزنة اليدوية بالدينار والدولار في مكان واحد.',
      count: 'عرض الجرد',
      countLabel: 'مخزون ومالية',
      icon: <Landmark size={26} />,
      href: '/admin/stock',
      color: '#6366f1'
    },
    {
      label: 'طاقم وعمال كليوباترا',
      desc: 'مراقبة حضور موظفي المعرض، ساعات العمل، وإدارة المرتبات الشهرية.',
      count: stats.totalWorkers,
      countLabel: 'موظفين',
      icon: <Users size={26} />,
      href: '/admin/workers',
      color: '#cbd5e1'
    },
    {
      label: 'إعدادات المنصة وهويتها',
      desc: 'تخصيص اسم المتجر، روابط إنستغرام، أرقام واتساب، وربط بوت الإشعارات التلقائية للتليغرام.',
      count: 'تعديل',
      countLabel: 'تخصيص شامل',
      icon: <Settings size={26} />,
      href: '/admin/settings',
      color: '#f59e0b'
    },
  ];

  return (
    <div style={{ direction: 'rtl' }}>
      {/* Welcome Heading Banner */}
      <div style={{ marginBottom: '2.5rem' }}>
        <h1 style={{ fontSize: '2rem', color: 'var(--gold-pale)', marginBottom: '0.4rem', fontWeight: 800 }}>
          مرحباً بك، مدير كليوباترا 👑
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: 0 }}>
          لوحة التحكم الإدارية المتكاملة لمعرض ومجوهرات كليوباترا (كربلاء، العراق). آخر فحص للمؤشرات: اليوم الساعة {stats.lastUpdate}
        </p>
      </div>

      {/* Main Dashboard Navigation Grid */}
      <h2 style={{ fontSize: '1.2rem', color: 'var(--gold-pale)', marginBottom: '1.25rem', fontWeight: 700 }}>
        📂 الأقسام الإدارية والعمليات الإدارية السريعة
      </h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', marginBottom: '3rem' }}>
        {menuSections.map(sec => (
          <Link key={sec.href} href={sec.href} style={{ textDecoration: 'none' }}>
            <div
              style={{
                background: 'var(--bg-card)',
                padding: '1.75rem',
                borderRadius: '16px',
                border: '1px solid var(--border-color)',
                cursor: 'pointer',
                transition: 'all 0.25s ease',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                height: '100%',
                boxSizing: 'border-box'
              }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = sec.color;
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = `0 6px 20px rgba(0,0,0,0.3)`;
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = 'var(--border-color)';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <div style={{ color: sec.color, background: `${sec.color}15`, padding: '0.6rem', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {sec.icon}
                  </div>
                  <span style={{ fontSize: '0.78rem', background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border-color)', padding: '0.25rem 0.6rem', borderRadius: '6px', color: 'var(--text-secondary)' }}>
                    {sec.countLabel}
                  </span>
                </div>
                <h3 style={{ color: '#fff', fontSize: '1.15rem', fontWeight: 700, margin: '0 0 0.5rem 0' }}>{sec.label}</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', lineHeight: '1.5', margin: 0 }}>{sec.desc}</p>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                <span style={{ fontSize: '1.6rem', color: sec.color, fontWeight: 800 }}>{sec.count}</span>
                <span style={{ color: sec.color, fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.2rem', fontWeight: 600 }}>
                  دخول القسم <ChevronLeft size={16} />
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Quick Status / Help Guidelines Footer */}
      <div style={{ padding: '1.5rem', background: 'rgba(197,168,92,0.05)', borderRadius: '16px', border: '1px solid rgba(197,168,92,0.15)', display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
        <span style={{ fontSize: '1.8rem', lineHeight: '1' }}>💡</span>
        <div>
          <h4 style={{ color: 'var(--gold-pale)', margin: '0 0 0.4rem 0', fontWeight: 700 }}>تعليمات الاستخدام السريع للوحة التحكم</h4>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.83rem', lineHeight: '1.6', margin: 0 }}>
            لضمان التحديث اللحظي لأسعار القطع المعروضة للزوار على الواجهة العامة للموقع، يُرجى الحفاظ على تحديث أسعار صرف الدولار وأسعار صياغة المصوغات من قسم "إعدادات المنصة". عند استلام أي طلب شراء جديد من زائر، ستسمع رنيناً وتصلك إشعارات وتفاصيل الفاتورة مباشرةً على بوت التليغرام المرتبط بمتجرك.
          </p>
        </div>
      </div>
    </div>
  );
}
