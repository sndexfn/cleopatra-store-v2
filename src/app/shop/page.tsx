"use client";

import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import ProductCard from "@/components/ProductCard";
import { getProducts, Product } from "@/lib/supabase";
import { getLiveGoldPrices, GoldPrices } from "@/lib/goldPrice";
import { useLangStore } from "@/lib/langStore";
import { arabicDict, englishDict } from "@/lib/dictionary";
import styles from "./page.module.css";
import { Search } from "lucide-react";

export default function ShopPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [prices, setPrices] = useState<GoldPrices | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // Metal Selection: 'gold' | 'silver'
  const [selectedMetal, setSelectedMetal] = useState<'gold' | 'silver'>('gold');
  // Subcategory within that metal
  const [selectedSubCategory, setSelectedSubCategory] = useState<string>('all');

  const { lang } = useLangStore();
  const d = lang === "ar" ? arabicDict : englishDict;
  const isRtl = lang === "ar";

  useEffect(() => {
    async function fetchData() {
      const [fetchedProducts, fetchedPrices] = await Promise.all([
        getProducts(),
        getLiveGoldPrices()
      ]);
      setProducts(fetchedProducts);
      setPrices(fetchedPrices);
      setLoading(false);
    }
    fetchData();
  }, []);

  // Filter products by metal first, then search term, then subcategory
  const filteredProducts = products.filter(product => {
    // Metal check (default to 'gold' if not specified)
    const productMetal = product.metal || 'gold';
    if (productMetal !== selectedMetal) return false;

    // Search query check
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          product.description.toLowerCase().includes(searchTerm.toLowerCase());
    if (!matchesSearch) return false;

    // Subcategory check
    if (selectedSubCategory === 'all') return true;
    if (selectedSubCategory === 'rings') return product.name.includes("خاتم");
    if (selectedSubCategory === 'necklaces') return product.name.includes("قلادة") || product.name.includes("سلسلة") || product.name.includes("طقم");
    if (selectedSubCategory === 'bracelets') return product.name.includes("سوار") || product.name.includes("أساور");
    if (selectedSubCategory === 'earrings') return product.name.includes("أقراط");

    return true;
  });

  // Reset subcategory on metal switch
  const handleMetalChange = (metal: 'gold' | 'silver') => {
    setSelectedMetal(metal);
    setSelectedSubCategory('all');
  };

  return (
    <>
      <Navbar />
      <main className={styles.main} dir={isRtl ? "rtl" : "ltr"}>
        <div className={styles.header}>
          <h1 className={styles.title}>{selectedMetal === 'gold' ? 'قسم الذهب' : 'قسم الفضة'}</h1>
          <p className={styles.subtitle}>أرقى المجوهرات في العراق بأدق تفاصيل الأوزان والتصميم</p>
        </div>

        {/* Filter Controls matching Sketch Layout */}
        <div className={styles.controls} style={{ maxWidth: '600px', margin: '0 auto 2.5rem auto' }}>
          {/* Search Box */}
          <div className={styles.searchWrapper} style={{ marginBottom: '1.5rem', position: 'relative' }}>
            <input
              type="text"
              className={styles.searchInput}
              placeholder="ابحث عن قطعة أحلامك..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              style={{ width: '100%', padding: '0.8rem 1rem 0.8rem 2.5rem', borderRadius: '12px', border: '2px solid var(--border-color)', background: 'var(--bg-card)', color: 'var(--text-primary)', fontSize: '1rem', outline: 'none' }}
            />
            <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          </div>

          {/* Metal Tab Switcher: Gold vs Silver */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
            <button
              onClick={() => handleMetalChange('gold')}
              style={{
                padding: '1rem',
                borderRadius: '12px',
                border: '2px solid',
                borderColor: selectedMetal === 'gold' ? 'var(--gold-primary)' : 'var(--border-color)',
                background: selectedMetal === 'gold' ? 'rgba(197,168,92,0.15)' : 'var(--bg-card)',
                color: selectedMetal === 'gold' ? 'var(--gold-primary)' : 'var(--text-secondary)',
                fontWeight: 700,
                fontSize: '1.1rem',
                cursor: 'pointer',
                transition: 'all 0.2s',
                textAlign: 'center'
              }}
            >
              👑 الذهب (Gold)
            </button>
            <button
              onClick={() => handleMetalChange('silver')}
              style={{
                padding: '1rem',
                borderRadius: '12px',
                border: '2px solid',
                borderColor: selectedMetal === 'silver' ? '#e2e8f0' : 'var(--border-color)',
                background: selectedMetal === 'silver' ? 'rgba(255,255,255,0.1)' : 'var(--bg-card)',
                color: selectedMetal === 'silver' ? '#fff' : 'var(--text-secondary)',
                fontWeight: 700,
                fontSize: '1.1rem',
                cursor: 'pointer',
                transition: 'all 0.2s',
                textAlign: 'center'
              }}
            >
              💍 الفضة (Silver)
            </button>
          </div>

          {/* Subcategories (Gold vs Silver categories only) */}
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', justifyContent: 'center' }}>
            <button
              onClick={() => setSelectedSubCategory('all')}
              style={{
                padding: '0.5rem 1rem',
                borderRadius: '8px',
                border: '1px solid var(--border-color)',
                background: selectedSubCategory === 'all' ? 'var(--gold-primary)' : 'transparent',
                color: selectedSubCategory === 'all' ? '#000' : 'var(--text-secondary)',
                cursor: 'pointer',
                fontSize: '0.9rem',
                fontWeight: 600
              }}
            >
              {selectedMetal === 'gold' ? 'كل الذهب' : 'كل الفضة'}
            </button>
            <button
              onClick={() => setSelectedSubCategory('rings')}
              style={{
                padding: '0.5rem 1rem',
                borderRadius: '8px',
                border: '1px solid var(--border-color)',
                background: selectedSubCategory === 'rings' ? 'var(--gold-primary)' : 'transparent',
                color: selectedSubCategory === 'rings' ? '#000' : 'var(--text-secondary)',
                cursor: 'pointer',
                fontSize: '0.9rem',
                fontWeight: 600
              }}
            >
              الخواتم
            </button>
            <button
              onClick={() => setSelectedSubCategory('necklaces')}
              style={{
                padding: '0.5rem 1rem',
                borderRadius: '8px',
                border: '1px solid var(--border-color)',
                background: selectedSubCategory === 'necklaces' ? 'var(--gold-primary)' : 'transparent',
                color: selectedSubCategory === 'necklaces' ? '#000' : 'var(--text-secondary)',
                cursor: 'pointer',
                fontSize: '0.9rem',
                fontWeight: 600
              }}
            >
              القلائد والأطقم
            </button>
            <button
              onClick={() => setSelectedSubCategory('bracelets')}
              style={{
                padding: '0.5rem 1rem',
                borderRadius: '8px',
                border: '1px solid var(--border-color)',
                background: selectedSubCategory === 'bracelets' ? 'var(--gold-primary)' : 'transparent',
                color: selectedSubCategory === 'bracelets' ? '#000' : 'var(--text-secondary)',
                cursor: 'pointer',
                fontSize: '0.9rem',
                fontWeight: 600
              }}
            >
              الأساور
            </button>
            <button
              onClick={() => setSelectedSubCategory('earrings')}
              style={{
                padding: '0.5rem 1rem',
                borderRadius: '8px',
                border: '1px solid var(--border-color)',
                background: selectedSubCategory === 'earrings' ? 'var(--gold-primary)' : 'transparent',
                color: selectedSubCategory === 'earrings' ? '#000' : 'var(--text-secondary)',
                cursor: 'pointer',
                fontSize: '0.9rem',
                fontWeight: 600
              }}
            >
              الأقراط
            </button>
          </div>
        </div>

        {loading ? (
          <div className={styles.loadingWrapper}>
            <div className={styles.loadingSpinner}></div>
            <p style={{ color: "var(--gold-primary)", fontWeight: 700 }}>{d.loading}</p>
          </div>
        ) : filteredProducts.length > 0 ? (
          <div className={styles.grid}>
            {filteredProducts.map(product => (
              <ProductCard key={product.id} product={product} goldPrices={prices} />
            ))}
          </div>
        ) : (
          <p className={styles.noProducts} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>
            لا توجد قطع تطابق بحثك أو تصنيفك حالياً في قسم {selectedMetal === 'gold' ? 'الذهب' : 'الفضة'}.
          </p>
        )}
      </main>
    </>
  );
}
