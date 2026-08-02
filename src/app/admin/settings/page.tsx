"use client";
import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { Save, Upload, RefreshCw } from 'lucide-react';

type SiteSettings = {
  story_text: string;
  stats_years: string;
  stats_customers: string;
  stats_karat_count: string;
  hero_bg_url: string;
};

const defaultSettings: SiteSettings = {
  story_text: `تأسس متجر كليوباترا للمجوهرات عام 1975 على يد صاحبه الذي حمل معه حلماً بتقديم أفخر أنواع الذهب والمجوهرات لأبناء العراق. على مدار خمسة عقود، أصبحنا الوجهة الأولى للعائلات والأفراد الباحثين عن الجودة والأصالة.\n\nنلتزم بتقديم ذهب حقيقي بأعيار موثوقة (18، 21، 24) مع شهادات ضمان لكل قطعة، وأسعار شفافة محسوبة وفق سعر الذهب العالمي اللحظي.`,
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

  useEffect(() => { fetchSettings(); }, []);

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
    if (!supabase) { setLoading(false); return; }
    const rows = Object.entries(settings).map(([key, value]) => ({ key, value }));
    for (const row of rows) {
      await supabase.from('site_settings').upsert({ key: row.key, value: row.value }, { onConflict: 'key' });
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

  if (fetching) return <p style={{ color: 'var(--text-muted)', padding: '2rem' }}>جاري التحميل...</p>;

  const inputStyle = { width: '100%', padding: '0.75rem 1rem', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-primary)', fontSize: '1rem', fontFamily: 'inherit', outline: 'none' };
  const labelStyle = { display: 'block', color: 'var(--text-secondary)', marginBottom: '0.5rem', fontSize: '0.9rem' };
  const sectionStyle = { background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '1.5rem', marginBottom: '1.5rem' };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.8rem', color: 'var(--gold-pale)' }}>إعدادات الموقع</h1>
        <button onClick={saveSettings} disabled={loading} style={{ background: 'var(--gold-primary)', color: '#000', border: 'none', borderRadius: '8px', padding: '0.75rem 1.5rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, fontSize: '1rem' }}>
          {loading ? <><RefreshCw size={18} className="spin" /> جاري الحفظ...</> : <><Save size={18} /> {saved ? '✅ تم الحفظ!' : 'حفظ التغييرات'}</>}
        </button>
      </div>

      {/* Hero Background */}
      <div style={sectionStyle}>
        <h2 style={{ color: 'var(--gold-primary)', marginBottom: '1rem', fontSize: '1.1rem' }}>🖼️ صورة خلفية الصفحة الرئيسية</h2>
        {settings.hero_bg_url && (
          <img src={settings.hero_bg_url} alt="bg preview" style={{ width: '100%', maxHeight: '200px', objectFit: 'cover', borderRadius: '8px', marginBottom: '1rem' }} />
        )}
        <input ref={bgRef} type="file" accept="image/*" onChange={handleBgUpload} style={{ display: 'none' }} />
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <button type="button" onClick={() => bgRef.current?.click()} disabled={uploadingBg} style={{ background: 'rgba(197,168,92,0.15)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0.6rem 1.2rem', color: 'var(--gold-primary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Upload size={16} /> {uploadingBg ? 'جاري الرفع...' : 'رفع صورة خلفية'}
          </button>
          <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>أو</span>
          <input style={{ ...inputStyle, flex: 1 }} value={settings.hero_bg_url} onChange={e => setSettings(s => ({ ...s, hero_bg_url: e.target.value }))} placeholder="الصق رابط الصورة هنا" />
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
