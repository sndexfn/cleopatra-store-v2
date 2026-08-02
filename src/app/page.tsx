"use client";
import styles from "./page.module.css";
import Navbar from "@/components/Navbar";
import { Gem, TrendingUp, ShieldCheck, Star, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { getProducts, Product } from "@/lib/supabase";
import { getLiveGoldPrices, calculateFinalPrice, formatCurrency } from "@/lib/goldPrice";

export default function Home() {
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [prices, setPrices] = useState<any>(null);

  useEffect(() => {
    Promise.all([getProducts(), getLiveGoldPrices()]).then(([prods, p]) => {
      setFeaturedProducts(prods.slice(0, 3));
      setPrices(p);
    });
  }, []);

  return (
    <>
      <Navbar />
      <main className={styles.main}>
        {/* Hero */}
        <section className={styles.hero}>
          <div className={styles.heroOverlay} />
          <div className={styles.heroContent}>
            <div className={styles.badge}>🇮🇶 التوصيل لجميع محافظات العراق</div>
            <h1 className={styles.title}>كليوباترا للذهب</h1>
            <div className={styles.divider}><span>✦</span></div>
            <p className={styles.subtitle}>أفخر أنواع الذهب والمجوهرات الأصيلة منذ 1975 — جودة ملكية بأسعار شفافة</p>
            <div className={styles.heroBtns}>
              <Link href="/shop" className={styles.ctaBtn}>تسوق الآن <ArrowLeft size={18} /></Link>
              <Link href="/about" className={styles.outlineBtn}>قصتنا</Link>
            </div>
          </div>
        </section>

        {/* Stats */}
        <section className={styles.stats}>
          <div className={styles.statItem}><span className={styles.statNum}>+50</span><span className={styles.statLabel}>عاماً من الخبرة</span></div>
          <div className={styles.statDivider} />
          <div className={styles.statItem}><span className={styles.statNum}>+10K</span><span className={styles.statLabel}>زبون سعيد</span></div>
          <div className={styles.statDivider} />
          <div className={styles.statItem}><span className={styles.statNum}>100%</span><span className={styles.statLabel}>ذهب أصلي مضمون</span></div>
          <div className={styles.statDivider} />
          <div className={styles.statItem}><span className={styles.statNum}>3</span><span className={styles.statLabel}>أعيار متوفرة</span></div>
        </section>

        {/* Featured Products */}
        {featuredProducts.length > 0 && (
          <section className={styles.featured}>
            <div className={styles.sectionHeader}>
              <h2>المنتجات المميزة</h2>
              <div className={styles.divider}><span>✦</span></div>
            </div>
            <div className={styles.productsGrid}>
              {featuredProducts.map(p => (
                <div key={p.id} className={styles.productCard}>
                  <div className={styles.productImgWrap}>
                    <img src={p.imageUrl} alt={p.name} className={styles.productImg} />
                    <span className={styles.karatBadge}>عيار {p.karat}</span>
                  </div>
                  <div className={styles.productBody}>
                    <h3>{p.name}</h3>
                    <p>{p.description}</p>
                    {prices && (
                      <span className={styles.price}>
                        {formatCurrency(calculateFinalPrice(p.weightGrams, p.karat, p.makingChargeUSD, prices).totalUSD, 'USD')}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <div style={{ textAlign: 'center', marginTop: '2.5rem' }}>
              <Link href="/shop" className={styles.ctaBtn}>عرض جميع المنتجات <ArrowLeft size={18} /></Link>
            </div>
          </section>
        )}

        {/* Features */}
        <section className={styles.features}>
          <div className={styles.sectionHeader}>
            <h2>لماذا كليوباترا؟</h2>
            <div className={styles.divider}><span>✦</span></div>
          </div>
          <div className={styles.featuresGrid}>
            {[
              { icon: <TrendingUp size={32} />, title: 'أسعار لحظية شفافة', desc: 'أسعارنا محسوبة مباشرة وفق سعر الذهب العالمي اللحظي بدون تلاعب' },
              { icon: <Gem size={32} />, title: 'تصاميم حصرية فاخرة', desc: 'مجموعات مصممة خصيصاً تجمع بين الأصالة العراقية والأناقة العصرية' },
              { icon: <ShieldCheck size={32} />, title: 'ضمان الأصالة', desc: 'شهادة ضمان لكل قطعة وأعيار موثوقة 18، 21، 24' },
              { icon: <Star size={32} />, title: 'خدمة متميزة', desc: 'فريق متخصص يرافقك من الاختيار حتى التسليم بأمان تام' },
            ].map((f, i) => (
              <div key={i} className={styles.featureCard}>
                <div className={styles.featureIcon}>{f.icon}</div>
                <h3>{f.title}</h3>
                <p>{f.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA Banner */}
        <section className={styles.ctaBanner}>
          <h2>هل تبحث عن هدية مميزة؟</h2>
          <p>تواصل معنا مباشرة عبر واتساب للطلبات الخاصة والحفلات</p>
          <a href="https://wa.me/9647724434443" target="_blank" rel="noopener noreferrer" className={styles.whatsappBtn}>
            💬 تواصل معنا على واتساب
          </a>
        </section>

        {/* Footer */}
        <footer className={styles.footer}>
          <p>© 2025 كليوباترا للذهب — جميع الحقوق محفوظة</p>
          <p style={{ fontSize: '0.8rem', opacity: 0.5, marginTop: '0.5rem' }}>بغداد، العراق | {'+964'} 772 443 4443</p>
        </footer>
      </main>
    </>
  );
}
