"use client";
import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { Save, Upload, RefreshCw, Trash2, Plus, AlertCircle, Coins } from 'lucide-react';

type SiteSettings = {
  story_text: string;
  stats_years: string;
  stats_customers: string;
  stats_karat_count: string;
  hero_bg_url: string;
};

const defaultSettings: SiteSettings = {
  story_text: `تأسس متجر كلياباترا للمجوهرات عام 1975 على يد صاحبه الذي حمل معه حلماً بتقديم أفخر أنواع الذهب والمجوهرات لأبناء العراق. على مدار خمسة عقود، أصبحنا الوجهة الأولى للعائلات والأفراد الباحثين عن الجودة والأصالة.\n\nنلتزم بتقديم ذهب حقيقي بأعيار موثوقة (18، 21، 24) مع شهادات ضمان لكل قطعة، وأسعار شفافة محسوبة وفق سعر الذهب العالمي اللحظي.`,
  stats_years: '+50',
  stats_customers: '+10K',
  stats_karat_count: '3',
  hero_bg_url: '',
};

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<SiteSettings>(defaultSettings);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [saved, setSaved] = useState(false);
  const [uploadingBg, setUploadingBg] = useState(false);
  const bgRef = useRef<HTMLInputElement>(null);

  // Price overrides state
  const [gold21kIQD, setGold21kIQD] = useState('');
  const [silverIQD, setSilverIQD] = useState('');
  const [exchangeRate, setExchangeRate] = useState('1310');

  // Slider images state
  const [slides, setSlides] = useState<string[]>([]);
  const [newSlideUrl, setNewSlideUrl] = useState('');

  useEffect(() => {
    fetchSettings();
    loadOverridesAndSlides();
  }, []);

  function loadOverridesAndSlides() {
    if (typeof window !== 'undefined') {
      setGold21kIQD(localStorage.getItem('override_gold_21k_iqd_per_gram') || '');
      setSilverIQD(localStorage.getItem('override_silver_iqd_per_gram') || '');
      setExchangeRate(localStorage.getItem('override_exchange_rate') || '1310');

      const custom = localStorage.getItem('custom_slides');
      if (custom) {
        try {
          setSlides(JSON.parse(custom));
        } catch {
          setSlides(['/slider-1.jpg']);
        }
      } else {
        setSlides([
          '/slider-1.jpg',
          'https://images.unsplash.com/photo-1601121141461-9d6647bca1ed?q=80&w=1200&auto=format&fit=crop',
          'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?q=80&w=1200&auto=format&fit=crop'
        ]);
      }
    }
  }

  async function fetchSettings() {
    setFetching(true);
    if (!supabase) { setFetching(false); return; }
    const { data, error } = await supabase.from('site_settings').select('*');
    if (!error && data && data.length > 0) {
      const obj: any = {};
      data.forEach((row: any) => { obj[row.key] = row.value; });
      setSettings(prev => ({ ...prev, ...obj }));
    }
    setFetching(false);
  }

  async function saveSettings() {
    setLoading(true);

    // Save DB site settings
    if (supabase) {
      const rows = Object.entries(settings).map(([key, value]) => ({ key, value }));
      for (const row of rows) {
        await supabase.from('site_settings').upsert({ key: row.key, value: row.value }, { onConflict: 'key' });
      }
    }

    // Save Price overrides & Slider list in localStorage
    if (typeof window !== 'undefined') {
      if (gold21kIQD.trim()) {
        localStorage.setItem('override_gold_21k_iqd_per_gram', gold21kIQD.trim());
      } else {
        localStorage.removeItem('override_gold_21k_iqd_per_gram');
      }

      if (silverIQD.trim()) {
        localStorage.setItem('override_silver_iqd_per_gram', silverIQD.trim());
      } else {
        localStorage.removeItem('override_silver_iqd_per_gram');
      }

      localStorage.setItem('override_exchange_rate', exchangeRate.trim() || '1310');
      localStorage.setItem('custom_slides', JSON.stringify(slides));
    }

    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
    setLoading(false);
  }

  const handleBgUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !supabase) return;
    setUploadingBg(true);
    const ext = file.name.split('.').pop();
    const path = `backgrounds/hero.${ext}`;
    const { data, error } = await supabase.storage.from('product-images').upload(path, file, { upsert: true });
    if (!error && data) {
      const { data: { publicUrl } } = supabase.storage.from('product-images').getPublicUrl(path);
      setSettings(s => ({ ...s, hero_bg_url: publicUrl }));
    } else {
      alert('خطأ في رفع الصورة: ' + error?.message);
    }
    setUploadingBg(false);
  };

  const handleAddSlide = () => {
    if (!newSlideUrl.trim()) return;
    setSlides(prev => [...prev, newSlideUrl.trim()]);
    setNewSlideUrl('');
  };

  const handleRemoveSlide = (index: number) => {
    setSlides(prev => prev.filter((_, idx) => idx !== index));
  };

  const handleResetPrices = () => {
    setGold21kIQD('');
    setSilverIQD('');
    setExchangeRate('1310');
    if (typeof window !== 'undefined') {
      localStorage.removeItem('override_gold_21k_iqd_per_gram');
      localStorage.removeItem('override_silver_iqd_per_gram');
      localStorage.setItem('override_exchange_rate', '1310');
    }
    alert('تم إعادة تعيين الأسعار لتعود إلى الأسعار العالمية التلقائية اللحظية.');
  };

  if (fetching) return <p style={{ color: 'var(--text-muted)', padding: '2rem' }}>جاري التحميل...</p>;

  const inputStyle = { width: '100%', padding: '0.75rem 1rem', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-primary)', fontSize: '1rem', fontFamily: 'inherit', outline: 'none' };
  const labelStyle = { display: 'block', color: 'var(--text-secondary)', marginBottom: '0.5rem', fontSize: '0.9rem' };
  const sectionStyle = { background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '1.5rem', marginBottom: '1.5rem' };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.8rem', color: 'var(--gold-pale)' }}>إعدادات الموقع والأسعار</h1>
        <button onClick={saveSettings} disabled={loading} style={{ background: 'var(--gold-primary)', color: '#000', border: 'none', borderRadius: '8px', padding: '0.75rem 1.5rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, fontSize: '1rem' }}>
          {loading ? <><RefreshCw size={18} className="spin" /> جاري الحفظ...</> : <><Save size={18} /> {saved ? '✅ تم الحفظ!' : 'حفظ التغييرات'}</>}
        </button>
      </div>

      {/* Gold & Silver Pricing Overrides Section */}
      <div style={{ ...sectionStyle, borderLeft: '4px solid var(--gold-primary)' }}>
        <h2 style={{ color: 'var(--gold-primary)', marginBottom: '0.5rem', fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Coins size={20} /> التحكم بأسعار الذهب والفضة (يدوي / تلقائي)
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
          إذا تركت الحقول فارغة، سيقوم النظام تلقائياً بجلب أسعار الذهب والفضة العالمية المحدثة لحظياً عبر API. أدخل قيمة محددة إذا أردت تثبيت السعر يدويًا بالدينار العراقي.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem' }}>
          <div>
            <label style={labelStyle}>سعر غرام الذهب 21 يدوياً (د.ع) *</label>
            <input
              style={inputStyle}
              type="number"
              value={gold21kIQD}
              onChange={e => setGold21kIQD(e.target.value)}
              placeholder="مثال: 95000 (اتركه فارغاً للتلقائي)"
            />
          </div>
          <div>
            <label style={labelStyle}>سعر غرام الفضة يدوياً (د.ع) *</label>
            <input
              style={inputStyle}
              type="number"
              value={silverIQD}
              onChange={e => setSilverIQD(e.target.value)}
              placeholder="مثال: 1800 (اتركه فارغاً للتلقائي)"
            />
          </div>
          <div>
            <label style={labelStyle}>سعر صرف الدولار مقابل الدينار يدوياً</label>
            <input
              style={inputStyle}
              type="number"
              value={exchangeRate}
              onChange={e => setExchangeRate(e.target.value)}
              placeholder="1310"
            />
          </div>
        </div>

        <div style={{ marginTop: '1.5rem', display: 'flex', gap: '1rem' }}>
          <button
            type="button"
            onClick={handleResetPrices}
            style={{
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: '8px',
              padding: '0.6rem 1.2rem',
              color: '#f87171',
              cursor: 'pointer',
              fontWeight: 600
            }}
          >
            🔄 إعادة تعيين للأسعار العالمية اللحظية
          </button>
        </div>
      </div>

      {/* Hero Interactive Slider Banners Section */}
      <div style={sectionStyle}>
        <h2 style={{ color: 'var(--gold-primary)', marginBottom: '0.5rem', fontSize: '1.2rem' }}>🖼️ صور البانر المتحرك في الواجهة الرئيسية (Slider)</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
          أضف أو احذف الصور التي تظهر خلف النص في الواجهة الأمامية بشكل متحرك.
        </p>

        {/* List of current slides */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
          {slides.map((slide, index) => (
            <div key={index} style={{ position: 'relative', border: '1px solid var(--border-color)', borderRadius: '10px', overflow: 'hidden', background: '#000' }}>
              <img src={slide} alt={`slide ${index + 1}`} style={{ width: '100%', height: '110px', objectFit: 'cover', opacity: 0.8 }} />
              <div style={{ padding: '0.4rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-card)' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '110px' }}>
                  {slide}
                </span>
                <button
                  type="button"
                  onClick={() => handleRemoveSlide(index)}
                  style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}
                  title="حذف الصورة"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Add new slide row */}
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <input
            style={{ ...inputStyle, flex: 1 }}
            value={newSlideUrl}
            onChange={e => setNewSlideUrl(e.target.value)}
            placeholder="أدخل رابط صورة البانر الجديد (URL)..."
          />
          <button
            type="button"
            onClick={handleAddSlide}
            style={{
              background: 'var(--gold-primary)',
              color: '#000',
              border: 'none',
              borderRadius: '8px',
              padding: '0 1.5rem',
              cursor: 'pointer',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: '0.25rem'
            }}
          >
            <Plus size={18} /> إضافة
          </button>
        </div>
      </div>

      {/* Story Text */}
      <div style={sectionStyle}>
        <h2 style={{ color: 'var(--gold-primary)', marginBottom: '1rem', fontSize: '1.1rem' }}>✍️ قصتنا (صفحة من نحن)</h2>
        <label style={labelStyle}>نص القصة</label>
        <textarea
          value={settings.story_text}
          onChange={e => setSettings(s => ({ ...s, story_text: e.target.value }))}
          rows={8}
          style={{ ...inputStyle, resize: 'vertical' }}
        />
      </div>

      {/* Stats */}
      <div style={sectionStyle}>
        <h2 style={{ color: 'var(--gold-primary)', marginBottom: '1rem', fontSize: '1.1rem' }}>📊 الإحصائيات (صفحة من نحن)</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
          <div>
            <label style={labelStyle}>سنوات الخبرة</label>
            <input style={inputStyle} value={settings.stats_years} onChange={e => setSettings(s => ({ ...s, stats_years: e.target.value }))} placeholder="+50" />
          </div>
          <div>
            <label style={labelStyle}>عدد الزبائن</label>
            <input style={inputStyle} value={settings.stats_customers} onChange={e => setSettings(s => ({ ...s, stats_customers: e.target.value }))} placeholder="+10K" />
          </div>
          <div>
            <label style={labelStyle}>عدد الأعيار</label>
            <input style={inputStyle} value={settings.stats_karat_count} onChange={e => setSettings(s => ({ ...s, stats_karat_count: e.target.value }))} placeholder="3" />
          </div>
        </div>
      </div>

      <button onClick={saveSettings} disabled={loading} style={{ background: 'var(--gold-primary)', color: '#000', border: 'none', borderRadius: '8px', padding: '0.75rem 2rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, fontSize: '1rem', marginTop: '1rem' }}>
        <Save size={18} /> {saved ? '✅ تم الحفظ!' : 'حفظ كل التغييرات'}
      </button>
    </div>
  );
}
