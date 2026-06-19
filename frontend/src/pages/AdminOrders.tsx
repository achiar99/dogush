import { useEffect, useState } from 'react';
import AdminLayout from '../components/AdminLayout';
import heConfig from '../../../shared/he.json';
import { adminFetch } from '../api/adminFetch';

const { strings, currencySymbol } = heConfig as any;

interface OrderItem {
  id: string;
  quantity: number;
}

interface Order {
  orderId: string;
  customer: string;
  address: string;
  email: string;
  items: OrderItem[];
  total: number;
  status: string;
  createdAt: string;
}

export default function AdminOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [productMap, setProductMap] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    adminFetch('/api/admin/products')
      .then(r => r.json())
      .then(prods => {
        const map: Record<string, string> = {};
        for (const p of (Array.isArray(prods) ? prods : [])) map[p.id] = p.name;
        setProductMap(map);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (fromDate) params.append('from', fromDate);
    if (toDate) params.append('to', toDate);
    const qs = params.toString();
    adminFetch(`/api/admin/orders${qs ? '?' + qs : ''}`)
      .then(r => r.json())
      .then(data => setOrders(Array.isArray(data) ? data : []))
      .catch(() => setOrders([]))
      .finally(() => setLoading(false));
  }, [fromDate, toDate]);

  const handleStatusChange = (status: string) => {
    if (!selectedOrder) return;
    setSelectedOrder({ ...selectedOrder, status });
  };

  const saveOrder = async () => {
    if (!selectedOrder) return;
    setSaving(true);
    try {
      const res = await adminFetch(`/api/admin/orders/${selectedOrder.orderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: selectedOrder.status }),
      });
      if (res.ok) {
        const updated = await res.json();
        setOrders(prev => prev.map(o => o.orderId === updated.orderId ? updated : o));
        setSelectedOrder(null);
      }
    } finally {
      setSaving(false);
    }
  };

  const formatDateTime = (iso: string) => {
    if (!iso) return '—';
    return new Intl.DateTimeFormat('he-IL', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(iso));
  };

  const getStatusLabel = (status: string) => {
    const map: Record<string, string> = {
      open: strings.statusPending,
      inProgress: strings.statusInProgress || 'בטיפול',
      completed: strings.statusCompleted,
      cancelled: strings.statusCancelled,
    };
    return map[status] ?? status;
  };

  return (
    <AdminLayout>
      <h1 style={{ direction: 'rtl', marginBottom: 20 }}>{strings.adminOrdersTitle}</h1>

      <div style={{ marginBottom: 24, display: 'flex', gap: 12, direction: 'rtl', alignItems: 'center', flexWrap: 'wrap' }}>
        <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)}
          style={{ padding: '8px 12px', borderRadius: 8, border: '1.5px solid #e0d8cc', fontFamily: 'inherit' }} />
        <span>עד</span>
        <input type="date" value={toDate} onChange={e => setToDate(e.target.value)}
          style={{ padding: '8px 12px', borderRadius: 8, border: '1.5px solid #e0d8cc', fontFamily: 'inherit' }} />
      </div>

      {loading ? (
        <p style={{ direction: 'rtl' }}>{strings.loading}</p>
      ) : (
        <>
          {/* Desktop table */}
          <div className="orders-table-wrap">
            <table style={{ width: '100%', borderCollapse: 'collapse', direction: 'rtl' }}>
              <thead>
                <tr style={{ backgroundColor: '#f9f9f9', borderBottom: '2px solid #eee' }}>
                  <th style={{ textAlign: 'right', padding: '14px 12px' }}>{strings.tableHeaderOrderId}</th>
                  <th style={{ textAlign: 'right', padding: '14px 12px' }}>{strings.tableHeaderCustomer}</th>
                  <th style={{ textAlign: 'right', padding: '14px 12px' }}>{strings.tableHeaderTotal}</th>
                  <th style={{ textAlign: 'center', padding: '14px 12px' }}>{strings.tableHeaderStatus}</th>
                  <th style={{ textAlign: 'center', padding: '14px 12px' }}>{strings.tableHeaderTime}</th>
                </tr>
              </thead>
              <tbody>
                {orders.map(order => (
                  <tr key={order.orderId} onClick={() => setSelectedOrder({ ...order })}
                    style={{ borderBottom: '1px solid #eee', cursor: 'pointer' }}>
                    <td style={{ padding: 12, fontWeight: 'bold' }}>#{order.orderId.slice(-6)}</td>
                    <td style={{ padding: 12 }}>
                      <div style={{ fontWeight: 600 }}>{order.customer}</div>
                      <div style={{ fontSize: '0.85rem', color: '#666' }}>{order.address}</div>
                    </td>
                    <td style={{ padding: 12 }}>{currencySymbol}{order.total}</td>
                    <td style={{ textAlign: 'center', padding: 12 }}>
                      <span style={{
                        padding: '4px 10px', borderRadius: 12, fontSize: '0.85rem',
                        backgroundColor: order.status === 'completed' ? '#e6f4ea' : '#fff4e5',
                        color: order.status === 'completed' ? '#1e7e34' : '#b45d00',
                      }}>
                        {getStatusLabel(order.status)}
                      </span>
                    </td>
                    <td style={{ textAlign: 'center', padding: 12, color: '#444', whiteSpace: 'nowrap' }}>{formatDateTime(order.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="orders-cards-wrap">
            {orders.map(order => (
              <div key={order.orderId} onClick={() => setSelectedOrder({ ...order })}
                style={{
                  background: '#fff', borderRadius: 14, padding: '14px 16px', marginBottom: 10,
                  boxShadow: '0 2px 6px rgba(0,0,0,0.06)', cursor: 'pointer', direction: 'rtl',
                }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: 15 }}>{order.customer}</div>
                    <div style={{ fontSize: 12, color: '#888', marginTop: 2 }}>#{order.orderId.slice(-6)} · {formatDateTime(order.createdAt)}</div>
                  </div>
                  <div style={{ fontWeight: 900, fontSize: 17, color: '#1e1e2e' }}>{currencySymbol}{order.total}</div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  {order.address && <div style={{ fontSize: 12, color: '#aaa' }}>📍 {order.address}</div>}
                  <span style={{
                    padding: '3px 10px', borderRadius: 12, fontSize: '0.8rem',
                    backgroundColor: order.status === 'completed' ? '#e6f4ea' : '#fff4e5',
                    color: order.status === 'completed' ? '#1e7e34' : '#b45d00',
                  }}>
                    {getStatusLabel(order.status)}
                  </span>
                </div>
              </div>
            ))}
            {orders.length === 0 && <p style={{ textAlign: 'center', color: '#aaa' }}>אין הזמנות</p>}
          </div>

          <style>{`
            .orders-table-wrap { background: #fff; border-radius: 16px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.06); }
            .orders-cards-wrap { display: none; }
            @media (max-width: 640px) {
              .orders-table-wrap { display: none; }
              .orders-cards-wrap { display: block; }
            }
          `}</style>
        </>
      )}

      {selectedOrder && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: '#fff', padding: 24, borderRadius: '16px 16px 0 0', width: '100%', maxWidth: 520, maxHeight: '85vh', overflowY: 'auto' }}>
            <h2 style={{ margin: '0 0 16px' }}>פרטי הזמנה</h2>

            {[
              ['מספר הזמנה', `#${selectedOrder.orderId.slice(-6)}`],
              ['לקוח', selectedOrder.customer],
              ['כתובת', selectedOrder.address],
              ['אימייל', selectedOrder.email],
              ['סכום', `${selectedOrder.total}${currencySymbol}`],
              ['זמן', formatDateTime(selectedOrder.createdAt)],
            ].map(([label, value]) => (
              <div key={label} style={{ marginBottom: 12 }}>
                <label style={{ display: 'block', marginBottom: 4, color: '#666', fontSize: '0.9rem' }}>{label}</label>
                <div style={{ padding: 8, backgroundColor: '#f5f5f5', borderRadius: 4 }}>{value}</div>
              </div>
            ))}

            <div style={{ marginBottom: 12 }}>
              <label style={{ display: 'block', marginBottom: 6, color: '#666', fontSize: '0.9rem' }}>מוצרים</label>
              <div style={{ backgroundColor: '#f5f5f5', borderRadius: 4, overflow: 'hidden' }}>
                {(selectedOrder.items || []).map((item, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', borderBottom: i < selectedOrder.items.length - 1 ? '1px solid #e0e0e0' : 'none', direction: 'rtl' }}>
                    <span>{productMap[item.id] || item.id}</span>
                    <span style={{ color: '#555' }}>× {item.quantity}</span>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', marginBottom: 4, color: '#666', fontSize: '0.9rem' }}>סטטוס</label>
              <select value={selectedOrder.status} onChange={e => handleStatusChange(e.target.value)}
                style={{ width: '100%', padding: 8 }}>
                <option value="open">{strings.statusPending}</option>
                <option value="inProgress">{strings.statusInProgress || 'בטיפול'}</option>
                <option value="completed">{strings.statusCompleted}</option>
                <option value="cancelled">{strings.statusCancelled}</option>
              </select>
            </div>

            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button onClick={() => setSelectedOrder(null)} style={{ padding: '10px 20px', cursor: 'pointer' }}>
                {strings.cancelButton}
              </button>
              <button onClick={saveOrder} disabled={saving}
                style={{ padding: '10px 20px', backgroundColor: '#28a745', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer' }}>
                {saving ? '...' : strings.saveButton}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
