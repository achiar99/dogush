import { useEffect, useMemo, useState } from 'react';
import AdminLayout from '../components/AdminLayout';
import heConfig from '../../../shared/he.json';

const { strings, categories } = heConfig as {
  strings: {
    adminDashboardTitle: string;
    tableHeaderName: string;
    tableHeaderPrice: string;
    tableHeaderOrders: string;
    tableHeaderCategory: string;
    tableHeaderActive: string;
  };
  categories: Array<{ key: string; name: string; priority: number }>;
};

interface FoodItem {
  id: string;
  name: string;
  price: number;
  orderCount: number;
  category: string;
  active: boolean;
}

export default function AdminDashboard() {
  const [foods, setFoods] = useState<FoodItem[]>([]);
  const [fromDate, setFromDate] = useState<string>('');
  const [toDate, setToDate] = useState<string>('');

  const categoryNames = useMemo(() => {
    const map: Record<string, string> = {};
    for (const cat of categories) {
      map[cat.key] = cat.name;
    }
    return map;
  }, [categories]);

  useEffect(() => {
    const params = new URLSearchParams();
    if (fromDate) params.append('from', fromDate);
    if (toDate) params.append('to', toDate);
    const query = params.toString();
    const url = query ? `/api/admin/stats?${query}` : '/api/admin/stats';
    fetch(`http://localhost:4000${url}`)
      .then(res => res.json())
      .then(data => setFoods(data))
      .catch(() => setFoods([]));
  }, [fromDate, toDate]);

  return (
    <AdminLayout>
      <h1>{strings.adminDashboardTitle}</h1>
      <div style={{ marginBottom: 16, display: 'flex', gap: 16 }}>
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
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid #ddd' }}>
            <th style={{ textAlign: 'right', padding: 12 }}>{strings.tableHeaderName}</th>
            <th style={{ textAlign: 'right', padding: 12 }}>{strings.tableHeaderCategory}</th>
            <th style={{ textAlign: 'right', padding: 12 }}>{strings.tableHeaderPrice}</th>
            <th style={{ textAlign: 'center', padding: 12 }}>{strings.tableHeaderOrders}</th>
            <th style={{ textAlign: 'center', padding: 12 }}>{strings.tableHeaderActive}</th>
          </tr>
        </thead>
        <tbody>
          {foods.map(food => (
            <tr key={food.id} style={{ borderBottom: '1px solid #eee' }}>
              <td style={{ padding: 12 }}>{food.name}</td>
              <td style={{ padding: 12 }}>{categoryNames[food.category] || food.category}</td>
              <td style={{ padding: 12 }}>{food.price} ₪</td>
              <td style={{ textAlign: 'center', padding: 12 }}>{food.orderCount}</td>
              <td style={{ textAlign: 'center', padding: 12 }}>{food.active ? '✓' : '✗'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </AdminLayout>
  );
}
