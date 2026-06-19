import { useEffect, useState } from 'react';
import AdminLayout from '../components/AdminLayout';
import { adminFetch } from '../api/adminFetch';

interface Product { id: string; name: string; orderCount: number; active: boolean; }
interface Order { orderId: string; status: string; createdAt: string; total: number; items: { id: string; quantity: number }[]; }
interface PageView { date: string; timestamp: string; sessionId: string; }

const STATUS_LABELS: Record<string, string> = {
  open: 'פתוח', inProgress: 'בטיפול', completed: 'הושלם', cancelled: 'בוטל',
};
const STATUS_COLORS: Record<string, string> = {
  open: '#f59e0b', inProgress: '#3b82f6', completed: '#22c55e', cancelled: '#ef4444',
};
const CHART_COLORS = ['#c15f2a','#3b82f6','#22c55e','#f59e0b','#8b5cf6','#ec4899','#14b8a6','#f97316'];

function PieChart({ slices }: { slices: { label: string; value: number; color: string }[] }) {
  const total = slices.reduce((s, x) => s + x.value, 0);
  if (total === 0) return <div style={{ color: '#aaa', fontSize: 13, textAlign: 'center', padding: 24 }}>אין נתונים</div>;

  let offset = 0;
  const paths = slices.map(s => {
    const pct = s.value / total;
    const start = offset;
    offset += pct;
    if (pct === 0) return null;
    const a1 = start * 2 * Math.PI - Math.PI / 2;
    const a2 = offset * 2 * Math.PI - Math.PI / 2;
    const r = 80;
    const cx = 100, cy = 100;
    const x1 = cx + r * Math.cos(a1), y1 = cy + r * Math.sin(a1);
    const x2 = cx + r * Math.cos(a2), y2 = cy + r * Math.sin(a2);
    const large = pct > 0.5 ? 1 : 0;
    return <path key={s.label} d={`M${cx},${cy} L${x1},${y1} A${r},${r} 0 ${large},1 ${x2},${y2} Z`} fill={s.color} stroke="#fff" strokeWidth={2} />;
  });

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap' }}>
      <svg viewBox="0 0 200 200" style={{ width: 160, height: 160, flexShrink: 0 }}>{paths}</svg>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {slices.filter(s => s.value > 0).map(s => (
          <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
            <div style={{ width: 12, height: 12, borderRadius: 3, background: s.color, flexShrink: 0 }} />
            <span style={{ fontWeight: 600 }}>{s.label}</span>
            <span style={{ color: '#888' }}>({s.value} — {Math.round((s.value / total) * 100)}%)</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function BarChart({ data, color = '#c15f2a' }: { data: { label: string; value: number }[]; color?: string }) {
  const max = Math.max(...data.map(d => d.value), 1);
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 5, height: 120 }}>
      {data.map(d => (
        <div key={d.label} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
          <div style={{ fontSize: 10, color: '#888', fontWeight: 600 }}>{d.value || ''}</div>
          <div style={{
            width: '100%', borderRadius: '5px 5px 0 0',
            background: d.value > 0 ? color : '#f0ebe1',
            height: `${Math.max((d.value / max) * 90, d.value > 0 ? 4 : 0)}px`,
            transition: 'height 0.4s',
          }} />
          <div style={{ fontSize: 9, color: '#aaa', whiteSpace: 'nowrap', transform: 'rotate(-35deg)', transformOrigin: 'top center', marginTop: 4 }}>
            {d.label}
          </div>
        </div>
      ))}
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ background: '#fff', borderRadius: 16, padding: 24, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
      <h3 style={{ margin: '0 0 20px', fontSize: 15, fontWeight: 800, color: '#1e1e2e' }}>{title}</h3>
      {children}
    </div>
  );
}

export default function AdminDashboard() {
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [views, setViews] = useState<PageView[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      adminFetch('/api/admin/stats').then(r => r.json()),
      adminFetch('/api/admin/orders').then(r => r.json()),
      adminFetch('/api/admin/analytics').then(r => r.json()),
    ]).then(([prods, ords, pvs]) => {
      setProducts(Array.isArray(prods) ? prods : []);
      setOrders(Array.isArray(ords) ? ords : []);
      setViews(Array.isArray(pvs) ? pvs : []);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  // Last 7 days axis
  const days7 = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d.toISOString().slice(0, 10);
  });

  const ordersByDay = days7.map(date => ({
    label: date.slice(5),
    value: orders.filter(o => o.createdAt?.slice(0, 10) === date).length,
  }));

  const viewsByDay = days7.map(date => ({
    label: date.slice(5),
    value: views.filter(v => v.date === date).length,
  }));

  const uniqueVisitorsByDay = days7.map(date => ({
    label: date.slice(5),
    value: new Set(views.filter(v => v.date === date).map(v => v.sessionId)).size,
  }));

  // Pie: orders by product (top 8)
  const orderCountByProduct = products
    .filter(p => p.orderCount > 0)
    .sort((a, b) => b.orderCount - a.orderCount)
    .slice(0, 8);

  const productSlices = orderCountByProduct.map((p, i) => ({
    label: p.name,
    value: p.orderCount,
    color: CHART_COLORS[i % CHART_COLORS.length],
  }));

  // Pie: order status
  const statusCounts: Record<string, number> = {};
  for (const o of orders) statusCounts[o.status] = (statusCounts[o.status] || 0) + 1;
  const statusSlices = Object.entries(statusCounts).map(([s, v]) => ({
    label: STATUS_LABELS[s] || s, value: v, color: STATUS_COLORS[s] || '#aaa',
  }));

  // KPIs
  const totalRevenue = orders.filter(o => o.status !== 'cancelled').reduce((s, o) => s + (o.total || 0), 0);
  const todayOrders = orders.filter(o => o.createdAt?.slice(0, 10) === new Date().toISOString().slice(0, 10)).length;
  const todayViews = views.filter(v => v.date === new Date().toISOString().slice(0, 10)).length;
  const uniqueVisitors = new Set(views.map(v => v.sessionId)).size;

  return (
    <AdminLayout>
      <div style={{ direction: 'rtl' }}>
        <h1 style={{ margin: '0 0 24px', fontSize: 24, fontWeight: 900 }}>📊 לוח בקרה</h1>

        {loading ? <p>טוען...</p> : (
          <>
            {/* KPIs */}
            <div className="db-kpi-grid" style={{ marginBottom: 24 }}>
              {[
                { label: 'הזמנות סה״כ', value: orders.length, icon: '🛒' },
                { label: 'הזמנות היום', value: todayOrders, icon: '📦' },
                { label: 'כניסות היום', value: todayViews, icon: '👁️' },
                { label: `הכנסות ₪`, value: totalRevenue.toLocaleString(), icon: '💰' },
              ].map(k => (
                <div key={k.label} style={{ background: '#fff', borderRadius: 16, padding: '16px 20px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                  <div style={{ fontSize: 24, marginBottom: 4 }}>{k.icon}</div>
                  <div style={{ fontSize: 28, fontWeight: 900, color: '#1e1e2e' }}>{k.value}</div>
                  <div style={{ fontSize: 12, color: '#888', marginTop: 4 }}>{k.label}</div>
                </div>
              ))}
            </div>

            <div className="db-chart-grid" style={{ marginBottom: 20 }}>
              <Card title="📦 הזמנות יומיות (7 ימים)">
                <BarChart data={ordersByDay} color="#c15f2a" />
              </Card>
              <Card title="👁️ כניסות יומיות (7 ימים)">
                <BarChart data={viewsByDay} color="#3b82f6" />
              </Card>
            </div>

            <div className="db-chart-grid" style={{ marginBottom: 20 }}>
              <Card title="👤 מבקרים ייחודיים יומי">
                <BarChart data={uniqueVisitorsByDay} color="#8b5cf6" />
              </Card>
              <Card title="🔘 סטטוס הזמנות">
                <PieChart slices={statusSlices} />
              </Card>
            </div>

            <Card title="🏆 הזמנות לפי מוצר">
              <PieChart slices={productSlices} />
            </Card>
          </>
        )}

        <style>{`
          .db-kpi-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 12px;
          }
          .db-chart-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 16px;
          }
          @media (max-width: 600px) {
            .db-kpi-grid {
              grid-template-columns: repeat(2, 1fr);
            }
            .db-chart-grid {
              grid-template-columns: 1fr;
            }
          }
        `}</style>
      </div>
    </AdminLayout>
  );
}
