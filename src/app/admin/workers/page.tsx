"use client";
import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, Users, Coins, UserCheck, ShieldAlert } from 'lucide-react';
import { formatCurrency } from '@/lib/goldPrice';

type Worker = {
  id: string;
  name: string;
  role: string;
  salaryUSD: number;
  phone: string;
  status: 'active' | 'on_leave' | 'inactive';
};

const defaultWorkers: Worker[] = [
  { id: 'w1', name: 'أحمد الصائغ', role: 'كبير الصياغ ومصمم المجوهرات', salaryUSD: 1800, phone: '07712345678', status: 'active' },
  { id: 'w2', name: 'سرور الكربلائي', role: 'مسؤول مبيعات واستقبال الزبائن', salaryUSD: 950, phone: '07809876543', status: 'active' },
  { id: 'w3', name: 'زينب حسين', role: 'مصممة جرافيك وتسويق رقمي', salaryUSD: 800, phone: '07501112233', status: 'active' },
];

export default function AdminWorkersPage() {
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Worker | null>(null);
  const [loading, setLoading] = useState(true);

  // Form fields
  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [salaryUSD, setSalaryUSD] = useState('');
  const [phone, setPhone] = useState('');
  const [status, setStatus] = useState<'active' | 'on_leave' | 'inactive'>('active');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('cleopatra_workers');
      if (saved) {
        try {
          setWorkers(JSON.parse(saved));
        } catch {
          setWorkers(defaultWorkers);
        }
      } else {
        setWorkers(defaultWorkers);
        localStorage.setItem('cleopatra_workers', JSON.stringify(defaultWorkers));
      }
      setLoading(false);
    }
  }, []);

  const saveWorkersToStorage = (updated: Worker[]) => {
    setWorkers(updated);
    if (typeof window !== 'undefined') {
      localStorage.setItem('cleopatra_workers', JSON.stringify(updated));
    }
  };

  const handleOpenAddForm = () => {
    setEditing(null);
    setName('');
    setRole('');
    setSalaryUSD('');
    setPhone('');
    setStatus('active');
    setShowForm(true);
  };

  const handleOpenEditForm = (w: Worker) => {
    setEditing(w);
    setName(w.name);
    setRole(w.role);
    setSalaryUSD(String(w.salaryUSD));
    setPhone(w.phone);
    setStatus(w.status);
    setShowForm(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !role || !salaryUSD) return;

    if (editing) {
      const updated = workers.map(w => w.id === editing.id ? {
        ...w,
        name,
        role,
        salaryUSD: parseFloat(salaryUSD),
        phone,
        status
      } : w);
      saveWorkersToStorage(updated);
    } else {
      const newWorker: Worker = {
        id: `w_${Date.now()}`,
        name,
        role,
        salaryUSD: parseFloat(salaryUSD),
        phone,
        status
      };
      saveWorkersToStorage([...workers, newWorker]);
    }

    setShowForm(false);
    setEditing(null);
  };

  const handleDelete = (id: string) => {
    if (!confirm('هل أنت متأكد من إزالة هذا الموظف من قائمة المعرض؟')) return;
    const updated = workers.filter(w => w.id !== id);
    saveWorkersToStorage(updated);
  };

  const inputStyle = {
    width: '100%',
    padding: '0.75rem 1rem',
    background: 'var(--bg-primary)',
    border: '1px solid var(--border-color)',
    borderRadius: '8px',
    color: 'var(--text-primary)',
    fontSize: '0.95rem',
    outline: 'none',
    boxSizing: 'border-box' as const
  };

  const labelStyle = {
    display: 'block',
    color: 'var(--text-secondary)',
    marginBottom: '0.4rem',
    fontSize: '0.85rem'
  };

  if (loading) return <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '3rem' }}>جاري التحميل...</p>;

  return (
    <div style={{ direction: 'rtl' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', color: 'var(--gold-pale)', fontWeight: 800 }}>موظفي وعمال معرض كليوباترا</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>إدارة الكوادر، كفاءة الأداء، والمرتبات الشهرية</p>
        </div>
        <button
          onClick={handleOpenAddForm}
          style={{
            background: 'var(--gold-primary)',
            color: '#000',
            border: 'none',
            borderRadius: '8px',
            padding: '0.75rem 1.25rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            fontWeight: 700,
            fontSize: '0.95rem'
          }}
        >
          <Plus size={18} /> إضافة كادر جديد
        </button>
      </div>

      {/* Workers Cards / Table */}
      {workers.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
          <p>لا يوجد موظفين مسجلين حالياً.</p>
        </div>
      ) : (
        <div style={{ background: 'var(--bg-card)', borderRadius: '12px', border: '1px solid var(--border-color)', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right' }}>
            <thead>
              <tr style={{ background: 'rgba(197,168,92,0.05)' }}>
                {['الاسم الكامل', 'المسمى الوظيفي والدور', 'الراتب (USD)', 'الهاتف', 'الحالة', 'إجراءات'].map(h => (
                  <th key={h} style={{ padding: '1rem', color: 'var(--gold-primary)', fontWeight: 600, fontSize: '0.85rem', borderBottom: '1px solid var(--border-color)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {workers.map(w => (
                <tr key={w.id} style={{ transition: 'background 0.2s', borderBottom: '1px solid var(--border-color)' }} onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.01)')} onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                  <td style={{ padding: '1rem', fontSize: '0.95rem', fontWeight: 600, color: '#fff' }}>{w.name}</td>
                  <td style={{ padding: '1rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{w.role}</td>
                  <td style={{ padding: '1rem', fontSize: '0.95rem', color: '#10b981', fontWeight: 700 }}>
                    {formatCurrency(w.salaryUSD, 'USD')}
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginRight: '0.35rem' }}>
                      (~ {formatCurrency(w.salaryUSD * 1310, 'IQD')})
                    </span>
                  </td>
                  <td style={{ padding: '1rem', fontSize: '0.9rem', color: 'var(--text-muted)', direction: 'ltr' }}>{w.phone || '—'}</td>
                  <td style={{ padding: '1rem' }}>
                    <span style={{
                      padding: '0.3rem 0.6rem',
                      borderRadius: '6px',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      background: w.status === 'active' ? 'rgba(16, 185, 129, 0.12)' : w.status === 'on_leave' ? 'rgba(245, 158, 11, 0.12)' : 'rgba(239, 68, 68, 0.12)',
                      color: w.status === 'active' ? '#10b981' : w.status === 'on_leave' ? '#f59e0b' : '#ef4444'
                    }}>
                      {w.status === 'active' ? '● على رأس العمل' : w.status === 'on_leave' ? '⏱ مجاز' : '❌ غير نشط'}
                    </span>
                  </td>
                  <td style={{ padding: '1rem', display: 'flex', gap: '0.5rem' }}>
                    <button onClick={() => handleOpenEditForm(w)} style={{ background: 'rgba(197,168,92,0.1)', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '0.35rem 0.6rem', color: 'var(--gold-primary)', cursor: 'pointer', display: 'flex', alignItems: 'center' }} title="تعديل">
                      <Pencil size={14} />
                    </button>
                    <button onClick={() => handleDelete(w.id)} style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '0.35rem 0.6rem', color: '#ef4444', cursor: 'pointer', display: 'flex', alignItems: 'center' }} title="إزالة">
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add/Edit Modal Form Overlay */}
      {showForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div style={{ background: 'var(--bg-card)', borderRadius: '16px', border: '1px solid var(--border-color)', padding: '2rem', maxWidth: '500px', width: '100%' }}>
            <h2 style={{ color: 'var(--gold-pale)', marginBottom: '1.5rem', fontSize: '1.25rem', fontWeight: 700 }}>
              {editing ? 'تعديل بيانات الكادر' : 'تسجيل موظف جديد في المعرض'}
            </h2>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={labelStyle}>الاسم الكامل للموظف *</label>
                <input required style={inputStyle} value={name} onChange={e => setName(e.target.value)} placeholder="مثال: علي كريم الخفاجي" />
              </div>
              <div>
                <label style={labelStyle}>الدور والمسمى الوظيفي *</label>
                <input required style={inputStyle} value={role} onChange={e => setRole(e.target.value)} placeholder="مثال: مصمم صياغة الذهب والفضة" />
              </div>
              <div>
                <label style={labelStyle}>المرتب الشهري بالدولار ($) *</label>
                <input required type="number" style={inputStyle} value={salaryUSD} onChange={e => setSalaryUSD(e.target.value)} placeholder="مثال: 1200" />
              </div>
              <div>
                <label style={labelStyle}>رقم الهاتف</label>
                <input style={inputStyle} value={phone} onChange={e => setPhone(e.target.value)} placeholder="077XXXXXXXX" />
              </div>
              <div>
                <label style={labelStyle}>حالة العمل الحالية *</label>
                <select style={inputStyle} value={status} onChange={e => setStatus(e.target.value as any)}>
                  <option value="active">على رأس العمل نشط</option>
                  <option value="on_leave">مجاز مؤقتاً</option>
                  <option value="inactive">غير نشط / منتهي العقد</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                <button type="submit" style={{ flex: 1, background: 'var(--gold-primary)', color: '#000', border: 'none', borderRadius: '8px', padding: '0.75rem', cursor: 'pointer', fontWeight: 700 }}>
                  حفظ البيانات
                </button>
                <button type="button" onClick={() => setShowForm(false)} style={{ flex: 1, background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', color: 'var(--text-secondary)', borderRadius: '8px', padding: '0.75rem', cursor: 'pointer' }}>
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
