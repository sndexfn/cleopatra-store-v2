"use client";
import { useEffect, useState } from 'react';
import styles from './page.module.css';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

const defaults = {
  story_text: `تأسس متجر كليوباترا للمجوهرات عام 1975 على يد صاحبه الذي حمل معه حلماً بتقديم أفخر أنواع الذهب والمجوهرات لأبناء العراق. على مدار خمسة عقود، أصبحنا الوجهة الأولى للعائلات والأفراد الباحثين عن الجودة والأصالة.\n\nنلتزم بتقديم ذهب حقيقي بأعيار موثوقة (18، 21، 24) مع شهادات ضمان لكل قطعة، وأسعار شفافة محسوبة وفق سعر الذهب العالمي اللحظي.`,
  stats_years: '+50',
  stats_customers: '+10K',
  stats_karat_count: '3',
};

export default function AboutPage() {
  const router = useRouter();
  const [settings, setSettings] = useState(defaults);

  useEffect(() => {
    async function fetchSettings() {
      if (!supabase) return;
      const { data } = await supabase.from('site_settings').select('*');
      if (data && data.length > 0) {
        const obj: any = {};
        data.forEach((row: any) => { obj[row.key] = row.value; });
        setSettings(prev => ({ ...prev, ...obj }));
      }
    }
    fetchSettings();
  }, []);

  return (
    <main className={styles.main}>
      {/* Back Button */}
      <button onClick={() => router.back()} style={{ position: 'fixed', top: '100px', right: '20px', zIndex: 100, background: 'rgba(197,168,92,0.15)', border: '1px solid var(--border-color)', borderRadius: '50%', width: '44px', height: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--gold-primary)', fontSize: '1.2rem' }}>
        ←
      </button>

      <div className={styles.hero}>
        <div className={styles.heroContent}>
          <p className={styles.tag}>منذ عام 1975</p>
          <h1 className={styles.title}>من نحن</h1>
          <p className={styles.subtitle}>نحن متجر كليوباترا للمجوهرات، وجهتك الأولى للذهب الأصيل والمجوهرات الفاخرة</p>
        </div>
      </div>

      <div className={styles.content}>
        <section className={styles.section}>
          <h2>قصتنا</h2>
          {settings.story_text.split('\n\n').map((para, i) => (
            <p key={i} style={{ marginBottom: '1rem' }}>{para}</p>
          ))}
        </section>

        <div className={styles.statsGrid}>
          <div className={styles.stat}>
            <span className={styles.statNum}>{settings.stats_years}</span>
            <span className={styles.statLabel}>عاماً من الخبرة</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statNum}>{settings.stats_customers}</span>
            <span className={styles.statLabel}>زبون سعيد</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statNum}>100%</span>
            <span className={styles.statLabel}>ذهب حقيقي مضمون</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statNum}>{settings.stats_karat_count}</span>
            <span className={styles.statLabel}>أعيار متوفرة</span>
          </div>
        </div>

        <section className={styles.section}>
          <h2>لماذا كليوباترا؟</h2>
          <div className={styles.features}>
            <div className={styles.feature}><span className={styles.featureIcon}>👑</span><h3>جودة ملكية</h3><p>كل قطعة تمر بفحص دقيق قبل عرضها لضمان أعلى معايير الجودة</p></div>
            <div className={styles.feature}><span className={styles.featureIcon}>💰</span><h3>أسعار شفافة</h3><p>أسعارنا محسوبة مباشرةً وفق سعر الذهب العالمي اللحظي بدون تلاعب</p></div>
            <div className={styles.feature}><span className={styles.featureIcon}>🛡️</span><h3>ضمان كامل</h3><p>نضمن أصالة كل قطعة ونقدم شهادة عيار موثوقة</p></div>
          </div>
        </section>
      </div>
    </main>
  );
}
