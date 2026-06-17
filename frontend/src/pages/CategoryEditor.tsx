import { useEffect, useState } from 'react';
import AdminLayout from '../components/AdminLayout';
import { adminFetch } from '../api/adminFetch';

interface Category {
  key: string;
  name: string;
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: 8,
  boxSizing: 'border-box',
  border: '1px solid #ccc',
  borderRadius: 4,
  fontSize: '1rem',
};

export default function CategoryEditor() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [usedKeys, setUsedKeys] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedKey, setSavedKey] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      adminFetch('/api/admin/categories').then(r => r.json()),
      adminFetch('/api/admin/products').then(r => r.json()),
    ])
      .then(([cats, prods]) => {
        setCategories(Array.isArray(cats) ? cats : []);
        const active = new Set<string>(
          (Array.isArray(prods) ? prods : [])
            .filter((p: any) => p.active)
            .map((p: any) => p.category as string)
        );
        setUsedKeys(active);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const openModal = () => {
    setName('');
    setError(null);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setError(null);
  };

  const handleAdd = async () => {
    if (!name.trim()) { setError('שם קטגוריה חובה'); return; }
    setSaving(true);
    setError(null);
    try {
      const res = await adminFetch('/api/admin/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim() }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }
      const created: Category = await res.json();
      setCategories(prev => [...prev, created]);
      setSavedKey(created.key);
      setTimeout(() => setSavedKey(null), 2500);
      closeModal();
    } catch (e: any) {
      setError(e.message ?? 'שגיאה בשמירה');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (cat: Category) => {
    if (!confirm(`למחוק את הקטגוריה "${cat.name}"?`)) return;
    setError(null);
    try {
      const res = await adminFetch(`/api/admin/categories/${encodeURIComponent(cat.key)}`, { method: 'DELETE' });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body.error ?? 'שגיאה במחיקה');
        return;
      }
      setCategories(prev => prev.filter(c => c.key !== cat.key));
    } catch {
      setError('שגיאה במחיקה');
    }
  };

  return (
    <AdminLayout>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, direction: 'rtl' }}>
        <h1 style={{ margin: 0 }}>ניהול קטגוריות</h1>
        <button
          onClick={openModal}
          style={{ padding: '10px 20px', backgroundColor: '#28a745', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 'bold', fontSize: '1rem' }}
        >
          + קטגוריה חדשה
        </button>
      </div>

      {error && (
        <div style={{ marginBottom: 16, padding: 10, backgroundColor: '#fff3f3', border: '1px solid #f5c6cb', borderRadius: 4, color: '#721c24', fontSize: '0.9rem', direction: 'rtl' }}>
          {error}
        </div>
      )}

      {loading ? (
        <p style={{ direction: 'rtl' }}>טוען...</p>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse', direction: 'rtl' }}>
          <thead>
            <tr style={{ backgroundColor: '#f9f9f9', borderBottom: '2px solid #eee' }}>
              <th style={{ textAlign: 'right', padding: 12 }}>שם</th>
              <th style={{ padding: 12 }}></th>
            </tr>
          </thead>
          <tbody>
            {categories.map(cat => {
              const hasProducts = usedKeys.has(cat.key);
              return (
                <tr key={cat.key} style={{ borderBottom: '1px solid #eee', backgroundColor: '#d4edda' }}>
                  <td style={{ padding: 12 }}>
                    {cat.name}
                    {savedKey === cat.key && (
                      <span style={{ marginRight: 8, color: '#28a745', fontSize: '0.85rem' }}>נשמר!</span>
                    )}
                    {hasProducts && (
                      <span style={{ marginRight: 10, fontSize: '0.8rem', color: '#856404', backgroundColor: '#fff3cd', border: '1px solid #ffc107', borderRadius: 4, padding: '2px 8px' }}>
                        יש מוצרים פעילים
                      </span>
                    )}
                  </td>
                  <td style={{ padding: 12, textAlign: 'center' }}>
                    <button
                      onClick={() => !hasProducts && handleDelete(cat)}
                      disabled={hasProducts}
                      title={hasProducts ? 'לא ניתן למחוק קטגוריה עם מוצרים פעילים' : 'מחק קטגוריה'}
                      style={{
                        padding: '4px 14px',
                        backgroundColor: hasProducts ? '#ccc' : '#dc3545',
                        color: hasProducts ? '#888' : '#fff',
                        border: 'none',
                        borderRadius: 4,
                        cursor: hasProducts ? 'not-allowed' : 'pointer',
                        fontSize: '0.85rem',
                      }}
                    >
                      מחק
                    </button>
                  </td>
                </tr>
              );
            })}
            {categories.length === 0 && (
              <tr>
                <td colSpan={2} style={{ padding: 20, textAlign: 'center', color: '#888' }}>אין קטגוריות עדיין</td>
              </tr>
            )}
          </tbody>
        </table>
      )}

      {modalOpen && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: '#fff', padding: 24, borderRadius: 8, width: 400, direction: 'rtl' }}>
            <h2 style={{ margin: '0 0 20px' }}>קטגוריה חדשה</h2>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', marginBottom: 4, fontWeight: 500 }}>שם</label>
              <input
                value={name}
                onChange={e => setName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAdd()}
                style={inputStyle}
                autoFocus
                placeholder="אוכל יבש"
              />
            </div>

            {error && (
              <div style={{ marginBottom: 12, padding: 10, backgroundColor: '#fff3f3', border: '1px solid #f5c6cb', borderRadius: 4, color: '#721c24', fontSize: '0.9rem' }}>
                {error}
              </div>
            )}

            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 8 }}>
              <button onClick={closeModal} style={{ padding: '10px 20px', cursor: 'pointer', borderRadius: 4, border: '1px solid #ccc' }}>
                ביטול
              </button>
              <button
                onClick={handleAdd}
                disabled={saving}
                style={{ padding: '10px 24px', backgroundColor: saving ? '#aaa' : '#28a745', color: '#fff', border: 'none', borderRadius: 4, cursor: saving ? 'default' : 'pointer', fontWeight: 'bold' }}
              >
                {saving ? '...' : 'שמור'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
