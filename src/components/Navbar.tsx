"use client";

import Link from "next/link";
import Image from "next/image";
import styles from "./Navbar.module.css";
import { ShoppingBag, TrendingUp, Search, Menu } from "lucide-react";
import { useCartStore } from "@/lib/store";
import { useLangStore } from "@/lib/langStore";
import { arabicDict, englishDict } from "@/lib/dictionary";
import { getLiveGoldPrices, GoldPrices, formatCurrency } from "@/lib/goldPrice";
import { useEffect, useState } from "react";
import { supabase, isAdmin } from "@/lib/supabase";
import { useUIStore } from "@/lib/uiStore";

export default function Navbar() {
  const { items } = useCartStore();
  const { lang, setLang } = useLangStore();
  const { openCart, openMenu } = useUIStore();
  const [mounted, setMounted] = useState(false);
  const [prices, setPrices] = useState<GoldPrices | null>(null);
  const [user, setUser] = useState<any>(null);
  const [isAdminUser, setIsAdminUser] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
    // Fetch live prices for ticker
    getLiveGoldPrices().then(p => setPrices(p));
    
    // Fetch user
    if (supabase) {
      (supabase.auth.getSession() as any).then(({ data: { session } }: any) => {
        if (session) {
          setUser(session.user);
          setIsAdminUser(isAdmin(session.user.email));
        }
      });
      
      const { data: authListener } = supabase.auth.onAuthStateChange((event: string, session: any) => {
        if (session) {
          setUser(session.user);
          setIsAdminUser(isAdmin(session.user.email));
        } else {
          setUser(null);
          setIsAdminUser(false);
        }
      });
      return () => {
        authListener.subscription.unsubscribe();
      };
    }
  }, []);

  const d = lang === "ar" ? arabicDict : englishDict;
  const isRtl = lang === "ar";

  const totalItems = items.reduce((acc, item) => acc + item.quantity, 0);

  const toggleLang = () => {
    const newLang = lang === "ar" ? "en" : "ar";
    setLang(newLang);
    // Dynamic document lang and dir update
    document.documentElement.lang = newLang;
    document.documentElement.dir = newLang === "ar" ? "rtl" : "ltr";
  };

  return (
    <div className={styles.navbarContainer}>
      {/* Live Gold Price Ticker */}
      <div className={styles.ticker} dir="rtl">
        <div className={styles.tickerContent}>
          <div className={styles.tickerItem}>
            <TrendingUp size={14} style={{ color: "var(--gold-primary)" }} />
            <span className={styles.tickerLabel}>{d.liveGoldPrice}</span>
          </div>
          {prices ? (
            <>
              <div className={styles.tickerItem}>
                <span>{d.karat24}:</span>
                <span className={styles.tickerPrice}>
                  {formatCurrency(prices.usdPerGram24k * prices.iqdExchangeRate, "IQD")}
                </span>
                <span className={styles.tickerPrice}>
                  ({formatCurrency(prices.usdPerGram24k, "USD")})
                </span>
              </div>
              <div className={styles.tickerItem}>
                <span>{d.karat21}:</span>
                <span className={styles.tickerPrice}>
                  {formatCurrency(prices.usdPerGram21k * prices.iqdExchangeRate, "IQD")}
                </span>
                <span className={styles.tickerPrice}>
                  ({formatCurrency(prices.usdPerGram21k, "USD")})
                </span>
              </div>
              <div className={styles.tickerItem}>
                <span>{d.karat18}:</span>
                <span className={styles.tickerPrice}>
                  {formatCurrency(prices.usdPerGram18k * prices.iqdExchangeRate, "IQD")}
                </span>
                <span className={styles.tickerPrice}>
                  ({formatCurrency(prices.usdPerGram18k, "USD")})
                </span>
              </div>
            </>
          ) : (
            <span>{d.loading}</span>
          )}
        </div>
      </div>

      {/* Main Navigation */}
      <nav className={styles.navbar} dir={isRtl ? "rtl" : "ltr"}>
        <div className={styles.container}>
          <Link href="/" className={styles.logo}>
            <Image
              src="/logo.jpg"
              alt={d.siteTitle}
              width={140}
              height={70}
              className={styles.logoImage}
              priority
            />
          </Link>
          
          <div className={styles.navLinks}>
            <Link href="/" className={styles.link}>{d.home}</Link>
            <Link href="/shop" className={styles.link}>{d.shop}</Link>
            <Link href="/about" className={styles.link}>{d.about}</Link>
          </div>

          <div className={styles.actions}>
            {/* Search Icon */}
            <button className={styles.iconBtn} aria-label="Search">
              <Search size={20} />
            </button>

            {/* Language Toggle Button */}
            <button onClick={toggleLang} className={styles.langBtn} aria-label="Toggle Language">
              {lang === "ar" ? "EN" : "ع"}
            </button>

            {/* Manager Control */}
            {mounted && isAdminUser && (
              <Link href="/admin" className={styles.adminBtn}>
                لوحة تحكم المدير
              </Link>
            )}

            <button onClick={openCart} className={styles.cartButton} aria-label={d.cart}>
              <ShoppingBag size={20} />
              <span className={styles.cartCount}>{mounted ? totalItems : 0}</span>
            </button>

            {mounted && user ? (
              <span className={styles.userName}>
                 {user.user_metadata?.full_name || user.email?.split('@')[0]}
              </span>
            ) : (
              <Link href="/login" className={styles.loginBtn}>
                {d.login}
              </Link>
            )}

            {/* Hamburger Menu */}
            <button onClick={openMenu} className={styles.iconBtn} aria-label="Menu" style={{ marginRight: '10px' }}>
              <Menu size={24} />
            </button>
          </div>
        </div>
      </nav>
    </div>
  );
}
