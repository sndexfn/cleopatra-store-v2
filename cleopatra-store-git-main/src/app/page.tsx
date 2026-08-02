"use client";

import styles from "./page.module.css";
import Navbar from "@/components/Navbar";
import { Gem, TrendingUp, ShieldCheck } from "lucide-react";
import { useLangStore } from "@/lib/langStore";
import { arabicDict, englishDict } from "@/lib/dictionary";
import Link from "next/link";

export default function Home() {
  const { lang } = useLangStore();
  const d = lang === "ar" ? arabicDict : englishDict;
  const isRtl = lang === "ar";

  return (
    <>
      <Navbar />
      <main className={styles.main} dir={isRtl ? "rtl" : "ltr"}>
        {/* Luxury Hero Section */}
        <section className={styles.hero}>
          <div className={styles.heroContent}>
            {/* Iraq Target Badge */}
            <div className={styles.iraqBadge}>
              <span>{d.iraqDeliveryBadge}</span>
            </div>

            <h1 className={styles.title}>{d.heroTitle}</h1>

            <div className={styles.decorativeLine}></div>

            <p className={styles.subtitle}>{d.heroSubtitle}</p>

            <Link href="/shop">
              <button className={styles.ctaButton}>
                {d.shopNow}
              </button>
            </Link>
          </div>
        </section>

        {/* Feature Highlights Showcase */}
        <section className={styles.features}>
          <div className={styles.featuresTitleSection}>
            <h2 className={styles.featuresMainTitle}>{d.featuresTitle}</h2>
            <div className={styles.decorativeLine}></div>
          </div>

          <div className={styles.featuresContainer}>
            {/* Feature 1: Live Global Pricing */}
            <div className={styles.featureCard}>
              <div className={styles.featureIcon}>
                <TrendingUp size={36} />
              </div>
              <h3 className={styles.featureTitle}>{d.feature1Title}</h3>
              <p className={styles.featureDesc}>{d.feature1Desc}</p>
            </div>
            
            {/* Feature 2: Exclusive Luxury Designs */}
            <div className={styles.featureCard}>
              <div className={styles.featureIcon}>
                <Gem size={36} />
              </div>
              <h3 className={styles.featureTitle}>{d.feature2Title}</h3>
              <p className={styles.featureDesc}>{d.feature2Desc}</p>
            </div>

            {/* Feature 3: Insured Iraq Delivery */}
            <div className={styles.featureCard}>
              <div className={styles.featureIcon}>
                <ShieldCheck size={36} />
              </div>
              <h3 className={styles.featureTitle}>{d.feature3Title}</h3>
              <p className={styles.featureDesc}>{d.feature3Desc}</p>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
