import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import Header from '../components/Header';

const API = import.meta.env.VITE_API_BASE_URL || '';

const STATUS_LABELS: Record<string, { label: string; color: string; bg: string; icon: string }> = {
  open:        { label: 'ממתין לטיפול', color: '#b45d00', bg: '#fff4e5', icon: '⏳' },
  inProgress:  { label: 'בטיפול',        color: '#1565c0', bg: '#e3f0ff', icon: '🚚' },
  completed:   { label: 'הושלם',         color: '#1e7e34', bg: '#e6f4ea', icon: '✅' },
  cancelled:   { label: 'בוטל',          color: '#721c24', bg: '#fff3f3', icon: '❌' },
};

interface Order {
  orderId: string;
  customer: string;
  address?: string;
  status: string;
  total: number;
  createdAt: string;
  items: { id: string; quantity: number }[];
}

export default function OrderTrack() {
  const [searchParams] = useSearchParams();
  const [input, setInput] = useState('');
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(false);
  const [notFound, setNotFound] = useState(false);

  const fetchOrder = async (id: string, orderToken?: string) => {
    setLoading(true);
    setNotFound(false);
    setOrder(null);
    try {
      const url = new URL(`${API}/api/orders/${id}`, window.location.origin);
      if (orderToken) url.searchParams.set('token', orderToken);
      const res = await fetch(url.toString());
      if (res.status === 404 || res.status === 403) { setNotFound(true); return; }
      if (!res.ok) throw new Error();
      setOrder(await res.json());
    } catch {
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  };

  // Auto-load when navigated from checkout with ?id=&token=
  useEffect(() => {
    const id = searchParams.get('id');
    const tok = searchParams.get('token') ?? undefined;
    if (id) {
      setInput(id);
      fetchOrder(id, tok);
    }
  }, []);

  const search = async () => {
    const id = input.trim().replace(/^#/, '').padStart(7, '0');
    if (!id) return;
    // Token from URL (if user refreshes the page)
    const tok = searchParams.get('token') ?? undefined;
    fetchOrder(id, tok);
  };

  const fmt = (iso: string) => new Intl.DateTimeFormat('he-IL', { dateStyle: 'long', timeStyle: 'short' }).format(new Date(iso));
  const status = order ? (STATUS_LABELS[order.status] ?? { label: order.status, color: '#333', bg: '#f5f5f5', icon: '📦' }) : null;

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#faf9f6', direction: 'rtl' }}>
      <Header />
      <div style={{ maxWidth: 520, margin: '0 auto', padding: '40px 16px' }}>
        <h1 style={{ marginBottom: 8 }}>מעקב הזמנה</h1>
        <p style={{ color: '#666', marginBottom: 28 }}>הכנס מספר הזמנה כדי לראות את הסטטוס</p>

        <div style={{ display: 'flex', gap: 10, marginBottom: 32 }}>
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && search()}
            placeholder="#0000001"
            dir="ltr"
            style={{ flex: 1, padding: '11px 14px', border: '1.5px solid #ddd', borderRadius: 8, fontSize: '1.1rem', outline: 'none' }}
          />
          <button
            onClick={search}
            disabled={loading}
            style={{ padding: '11px 22px', backgroundColor: '#c15f2a', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 700, fontSize: '1rem' }}
          >
            {loading ? '...' : 'חפש'}
          </button>
        </div>

        {notFound && (
          <div style={{ textAlign: 'center', padding: '32px 0', color: '#888' }}>
            <div style={{ fontSize: 40, marginBottom: 10 }}>🔍</div>
            <p style={{ margin: 0, marginBottom: 8 }}>לא נמצאה הזמנה עם מספר זה</p>
            <p style={{ margin: 0, fontSize: '0.85rem', color: '#aaa' }}>אם סיימת הזמנה, חפש דרך הקישור שקיבלת באישור</p>
          </div>
        )}

        {order && status && (
          <div style={{ backgroundColor: '#fff', borderRadius: 12, padding: 24, boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>הזמנה #{order.orderId.slice(-6)}</div>
                <div style={{ color: '#888', fontSize: '0.85rem', marginTop: 3 }}>{fmt(order.createdAt)}</div>
              </div>
              <span style={{ padding: '6px 14px', borderRadius: 999, backgroundColor: status.bg, color: status.color, fontWeight: 700, fontSize: '0.9rem' }}>
                {status.icon} {status.label}
              </span>
            </div>

            <div style={{ borderTop: '1px solid #f0f0f0', paddingTop: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                ['לקוח', order.customer],
                order.address ? ['כתובת', order.address] : null,
                ['סכום', `${order.total} ₪`],
                ['מספר פריטים', String(order.items?.length ?? 0)],
              ].filter(Boolean).map(([label, value]) => (
                <div key={label as string} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.95rem' }}>
                  <span style={{ color: '#888' }}>{label}</span>
                  <span style={{ fontWeight: 600 }}>{value}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
