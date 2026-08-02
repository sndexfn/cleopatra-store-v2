"use client";

import Link from "next/link";
import styles from "./layout.module.css";
import { LayoutDashboard, Package, ShoppingCart, LogOut, Settings, Image as ImageIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { supabase, isAdmin } from "@/lib/supabase";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkAdmin() {
      if (!supabase) { setLoading(false); return; }
      const { data: { session } } = await supabase.auth.getSession();
      if (!session || !isAdmin(session.user.email)) {
        router.push('/');
      } else {
        setIsAuthorized(true);
      }
      setLoading(false);
    }
    checkAdmin();
  }, [router]);

  if (loading) return <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--gold-primary)' }}>جاري التحقق من الصلاحيات...</div>;
  if (!isAuthorized) return null;

  const handleLogout = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (supabase) await supabase.auth.signOut();
    router.push('/');
  };

  const navItems = [
    { href: '/admin', icon: <LayoutDashboard size={20} />, label: 'لوحة التحكم' },
    { href: '/admin/products', icon: <Package size={20} />, label: 'المنتجات' },
    { href: '/admin/orders', icon: <ShoppingCart size={20} />, label: 'الطلبات' },
    { href: '/admin/settings', icon: <Settings size={20} />, label: 'إعدادات الموقع' },
  ];

  return (
    <div className={styles.adminLayout}>
      <aside className={styles.sidebar}>
        <div className={styles.logo}>🏛️ إدارة كليوباترا</div>
        <nav className={styles.nav}>
          {navItems.map(item => (
            <Link
              key={item.href}
              href={item.href}
              className={`${styles.navItem} ${pathname === item.href ? styles.navItemActive : ''}`}
            >
              {item.icon}
              <span>{item.label}</span>
            </Link>
          ))}
          <button onClick={handleLogout} className={styles.navItem} style={{ marginTop: 'auto', color: 'var(--error)', background: 'none', border: 'none', width: '100%', cursor: 'pointer', textAlign: 'right' }}>
            <LogOut size={20} />
            <span>الخروج</span>
          </button>
        </nav>
      </aside>
      <main className={styles.mainContent}>
        <div style={{ marginBottom: '1rem' }}>
          <button onClick={() => router.back()} style={{ background: 'none', border: '1px solid var(--border-color)', color: 'var(--text-secondary)', padding: '0.4rem 1rem', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem' }}>
            ← رجوع
          </button>
        </div>
        {children}
      </main>
    </div>
  );
}
