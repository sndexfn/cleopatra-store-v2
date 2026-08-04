"use client";
import styles from "./page.module.css";
import Navbar from "@/components/Navbar";
import { Gem, TrendingUp, ShieldCheck, Star, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase, getProducts, Product } from "@/lib/supabase";
import { getLiveGoldPrices, calculateFinalPrice, formatCurrency } from "@/lib/goldPrice";
import { useLangStore } from "@/lib/langStore";
import { arabicDict, englishDict } from "@/lib/dictionary";

export default function Home() {
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [prices, setPrices] = useState<any>(null);
  const { lang } = useLangStore();
  const d = lang === 'ar' ? arabicDict : englishDict;

  // Slide list states
  const [slides, setSlides] = useState<string[]>([
    '/slider-1.jpg',
    'https://images.unsplash.com/photo-1601121141461-9d6647bca1ed?q=80&w=1200&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?q=80&w=1200&auto=format&fit=crop'
  ]);
  const [activeSlide, setActiveSlide] = useState(0);

  useEffect(() => {
    Promise.all([getProducts(), getLiveGoldPrices()]).then(([prods, p]) => {
      setFeaturedProducts(prods.slice(0, 3));
      setPrices(p);
    });

    // Fetch customized slides (First Priority: Supabase Global DB, Second Priority: LocalStorage)
    async function loadGlobalSlides() {
      let loadedSlides = [
        '/slider-1.jpg',
        'https://images.unsplash.com/photo-1601121141461-9d6647bca1ed?q=80&w=1200&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?q=80&w=1200&auto=format&fit=crop'
      ];

      if (supabase) {
        try {
          const { data } = await supabase.from('site_settings').select('*');
          if (data && data.length > 0) {
            const foundRow = data.find((row: any) => row.key === 'custom_slides');
            if (foundRow && foundRow.value) {
              const parsed = JSON.parse(foundRow.value);
              if (Array.isArray(parsed) && parsed.length > 0) {
                setSlides(parsed);
                return;
              }
            }
          }
        } catch (e) {
          console.error('Error loading slides from global DB', e);
        }
      }

      // Fallback to local storage if DB didn't succeed
      if (typeof window !== 'undefined') {
        const custom = localStorage.getItem('custom_slides');
        if (custom) {
          try {
            const parsed = JSON.parse(custom);
            if (Array.isArray(parsed) && parsed.length > 0) {
              loadedSlides = parsed;
            }
          } catch (e) {
            console.error('Error loading custom slides', e);
          }
        }
      }

      setSlides(loadedSlides);
    }

    loadGlobalSlides();
  }, []);

  // Slide transition timer
  useEffect(() => {
    if (slides.length <= 1) return;
    const interval = setInterval(() => {
      setActiveSlide(prev => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [slides]);

  const handlePrevSlide = () => {
    setActiveSlide(prev => (prev - 1 + slides.length) % slides.length);
  };

  const handleNextSlide = () => {
    setActiveSlide(prev => (prev + 1) % slides.length);
  };

  return (
    <>
      <Navbar />
      <main className={styles.main}>
        {/* Dynamic Hero Slider */}
        <section className={styles.hero} style={{ position: 'relative', overflow: 'hidden' }}>
          {/* Animated Background Slides */}
          {slides.map((slide, index) => (
            <div
              key={slide + index}
              style={{
                position: 'absolute',
                inset: 0,
                background: `url('${slide}') center/cover no-repeat`,
                opacity: activeSlide === index ? 0.35 : 0,
                transition: 'opacity 1s ease-in-out',
                zIndex: 1,
              }}
            />
          ))}
          {/* High-contrast gradient overlay */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(to bottom, rgba(3,7,18,0.7) 0%, rgba(3,7,18,0.9) 100%)',
              zIndex: 1,
            }}
          />

          <div className={styles.heroContent} style={{ zIndex: 2 }}>
            <div className={styles.badge}>🇮🇶 {lang === 'ar' ? 'التوصيل لجميع محافظات العراق' : 'Delivery to all Iraqi governorates'}</div>
            <h1 className={styles.title}>{d.heroTitle}</h1>
            <div className={styles.divider}><span>✦</span></div>
            <p className={styles.subtitle}>{d.heroSubtitle}</p>
            <div className={styles.heroBtns}>
              <Link href="/shop" className={styles.ctaBtn}>{d.shopNow} <ArrowLeft size={18} /></Link>
              <Link href="/about" className={styles.outlineBtn}>{lang === 'ar' ? 'قصتنا' : 'Our Story'}</Link>
            </div>

            {/* Slider Navigation Dots */}
            {slides.length > 1 && (
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '2rem', zIndex: 10 }}>
                {slides.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveSlide(idx)}
                    style={{
                      width: '10px',
                      height: '10px',
                      borderRadius: '50%',
                      border: 'none',
                      background: activeSlide === idx ? 'var(--gold-primary)' : 'rgba(255,255,255,0.3)',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                    }}
                    aria-label={`Go to slide ${idx + 1}`}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Side Prev/Next Buttons */}
          {slides.length > 1 && (
            <>
              <button
                onClick={handlePrevSlide}
                style={{
                  position: 'absolute',
                  left: '1.5rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'rgba(0,0,0,0.4)',
                  color: '#fff',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '50%',
                  width: '40px',
                  height: '40px',
                  cursor: 'pointer',
                  zIndex: 10,
                  fontSize: '1.2rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'background 0.2s'
                }}
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(0,0,0,0.7)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'rgba(0,0,0,0.4)')}
              >
                ‹
              </button>
              <button
                onClick={handleNextSlide}
                style={{
                  position: 'absolute',
                  right: '1.5rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'rgba(0,0,0,0.4)',
                  color: '#fff',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '50%',
                  width: '40px',
                  height: '40px',
                  cursor: 'pointer',
                  zIndex: 10,
                  fontSize: '1.2rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'background 0.2s'
                }}
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(0,0,0,0.7)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'rgba(0,0,0,0.4)')}
              >
                ›
              </button>
            </>
          )}
        </section>

        {/* Stats */}
        <section className={styles.stats}>
          <div className={styles.statItem}><span className={styles.statNum}>+50</span><span className={styles.statLabel}>{lang === 'ar' ? 'عاماً من الخبرة' : 'Years of Experience'}</span></div>
          <div className={styles.statDivider} />
          <div className={styles.statItem}><span className={styles.statNum}>+10K</span><span className={styles.statLabel}>{lang === 'ar' ? 'زبون سعيد' : 'Happy Customers'}</span></div>
          <div className={styles.statDivider} />
          <div className={styles.statItem}><span className={styles.statNum}>100%</span><span className={styles.statLabel}>{lang === 'ar' ? 'ذهب أصلي مضمون' : 'Guaranteed Pure Gold'}</span></div>
          <div className={styles.statDivider} />
          <div className={styles.statItem}><span className={styles.statNum}>1</span><span className={styles.statLabel}>{lang === 'ar' ? 'أعيار الذهب (21)' : 'Gold Karat (21)'}</span></div>
        </section>

        {/* Featured Products */}
        {featuredProducts.length > 0 && (
          <section className={styles.featured}>
            <div className={styles.sectionHeader}>
              <h2>{lang === 'ar' ? 'المنتجات المميزة' : 'Featured Jewelry'}</h2>
              <div className={styles.divider}><span>✦</span></div>
            </div>
            <div className={styles.productsGrid}>
              {featuredProducts.map(p => {
                const final = prices ? calculateFinalPrice(p.weightGrams, p.karat, p.makingChargeUSD, prices, p.metal) : { totalUSD: 0, totalIQD: 0 };
                return (
                  <div key={p.id} className={styles.productCard}>
                    <div className={styles.productImgWrap}>
                      <img src={p.imageUrl} alt={p.name} className={styles.productImg} />
                      <span className={styles.karatBadge}>{p.metal === 'silver' ? (lang === 'ar' ? 'فضة نقية' : 'Pure Silver') : `${d.karat} ${p.karat}`}</span>
                    </div>
                    <div className={styles.productBody}>
                      <h3>{p.name}</h3>
                      <p>{p.description}</p>
                      {prices && (
                        <div style={{ display: 'flex', flexDirection: 'column', marginTop: '0.5rem' }}>
                          <span className={styles.price} style={{ color: 'var(--gold-primary)', fontWeight: 700, fontSize: '1.25rem' }}>
                            {formatCurrency(final.totalIQD, 'IQD')}
                          </span>
                          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                            {formatCurrency(final.totalUSD, 'USD')}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            <div style={{ textAlign: 'center', marginTop: '2.5rem' }}>
              <Link href="/shop" className={styles.ctaBtn}>{lang === 'ar' ? 'عرض جميع المنتجات' : 'View All Products'} <ArrowLeft size={18} /></Link>
            </div>
          </section>
        )}

        {/* Features */}
        <section className={styles.features}>
          <div className={styles.sectionHeader}>
            <h2>{d.featuresTitle}</h2>
            <div className={styles.divider}><span>✦</span></div>
          </div>
          <div className={styles.featuresGrid}>
            {[
              { icon: <TrendingUp size={32} />, title: d.feature1Title, desc: d.feature1Desc },
              { icon: <Gem size={32} />, title: d.feature2Title, desc: d.feature2Desc },
              { icon: <ShieldCheck size={32} />, title: d.feature3Title, desc: d.feature3Desc },
              { icon: <Star size={32} />, title: lang === 'ar' ? 'خدمة متميزة' : 'Exquisite Service', desc: lang === 'ar' ? 'فريق متخصص يرافقك من الاختيار حتى التسليم بأمان تام' : 'A dedicated team accompanies you from selection to secure delivery' },
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
          <h2>{lang === 'ar' ? 'هل تبحث عن هدية مميزة؟' : 'Looking for a Special Gift?'}</h2>
          <p>{lang === 'ar' ? 'تواصل معنا مباشرة عبر واتساب أو تابعنا على إنستغرام لمشاهدة أحدث الموديلات' : 'Contact us directly on WhatsApp or follow us on Instagram to view the latest models'}</p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap', marginTop: '1.5rem' }}>
            <a href="https://wa.me/9647724434443" target="_blank" rel="noopener noreferrer" className={styles.whatsappBtn}>
              💬 {lang === 'ar' ? 'تواصل معنا على واتساب' : 'Contact us on WhatsApp'}
            </a>
            <a href="https://www.instagram.com/cleo.patra_jewelry?utm_source=ig_web_button_share_sheet&igsh=ZDNlZDc0MzIxNw==" target="_blank" rel="noopener noreferrer" style={{ background: 'radial-gradient(circle at 30% 107%, #fdf497 0%, #fdf497 5%, #fd5949 45%,#d6249f 60%,#285AEB 90%)', color: '#fff', padding: '0.8rem 1.5rem', borderRadius: '50px', textDecoration: 'none', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '0.5rem', boxShadow: '0 4px 15px rgba(0,0,0,0.2)' }}>
              📸 {lang === 'ar' ? 'تابعنا على إنستغرام' : 'Follow us on Instagram'}
            </a>
          </div>
        </section>

        {/* Footer */}
        <footer className={styles.footer}>
          <p>© 2025 {d.siteTitle} — {lang === 'ar' ? 'جميع الحقوق محفوظة' : 'All Rights Reserved'}</p>
          <p style={{ fontSize: '0.9rem', opacity: 0.8, marginTop: '0.5rem', color: 'var(--gold-primary)' }}>📍 {lang === 'ar' ? 'كربلاء، العراق' : 'Karbala, Iraq'} | 📞 {'+964'} 772 443 4443</p>
          <div style={{ marginTop: '0.5rem' }}>
            <a href="https://www.instagram.com/cleo.patra_jewelry?utm_source=ig_web_button_share_sheet&igsh=ZDNlZDc0MzIxNw==" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--text-muted)', textDecoration: 'none', fontSize: '0.85rem' }}>
              instagram: @cleo.patra_jewelry
            </a>
          </div>
        </footer>
      </main>
    </>
  );
}
