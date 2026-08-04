"use client";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import { RefreshCw, Save } from "lucide-react";

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<any>({});
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [saved, setSaved] = useState(false);
  const bgRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function fetchSettings() {
      if (!supabase) { setFetching(false); return; }
      const { data } = await supabase.from('site_settings').select('*');
      if (data && data.length > 0) {
        const obj: any = {};
        data.forEach((row: any) => { obj[row.key] = row.value; });
        setSettings(prev => ({ ...prev, ...obj }));
      }
      setFetching(false);
    }
    fetchSettings();
  }, []);

  const handleBgUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !supabase) return;
    setLoading(true);
    const ext = file.name.split('.').pop();
    const path = `backgrounds/hero.${ext}`;
    const { data, error } = await supabase.storage.from('product-images').upload(path, file, { upsert: true });
    if (!error && data) {
      const { data: { publicUrl } } = supabase.storage.from('product-images').getPublicUrl(path);
      setSettings(s => ({ ...s, hero_bg_url: publicUrl }));
    } else {
      alert('خطأ في رفع الصورة: ' + error?.message);
    }
    setLoading(false);
  };

  const saveSettings = async () => {
    if (!supabase) return;
    setLoading(true);
    setSaved(false);
    try {
      const entries = Object.keys(settings).map(key => ({ key, value: settings[key] }));
      // Upsert each setting row
      for (const row of entries) {
        await supabase.from('site_settings').upsert(row, { onConflict: 'key' });
      }
      setSaved(true);
    } catch (e) {
      console.error('Save settings error', e);
      alert('خطأ أثناء حفظ الإعدادات');
    }
    setLoading(false);
  };

  const testTelegram = async () => {
    try {
      const res = await fetch('/api/admin/test-telegram', { method: 'POST' });
      const json = await res.json();
      if (json.success) alert('تم إرسال رسالة تجريبية إلى التليجرام');
      else alert('فشل الإرسال: ' + (json.error || 'Unknown'));
    } catch (e) {
      alert('فشل في الاتصال بخدمة الاختبار');
    }
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

      <div style={sectionStyle}>
        <h2 style={{ color: 'var(--gold-primary)', marginBottom: '1rem', fontSize: '1.1rem' }}>🖼️ صورة خلفية الصفحة الرئيسية</h2>
        {settings.hero_bg_url && (
          <img src={settings.hero_bg_url} alt="bg preview" style={{ width: '100%', maxHeight: '200px', objectFit: 'cover', borderRadius: '8px', marginBottom: '1rem' }} />
        )}
        <input ref={bgRef} type="file" accept="image/*" onChange={handleBgUpload} style={{ display: 'none' }} />
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button onClick={() => bgRef.current?.click()} style={{ padding: '0.6rem 1rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'transparent', color: 'var(--text-secondary)' }}>رفع صورة</button>
          <button onClick={() => setSettings(s => ({ ...s, hero_bg_url: '' }))} style={{ padding: '0.6rem 1rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'transparent', color: 'var(--text-secondary)' }}>إزالة</button>
        </div>
      </div>

      <div style={sectionStyle}>
        <h2 style={{ color: 'var(--gold-primary)', marginBottom: '1rem', fontSize: '1.1rem' }}>💰 إعدادات الأسعار وواجهة الأسعار</h2>
        <label style={labelStyle}>مفتاح API للذهب (قابل للتعديل بواسطة المدير)</label>
        <input style={inputStyle} value={settings.gold_api_key || ''} onChange={e => setSettings(s => ({ ...s, gold_api_key: e.target.value }))} placeholder="مفتاح API للذهب" />

        <div style={{ height: '0.75rem' }} />
        <label style={labelStyle}>نقطة نهاية API للذهب (اختياري)</label>
        <input style={inputStyle} value={settings.gold_api_endpoint || ''} onChange={e => setSettings(s => ({ ...s, gold_api_endpoint: e.target.value }))} placeholder="https://example.com/price" />

        <div style={{ height: '0.75rem' }} />
        <label style={labelStyle}>معدل صرف IQD (مثلاً 1310)</label>
        <input style={inputStyle} value={settings.iqd_exchange_rate || ''} onChange={e => setSettings(s => ({ ...s, iqd_exchange_rate: e.target.value }))} placeholder="1310" />

        <div style={{ height: '0.75rem' }} />
        <label style={labelStyle}>تفعيل تجاوز السعر يدوياً (USD/غرام)</label>
        <input style={inputStyle} value={settings.manual_price_usd_per_gram || ''} onChange={e => setSettings(s => ({ ...s, manual_price_usd_per_gram: e.target.value }))} placeholder="مثال: 45.5" />
      </div>

      <div style={sectionStyle}>
        <h2 style={{ color: 'var(--gold-primary)', marginBottom: '1rem', fontSize: '1.1rem' }}>⚙️ إعدادات التليجرام</h2>
        <label style={labelStyle}>توكن بوت التليجرام</label>
        <input style={inputStyle} value={settings.telegram_bot_token || ''} onChange={e => setSettings(s => ({ ...s, telegram_bot_token: e.target.value }))} placeholder="أدخل توكن البوت (سيُخزن في قاعدة البيانات)" />

        <div style={{ height: '0.75rem' }} />
        <label style={labelStyle}>Chat ID للإشعارات (مثال: -5558327304)</label>
        <input style={inputStyle} value={settings.telegram_chat_id || ''} onChange={e => setSettings(s => ({ ...s, telegram_chat_id: e.target.value }))} placeholder="Chat ID" />

        <div style={{ height: '0.75rem' }} />
        <button onClick={testTelegram} style={{ padding: '0.7rem 1.2rem', borderRadius: '8px', background: 'var(--gold-primary)', border: 'none', color: '#000', fontWeight: 700 }}>إرسال رسالة تجريبية للتليجرام</button>
      </div>

      <div style={sectionStyle}>
        <h2 style={{ color: 'var(--gold-primary)', marginBottom: '1rem', fontSize: '1.1rem' }}>🥈 إعدادات الفضة</h2>
        <label style={labelStyle}>سعر الفضة (USD/غرام) - يتم إدخاله يدوياً</label>
        <input style={inputStyle} value={settings.silver_price_usd_per_gram || ''} onChange={e => setSettings(s => ({ ...s, silver_price_usd_per_gram: e.target.value }))} placeholder="مثال: 0.75" />
      </div>

      <div style={sectionStyle}>
        <h2 style={{ color: 'var(--gold-primary)', marginBottom: '1rem', fontSize: '1.1rem' }}>📍 معلومات المتجر</h2>
        <label style={labelStyle}>اسم المتجر الظاهر (مثال: كليوباترا)</label>
        <input style={inputStyle} value={settings.site_name || ''} onChange={e => setSettings(s => ({ ...s, site_name: e.target.value }))} placeholder="اسم المتجر" />

        <div style={{ height: '0.75rem' }} />
        <label style={labelStyle}>الموقع (City)</label>
        <input style={inputStyle} value={settings.location || ''} onChange={e => setSettings(s => ({ ...s, location: e.target.value }))} placeholder="Karbala" />

        <div style={{ height: '0.75rem' }} />
        <label style={labelStyle}>رابط الانستغرام</label>
        <input style={inputStyle} value={settings.instagram || ''} onChange={e => setSettings(s => ({ ...s, instagram: e.target.value }))} placeholder="https://instagram.com/..." />
      </div>

    </div>
  );
}
