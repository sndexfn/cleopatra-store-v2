"use client";
import Link from "next/link";
import Image from "next/image";
import styles from "./Navbar.module.css";
import { ShoppingBag, TrendingUp, Menu, Crown, LogOut, User, RefreshCw } from "lucide-react";
import { useCartStore } from "@/lib/store";
import { getLiveGoldPrices, GoldPrices, formatCurrency } from "@/lib/goldPrice";
import { useEffect, useState } from "react";
import { supabase, isAdmin } from "@/lib/supabase";
import { useUIStore } from "@/lib/uiStore";
import { useRouter } from "next/navigation";
import { useLangStore } from "@/lib/langStore";

export default function Navbar() {
  const { items } = useCartStore();
  const { openCart, openMenu } = useUIStore();
  const { lang, setLang } = useLangStore();
  const [mounted, setMounted] = useState(false);
  const [prices, setPrices] = useState<GoldPrices | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  interface CustomUser {
    id: string;
    email?: string;
    user_metadata?: {
      full_name?: string;
    };
  }
  const [user, setUser] = useState<CustomUser | null>(null);
  const [isAdminUser, setIsAdminUser] = useState(false);
  const router = useRouter();
  const totalItems = items.reduce((acc, item) => acc + item.quantity, 0);

  const fetchPrices = async () => {
    setRefreshing(true);
    const p = await getLiveGoldPrices();
    setPrices(p);
    setRefreshing(false);
  };

  useEffect(() => {
    Promise.resolve().then(() => {
      setMounted(true);
      fetchPrices();
    });
    if (supabase) {
      supabase.auth.getSession().then(({ data: { session } }) => {
        const u = session?.user;
        setUser(u ? { id: u.id, email: u.email, user_metadata: u.user_metadata } : null);
        setIsAdminUser(isAdmin(u?.email));
      });
      const { data: l } = supabase.auth.onAuthStateChange((_e, session) => {
        const u = session?.user;
        setUser(u ? { id: u.id, email: u.email, user_metadata: u.user_metadata } : null);
        setIsAdminUser(isAdmin(u?.email));
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
      {/* ===== GOLD PRICE TICKER — single scrollable line ===== */}
      <div className={styles.ticker}>
        <div className={styles.tickerContent}>
          <div className={styles.tickerItem}>
            <TrendingUp size={11} color="var(--gold-primary)" />
            <span style={{ fontWeight: 700, color: 'var(--gold-pale)', fontSize: '0.7rem' }}>
              أسعار اليوم اللحظية
            </span>
          </div>

          {prices ? (
            <>
              {/* عيار الذهب 21 — غرام */}
              <div className={styles.tickerItem}>
                <span style={{ fontWeight: 600 }}>ذهب عيار 21 (غرام):</span>
                <span className={styles.tickerPrice}>
                  {formatCurrency(prices.usdPerGram21k * prices.iqdExchangeRate, 'IQD')}
                  <span className={styles.tickerSecondaryPrice}>
                    ({formatCurrency(prices.usdPerGram21k, 'USD')})
                  </span>
                </span>
              </div>

              {/* مثقال الذهب 21 */}
              <div className={styles.tickerItem}>
                <span style={{ fontWeight: 600 }}>مثقال الذهب 21 (5غ):</span>
                <span className={styles.tickerPrice}>
                  {formatCurrency(prices.usdPerGram21k * 5 * prices.iqdExchangeRate, 'IQD')}
                  <span className={styles.tickerSecondaryPrice}>
                    ({formatCurrency(prices.usdPerGram21k * 5, 'USD')})
                  </span>
                </span>
              </div>
            </>
          ) : (
            <span className={styles.tickerPrice}>جاري تحميل الأسعار...</span>
          )}

          {/* Refresh button */}
          <button onClick={fetchPrices} disabled={refreshing}
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '0 0.25rem', display: 'flex', alignItems: 'center', flexShrink: 0 }}>
            <RefreshCw size={11} style={{ animation: refreshing ? 'spin 1s linear infinite' : 'none' }} />
          </button>
        </div>
      </div>

      {/* ===== MAIN NAVBAR ===== */}
      <nav className={styles.navbar}>
        <div className={styles.container}>
          <Link href="/" className={styles.logo}>
            <Image src="/logo-new.png" alt="مجوهرات كليوباترا" width={120} height={60}
              className={styles.logoImage} priority />
          </Link>

          <div className={styles.navLinks}>
            <Link href="/" className={styles.link}>الرئيسية</Link>
            <Link href="/shop" className={styles.link}>المتجر</Link>
            <Link href="/about" className={styles.link}>من نحن</Link>
          </div>

          <div className={styles.actions}>
            {/* Language toggle */}
            {mounted && (
              <button onClick={() => setLang(lang === 'ar' ? 'en' : 'ar')}
                style={{ background: 'none', border: '1px solid var(--border-color)', color: 'var(--text-secondary)', padding: '0.38rem 0.6rem', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.2rem', height: '38px' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--gold-primary)'; e.currentTarget.style.color = 'var(--gold-primary)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-color)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}>
                🌐 {lang === 'ar' ? 'EN' : 'عربي'}
              </button>
            )}

            {mounted && isAdminUser && (
              <Link href="/admin" className={styles.adminBtn}>
                <Crown size={13} /> <span>التحكم</span>
              </Link>
            )}

            <button onClick={openCart} className={styles.cartButton} aria-label="السلة">
              <ShoppingBag size={19} />
              {mounted && totalItems > 0 && <span className={styles.cartBadge}>{totalItems}</span>}
            </button>

            {mounted && user ? (
              <div className={styles.userMenu}>
                <span className={styles.userName}>
                  <User size={13} />
                  {user.user_metadata?.full_name || user.email?.split('@')[0]}
                </span>
                <button onClick={handleLogout} className={styles.logoutBtn} title="خروج">
                  <LogOut size={14} />
                </button>
              </div>
            ) : (
              <Link href="/login" className={styles.loginBtn}>دخول</Link>
            )}

            <button onClick={openMenu} className={styles.menuBtn} aria-label="القائمة">
              <Menu size={21} />
            </button>
          </div>
        </div>
      </nav>

      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
