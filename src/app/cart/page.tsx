"use client";

import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import { useCartStore } from "@/lib/store";
import { getLiveGoldPrices, calculateFinalPrice, formatCurrency, GoldPrices } from "@/lib/goldPrice";
import styles from "./page.module.css";
import { Trash2 } from "lucide-react";
import Link from "next/link";

export default function CartPage() {
  const { items, updateQuantity, removeItem } = useCartStore();
  const [prices, setPrices] = useState<GoldPrices | null>(null);
  
  // To fix hydration error with Zustand persist
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsClient(true);
    getLiveGoldPrices().then(setPrices);
  }, []);

  if (!isClient) return null;

  let grandTotalUSD = 0;
  let grandTotalIQD = 0;

  if (prices) {
    items.forEach(item => {
      const itemPrice = calculateFinalPrice(item.product.weightGrams, item.product.karat, item.product.makingChargeUSD, prices);
      grandTotalUSD += itemPrice.totalUSD * item.quantity;
      grandTotalIQD += itemPrice.totalIQD * item.quantity;
    });
  }

  return (
    <>
      <Navbar />
      <main className={styles.main}>
        <h1 className={styles.title}>سلة التسوق</h1>

        {items.length === 0 ? (
          <div style={{ textAlign: "center", padding: "4rem 0" }}>
            <p style={{ color: "var(--text-secondary)", marginBottom: "2rem" }}>سلة التسوق فارغة حالياً.</p>
            <Link href="/shop" className={styles.checkoutBtn} style={{ display: "inline-block", width: "auto" }}>
              العودة للمتجر
            </Link>
          </div>
        ) : (
          <div className={styles.cartContainer}>
            <div className={styles.itemsList}>
              {items.map(item => {
                let itemTotalUSD = 0;
                if (prices) {
                  const itemPrice = calculateFinalPrice(item.product.weightGrams, item.product.karat, item.product.makingChargeUSD, prices);
                  itemTotalUSD = itemPrice.totalUSD;
                }

                return (
                  <div key={item.product.id} className={styles.cartItem}>
                    <img src={item.product.imageUrl} alt={item.product.name} className={styles.itemImage} />
                    <div className={styles.itemDetails}>
                      <h3 className={styles.itemName}>{item.product.name}</h3>
                      <p className={styles.itemMeta}>عيار {item.product.karat} | {item.product.weightGrams}غرام</p>
                      
                      <div className={styles.quantityControl}>
                        <button
                          onClick={() => updateQuantity(item.product.id, Math.max(1, item.quantity - 1))}
                          className={styles.qBtn}
                        >-</button>
                        <span className={styles.quantity}>{item.quantity}</span>
                        <button 
                          onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                          className={styles.qBtn}
                        >+</button>
                      </div>
                    </div>

                    <div className={styles.itemPriceArea}>
                      {prices ? (
                        <>
                          <span className={styles.itemPriceUSD}>{formatCurrency(itemTotalUSD * item.quantity, 'USD')}</span>
                          <span className={styles.itemPriceIQD}>~ {formatCurrency(itemTotalUSD * item.quantity * prices.iqdExchangeRate, 'IQD')}</span>
                        </>
                      ) : (
                        <span>جاري الحساب...</span>
                      )}

                      <button onClick={() => removeItem(item.product.id)} className={styles.removeBtn} aria-label="حذف">
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className={styles.summaryCard}>
              <h2 className={styles.summaryTitle}>ملخص الطلب</h2>

              <div className={styles.summaryRow}>
                <span>المجموع بالدولار:</span>
                <span className={styles.totalUSD}>{formatCurrency(grandTotalUSD, 'USD')}</span>
              </div>

              <div className={styles.summaryRow}>
                <span>المجموع بالدينار:</span>
                <span className={styles.totalIQD}>{formatCurrency(grandTotalIQD, 'IQD')}</span>
              </div>

              <div className={styles.note}>
                * يتم تحديث الأسعار تلقائياً بناءً على سعر الذهب العالمي لحظياً.
              </div>

              <Link href="/checkout" className={styles.checkoutBtn}>
                الانتقال للدفع
              </Link>
            </div>
          </div>
        )}
      </main>
    </>
  );
}
