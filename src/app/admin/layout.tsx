"use client";
import Link from "next/link";
import styles from "./layout.module.css";
import { LayoutDashboard, Package, ShoppingCart, LogOut, Settings, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { supabase, isAdmin } from "@/lib/supabase";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);
  const [adminEmail, setAdminEmail] = useState('');

  useEffect(() => {
    async function checkAdmin() {
      if (!supabase) { setLoading(false); return; }
      const { data: { session } } = await supabase.auth.getSession();
      if (!session || !isAdmin(session.user.email)) {
        router.replace('/login');
      } else {
        setIsAuthorized(true);
        setAdminEmail(session.user.email || '');
      }
      setLoading(false);
    }
    checkAdmin();
  }, [router]);

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-primary)' }}>
      <div style={{ textAlign: 'center', color: 'var(--gold-primary)' }}>
        <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>👑</div>
        <p>جاري التحقق من الصلاحيات...</p>
      </div>
    </div>
  );
  if (!isAuthorized) return null;

  const handleLogout = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (supabase) await supabase.auth.signOut();
    router.push('/');
  };

  const navItems = [
    { href: '/admin', icon: <LayoutDashboard size={18} />, label: 'لوحة التحكم' },
    { href: '/admin/products', icon: <Package size={18} />, label: 'المنتجات' },
    { href: '/admin/orders', icon: <ShoppingCart size={18} />, label: 'الطلبات' },
    { href: '/admin/workers', icon: <Users size={18} />, label: 'عمال وموظفي المعرض' },
    { href: '/admin/settings', icon: <Settings size={18} />, label: 'إعدادات الموقع' },
  ];

  return (
    <div className={styles.adminLayout}>
      <aside className={styles.sidebar}>
        <div className={styles.sidebarHeader}>
          <div className={styles.sidebarLogo}>👑</div>
          <div>
            <p className={styles.sidebarTitle}>لوحة تحكم</p>
            <p className={styles.sidebarEmail}>{adminEmail}</p>
          </div>
        </div>
        <nav className={styles.nav}>
          {navItems.map(item => (
            <Link key={item.href} href={item.href}
              className={`${styles.navItem} ${pathname === item.href ? styles.active : ''}`}>
              {item.icon}<span>{item.label}</span>
            </Link>
          ))}
        </nav>
        <div className={styles.sidebarFooter}>
          <button onClick={handleLogout} className={styles.logoutBtn}>
            <LogOut size={16} /><span>تسجيل الخروج</span>
          </button>
          <Link href="/" className={styles.viewSiteBtn} target="_blank">↗ عرض الموقع</Link>
        </div>
      </aside>
      <main className={styles.mainContent}>
        <button onClick={() => router.back()} className={styles.backBtn}>← رجوع</button>
        {children}
      </main>
    </div>
  );
}
