"use client";
import Link from "next/link";
import Image from "next/image";
import styles from "./Navbar.module.css";
import { ShoppingBag, TrendingUp, Menu, Crown, LogOut, User } from "lucide-react";
import { useCartStore } from "@/lib/store";
import { getLiveGoldPrices, GoldPrices, formatCurrency } from "@/lib/goldPrice";
import { useEffect, useState } from "react";
import { supabase, isAdmin } from "@/lib/supabase";
import { useUIStore } from "@/lib/uiStore";
import { useRouter } from "next/navigation";

export default function Navbar() {
  const { items } = useCartStore();
  const { openCart, openMenu } = useUIStore();
  const [mounted, setMounted] = useState(false);
  const [prices, setPrices] = useState<GoldPrices | null>(null);
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
              <div className={styles.tickerItem}><span>عيار 18:</span><span className={styles.tickerPrice}>{formatCurrency(prices.usdPerGram18k, 'USD')}/غ</span></div>
            </>
          ) : <span className={styles.tickerPrice}>جاري التحميل...</span>}
        </div>
      </div>

      {/* Main Nav */}
      <nav className={styles.navbar}>
        <div className={styles.container}>
          <Link href="/" className={styles.logo}>
            <Image src="/logo.jpg" alt="كليوباترا" width={120} height={60} className={styles.logoImage} priority />
          </Link>

          <div className={styles.navLinks}>
            <Link href="/" className={styles.link}>الرئيسية</Link>
            <Link href="/shop" className={styles.link}>المتجر</Link>
            <Link href="/about" className={styles.link}>من نحن</Link>
          </div>

          <div className={styles.actions}>
            {mounted && isAdminUser && (
              <Link href="/admin" className={styles.adminBtn}>
                <Crown size={14} /> لوحة التحكم
              </Link>
            )}
            <button onClick={openCart} className={styles.cartButton} aria-label="السلة">
              <ShoppingBag size={20} />
              {mounted && totalItems > 0 && <span className={styles.cartBadge}>{totalItems}</span>}
            </button>
            {mounted && user ? (
              <div className={styles.userMenu}>
                <span className={styles.userName}>
                  <User size={14} />
                  {user.user_metadata?.full_name || user.email?.split('@')[0]}
                </span>
                <button onClick={handleLogout} className={styles.logoutBtn} title="تسجيل الخروج">
                  <LogOut size={16} />
                </button>
              </div>
            ) : (
              <Link href="/login" className={styles.loginBtn}>دخول</Link>
            )}
            <button onClick={openMenu} className={styles.menuBtn} aria-label="القائمة">
              <Menu size={22} />
            </button>
          </div>
        </div>
      </nav>
    </div>
  );
}
