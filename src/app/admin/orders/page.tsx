"use client";
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { RefreshCw, Eye } from 'lucide-react';

type Order = {
  id: string;
  created_at: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  total_usd: number;
  status: string;
  items: any[];
};

const statusColors: Record<string, string> = {
  pending: '#f59e0b',
  confirmed: '#6366f1',
  shipped: '#3b82f6',
  delivered: '#10b981',
  cancelled: '#ef4444',
};

const statusLabels: Record<string, string> = {
  pending: '⏳ معلق',
  confirmed: '✅ مؤكد',
  shipped: '🚚 تم الشحن',
  delivered: '📦 تم التسليم',
  cancelled: '❌ ملغي',
};

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Order | null>(null);

  useEffect(() => { fetchOrders(); }, []);

  async function fetchOrders() {
    setLoading(true);
    if (!supabase) { setLoading(false); return; }
    const { data, error } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
    if (!error && data) setOrders(data as Order[]);
    setLoading(false);
  }

  async function updateStatus(id: string, status: string) {
    if (!supabase) return;
    await supabase.from('orders').update({ status }).eq('id', id);
    setOrders(prev => prev.map(o => o.id === id ? { ...o, status } : o));
    if (selected?.id === id) setSelected(prev => prev ? { ...prev, status } : null);
  }

  const tdStyle = { padding: '1rem', color: 'var(--text-secondary)', borderBottom: '1px solid var(--border-color)', fontSize: '0.9rem' };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.8rem', color: 'var(--gold-pale)' }}>إدارة الطلبات</h1>
        <button onClick={fetchOrders} style={{ background: 'none', border: '1px solid var(--border-color)', color: 'var(--text-secondary)', padding: '0.5rem 1rem', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <RefreshCw size={16} /> تحديث
        </button>
      </div>

      {loading ? (
        <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '3rem' }}>جاري التحميل...</p>
      ) : orders.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
          <p>لا توجد طلبات بعد.</p>
        </div>
      ) : (
        <div style={{ background: 'var(--bg-card)', borderRadius: '12px', border: '1px solid var(--border-color)', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'rgba(197,168,92,0.05)' }}>
                {['#', 'العميل', 'الإيميل', 'المبلغ', 'الحالة', 'التاريخ', 'إجراءات'].map(h => (
                  <th key={h} style={{ padding: '1rem', color: 'var(--gold-primary)', textAlign: 'right', fontWeight: 600, fontSize: '0.85rem', borderBottom: '1px solid var(--border-color)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {orders.map((order, i) => (
                <tr key={order.id} style={{ transition: 'background 0.2s' }} onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.02)')} onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                  <td style={tdStyle}>{i + 1}</td>
                  <td style={tdStyle}>{order.customer_name || '—'}</td>
                  <td style={{ ...tdStyle, direction: 'ltr' }}>{order.customer_email || '—'}</td>
                  <td style={{ ...tdStyle, color: 'var(--gold-primary)', fontWeight: 600 }}>${order.total_usd?.toFixed(2) || '0'}</td>
                  <td style={tdStyle}>
                    <select value={order.status || 'pending'} onChange={e => updateStatus(order.id, e.target.value)}
                      style={{ background: 'var(--bg-primary)', border: `1px solid ${statusColors[order.status] || '#666'}`, color: statusColors[order.status] || '#fff', borderRadius: '6px', padding: '0.3rem 0.6rem', cursor: 'pointer', fontSize: '0.85rem' }}>
                      {Object.entries(statusLabels).map(([val, lbl]) => (
                        <option key={val} value={val}>{lbl}</option>
                      ))}
                    </select>
                  </td>
                  <td style={tdStyle}>{new Date(order.created_at).toLocaleDateString('ar-IQ')}</td>
                  <td style={tdStyle}>
                    <button onClick={() => setSelected(order)} style={{ background: 'rgba(197,168,92,0.1)', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '0.3rem 0.7rem', color: 'var(--gold-primary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      <Eye size={14} /> تفاصيل
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Order Detail Modal */}
      {selected && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div style={{ background: 'var(--bg-card)', borderRadius: '16px', border: '1px solid var(--border-color)', padding: '2rem', maxWidth: '600px', width: '100%', maxHeight: '80vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ color: 'var(--gold-pale)' }}>تفاصيل الطلب</h2>
              <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.5rem' }}>×</button>
            </div>
            <div style={{ display: 'grid', gap: '0.75rem', color: 'var(--text-secondary)' }}>
              <p><strong style={{ color: 'var(--gold-primary)' }}>العميل:</strong> {selected.customer_name}</p>
              <p><strong style={{ color: 'var(--gold-primary)' }}>الإيميل:</strong> {selected.customer_email}</p>
              <p><strong style={{ color: 'var(--gold-primary)' }}>الهاتف:</strong> {selected.customer_phone}</p>
              <p><strong style={{ color: 'var(--gold-primary)' }}>المبلغ الإجمالي:</strong> ${selected.total_usd?.toFixed(2)}</p>
              <p><strong style={{ color: 'var(--gold-primary)' }}>الحالة:</strong> {statusLabels[selected.status] || selected.status}</p>
              <p><strong style={{ color: 'var(--gold-primary)' }}>التاريخ:</strong> {new Date(selected.created_at).toLocaleString('ar-IQ')}</p>
              {selected.items && selected.items.length > 0 && (
                <div>
                  <strong style={{ color: 'var(--gold-primary)' }}>المنتجات:</strong>
                  <ul style={{ marginTop: '0.5rem', paddingRight: '1rem' }}>
                    {selected.items.map((item: any, i: number) => (
                      <li key={i} style={{ marginBottom: '0.3rem' }}>{item.name} × {item.quantity} — ${item.price?.toFixed(2)}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
