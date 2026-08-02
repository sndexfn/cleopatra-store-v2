"use client";

import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import { useCartStore } from "@/lib/store";
import { useLangStore } from "@/lib/langStore";
import { arabicDict, englishDict } from "@/lib/dictionary";
import { calculateFinalPrice, getLiveGoldPrices, GoldPrices, formatCurrency } from "@/lib/goldPrice";
import styles from "./page.module.css";
import { CheckCircle } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

// List of Iraqi Governorates with customized delivery fees (approx. in USD)
type Governorate = {
  id: string;
  nameAr: string;
  nameEn: string;
  shippingUSD: number;
};

const IRAQI_GOVERNORATES: Governorate[] = [
  { id: "baghdad", nameAr: "بغداد", nameEn: "Baghdad", shippingUSD: 5 },
  { id: "basra", nameAr: "البصرة", nameEn: "Basra", shippingUSD: 8 },
  { id: "erbil", nameAr: "أربيل", nameEn: "Erbil", shippingUSD: 8 },
  { id: "najaf", nameAr: "النجف", nameEn: "Najaf", shippingUSD: 6 },
  { id: "karbala", nameAr: "كربلاء", nameEn: "Karbala", shippingUSD: 6 },
  { id: "sulaymaniyah", nameAr: "السليمانية", nameEn: "Sulaymaniyah", shippingUSD: 8 },
  { id: "dahuk", nameAr: "دهوك", nameEn: "Dahuk", shippingUSD: 9 },
  { id: "kirkuk", nameAr: "كركوك", nameEn: "Kirkuk", shippingUSD: 7 },
  { id: "ninawa", nameAr: "نينوى", nameEn: "Ninawa", shippingUSD: 8 },
  { id: "babil", nameAr: "بابل", nameEn: "Babil", shippingUSD: 6 },
  { id: "anbar", nameAr: "الأنبار", nameEn: "Anbar", shippingUSD: 7 },
  { id: "diyala", nameAr: "ديالى", nameEn: "Diyala", shippingUSD: 6 },
  { id: "maysan", nameAr: "ميسان", nameEn: "Maysan", shippingUSD: 7 },
  { id: "thi_qar", nameAr: "ذي قار", nameEn: "Thi Qar", shippingUSD: 7 },
  { id: "qadisiyah", nameAr: "القادسية", nameEn: "Qadisiyah", shippingUSD: 6 },
  { id: "wasit", nameAr: "واسط", nameEn: "Wasit", shippingUSD: 6 },
  { id: "salah_al_din", nameAr: "صلاح الدين", nameEn: "Salah al-Din", shippingUSD: 7 },
  { id: "muthanna", nameAr: "المثنى", nameEn: "Muthanna", shippingUSD: 7 }
];

