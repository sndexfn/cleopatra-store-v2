"use client";

import { useState } from "react";
import { Product } from "@/lib/supabase";
import { GoldPrices, calculateFinalPrice, formatCurrency, gramsToMithqal } from "@/lib/goldPrice";
import { useCartStore } from "@/lib/store";
import { useLangStore } from "@/lib/langStore";
import { arabicDict, englishDict } from "@/lib/dictionary";
import styles from "./ProductCard.module.css";
import { ShoppingCart, Eye, X, Scale, Coins, ShieldCheck, ChevronLeft, ChevronRight, Image as ImageIcon } from "lucide-react";

interface ProductCardProps {
  product: Product;
  goldPrices: GoldPrices | null;
}

export default function ProductCard({ product, goldPrices }: ProductCardProps) {
  const addItem = useCartStore(state => state.addItem);
  const { lang } = useLangStore();
  const d = lang === "ar" ? arabicDict : englishDict;
  const [showModal, setShowModal] = useState(false);
  const [activeImgIndex, setActiveImgIndex] = useState(0);

  // Safe parsing of multiple comma-separated image URLs
  const imageUrls = product.imageUrl
    ? product.imageUrl.split(',').map(s => s.trim()).filter(Boolean)
    : [];
  const displayImage = imageUrls[0] || '/logo.jpg';

  let prices = { totalUSD: 0, totalIQD: 0 };
  if (goldPrices) {
    prices = calculateFinalPrice(product.weightGrams, product.karat, product.makingChargeUSD, goldPrices, product.metal);
  }

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    addItem(product);
  };

  const handlePrevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveImgIndex(prev => (prev === 0 ? imageUrls.length - 1 : prev - 1));
  };

  const handleNextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveImgIndex(prev => (prev === imageUrls.length - 1 ? 0 : prev + 1));
  };

  const mithqals = gramsToMithqal(product.weightGrams);

  return (
    <>
      <div className={styles.card} onClick={() => { setShowModal(true); setActiveImgIndex(0); }} style={{ cursor: 'pointer' }}>
        <div className={styles.imageContainer}>
          <img src={displayImage} alt={product.name} loading="lazy" onError={e => { (e.target as HTMLImageElement).src = '/logo.jpg'; }} />
          <span className={styles.karatBadge}>
            {product.metal === 'silver' ? 'فضة نقية' : `${d.karat} ${product.karat}`}
          </span>
          {imageUrls.length > 1 && (
            <span style={{ position: 'absolute', bottom: '8px', left: '8px', background: 'rgba(0,0,0,0.7)', borderRadius: '4px', padding: '2px 6px', fontSize: '0.7rem', color: '#fff', display: 'flex', alignItems: 'center', gap: '3px' }}>
              <ImageIcon size={10} color="var(--gold-primary)" /> {imageUrls.length} صور
            </span>
          )}
          <div className={styles.hoverOverlay} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)', opacity: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'opacity 0.2s' }}
            onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
            onMouseLeave={e => (e.currentTarget.style.opacity = '0')}>
            <span style={{ background: 'var(--gold-primary)', color: '#000', padding: '0.4rem 0.8rem', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '0.25rem', fontWeight: 700, fontSize: '0.85rem' }}>
              <Eye size={16} /> عرض التفاصيل الكاملة
            </span>
          </div>
        </div>
        
        <div className={styles.content}>
          <h3 className={styles.title}>{product.name}</h3>
          <p className={styles.description}>{product.description}</p>

          <div className={styles.details}>
            <div className={styles.detailItem}>
              <span className={styles.detailLabel}>{d.weight}</span>
              <span className={styles.detailVal}>{product.weightGrams} غرام</span>
            </div>
            <div className={styles.detailItem}>
              <span className={styles.detailLabel}>بالمثقال</span>
              <span className={styles.detailVal}>{mithqals.toFixed(2)} مثقال</span>
            </div>
          </div>

          <div className={styles.priceContainer} style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '0.2rem', marginTop: 'auto' }}>
            {goldPrices ? (
              <>
                {/* Primary Price: Dinars (IQD) */}
                <span className={styles.iqdPrice} style={{ fontSize: '1.4rem', color: 'var(--gold-primary)', fontWeight: 700 }}>
                  {formatCurrency(prices.totalIQD, 'IQD')}
                </span>
                {/* Secondary Price: USD, smaller */}
                <span className={styles.usdPrice} style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                  {formatCurrency(prices.totalUSD, 'USD')}
                </span>
              </>
            ) : (
              <span className={styles.usdPrice}>{d.loading}</span>
            )}
          </div>

          <button onClick={handleAddToCart} className={styles.addToCart} style={{ marginTop: '0.8rem' }}>
            <ShoppingCart size={18} />
            {d.addToCart}
          </button>
        </div>
      </div>

      {/* Product Detail Modal */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(3, 7, 18, 0.9)', zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', direction: 'rtl' }} onClick={() => setShowModal(false)}>
          <div style={{ background: 'var(--bg-card)', borderRadius: '20px', border: '1px solid var(--border-color)', maxWidth: '750px', width: '100%', overflow: 'hidden', boxShadow: '0 10px 30px rgba(0,0,0,0.5)', display: 'flex', flexDirection: 'column', maxHeight: '90vh' }} onClick={e => e.stopPropagation()}>

            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border-color)' }}>
              <h2 style={{ color: 'var(--gold-pale)', fontSize: '1.4rem', margin: 0, fontWeight: 700 }}>تفاصيل القطعة الملكية</h2>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                <X size={24} />
              </button>
            </div>

            {/* Modal Content */}
            <div style={{ padding: '1.5rem', overflowY: 'auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>

              {/* Image Column with Gallery Slider */}
              <div style={{ position: 'relative', borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--border-color)', height: '300px', background: 'rgba(0,0,0,0.2)' }}>
                <img src={imageUrls[activeImgIndex] || '/logo.jpg'} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'opacity 0.2s ease-in-out' }} onError={e => { (e.target as HTMLImageElement).src = '/logo.jpg'; }} />

                {imageUrls.length > 1 && (
                  <>
                    {/* Left Swipe Button */}
                    <button onClick={handlePrevImage} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', background: 'rgba(0,0,0,0.6)', border: 'none', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', cursor: 'pointer', zIndex: 10 }}>
                      <ChevronLeft size={18} />
                    </button>
                    {/* Right Swipe Button */}
                    <button onClick={handleNextImage} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'rgba(0,0,0,0.6)', border: 'none', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', cursor: 'pointer', zIndex: 10 }}>
                      <ChevronRight size={18} />
                    </button>
                    {/* Slider Indicator Dots */}
                    <div style={{ position: 'absolute', bottom: '10px', left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: '6px', zIndex: 10 }}>
                      {imageUrls.map((_, idx) => (
                        <span key={idx} style={{ width: '8px', height: '8px', borderRadius: '50%', background: idx === activeImgIndex ? 'var(--gold-primary)' : 'rgba(255,255,255,0.4)', transition: 'background 0.2s' }} />
                      ))}
                    </div>
                  </>
                )}

                <span style={{ position: 'absolute', top: '12px', right: '12px', background: 'var(--gold-primary)', color: '#000', padding: '0.4rem 0.8rem', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 700, zIndex: 5 }}>
                  {product.metal === 'silver' ? 'فضة نقية' : `ذهب عيار ${product.karat}`}
                </span>
              </div>

              {/* Specs Column */}
              <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <h3 style={{ color: '#fff', fontSize: '1.6rem', marginBottom: '0.5rem', fontWeight: 700 }}>{product.name}</h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: '1.6', marginBottom: '1.5rem' }}>{product.description}</p>
                </div>

                {/* Specs Cards */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem', marginBottom: '1.5rem' }}>
                  <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', borderRadius: '10px', padding: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Scale size={20} color="var(--gold-primary)" />
                    <div>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>الوزن الإجمالي</p>
                      <p style={{ fontSize: '1rem', color: '#fff', fontWeight: 700, margin: 0 }}>{product.weightGrams} غرام</p>
                    </div>
                  </div>
                  <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', borderRadius: '10px', padding: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Coins size={20} color="var(--gold-primary)" />
                    <div>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>الوزن بالمثقال</p>
                      <p style={{ fontSize: '1rem', color: '#fff', fontWeight: 700, margin: 0 }}>{mithqals.toFixed(2)} مثقال</p>
                    </div>
                  </div>
                  <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', borderRadius: '10px', padding: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <ShieldCheck size={20} color="var(--gold-primary)" />
                    <div>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>صياغة الغرام الواحد</p>
                      <p style={{ fontSize: '1rem', color: '#fff', fontWeight: 700, margin: 0 }}>{formatCurrency(product.makingChargeUSD / product.weightGrams, 'USD')}</p>
                    </div>
                  </div>
                  <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', borderRadius: '10px', padding: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Coins size={20} color="var(--gold-primary)" />
                    <div>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>إجمالي الصياغة</p>
                      <p style={{ fontSize: '1rem', color: '#fff', fontWeight: 700, margin: 0 }}>{formatCurrency(product.makingChargeUSD, 'USD')}</p>
                    </div>
                  </div>
                </div>

                {/* Price Summary */}
                <div style={{ background: 'rgba(197,168,92,0.08)', border: '1px solid rgba(197,168,92,0.2)', borderRadius: '12px', padding: '1rem', marginBottom: '1.5rem' }}>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '0 0 0.25rem 0' }}>السعر الكلي التقريبي (شامل الصياغة):</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
                    <span style={{ fontSize: '1.8rem', color: 'var(--gold-primary)', fontWeight: 800 }}>
                      {goldPrices ? formatCurrency(prices.totalIQD, 'IQD') : 'جاري الحساب...'}
                    </span>
                    <span style={{ fontSize: '1rem', color: 'var(--text-secondary)' }}>
                      ~ {goldPrices ? formatCurrency(prices.totalUSD, 'USD') : ''}
                    </span>
                  </div>
                </div>

                <button onClick={handleAddToCart} style={{ background: 'var(--gold-primary)', color: '#000', border: 'none', borderRadius: '10px', padding: '0.9rem', cursor: 'pointer', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', fontSize: '1rem', transition: 'all 0.2s' }}>
                  <ShoppingCart size={20} />
                  إضافة هذه القطعة إلى السلة
                </button>
              </div>
            </div>

          </div>
        </div>
      )}
    </>
  );
}
