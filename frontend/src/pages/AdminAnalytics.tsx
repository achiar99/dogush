import { useEffect, useState } from 'react';
import AdminLayout from '../components/AdminLayout';
import { adminFetch } from '../api/adminFetch';

interface PageView {
  visitId: string;
  timestamp: string;
  date: string;
  page: string;
  source: string;
  sessionId: string;
  referrer: string;
  userAgent: string;
  screenWidth: number;
  language: string;
  ip: string;
  city?: string;
  country?: string;
  region?: string;
}

function count<T extends string>(arr: T[]): Record<string, number> {
  const map: Record<string, number> = {};
  for (const v of arr) map[v] = (map[v] || 0) + 1;
  return map;
}

function topN(map: Record<string, number>, n = 6): [string, number][] {
  return Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, n);
}

function isMobile(ua: string) {
  return /mobile|android|iphone|ipad/i.test(ua);
}

const RANGES = [
  { label: 'היום', days: 1 },
  { label: '7 ימים', days: 7 },
  { label: '30 ימים', days: 30 },
  { label: 'הכל', days: 0 },
];

export default function AdminAnalytics() {
  const [views, setViews] = useState<PageView[]>([]);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState(7);

  useEffect(() => {
    adminFetch('/api/admin/analytics')
      .then(r => r.json())
      .then(data => setViews(Array.isArray(data) ? data : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = range === 0 ? views : views.filter(v => {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - range);
    return new Date(v.timestamp) >= cutoff;
  });

  const uniqueSessions = new Set(filtered.map(v => v.ip)).size;
  const bySource = count(filtered.map(v => v.source || 'direct'));
  const byCountry = count(filtered.map(v => v.country || 'Unknown'));
  const byCity = count(filtered.map(v => v.city || 'Unknown'));
  const mobileCount = filtered.filter(v => isMobile(v.userAgent)).length;
  const desktopCount = filtered.length - mobileCount;

  // Visits per day (last 14 days)
  const dayMap: Record<string, number> = {};
  const today = new Date();
  const days = Math.min(range || 14, 14);
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    dayMap[d.toISOString().slice(0, 10)] = 0;
  }
  for (const v of filtered) {
    if (dayMap[v.date] !== undefined) dayMap[v.date]++;
  }
  const dayEntries = Object.entries(dayMap);
  const maxDay = Math.max(...Object.values(dayMap), 1);

  return (
    <AdminLayout>
      <div style={{ direction: 'rtl' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginBottom: 24 }}>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 900 }}>📈 אנליטיקה</h1>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {RANGES.map(r => (
              <button key={r.days} onClick={() => setRange(r.days)} style={{
                padding: '7px 14px', borderRadius: 8, cursor: 'pointer', fontWeight: 600,
                fontSize: '0.82rem', fontFamily: 'inherit',
                background: range === r.days ? '#1e1e2e' : '#fff',
                color: range === r.days ? '#fff' : '#555',
                border: `1.5px solid ${range === r.days ? '#1e1e2e' : '#ddd'}`,
              }}>{r.label}</button>
            ))}
          </div>
        </div>

        {loading ? <p>טוען...</p> : (
          <>
            {/* KPI cards */}
            <div className="admin-kpi-grid" style={{ marginBottom: 28 }}>
              {[
                { label: 'כניסות', value: filtered.length, icon: '👁️' },
                { label: 'מבקרים ייחודיים', value: uniqueSessions, icon: '👤' },
                { label: 'מובייל', value: mobileCount, icon: '📱' },
                { label: 'דסקטופ', value: desktopCount, icon: '💻' },
              ].map(kpi => (
                <div key={kpi.label} style={{
                  background: '#fff', borderRadius: 16, padding: '20px 24px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                }}>
                  <div style={{ fontSize: 28, marginBottom: 8 }}>{kpi.icon}</div>
                  <div style={{ fontSize: 32, fontWeight: 900, color: '#1e1e2e' }}>{kpi.value}</div>
                  <div style={{ fontSize: 13, color: '#888', marginTop: 4 }}>{kpi.label}</div>
                </div>
              ))}
            </div>

            {/* Daily chart */}
            {range !== 1 && (
              <div style={{ background: '#fff', borderRadius: 16, padding: '20px 16px 12px', marginBottom: 24, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                <h3 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 700 }}>כניסות לפי יום</h3>
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: 110, overflow: 'hidden' }}>
                  {dayEntries.map(([date, cnt]) => (
                    <div key={date} style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                      <div style={{ fontSize: 9, color: '#888', fontWeight: 600, lineHeight: 1 }}>{cnt || ''}</div>
                      <div style={{
                        width: '80%', borderRadius: '4px 4px 0 0',
                        background: cnt > 0 ? '#c15f2a' : '#f0ebe1',
                        height: `${Math.max((cnt / maxDay) * 75, cnt > 0 ? 4 : 2)}px`,
                        transition: 'height 0.3s',
                      }} />
                      <div style={{ fontSize: 8, color: '#bbb', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100%', textAlign: 'center', lineHeight: 1.2, marginTop: 2 }}>
                        {date.slice(8)}/{date.slice(5, 7)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="admin-2col-grid" style={{ marginBottom: 24 }}>
              <StatCard title="מקורות כניסה" items={topN(bySource)} total={filtered.length} color="#c15f2a" />
              <StatCard title="מדינות" items={topN(byCountry)} total={filtered.length} color="#2563eb" />
            </div>

            <div className="admin-2col-grid" style={{ marginBottom: 24 }}>
              {/* Cities */}
              <StatCard title="ערים" items={topN(byCity)} total={filtered.length} color="#16a34a" />
              {/* QR stats */}
              <div style={{ background: '#fff', borderRadius: 16, padding: 24, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                <h3 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 700 }}>📲 QR Code</h3>
                <div style={{ fontSize: 48, fontWeight: 900, color: '#1e1e2e' }}>{bySource['qr'] || 0}</div>
                <div style={{ fontSize: 13, color: '#888', marginTop: 4 }}>סריקות QR</div>
                <div style={{ marginTop: 12, fontSize: 13, color: '#aaa' }}>
                  {filtered.length > 0
                    ? `${Math.round(((bySource['qr'] || 0) / filtered.length) * 100)}% מסך הכניסות`
                    : '—'}
                </div>
              </div>
            </div>

            {/* Recent visits */}
            <div style={{ background: '#fff', borderRadius: 16, padding: 24, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
              <h3 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 700 }}>כניסות אחרונות</h3>

              {/* Desktop table */}
              <div className="analytics-table-wrap">
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid #f0f0f0', color: '#888' }}>
                      {['זמן', 'IP', 'עיר', 'מדינה', 'מקור', 'מסך'].map(h => (
                        <th key={h} style={{ textAlign: 'right', padding: '8px 12px', fontWeight: 600 }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.slice(0, 50).map(v => (
                      <tr key={v.visitId} style={{ borderBottom: '1px solid #f5f5f5' }}>
                        <td style={{ padding: '8px 12px', color: '#555', whiteSpace: 'nowrap' }}>
                          {new Date(v.timestamp).toLocaleString('he-IL', { dateStyle: 'short', timeStyle: 'short' })}
                        </td>
                        <td style={{ padding: '8px 12px', fontFamily: 'monospace', color: '#777' }}>{v.ip}</td>
                        <td style={{ padding: '8px 12px' }}>{v.city || '—'}</td>
                        <td style={{ padding: '8px 12px' }}>{v.country || '—'}</td>
                        <td style={{ padding: '8px 12px' }}>
                          <span style={{
                            padding: '2px 10px', borderRadius: 999, fontSize: 11, fontWeight: 700,
                            background: v.source === 'qr' ? '#fef3c7' : v.source === 'direct' ? '#f0f0f0' : '#dbeafe',
                            color: v.source === 'qr' ? '#92400e' : v.source === 'direct' ? '#666' : '#1e40af',
                          }}>{v.source}</span>
                        </td>
                        <td style={{ padding: '8px 12px', color: '#888' }}>{v.screenWidth ? `${v.screenWidth}px` : '—'}</td>
                      </tr>
                    ))}
                    {filtered.length === 0 && (
                      <tr><td colSpan={6} style={{ padding: 24, textAlign: 'center', color: '#aaa' }}>אין נתונים עדיין</td></tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Mobile cards */}
              <div className="analytics-cards-wrap">
                {filtered.length === 0 && <p style={{ textAlign: 'center', color: '#aaa', fontSize: 13 }}>אין נתונים עדיין</p>}
                {filtered.slice(0, 50).map(v => (
                  <div key={v.visitId} style={{ borderBottom: '1px solid #f0f0f0', padding: '10px 0', direction: 'rtl' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: '#333' }}>
                          {v.city || '—'}{v.country ? `, ${v.country}` : ''}
                        </div>
                        <div style={{ fontSize: 11, color: '#aaa', marginTop: 2 }}>
                          {new Date(v.timestamp).toLocaleString('he-IL', { dateStyle: 'short', timeStyle: 'short' })}
                          {v.screenWidth ? ` · ${v.screenWidth}px` : ''}
                        </div>
                      </div>
                      <span style={{
                        padding: '2px 10px', borderRadius: 999, fontSize: 11, fontWeight: 700, flexShrink: 0,
                        background: v.source === 'qr' ? '#fef3c7' : v.source === 'direct' ? '#f0f0f0' : '#dbeafe',
                        color: v.source === 'qr' ? '#92400e' : v.source === 'direct' ? '#666' : '#1e40af',
                      }}>{v.source}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        <style>{`
          .admin-kpi-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 12px;
          }
          .admin-2col-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 16px;
          }
          .analytics-table-wrap { display: block; }
          .analytics-cards-wrap { display: none; }
          @media (max-width: 600px) {
            .admin-kpi-grid { grid-template-columns: repeat(2, 1fr); }
            .admin-2col-grid { grid-template-columns: 1fr; }
            .analytics-table-wrap { display: none; }
            .analytics-cards-wrap { display: block; }
          }
        `}</style>
      </div>
    </AdminLayout>
  );
}

function StatCard({ title, items, total, color }: { title: string; items: [string, number][]; total: number; color: string }) {
  return (
    <div style={{ background: '#fff', borderRadius: 16, padding: 24, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
      <h3 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 700 }}>{title}</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {items.length === 0 && <div style={{ color: '#aaa', fontSize: 13 }}>אין נתונים</div>}
        {items.map(([label, cnt]) => (
          <div key={label}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 13 }}>
              <span style={{ fontWeight: 600 }}>{label}</span>
              <span style={{ color: '#888' }}>{cnt} ({total > 0 ? Math.round((cnt / total) * 100) : 0}%)</span>
            </div>
            <div style={{ height: 6, background: '#f0f0f0', borderRadius: 99 }}>
              <div style={{ height: '100%', borderRadius: 99, background: color, width: `${total > 0 ? (cnt / total) * 100 : 0}%`, transition: 'width 0.4s' }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