export default function CheckoutPage() {
  const { items, clearCart } = useCartStore();
  const { lang } = useLangStore();
  const router = useRouter();

  const d = lang === "ar" ? arabicDict : englishDict;
  const isRtl = lang === "ar";

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    city: "baghdad",
    address: "",
    notes: ""
  });

  const [prices, setPrices] = useState<GoldPrices | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    getLiveGoldPrices().then(p => setPrices(p));
  }, []);

  if (items.length === 0 && !success) {
    if (typeof window !== "undefined") {
      router.push("/cart");
    }
    return null;
  }

  // Find active governorate shipping price
  const activeGov = IRAQI_GOVERNORATES.find(g => g.id === formData.city) || IRAQI_GOVERNORATES[0];
  const shippingFeeUSD = activeGov.shippingUSD;

  // Calculate items price
  let itemsTotalUSD = 0;
  if (prices) {
    itemsTotalUSD = items.reduce((acc, item) => {
      const p = calculateFinalPrice(
        item.product.weightGrams,
        item.product.karat,
        item.product.makingChargeUSD,
        prices
      );
      return acc + (p.totalUSD * item.quantity);
    }, 0);
  }

  const grandTotalUSD = itemsTotalUSD + shippingFeeUSD;
  const exchangeRate = prices?.iqdExchangeRate || 1310;
  const grandTotalIQD = grandTotalUSD * exchangeRate;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer: {
            name: formData.name,
            phone: formData.phone,
            city: activeGov.nameAr,
            address: formData.address,
            notes: formData.notes
          },
          items: items,
          shippingUSD: shippingFeeUSD,
          grandTotalUSD: grandTotalUSD
        })
      });

      if (response.ok) {
        setSuccess(true);
        clearCart();
      } else {
        alert(isRtl ? "حدث خطأ أثناء معالجة الطلب، يرجى المحاولة مرة أخرى." : "An error occurred, please try again.");
      }
    } catch (error) {
      console.error(error);
      alert(isRtl ? "تعذر الاتصال بالخادم." : "Could not connect to the server.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Navbar />
      <main className={styles.main} dir={isRtl ? "rtl" : "ltr"}>
        {success ? (
          <div className={styles.successMessage}>
            <CheckCircle size={80} className={styles.successIcon} />
            <h1 className={styles.successTitle}>{d.orderSuccess}</h1>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem', fontSize: '1.15rem' }}>
              {d.orderSuccessDesc}
            </p>
            <Link href="/shop" style={{ color: "var(--gold-primary)", textDecoration: "underline", fontWeight: 700 }}>
              {d.continueShopping}
            </Link>
          </div>
        ) : (
          <>
            <h1 className={styles.title}>{d.checkoutTitle}</h1>

            <form className={styles.form} onSubmit={handleSubmit}>
              {/* Full Name */}
              <div className={styles.formGroup}>
                <label className={styles.label}>{d.fullName}</label>
                <input 
                  type="text" 
                  className={styles.input} 
                  required 
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder={isRtl ? "مثال: علي كريم أحمد" : "e.g., Ali Kareem Ahmed"}
                />
              </div>

              {/* Phone Number */}
              <div className={styles.formGroup}>
                <label className={styles.label}>{d.phone}</label>
                <input 
                  type="tel" 
                  className={styles.input} 
                  required 
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  placeholder="077XXXXXXXX"
                />
              </div>

              {/* Governorate Dropdown */}
              <div className={styles.formGroup}>
                <label className={styles.label}>{d.city}</label>
                <select
                  className={styles.input}
                  value={formData.city}
                  onChange={(e) => setFormData({...formData, city: e.target.value})}
                >
                  {IRAQI_GOVERNORATES.map(gov => (
                    <option key={gov.id} value={gov.id}>
                      {isRtl ? gov.nameAr : gov.nameEn} ({formatCurrency(gov.shippingUSD, 'USD')} / ~{formatCurrency(gov.shippingUSD * exchangeRate, 'IQD')})
                    </option>
                  ))}
                </select>
              </div>

              {/* Address Details */}
              <div className={styles.formGroup}>
                <label className={styles.label}>{d.addressDetails}</label>
                <textarea 
                  className={styles.input} 
                  rows={3}
                  required
                  value={formData.address}
                  onChange={(e) => setFormData({...formData, address: e.target.value})}
                  placeholder={isRtl ? "المنطقة، شارع، قرب معلم بارز" : "District, Street, Landmark"}
                ></textarea>
              </div>

              {/* Delivery Notes */}
              <div className={styles.formGroup}>
                <label className={styles.label}>{d.notes}</label>
                <input
                  type="text"
                  className={styles.input}
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  placeholder={isRtl ? "مثال: الاتصال قبل نصف ساعة من الوصول" : "e.g., Call before arrival"}
                />
              </div>

              {/* COD Badge */}
              <div className={styles.codContainer}>
                <span className={styles.codBadge}>{isRtl ? "دفع نقدي" : "COD"}</span>
                <span className={styles.codText}>{d.secureCheckout}</span>
              </div>

              {/* Order Summary */}
              <div className={styles.summary}>
                <h3 className={styles.summaryTitle}>{d.orderSummary}</h3>
                <div className={styles.summaryRow}>
                  <span>{isRtl ? "مجموع المنتجات:" : "Products Total:"}</span>
                  <span>{formatCurrency(itemsTotalUSD, 'USD')}</span>
                </div>
                <div className={styles.summaryRow}>
                  <span>{d.shippingFee}:</span>
                  <span>{formatCurrency(shippingFeeUSD, 'USD')}</span>
                </div>
                <div className={styles.summaryTotal}>
                  <span>{d.total}:</span>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                    <span>{formatCurrency(grandTotalUSD, 'USD')}</span>
                    <span style={{ fontSize: '0.95rem', color: 'var(--text-secondary)' }}>
                      ~ {formatCurrency(grandTotalIQD, 'IQD')}
                    </span>
                  </div>
                </div>
              </div>

              <button type="submit" className={styles.submitBtn} disabled={loading}>
                {loading ? d.loading : d.completeOrder}
              </button>
            </form>
          </>
        )}
      </main>
    </>
  );
}
