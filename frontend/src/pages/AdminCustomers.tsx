import { useEffect, useState } from 'react';
import AdminLayout from '../components/AdminLayout';
import { adminFetch } from '../api/adminFetch';

interface User {
  userId: string;
  email: string;
  name: string;
  phone?: string;
  address?: string;
  createdAt: string;
}

interface Order {
  orderId: string;
  total: number;
  status: string;
  createdAt: string;
  items: { id: string; quantity: number }[];
}

const STATUS_LABELS: Record<string, string> = {
  open: 'פתוח', inProgress: 'בטיפול', completed: 'הושלם', cancelled: 'בוטל',
};
const STATUS_COLORS: Record<string, string> = {
  open: '#f59e0b', inProgress: '#3b82f6', completed: '#22c55e', cancelled: '#ef4444',
};

export default function AdminCustomers() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<User | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);

  useEffect(() => {
    adminFetch('/api/admin/users')
      .then(r => r.json())
      .then(data => setUsers(Array.isArray(data) ? data : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const selectUser = async (user: User) => {
    setSelected(user);
    setOrdersLoading(true);
    setOrders([]);
    try {
      const data = await adminFetch(`/api/admin/users/${user.userId}/orders`).then(r => r.json());
      setOrders(Array.isArray(data) ? data : []);
    } catch {}
    setOrdersLoading(false);
  };

  const filtered = users.filter(u => {
    const q = search.toLowerCase();
    return !q || u.name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q) || u.phone?.includes(q);
  });

  const totalSpent = orders.filter(o => o.status !== 'cancelled').reduce((s, o) => s + (o.total || 0), 0);

  return (
    <AdminLayout>
      <div style={{ direction: 'rtl' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 900 }}>👥 לקוחות</h1>
          <div style={{ position: 'relative' }}>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="🔍 חיפוש לפי שם, אימייל, טלפון..."
              style={{
                padding: '9px 16px', borderRadius: 10, border: '1.5px solid #e0d8cc',
                fontSize: '0.9rem', width: 280, fontFamily: 'inherit', outline: 'none',
                background: '#fff',
              }}
            />
            {search && (
              <button onClick={() => setSearch('')} style={{
                position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)',
                background: 'none', border: 'none', cursor: 'pointer', color: '#aaa', fontSize: 16,
              }}>✕</button>
            )}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: selected ? '1fr 1fr' : '1fr', gap: 20 }}>
          {/* Customer list */}
          <div style={{ background: '#fff', borderRadius: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
            <div style={{ padding: '12px 20px', borderBottom: '1px solid #f0f0f0', fontSize: 13, color: '#888', fontWeight: 600 }}>
              {filtered.length} לקוחות
            </div>
            {loading ? (
              <p style={{ padding: 24, color: '#888' }}>טוען...</p>
            ) : filtered.length === 0 ? (
              <p style={{ padding: 24, color: '#aaa', textAlign: 'center' }}>לא נמצאו לקוחות</p>
            ) : (
              <div style={{ maxHeight: 600, overflowY: 'auto' }}>
                {filtered.map(user => (
                  <div
                    key={user.userId}
                    onClick={() => selectUser(user)}
                    style={{
                      padding: '14px 20px', cursor: 'pointer', borderBottom: '1px solid #f5f5f5',
                      background: selected?.userId === user.userId ? '#fdf6f1' : '#fff',
                      borderRight: selected?.userId === user.userId ? '3px solid #c15f2a' : '3px solid transparent',
                      transition: 'background 0.15s',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 15, color: '#1a1a1a' }}>{user.name}</div>
                        <div style={{ fontSize: 12, color: '#888', marginTop: 3 }}>{user.email}</div>
                        {user.phone && <div style={{ fontSize: 12, color: '#aaa', marginTop: 2, direction: 'ltr', textAlign: 'right' }}>{user.phone}</div>}
                      </div>
                      <div style={{ fontSize: 11, color: '#bbb', whiteSpace: 'nowrap', marginRight: 8 }}>
                        {new Date(user.createdAt).toLocaleDateString('he-IL')}
                      </div>
                    </div>
                    {user.address && (
                      <div style={{ fontSize: 11, color: '#aaa', marginTop: 4 }}>📍 {user.address}</div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Customer detail panel */}
          {selected && (
            <div>
              {/* Info card */}
              <div style={{ background: '#fff', borderRadius: 16, padding: 24, boxShadow: '0 2px 8px rgba(0,0,0,0.06)', marginBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                  <h2 style={{ margin: 0, fontSize: 18, fontWeight: 900 }}>{selected.name}</h2>
                  <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#aaa', fontSize: 20 }}>✕</button>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  {[
                    { label: 'אימייל', value: selected.email },
                    { label: 'טלפון', value: selected.phone || '—' },
                    { label: 'כתובת', value: selected.address || '—' },
                    { label: 'נרשם', value: new Date(selected.createdAt).toLocaleDateString('he-IL') },
                    { label: 'הזמנות', value: String(orders.length) },
                    { label: 'סה״כ קניות', value: `₪${totalSpent.toLocaleString()}` },
                  ].map(f => (
                    <div key={f.label} style={{ background: '#f8f8f8', borderRadius: 10, padding: '10px 14px' }}>
                      <div style={{ fontSize: 11, color: '#aaa', marginBottom: 3 }}>{f.label}</div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: '#1a1a1a' }}>{f.value}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Orders */}
              <div style={{ background: '#fff', borderRadius: 16, padding: 24, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                <h3 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 800 }}>היסטוריית הזמנות</h3>
                {ordersLoading ? (
                  <p style={{ color: '#888', fontSize: 13 }}>טוען...</p>
                ) : orders.length === 0 ? (
                  <p style={{ color: '#aaa', fontSize: 13, textAlign: 'center' }}>אין הזמנות עדיין</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {orders.map(order => (
                      <div key={order.orderId} style={{ border: '1px solid #f0f0f0', borderRadius: 10, padding: '12px 16px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div>
                            <span style={{ fontWeight: 700, fontSize: 14 }}>#{order.orderId}</span>
                            <span style={{ fontSize: 12, color: '#888', marginRight: 10 }}>
                              {new Date(order.createdAt).toLocaleDateString('he-IL')}
                            </span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <span style={{ fontWeight: 800, fontSize: 15 }}>₪{order.total}</span>
                            <span style={{
                              padding: '3px 10px', borderRadius: 999, fontSize: 11, fontWeight: 700,
                              background: STATUS_COLORS[order.status] + '22',
                              color: STATUS_COLORS[order.status],
                            }}>{STATUS_LABELS[order.status] || order.status}</span>
                          </div>
                        </div>
                        <div style={{ fontSize: 12, color: '#aaa', marginTop: 6 }}>
                          {order.items?.length} פריטים
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
