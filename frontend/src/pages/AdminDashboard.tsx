import { useEffect, useMemo, useState } from 'react';
import AdminLayout from '../components/AdminLayout';
import heConfig from '../../../shared/he.json';

const { strings } = heConfig as {
  strings: {
    adminDashboardTitle: string;
    tableHeaderName: string;
    tableHeaderPrice: string;
    tableHeaderOrders: string;
    tableHeaderCategory: string;
    tableHeaderActive: string;
    loading: string;
  };
};

interface FoodItem {
  id: string;
  name: string;
  price: number;
  orderCount: number;
  category: string;
  active: boolean;
}

interface Category {
  key: string;
  name: string;
}

const API = import.meta.env.VITE_API_BASE_URL || '';

function getToken() {
  return localStorage.getItem('adminToken') || '';
}

export default function AdminDashboard() {
  const [foods, setFoods] = useState<FoodItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  useEffect(() => {
    fetch(`${API}/api/admin/categories`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    })
      .then(r => r.json())
      .then(data => setCategories(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (fromDate) params.append('from', fromDate);
    if (toDate) params.append('to', toDate);
    const query = params.toString();
    fetch(`${API}/api/admin/stats${query ? `?${query}` : ''}`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    })
      .then(r => r.json())
      .then(data => setFoods(Array.isArray(data) ? data : []))
      .catch(() => setFoods([]))
      .finally(() => setLoading(false));
  }, [fromDate, toDate]);

  const categoryNames = useMemo(() => {
    const map: Record<string, string> = {};
    for (const cat of categories) map[cat.key] = cat.name;
    return map;
  }, [categories]);

  return (
    <AdminLayout>
      <h1 style={{ direction: 'rtl', marginBottom: 20 }}>{strings.adminDashboardTitle}</h1>

      <div style={{ marginBottom: 20, display: 'flex', gap: 16, alignItems: 'center' }}>
        <input
          type="date"
          value={fromDate}
          onChange={e => setFromDate(e.target.value)}
          style={{ padding: 8, borderRadius: 4, border: '1px solid #ccc' }}
        />
        <span>עד</span>
        <input
          type="date"
          value={toDate}
          onChange={e => setToDate(e.target.value)}
          style={{ padding: 8, borderRadius: 4, border: '1px solid #ccc' }}
        />
        {(fromDate || toDate) && (
          <button onClick={() => { setFromDate(''); setToDate(''); }} style={{ padding: '8px 14px', borderRadius: 4, border: '1px solid #ccc', cursor: 'pointer' }}>
            נקה
          </button>
        )}
      </div>

      {loading ? (
        <p style={{ direction: 'rtl' }}>{strings.loading}</p>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse', direction: 'rtl' }}>
          <thead>
            <tr style={{ backgroundColor: '#f9f9f9', borderBottom: '2px solid #eee' }}>
              <th style={{ textAlign: 'right', padding: 12 }}>{strings.tableHeaderName}</th>
              <th style={{ textAlign: 'right', padding: 12 }}>{strings.tableHeaderCategory}</th>
              <th style={{ textAlign: 'right', padding: 12 }}>{strings.tableHeaderPrice}</th>
              <th style={{ textAlign: 'center', padding: 12 }}>{strings.tableHeaderOrders}</th>
              <th style={{ textAlign: 'center', padding: 12 }}>{strings.tableHeaderActive}</th>
            </tr>
          </thead>
          <tbody>
            {foods.map(food => (
              <tr key={food.id} style={{ borderBottom: '1px solid #eee', backgroundColor: food.active ? '#d4edda' : '#f8d7da' }}>
                <td style={{ padding: 12 }}>{food.name}</td>
                <td style={{ padding: 12 }}>{categoryNames[food.category] || food.category}</td>
                <td style={{ padding: 12 }}>{food.price} ₪</td>
                <td style={{ textAlign: 'center', padding: 12 }}>{food.orderCount}</td>
                <td style={{ textAlign: 'center', padding: 12 }}>{food.active ? '✓' : '✗'}</td>
              </tr>
            ))}
            {foods.length === 0 && (
              <tr><td colSpan={5} style={{ padding: 20, textAlign: 'center', color: '#888' }}>אין נתונים</td></tr>
            )}
          </tbody>
        </table>
      )}
    </AdminLayout>
  );
}
