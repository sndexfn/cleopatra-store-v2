"use client";
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import styles from './page.module.css';

export default function AdminWorkersPage() {
  const [workers, setWorkers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ name: '', role: '', wage: '' });

  useEffect(() => { fetchWorkers(); }, []);

  async function fetchWorkers() {
    setLoading(true);
    if (!supabase) { setLoading(false); return; }
    try {
      const { data } = await supabase.from('workers').select('*').order('created_at', { ascending: false });
      setWorkers(data || []);
    } catch (e) { console.error(e); }
    setLoading(false);
  }

  async function addWorker(e: React.FormEvent) {
    e.preventDefault();
    if (!supabase) return;
    try {
      const { error } = await supabase.from('workers').insert([{ name: form.name, role: form.role, wage: Number(form.wage) }]);
      if (!error) {
        setForm({ name: '', role: '', wage: '' });
        fetchWorkers();
      }
    } catch (e) { console.error(e); }
  }

  async function removeWorker(id: string) {
    if (!confirm('حذف هذا العامل؟')) return;
    if (!supabase) return;
    await supabase.from('workers').delete().eq('id', id);
    fetchWorkers();
  }

  return (
    <div>
      <h1 style={{ color: 'var(--gold-pale)', marginBottom: '1rem' }}>إدارة العمال</h1>

      <form onSubmit={addWorker} style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
        <input placeholder="الاسم" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} style={{ padding: '0.6rem', borderRadius: 8, border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)' }} required />
        <input placeholder="الدور" value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))} style={{ padding: '0.6rem', borderRadius: 8, border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)' }} />
        <input placeholder="الأجر" value={form.wage} onChange={e => setForm(f => ({ ...f, wage: e.target.value }))} style={{ padding: '0.6rem', borderRadius: 8, border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)' }} />
        <button style={{ background: 'var(--gold-primary)', color: '#000', padding: '0.6rem 0.9rem', borderRadius: 8 }}>إضافة</button>
      </form>

      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 12, padding: '1rem' }}>
        {loading ? <p style={{ color: 'var(--text-muted)' }}>جاري التحميل...</p> : (
          <ul>
            {workers.map(w => (
              <li key={w.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                <div>
                  <div style={{ color: 'var(--text-primary)', fontWeight: 700 }}>{w.name}</div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{w.role} — {w.wage}$</div>
                </div>
                <div>
                  <button onClick={() => removeWorker(w.id)} style={{ background: 'none', border: 'none', color: 'var(--error)' }}>حذف</button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
