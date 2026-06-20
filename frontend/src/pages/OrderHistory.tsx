import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import { useUser } from '../context/UserContext';

const API = import.meta.env.VITE_API_BASE_URL || '';

interface OrderItem { id: string; quantity: number; }
interface Order {
  orderId: string; customer: string; address?: string; email?: string;
  items: OrderItem[]; total: number; status: string; createdAt: string;
}

const STATUS_LABELS: Record<string, string> = {
  open: 'ממתין', inProgress: 'בטיפול', completed: 'הושלם', cancelled: 'בוטל',
};

export default function OrderHistory() {
  const { user, token } = useUser();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) { navigate('/'); return; }
    fetch(`${API}/api/orders/my`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(data => setOrders(Array.isArray(data) ? data : []))
      .catch(() => setOrders([]))
      .finally(() => setLoading(false));
  }, [token]);

  const fmt = (iso: string) => new Intl.DateTimeFormat('he-IL', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(iso));

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#faf9f6', direction: 'rtl' }}>
      <Header />
      <div style={{ maxWidth: 700, margin: '0 auto', padding: '32px 16px' }}>
        <h1 style={{ marginBottom: 8 }}>ההזמנות שלי</h1>
        {user && <p style={{ color: '#666', marginBottom: 24 }}>שלום, {user.name}</p>}

        {loading ? (
          <p>טוען...</p>
        ) : orders.length === 0 ? (
          <div style={{ textAlign: 'center', paddingTop: 60, color: '#aaa' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>📦</div>
            <p>עדיין אין הזמנות</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {orders.map(order => (
              <div key={order.orderId} style={{ backgroundColor: '#fff', borderRadius: 10, padding: 20, boxShadow: '0 1px 6px rgba(0,0,0,0.08)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '1rem' }}>הזמנה #{order.orderId.slice(-6)}</div>
                    <div style={{ color: '#888', fontSize: '0.85rem', marginTop: 2 }}>{fmt(order.createdAt)}</div>
                  </div>
                  <span style={{
                    padding: '4px 10px', borderRadius: 12, fontSize: '0.85rem',
                    backgroundColor: order.status === 'completed' ? '#e6f4ea' : '#fff4e5',
                    color: order.status === 'completed' ? '#1e7e34' : '#b45d00',
                  }}>
                    {STATUS_LABELS[order.status] ?? order.status}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#555', fontSize: '0.9rem' }}>
                  <span>{order.items.length} פריטים</span>
                  <span style={{ fontWeight: 700, color: '#333' }}>{order.total} ₪</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
