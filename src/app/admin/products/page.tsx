"use client";
import { useState, useRef, useEffect } from 'react';
import styles from './page.module.css';
import { supabase } from '@/lib/supabase';
import { Plus, Pencil, Trash2, Upload, Video, X, Image as ImageIcon } from 'lucide-react';

type Product = {
  id: string;
  name: string;
  description: string;
  karat: 18 | 21 | 24;
  weightGrams: number;
  makingChargeUSD: number;
  imageUrl: string;
  videoUrl?: string;
  inStock: boolean;
  metal?: 'gold' | 'silver';
};

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [fetchingProducts, setFetchingProducts] = useState(true);
  const fileRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLInputElement>(null);

  const emptyForm = { name: '', description: '', karat: 21 as 18|21|24, weightGrams: '', makingChargeUSD: '', imageUrl: '', videoUrl: '', inStock: true, metal: 'gold' as 'gold' | 'silver' };
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    fetchProducts();
  }, []);

  async function fetchProducts() {
    setFetchingProducts(true);
    if (!supabase) { setFetchingProducts(false); return; }
    const { data, error } = await supabase.from('products').select('*').order('created_at', { ascending: false });
    if (!error && data) setProducts(data as Product[]);
    setFetchingProducts(false);
  }

  // Handle multiple image uploads concurrently
  const handleImagesUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !supabase) return;
    setUploading(true);
    const uploadedUrls: string[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const ext = file.name.split('.').pop();
      const path = `products/${Date.now()}_${i}.${ext}`;
      try {
        const { data, error } = await supabase.storage.from('product-images').upload(path, file, { upsert: true });
        if (!error && data) {
          const { data: { publicUrl } } = supabase.storage.from('product-images').getPublicUrl(path);
          uploadedUrls.push(publicUrl);
        } else {
          console.error('Error uploading product image', file.name, error);
        }
      } catch (err) {
        console.error('Upload exception', err);
      }
    }

    if (uploadedUrls.length > 0) {
      setForm(f => {
        const existing = f.imageUrl ? f.imageUrl.split(',').map(s => s.trim()).filter(Boolean) : [];
        const updated = [...existing, ...uploadedUrls];
        return { ...f, imageUrl: updated.join(',') };
      });
    } else {
      alert('خطأ في رفع الصور. تأكد إن bucket "product-images" موجود بـ Supabase Storage ومفتوح للصلاحيات العامة.');
    }
    setUploading(false);
  };

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !supabase) return;
    setUploadingVideo(true);
    const ext = file.name.split('.').pop();
    const path = `videos/${Date.now()}.${ext}`;
    const { data, error } = await supabase.storage.from('product-images').upload(path, file, { upsert: true });
    if (!error && data) {
      const { data: { publicUrl } } = supabase.storage.from('product-images').getPublicUrl(path);
      setForm(f => ({ ...f, videoUrl: publicUrl }));
    } else {
      alert('خطأ في رفع الفيديو.');
    }
    setUploadingVideo(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.imageUrl) {
      alert('يرجى رفع صورة واحدة على الأقل للمنتج!');
      return;
    }

    setLoading(true);
    const payload = {
      name: form.name, description: form.description, karat: form.karat,
      weightGrams: parseFloat(form.weightGrams), makingChargeUSD: parseFloat(form.makingChargeUSD),
      imageUrl: form.imageUrl, videoUrl: form.videoUrl || null, inStock: form.inStock,
      metal: form.metal,
    };

    if (supabase) {
      if (editing) {
        const { error } = await supabase.from('products').update(payload).eq('id', editing.id);
        if (error) alert('خطأ في التحديث: ' + error.message);
      } else {
        const { error } = await supabase.from('products').insert(payload);
        if (error) alert('خطأ في الإضافة: ' + error.message);
      }
    }
    await fetchProducts();
    setShowForm(false);
    setEditing(null);
    setForm(emptyForm);
    setLoading(false);
  };

  const handleEdit = (p: Product) => {
    setEditing(p);
    setForm({ name: p.name, description: p.description, karat: p.karat, weightGrams: String(p.weightGrams), makingChargeUSD: String(p.makingChargeUSD), imageUrl: p.imageUrl, videoUrl: p.videoUrl || '', inStock: p.inStock, metal: p.metal || 'gold' });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا المنتج نهائياً؟')) return;
    if (supabase) {
      const { error } = await supabase.from('products').delete().eq('id', id);
      if (error) { alert('خطأ في الحذف: ' + error.message); return; }
    }
    setProducts(p => p.filter(x => x.id !== id));
  };

  const handleRemoveImage = (indexToRemove: number) => {
    const currentUrls = form.imageUrl ? form.imageUrl.split(',').map(s => s.trim()).filter(Boolean) : [];
    const updatedUrls = currentUrls.filter((_, idx) => idx !== indexToRemove);
    setForm(f => ({ ...f, imageUrl: updatedUrls.join(',') }));
  };

  // Convert form image field to list for preview rendering
  const formImageUrls = form.imageUrl ? form.imageUrl.split(',').map(s => s.trim()).filter(Boolean) : [];

  return (
    <div>
      <div className={styles.header}>
        <h1 className={styles.title}>إدارة المنتجات</h1>
        <button className={styles.addBtn} onClick={() => { setShowForm(true); setEditing(null); setForm(emptyForm); }}>
          <Plus size={18} /> إضافة منتج جديد
        </button>
      </div>

      {showForm && (
        <div className={styles.formOverlay}>
          <div className={styles.formCard}>
            <h2>{editing ? 'تعديل المنتج' : 'إضافة منتج جديد'}</h2>
            <form onSubmit={handleSubmit} className={styles.form}>
              <div className={styles.formGrid}>
                <div className={styles.field}>
                  <label>اسم المنتج *</label>
                  <input required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="مثال: قلادة كليوباترا" />
                </div>
                <div className={styles.field}>
                  <label>المعدن *</label>
                  <select value={form.metal} onChange={e => setForm(f => ({ ...f, metal: e.target.value as 'gold' | 'silver' }))}>
                    <option value="gold">ذهب (Gold)</option>
                    <option value="silver">فضة (Silver)</option>
                  </select>
                </div>
                {form.metal === 'gold' && (
                  <div className={styles.field}>
                    <label>العيار *</label>
                    <select value={form.karat} onChange={e => setForm(f => ({ ...f, karat: parseInt(e.target.value) as 18|21|24 }))}>
                      <option value={21}>21 - الأكثر رواجاً</option>
                      <option value={24}>24 - ذهب خالص</option>
                      <option value={18}>18 - مقاوم للخدش</option>
                    </select>
                  </div>
                )}
                <div className={styles.field}>
                  <label>الوزن (غرام) *</label>
                  <input required type="number" step="0.01" value={form.weightGrams} onChange={e => setForm(f => ({ ...f, weightGrams: e.target.value }))} placeholder="25.50" />
                </div>
                <div className={styles.field}>
                  <label>أجرة الصياغة ($) *</label>
                  <input required type="number" step="0.5" value={form.makingChargeUSD} onChange={e => setForm(f => ({ ...f, makingChargeUSD: e.target.value }))} placeholder="150" />
                </div>
              </div>

              <div className={styles.field}>
                <label>الوصف</label>
                <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="وصف وتفاصيل المنتج الفاخر..." rows={3} />
              </div>

              {/* Multiple Image Upload Row */}
              <div className={styles.imageField}>
                <label>📷 ألبوم صور المنتج (تستطيع رفع أكثر من صورة دفعة واحدة) *</label>

                {/* Thumbnails grid */}
                {formImageUrls.length > 0 && (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(90px, 1fr))', gap: '0.75rem', marginBottom: '1rem', background: 'rgba(255,255,255,0.02)', padding: '0.75rem', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                    {formImageUrls.map((url, idx) => (
                      <div key={url + idx} style={{ position: 'relative', width: '100%', aspectRatio: '1', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
                        <img src={url} alt="Uploaded thumbnail" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        <button
                          type="button"
                          onClick={() => handleRemoveImage(idx)}
                          style={{ position: 'absolute', top: '4px', right: '4px', background: '#ef4444', border: 'none', borderRadius: '50%', width: '18px', height: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', cursor: 'pointer', boxShadow: '0 2px 4px rgba(0,0,0,0.3)' }}
                          title="حذف الصورة"
                        >
                          <X size={12} />
                        </button>
                        {idx === 0 && (
                          <div style={{ position: 'absolute', bottom: 0, insetInline: 0, background: 'rgba(197,168,92,0.9)', color: '#000', fontSize: '0.65rem', textAlign: 'center', padding: '1px 0', fontWeight: 700 }}>
                            الرئيسية
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                <input ref={fileRef} type="file" accept="image/*" multiple onChange={handleImagesUpload} style={{ display: 'none' }} />
                <div className={styles.uploadRow}>
                  <button type="button" className={styles.uploadBtn} onClick={() => fileRef.current?.click()} disabled={uploading} style={{ padding: '0.75rem 1.25rem', fontSize: '0.9rem' }}>
                    <Upload size={18} /> {uploading ? 'جاري رفع الصور...' : 'رفع صور متعددة'}
                  </button>
                  <span className={styles.hint}>أو أضف رابط صورة مباشر:</span>
                  <input
                    className={styles.urlInput}
                    value={form.imageUrl}
                    onChange={e => setForm(f => ({ ...f, imageUrl: e.target.value }))}
                    placeholder="رابط الصورة (إذا كانت متعددة، افصل بينها بفاصلة ,)"
                  />
                </div>
              </div>

              {/* Video Upload */}
              <div className={styles.imageField}>
                <label>🎬 فيديو المنتج (اختياري)</label>
                {form.videoUrl && (
                  <div style={{ position: 'relative', width: '100%', maxWidth: '320px', maxHeight: '180px', borderRadius: '8px', overflow: 'hidden', marginBottom: '0.5rem', border: '1px solid var(--border-color)' }}>
                    <video src={form.videoUrl} controls style={{ width: '100%', height: '100%' }} />
                    <button
                      type="button"
                      onClick={() => setForm(f => ({ ...f, videoUrl: '' }))}
                      style={{ position: 'absolute', top: '8px', right: '8px', background: '#ef4444', border: 'none', borderRadius: '50%', width: '22px', height: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', cursor: 'pointer' }}
                      title="إزالة الفيديو"
                    >
                      <X size={14} />
                    </button>
                  </div>
                )}
                <input ref={videoRef} type="file" accept="video/*" onChange={handleVideoUpload} style={{ display: 'none' }} />
                <div className={styles.uploadRow}>
                  <button type="button" className={styles.uploadBtn} onClick={() => videoRef.current?.click()} disabled={uploadingVideo}>
                    <Video size={16} /> {uploadingVideo ? 'جاري الرفع...' : 'رفع فيديو'}
                  </button>
                  <span className={styles.hint}>أو</span>
                  <input className={styles.urlInput} value={form.videoUrl} onChange={e => setForm(f => ({ ...f, videoUrl: e.target.value }))} placeholder="رابط الفيديو (مثال: mp4)" />
                </div>
              </div>

              <div className={styles.checkField}>
                <input type="checkbox" id="inStock" checked={form.inStock} onChange={e => setForm(f => ({ ...f, inStock: e.target.checked }))} style={{ width: '18px', height: '18px', cursor: 'pointer' }} />
                <label htmlFor="inStock" style={{ cursor: 'pointer', fontWeight: 600 }}>متاح في المخزون ومعروض للبيع</label>
              </div>

              <div className={styles.formActions}>
                <button type="submit" className={styles.submitBtn} disabled={loading}>
                  {loading ? 'جاري الحفظ والرفع...' : (editing ? 'حفظ التعديلات' : 'إضافة المنتج إلى الكتالوج')}
                </button>
                <button type="button" className={styles.cancelBtn} onClick={() => { setShowForm(false); setEditing(null); }}>إلغاء</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {fetchingProducts ? (
        <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '3rem' }}>جاري التحميل...</p>
      ) : products.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
          <p>لا توجد منتجات بعد.</p>
          <button className={styles.addBtn} style={{ marginTop: '1rem' }} onClick={() => setShowForm(true)}><Plus size={16} /> أضف أول منتج</button>
        </div>
      ) : (
        <div className={styles.grid}>
          {products.map(p => {
            // Safely get primary image
            const itemImages = p.imageUrl ? p.imageUrl.split(',').map(s => s.trim()).filter(Boolean) : [];
            const displayImg = itemImages[0] || '/logo.jpg';
            const extraCount = itemImages.length - 1;

            return (
              <div key={p.id} className={styles.productCard}>
                <div style={{ position: 'relative' }}>
                  <img src={displayImg} alt={p.name} className={styles.productImg} onError={e => { (e.target as HTMLImageElement).src = '/logo.jpg'; }} />
                  {extraCount > 0 && (
                    <span style={{ position: 'absolute', bottom: '8px', left: '8px', background: 'rgba(0,0,0,0.75)', borderRadius: '6px', padding: '4px 8px', fontSize: '0.72rem', color: '#fff', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}>
                      <ImageIcon size={12} color="var(--gold-primary)" /> +{extraCount} صور أخرى
                    </span>
                  )}
                  {p.videoUrl && <span style={{ position: 'absolute', top: '8px', right: '8px', background: 'rgba(0,0,0,0.75)', borderRadius: '6px', padding: '4px 8px', fontSize: '0.72rem', color: '#fff', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}>🎬 فيديو</span>}
                </div>
                <div className={styles.productInfo}>
                  <h3 style={{ fontSize: '1rem', fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</h3>
                  <p style={{ margin: '0.25rem 0 0.5rem 0' }}>
                    <span style={{ color: 'var(--gold-primary)', fontWeight: 600 }}>{p.metal === 'silver' ? 'فضة' : `ذهب عيار ${p.karat}`}</span>
                    <span> | {p.weightGrams}غ</span>
                    <span> | أجرة: ${p.makingChargeUSD}</span>
                  </p>
                  <span className={p.inStock ? styles.inStock : styles.outStock} style={{ fontWeight: 700, fontSize: '0.78rem' }}>{p.inStock ? '✅ متوفر للبيع' : '❌ محجوز / مباع'}</span>
                </div>
                <div className={styles.productActions}>
                  <button onClick={() => handleEdit(p)} className={styles.editBtn} style={{ flex: 1, gap: '4px', fontSize: '0.82rem' }}><Pencil size={14} /> تعديل</button>
                  <button onClick={() => handleDelete(p.id)} className={styles.deleteBtn} style={{ flex: 1, gap: '4px', fontSize: '0.82rem' }}><Trash2 size={14} /> حذف</button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
