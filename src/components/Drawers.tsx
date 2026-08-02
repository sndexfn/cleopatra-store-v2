"use client";

import { useUIStore } from "@/lib/uiStore";
import { useCartStore } from "@/lib/store";
import styles from "./Drawers.module.css";
import { X, Trash2 } from "lucide-react";
import { getLiveGoldPrices, calculateFinalPrice, formatCurrency, GoldPrices } from "@/lib/goldPrice";
import { useEffect, useState } from "react";
import Image from "next/image";

export default function Drawers() {
  const { 
    isCartOpen, closeCart, 
    isCheckoutOpen, openCheckout, closeCheckout,
    isMenuOpen, closeMenu 
  } = useUIStore();
  const { items, updateQuantity, removeItem } = useCartStore();
  const [prices, setPrices] = useState<GoldPrices | null>(null);

  useEffect(() => {
    getLiveGoldPrices().then(setPrices);
  }, [isCartOpen, isCheckoutOpen]);

  let grandTotalUSD = 0;
  if (prices) {
    items.forEach(item => {
      const itemPrice = calculateFinalPrice(item.product.weightGrams, item.product.karat, item.product.makingChargeUSD, prices);
      grandTotalUSD += itemPrice.totalUSD * item.quantity;
    });
  }

  return (
    <>
      {/* Cart Drawer */}
      <div className={`${styles.drawerOverlay} ${isCartOpen ? styles.open : ""}`} onClick={closeCart}>
        <div className={styles.drawerContent} onClick={e => e.stopPropagation()}>
          <div className={styles.drawerHeader}>
            <button className={styles.closeBtn} onClick={closeCart}><X /></button>
            <h2>سلة التسوق ({items.length})</h2>
          </div>
          <div className={styles.drawerBody}>
            {items.map(item => (
              <div key={item.product.id} className={styles.cartItem}>
                <Image src={item.product.imageUrl} alt={item.product.name} width={60} height={60} className={styles.itemImage} />
                <div className={styles.itemDetails}>
                  <h4>{item.product.name}</h4>
                  <div className={styles.qControl}>
                    <button onClick={() => updateQuantity(item.product.id, Math.max(1, item.quantity - 1))}>-</button>
                    <span>{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.product.id, item.quantity + 1)}>+</button>
                  </div>
                </div>
                <button onClick={() => removeItem(item.product.id)} className={styles.deleteBtn}><Trash2 size={16}/></button>
              </div>
            ))}
          </div>
          <div className={styles.drawerFooter}>
            <div className={styles.totalRow}>
              <span>الإجمالي</span>
              <span>{formatCurrency(grandTotalUSD, 'USD')}</span>
            </div>
            <button className={styles.checkoutBtn} onClick={openCheckout}>إتمام الشراء ←</button>
          </div>
        </div>
      </div>

      {/* Checkout Drawer (Skeleton for now) */}
      <div className={`${styles.drawerOverlay} ${isCheckoutOpen ? styles.open : ""}`} onClick={closeCheckout}>
        <div className={styles.drawerContent} onClick={e => e.stopPropagation()}>
          <div className={styles.drawerHeader}>
            <button className={styles.closeBtn} onClick={closeCheckout}><X /></button>
            <h2>إتمام الشراء</h2>
          </div>
          <div className={styles.drawerBody}>
            <p>نموذج الدفع سيظهر هنا (جارٍ تصميمه)</p>
          </div>
        </div>
      </div>

      {/* Mobile/Hamburger Menu Drawer */}
      <div className={`${styles.drawerOverlay} ${isMenuOpen ? styles.open : ""}`} onClick={closeMenu}>
        <div className={styles.drawerContent} onClick={e => e.stopPropagation()}>
          <div className={styles.drawerHeader}>
            <button className={styles.closeBtn} onClick={closeMenu}><X /></button>
            <h2>القائمة</h2>
          </div>
          <div className={styles.drawerBody}>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '1rem', fontSize: '1.2rem' }}>
              <li><a href="/" style={{ color: 'var(--text-light)', textDecoration: 'none' }}>الرئيسية</a></li>
              <li><a href="/shop" style={{ color: 'var(--text-light)', textDecoration: 'none' }}>المتجر</a></li>
              <li><a href="/shop?category=rings" style={{ color: 'var(--text-light)', textDecoration: 'none' }}>خواتم</a></li>
              <li><a href="/shop?category=necklaces" style={{ color: 'var(--text-light)', textDecoration: 'none' }}>قلائد</a></li>
              <li><a href="/shop?category=bracelets" style={{ color: 'var(--text-light)', textDecoration: 'none' }}>أساور</a></li>
              <li><a href="/about" style={{ color: 'var(--text-light)', textDecoration: 'none' }}>من نحن</a></li>
            </ul>
          </div>
        </div>
      </div>
    </>
  );
}
