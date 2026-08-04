"use client";

import { Product } from "@/lib/supabase";
import { GoldPrices, calculateFinalPrice, formatCurrency, getPricePerMithqal } from "@/lib/goldPrice";
import { useCartStore } from "@/lib/store";
import { useLangStore } from "@/lib/langStore";
import { arabicDict, englishDict } from "@/lib/dictionary";
import styles from "./ProductCard.module.css";
import { ShoppingCart } from "lucide-react";

interface ProductCardProps {
  product: Product;
  goldPrices: GoldPrices | null;
}

export default function ProductCard({ product, goldPrices }: ProductCardProps) {
  const addItem = useCartStore(state => state.addItem);
  const { lang } = useLangStore();
  const d = lang === "ar" ? arabicDict : englishDict;

  let prices = { totalUSD: 0, totalIQD: 0 };
  if (goldPrices && product.metalType !== 'silver') {
    prices = calculateFinalPrice(product.weightGrams, product.karat, product.makingChargeUSD, goldPrices);
  }

  const handleAddToCart = () => {
    addItem(product);
  };

  return (
    <div className={styles.card}>
      <div className={styles.imageContainer}>
        <img src={product.imageUrl} alt={product.name} loading="lazy" />
        <span className={styles.karatBadge}>{d.karat} {product.karat}</span>
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
            <span className={styles.detailLabel}>{d.makingCharge}</span>
            <span className={styles.detailVal}>{formatCurrency(product.makingChargeUSD, 'USD')}</span>
          </div>
        </div>

        <div className={styles.priceContainer}>
          {product.metalType === 'silver' ? (
            <span className={styles.usdPrice}>{d.loading}</span>
          ) : (goldPrices ? (
            <>
              <span className={styles.usdPrice}>{formatCurrency(prices.totalUSD, 'USD')}</span>
              <span className={styles.iqdPrice}>{formatCurrency(prices.totalIQD, 'IQD')}</span>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>مثقال: {goldPrices ? formatCurrency(getPricePerMithqal(goldPrices, product.karat as any), 'USD') : '—'}</span>
            </>
          ) : (
            <span className={styles.usdPrice}>{d.loading}</span>
          ))}
        </div>

        <button onClick={handleAddToCart} className={styles.addToCart}>
          <ShoppingCart size={18} />
          {d.addToCart}
        </button>
      </div>
    </div>
  );
}
