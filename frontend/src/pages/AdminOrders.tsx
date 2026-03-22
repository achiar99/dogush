import { useMemo, useState } from 'react';
import AdminLayout from '../components/AdminLayout';
import heConfig from '../../../shared/he.json';

// Destructure everything we need from the JSON
const { strings, currencySymbol, orders: localOrders } = heConfig as any;

interface Order {
  id: string;
  name: string;
  address: string;
  email: string;
  items: Array<{ id: string; amount: number }>;
  total: number;
  status: string;
  time: string;
}

export default function AdminDashboard() {
  // Use the localOrders from your JSON as the initial state
  const [orders] = useState<Order[]>(localOrders || []);
  const [fromDate, setFromDate] = useState<string>('');
  const [toDate, setToDate] = useState<string>('');

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'open': return strings.statusPending;
      case 'completed': return strings.statusCompleted;
      case 'cancelled': return strings.statusCancelled;
      default: return status;
    }
  };

  // Filter logic (since we aren't fetching from a DB anymore)
  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      if (fromDate && order.time < fromDate) return false;
      if (toDate && order.time > toDate) return false;
      return true;
    });
  }, [orders, fromDate, toDate]);

  return (
    <AdminLayout>
      <h1 style={{ direction: 'rtl' }}>{strings.adminOrdersTitle}</h1>
      
      <div style={{ marginBottom: 16, display: 'flex', gap: 16, direction: 'rtl' }}>
        <input
          type="date"
          value={fromDate}
          onChange={(e) => setFromDate(e.target.value)}
          style={{ padding: 8 }}
        />
        <span style={{ padding: 8 }}>עד</span>
        <input
          type="date"
          value={toDate}
          onChange={(e) => setToDate(e.target.value)}
          style={{ padding: 8 }}
        />
      </div>

      <table style={{ width: '100%', borderCollapse: 'collapse', direction: 'rtl' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid #ddd' }}>
            <th style={{ textAlign: 'right', padding: 12 }}>{strings.tableHeaderOrderId}</th>
            <th style={{ textAlign: 'right', padding: 12 }}>{strings.tableHeaderCustomer}</th>
            <th style={{ textAlign: 'right', padding: 12 }}>{strings.tableHeaderTotal}</th>
            <th style={{ textAlign: 'center', padding: 12 }}>{strings.tableHeaderStatus}</th>
            <th style={{ textAlign: 'center', padding: 12 }}>{strings.tableHeaderTime}</th>
          </tr>
        </thead>
        <tbody>
          {filteredOrders.map(order => (
            <tr key={order.id} style={{ borderBottom: '1px solid #eee' }}>
              <td style={{ padding: 12 }}>#{order.id}</td>
              <td style={{ padding: 12 }}>
                <div><strong>{order.name}</strong></div>
                <div style={{ fontSize: '0.8em', color: '#666' }}>{order.address}</div>
              </td>
              <td style={{ padding: 12 }}>{order.total}{currencySymbol}</td>
              <td style={{ textAlign: 'center', padding: 12 }}>
                {getStatusLabel(order.status)}
              </td>
              <td style={{ textAlign: 'center', padding: 12 }}>
                {order.time || '—'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </AdminLayout>
  );
}