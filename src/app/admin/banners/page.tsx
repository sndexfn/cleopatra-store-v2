"use client";
import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { Plus, Trash2, Upload, Eye, EyeOff } from 'lucide-react';

type Banner = { id: string; imageUrl: string; title: string; subtitle: string; active: boolean; order: number; };

export default function BannersPage() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [newTitle, setNewTitle] = useState('');
  const [newSubtitle, setNewSubtitle] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => { fetchBanners(); }, []);

  async function fetchBanners() {
    setLoading(true);
    if (!supabase) { setLoading(false); return; }
    const { data } = await supabase.from('banners').select('*').order('order', { ascending: true });
    setBanners(data || []);
    setLoading(false);
  }

  async function uploadBanner(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !supabase) return;
    setUploading(true);
    const path = `banners/${Date.now()}.${file.name.split('.').pop()}`;
    const { data, error } = await supabase.storage.from('product-images').upload(path, file, { upsert: true });
    if (!error && data) {
      const { data: { publicUrl } } = supabase.storage.from('product-images').getPublicUrl(path);
      await supabase.from('banners').insert({ imageUrl: publicUrl, title: newTitle || '', subtitle: newSubtitle || '', active: true, order: banners.length + 1 });
      await fetchBanners();
      setNewTitle(''); setNewSubtitle('');
    }
    setUploading(false);
    if (fileRef.current) fileRef.current.value = '';
  }

  async function toggleActive(id: string, current: boolean) {
    if (!supabase) return;
    await supabase.from('banners').update({ active: !current }).eq('id', id);
    setBanners(b => b.map(x => x.id === id ? { ...x, active: !current } : x));
  }

  async function deleteBanner(id: string) {
    if (!confirm('حذف هذا البانر؟')) return;
    if (!supabase) return;
    await supabase.from('banners').delete().eq('id', id);
    setBanners(b => b.filter(x => x.id !== id));
  }

  const inp = { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(197,168,92,0.2)', borderRadius: '8px', padding: '0.65rem 1rem', color: 'var(--text-primary)', fontSize: '0.88rem', fontFamily: 'inherit', outline: 'none' } as React.CSSProperties;

  return (
    <div>
      <h1 style={{ fontSize: '1.75rem', color: 'var(--gold-pale)', marginBottom: '0.5rem' }}>🖼️ البانرات المتحركة</h1>
      <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>إدارة صور البانر التي تظهر في الصفحة الرئيسية</p>

      {/* Upload Section */}
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '14px', padding: '1.5rem', marginBottom: '2rem' }}>
        <h3 style={{ color: 'var(--gold-pale)', marginBottom: '1rem', fontSize: '1rem' }}>➕ إضافة بانر جديد</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
          <div>
            <label style={{ display: 'block', color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '0.35rem' }}>العنوان (اختياري)</label>
            <input style={inp} value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="عنوان البانر" />
          </div>
          <div>
            <label style={{ display: 'block', color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '0.35rem' }}>النص الفرعي (اختياري)</label>
            <input style={inp} value={newSubtitle} onChange={e => setNewSubtitle(e.target.value)} placeholder="وصف قصير" />
          </div>
        </div>
        <input ref={fileRef} type="file" accept="image/*" onChange={uploadBanner} style={{ display: 'none' }} />
        <button onClick={() => fileRef.current?.click()} disabled={uploading}
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'linear-gradient(135deg, var(--gold-primary), var(--gold-brown))', color: '#000', border: 'none', borderRadius: '10px', padding: '0.75rem 1.5rem', fontWeight: 700, cursor: uploading ? 'not-allowed' : 'pointer', opacity: uploading ? 0.7 : 1, fontFamily: 'inherit' }}>
          <Upload size={16} /> {uploading ? 'جاري الرفع...' : 'رفع صورة بانر'}
        </button>
      </div>

      {/* Banners Grid */}
      {loading ? <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem' }}>جاري التحميل...</p>
        : banners.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)', background: 'var(--bg-card)', borderRadius: '14px', border: '1px solid var(--border-color)' }}>
            <p style={{ fontSize: '3rem', marginBottom: '1rem' }}>🖼️</p>
            <p>لم تضف أي بانر بعد. ارفع أول صورة!</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
            {banners.map(b => (
              <div key={b.id} style={{ background: 'var(--bg-card)', border: `1px solid ${b.active ? 'var(--border-color)' : 'rgba(239,68,68,0.3)'}`, borderRadius: '12px', overflow: 'hidden', opacity: b.active ? 1 : 0.6 }}>
                <div style={{ position: 'relative' }}>
                  <img src={b.imageUrl} alt={b.title} style={{ width: '100%', height: '160px', objectFit: 'cover' }} />
                  <span style={{ position: 'absolute', top: '8px', right: '8px', background: b.active ? 'rgba(16,185,129,0.9)' : 'rgba(239,68,68,0.9)', color: '#fff', fontSize: '0.72rem', padding: '0.25rem 0.6rem', borderRadius: '6px' }}>
                    {b.active ? '✅ نشط' : '❌ مخفي'}
                  </span>
                </div>
                <div style={{ padding: '0.875rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    {b.title && <p style={{ color: 'var(--text-primary)', fontSize: '0.88rem', fontWeight: 600 }}>{b.title}</p>}
                    {b.subtitle && <p style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>{b.subtitle}</p>}
                  </div>
                  <div style={{ display: 'flex', gap: '0.4rem' }}>
                    <button onClick={() => toggleActive(b.id, b.active)} style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: '7px', padding: '0.4rem', color: '#818cf8', cursor: 'pointer', display: 'flex' }}>
                      {b.active ? <EyeOff size={14}/> : <Eye size={14}/>}
                    </button>
                    <button onClick={() => deleteBanner(b.id)} style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '7px', padding: '0.4rem', color: '#ef4444', cursor: 'pointer', display: 'flex' }}><Trash2 size={14}/></button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
    </div>
  );
}
