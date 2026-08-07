"use client";
import { useState, useRef, useEffect } from 'react';
import styles from './page.module.css';
import { supabase } from '@/lib/supabase';
import { Plus, Pencil, Trash2, Upload, Video } from 'lucide-react';

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
  const [imageUrls, setImageUrls] = useState<string[]>([]);

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

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !supabase) return;
    setUploading(true);

    const uploadedUrls: string[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const ext = file.name.split('.').pop();
      const path = `products/${Date.now()}-${i}.${ext}`;
      const { data, error } = await supabase.storage.from('product-images').upload(path, file, { upsert: true });
      if (!error && data) {
        const { data: { publicUrl } } = supabase.storage.from('product-images').getPublicUrl(path);
        uploadedUrls.push(publicUrl);
      } else {
        alert(`خطأ في رفع الصورة "${file.name}". تأكد إن bucket "product-images" موجود بـ Supabase Storage.`);
      }
    }

    if (uploadedUrls.length > 0) {
      setImageUrls(urls => [...urls, ...uploadedUrls]);
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
    setLoading(true);
    const payload = {
      name: form.name, description: form.description, karat: form.karat,
      weightGrams: parseFloat(form.weightGrams), makingChargeUSD: parseFloat(form.makingChargeUSD),
      imageUrl: imageUrls.join(','), videoUrl: form.videoUrl || null, inStock: form.inStock,
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
    setImageUrls([]);
    setLoading(false);
  };

  const handleEdit = (p: Product) => {
    setEditing(p);
    const urls = p.imageUrl ? p.imageUrl.split(',').map(s => s.trim()).filter(Boolean) : [];
    setImageUrls(urls);
    setForm({ name: p.name, description: p.description, karat: p.karat, weightGrams: String(p.weightGrams), makingChargeUSD: String(p.makingChargeUSD), imageUrl: p.imageUrl, videoUrl: p.videoUrl || '', inStock: p.inStock, metal: p.metal || 'gold' });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا المنتج؟')) return;
    if (supabase) {
      const { error } = await supabase.from('products').delete().eq('id', id);
      if (error) { alert('خطأ في الحذف: ' + error.message); return; }
    }
    setProducts(p => p.filter(x => x.id !== id));
  };

  return (
    <div>
      <div className={styles.header}>
        <h1 className={styles.title}>إدارة المنتجات</h1>
        <button className={styles.addBtn} onClick={() => { setShowForm(true); setEditing(null); setForm(emptyForm); setImageUrls([]); }}>
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
                  <input required type="number" step="0.1" value={form.weightGrams} onChange={e => setForm(f => ({ ...f, weightGrams: e.target.value }))} placeholder="25.5" />
                </div>
                <div className={styles.field}>
                  <label>أجرة الصياغة ($) *</label>
                  <input required type="number" step="0.5" value={form.makingChargeUSD} onChange={e => setForm(f => ({ ...f, makingChargeUSD: e.target.value }))} placeholder="150" />
                </div>
              </div>

              <div className={styles.field}>
                <label>الوصف</label>
                <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="وصف المنتج..." rows={3} />
              </div>

              {/* Image Upload */}
              <div className={styles.imageField}>
                <label>📷 صور المنتج (يمكنك رفع أو إضافة عدة صور)</label>

                {imageUrls.length > 0 && (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))', gap: '0.75rem', marginBottom: '0.5rem' }}>
                    {imageUrls.map((url, index) => (
                      <div key={url + index} style={{ position: 'relative', width: '80px', height: '80px', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
                        <img src={url} alt={`preview-${index}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        <button type="button" onClick={() => setImageUrls(urls => urls.filter((_, i) => i !== index))} style={{ position: 'absolute', top: '4px', right: '4px', background: 'rgba(239, 68, 68, 0.9)', color: '#fff', border: 'none', borderRadius: '50%', width: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: '12px', padding: 0, fontWeight: 'bold' }}>
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <input ref={fileRef} type="file" accept="image/*" multiple onChange={handleImageUpload} style={{ display: 'none' }} />
                <div className={styles.uploadRow}>
                  <button type="button" className={styles.uploadBtn} onClick={() => fileRef.current?.click()} disabled={uploading}>
                    <Upload size={16} /> {uploading ? 'جاري الرفع...' : 'رفع صور'}
                  </button>
                  <span className={styles.hint}>أو</span>
                  <div style={{ display: 'flex', gap: '0.5rem', flex: 1, minWidth: '200px' }}>
                    <input className={styles.urlInput} id="manual-url-input" placeholder="الصق رابط الصورة واضغط إضافة" onKeyDown={e => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        const val = (e.target as HTMLInputElement).value.trim();
                        if (val) {
                          setImageUrls(urls => [...urls, val]);
                          (e.target as HTMLInputElement).value = '';
                        }
                      }
                    }} />
                    <button type="button" className={styles.uploadBtn} onClick={() => {
                      const input = document.getElementById('manual-url-input') as HTMLInputElement;
                      if (input && input.value.trim()) {
                        setImageUrls(urls => [...urls, input.value.trim()]);
                        input.value = '';
                      }
                    }}>إضافة</button>
                  </div>
                </div>
              </div>

              {/* Video Upload */}
              <div className={styles.imageField}>
                <label>🎬 فيديو المنتج (اختياري)</label>
                {form.videoUrl && (
                  <video src={form.videoUrl} controls style={{ width: '100%', maxHeight: '200px', borderRadius: '8px', marginBottom: '0.5rem' }} />
                )}
                <input ref={videoRef} type="file" accept="video/*" onChange={handleVideoUpload} style={{ display: 'none' }} />
                <div className={styles.uploadRow}>
                  <button type="button" className={styles.uploadBtn} onClick={() => videoRef.current?.click()} disabled={uploadingVideo}>
                    <Video size={16} /> {uploadingVideo ? 'جاري الرفع...' : 'رفع فيديو'}
                  </button>
                  <span className={styles.hint}>أو</span>
                  <input className={styles.urlInput} value={form.videoUrl} onChange={e => setForm(f => ({ ...f, videoUrl: e.target.value }))} placeholder="الصق رابط الفيديو هنا (YouTube, mp4...)" />
                </div>
              </div>

              <div className={styles.checkField}>
                <input type="checkbox" id="inStock" checked={form.inStock} onChange={e => setForm(f => ({ ...f, inStock: e.target.checked }))} />
                <label htmlFor="inStock">متاح في المخزون</label>
              </div>

              <div className={styles.formActions}>
                <button type="submit" className={styles.submitBtn} disabled={loading}>
                  {loading ? 'جاري الحفظ...' : (editing ? 'حفظ التعديلات' : 'إضافة المنتج')}
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
          <button className={styles.addBtn} style={{ marginTop: '1rem' }} onClick={() => { setShowForm(true); setEditing(null); setForm(emptyForm); setImageUrls([]); }}><Plus size={16} /> أضف أول منتج</button>
        </div>
      ) : (
        <div className={styles.grid}>
          {products.map(p => (
            <div key={p.id} className={styles.productCard}>
              <img src={(p.imageUrl ? p.imageUrl.split(',')[0] : '') || '/logo.jpg'} alt={p.name} className={styles.productImg} />
              {p.videoUrl && <span style={{ position: 'absolute', top: '8px', right: '8px', background: 'rgba(0,0,0,0.7)', borderRadius: '4px', padding: '2px 6px', fontSize: '0.7rem', color: '#fff' }}>🎬 فيديو</span>}
              <div className={styles.productInfo}>
                <h3>{p.name}</h3>
                <p>
                  <span>{p.metal === 'silver' ? 'فضة' : `ذهب عيار ${p.karat}`}</span>
                  <span> | {p.weightGrams}غ</span>
                  <span> | أجرة: ${p.makingChargeUSD}</span>
                </p>
                <span className={p.inStock ? styles.inStock : styles.outStock}>{p.inStock ? '✅ متاح' : '❌ نفذ'}</span>
              </div>
              <div className={styles.productActions}>
                <button onClick={() => handleEdit(p)} className={styles.editBtn}><Pencil size={16} /></button>
                <button onClick={() => handleDelete(p.id)} className={styles.deleteBtn}><Trash2 size={16} /></button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
