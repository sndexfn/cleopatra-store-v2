"use client";
import Link from "next/link";
import styles from "./Navbar.module.css";
import Image from "next/image";
import { TrendingUp, LayoutDashboard, Package, ShoppingCart, LogOut, Settings } from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase, isAdmin } from "@/lib/supabase";
import { getLiveGoldPrices, formatCurrency } from "@/lib/goldPrice";
import { useCartStore } from "@/lib/store";
import { useUIStore } from "@/lib/uiStore";

export default function Navbar() {
  const { items } = useCartStore();
  const { openCart, openMenu } = useUIStore();
  const [mounted, setMounted] = useState(false);
  const [prices, setPrices] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [isAdminUser, setIsAdminUser] = useState(false);
  const router = useRouter();
  const totalItems = items.reduce((acc, item) => acc + item.quantity, 0);

  useEffect(() => {
    setMounted(true);
    getLiveGoldPrices().then(setPrices);
    if (supabase) {
      supabase.auth.getSession().then(({ data: { session } }) => {
        setUser(session?.user ?? null);
        setIsAdminUser(isAdmin(session?.user?.email));
      });
      const { data: l } = supabase.auth.onAuthStateChange((_e, session) => {
        setUser(session?.user ?? null);
        setIsAdminUser(isAdmin(session?.user?.email));
      });
      return () => l.subscription.unsubscribe();
    }
  }, []);

  const handleLogout = async () => {
    if (supabase) await supabase.auth.signOut();
    setUser(null);
    router.push('/');
    router.refresh();
  };

  return (
    <div className={styles.navbarContainer}>
      {/* Gold Price Ticker */}
      <div className={styles.ticker}>
        <div className={styles.tickerContent}>
          <div className={styles.tickerItem}>
            <TrendingUp size={12} color="var(--gold-primary)" />
            <span>سعر الذهب اليوم</span>
          </div>
          {prices ? (
            <>
              <div className={styles.tickerItem}><span>عيار 24:</span><span className={styles.tickerPrice}>{formatCurrency(prices.usdPerGram24k, 'USD')}/غ</span></div>
              <div className={styles.tickerItem}><span>عيار 21:</span><span className={styles.tickerPrice}>{formatCurrency(prices.usdPerGram21k, 'USD')}/غ</span></div>
            </>
          ) : <span className={styles.tickerPrice}>جاري التحميل...</span>}
        </div>
      </div>

      {/* Main Nav */}
      <nav className={styles.navbar}>
        <div className={styles.container}>
          <Link href="/" className={styles.logo}>
            <Image src="/logo.png" alt="كليوباترا" width={140} height={70} className={styles.logoImage} priority />
          </Link>

          <div className={styles.navLinks}>
            <Link href="/" className={styles.link}>الرئيسية</Link>
            <Link href="/shop" className={styles.link}>المتجر</Link>
            <Link href="/about" className={styles.link}>من نحن</Link>
          </div>

          <div className={styles.actions}>
            {mounted && isAdminUser && (
              <Link href="/admin" className={styles.adminBtn}>
                لوحة التحكم
              </Link>
            )}

            <button className={styles.cartButton} onClick={openCart} aria-label="سلة التسوق">
              <ShoppingCart size={16} />
              {totalItems > 0 && <span className={styles.cartBadge}>{totalItems}</span>}
            </button>

            {user ? (
              <div className={styles.userMenu}>
                <span className={styles.userName}>{user.user_metadata?.full_name || user.email?.split('@')[0]}</span>
                <button className={styles.logoutBtn} onClick={handleLogout}>تسجيل الخروج</button>
              </div>
            ) : (
              <Link href="/login" className={styles.loginBtn}>تسجيل الدخول</Link>
            )}

            <button className={styles.menuBtn} onClick={openMenu} aria-label="قائمة">☰</button>
          </div>
        </div>
      </nav>
    </div>
  );
}
