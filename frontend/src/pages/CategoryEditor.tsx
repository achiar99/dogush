import { useEffect, useState } from 'react';
import AdminLayout from '../components/AdminLayout';
import { adminFetch } from '../api/adminFetch';

interface Category {
  key: string;
  name: string;
  priority: number;
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '9px 12px',
  boxSizing: 'border-box',
  border: '1.5px solid #e0e0e0',
  borderRadius: 8,
  fontSize: '0.92rem',
  fontFamily: 'inherit',
  outline: 'none',
  background: '#fafafa',
};

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{ display: 'block', marginBottom: 5, fontWeight: 600, fontSize: '0.83rem', color: '#555', textTransform: 'uppercase', letterSpacing: '0.03em' }}>{label}</label>
      {children}
    </div>
  );
}

export default function CategoryEditor() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [usedKeys, setUsedKeys] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  // New category modal
  const [modalOpen, setModalOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPriority, setNewPriority] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Edit modal
  const [editCat, setEditCat] = useState<Category | null>(null);
  const [editName, setEditName] = useState('');
  const [editPriority, setEditPriority] = useState(0);
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

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

  // ── Add ──────────────────────────────────────────────────────────────────────
  const openAdd = () => { setNewName(''); setNewPriority(0); setError(null); setModalOpen(true); };
  const closeAdd = () => { setModalOpen(false); setError(null); };

  const handleAdd = async () => {
    if (!newName.trim()) { setError('שם קטגוריה חובה'); return; }
    setSaving(true); setError(null);
    try {
      const res = await adminFetch('/api/admin/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName.trim(), priority: newPriority }),
      });
      if (!res.ok) { const b = await res.json().catch(() => ({})); throw new Error(b.error ?? `HTTP ${res.status}`); }
      const created: Category = await res.json();
      setCategories(prev => [...prev, created].sort((a, b) => a.priority - b.priority));
      closeAdd();
    } catch (e: any) { setError(e.message ?? 'שגיאה בשמירה'); }
    finally { setSaving(false); }
  };

  // ── Edit ─────────────────────────────────────────────────────────────────────
  const openEdit = (cat: Category) => {
    setEditCat(cat); setEditName(cat.name); setEditPriority(cat.priority); setEditError(null);
  };
  const closeEdit = () => { setEditCat(null); setEditError(null); };

  const handleEdit = async () => {
    if (!editCat) return;
    if (!editName.trim()) { setEditError('שם חובה'); return; }
    setEditSaving(true); setEditError(null);
    try {
      const res = await adminFetch(`/api/admin/categories/${encodeURIComponent(editCat.key)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editName.trim(), priority: editPriority }),
      });
      if (!res.ok) { const b = await res.json().catch(() => ({})); throw new Error(b.error ?? `HTTP ${res.status}`); }
      const updated: Category = await res.json();
      setCategories(prev => prev.map(c => c.key === updated.key ? updated : c).sort((a, b) => a.priority - b.priority));
      closeEdit();
    } catch (e: any) { setEditError(e.message ?? 'שגיאה בשמירה'); }
    finally { setEditSaving(false); }
  };

  // ── Delete ───────────────────────────────────────────────────────────────────
  const handleDelete = async (cat: Category) => {
    if (!confirm(`למחוק את הקטגוריה "${cat.name}"?`)) return;
    try {
      const res = await adminFetch(`/api/admin/categories/${encodeURIComponent(cat.key)}`, { method: 'DELETE' });
      if (!res.ok) { const b = await res.json().catch(() => ({})); setError(b.error ?? 'שגיאה במחיקה'); return; }
      setCategories(prev => prev.filter(c => c.key !== cat.key));
    } catch { setError('שגיאה במחיקה'); }
  };

  return (
    <AdminLayout>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, direction: 'rtl' }}>
        <h1 style={{ margin: 0 }}>ניהול קטגוריות</h1>
        <button onClick={openAdd} style={{ padding: '10px 20px', backgroundColor: '#28a745', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 'bold', fontSize: '1rem' }}>
          + קטגוריה חדשה
        </button>
      </div>

      {error && <div style={{ marginBottom: 16, padding: 10, backgroundColor: '#fff3f3', border: '1px solid #f5c6cb', borderRadius: 4, color: '#721c24', fontSize: '0.9rem', direction: 'rtl' }}>{error}</div>}

      {loading ? <p style={{ direction: 'rtl' }}>טוען...</p> : (
        <>
          {/* Desktop table */}
          <div className="cat-table-wrap">
            <table style={{ width: '100%', borderCollapse: 'collapse', direction: 'rtl' }}>
              <thead>
                <tr style={{ backgroundColor: '#f9f9f9', borderBottom: '2px solid #eee' }}>
                  <th style={{ textAlign: 'right', padding: 12 }}>שם</th>
                  <th style={{ textAlign: 'center', padding: 12 }}>עדיפות</th>
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
                        {hasProducts && (
                          <span style={{ marginRight: 10, fontSize: '0.8rem', color: '#856404', backgroundColor: '#fff3cd', border: '1px solid #ffc107', borderRadius: 4, padding: '2px 8px' }}>
                            יש מוצרים פעילים
                          </span>
                        )}
                      </td>
                      <td style={{ textAlign: 'center', padding: 12, color: '#555', fontWeight: 600 }}>{cat.priority}</td>
                      <td style={{ padding: 12, textAlign: 'center', display: 'flex', gap: 8, justifyContent: 'center' }}>
                        <button onClick={() => openEdit(cat)} style={{ padding: '4px 14px', backgroundColor: '#007bff', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: '0.85rem' }}>ערוך</button>
                        <button onClick={() => !hasProducts && handleDelete(cat)} disabled={hasProducts}
                          style={{ padding: '4px 14px', backgroundColor: hasProducts ? '#ccc' : '#dc3545', color: hasProducts ? '#888' : '#fff', border: 'none', borderRadius: 4, cursor: hasProducts ? 'not-allowed' : 'pointer', fontSize: '0.85rem' }}>
                          מחק
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {categories.length === 0 && (
                  <tr><td colSpan={3} style={{ padding: 20, textAlign: 'center', color: '#888' }}>אין קטגוריות עדיין</td></tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="cat-cards-wrap">
            {categories.length === 0 && <p style={{ textAlign: 'center', color: '#aaa' }}>אין קטגוריות עדיין</p>}
            {categories.map(cat => {
              const hasProducts = usedKeys.has(cat.key);
              return (
                <div key={cat.key} style={{
                  background: '#f0faf2', borderRadius: 14, padding: '12px 14px', marginBottom: 10,
                  boxShadow: '0 2px 6px rgba(0,0,0,0.06)', direction: 'rtl',
                  borderRight: '4px solid #22c55e',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 15 }}>{cat.name}</div>
                      <div style={{ fontSize: 12, color: '#777', marginTop: 3 }}>עדיפות: {cat.priority}</div>
                      {hasProducts && (
                        <span style={{ marginTop: 4, display: 'inline-block', fontSize: '0.75rem', color: '#856404', backgroundColor: '#fff3cd', border: '1px solid #ffc107', borderRadius: 4, padding: '2px 7px' }}>
                          יש מוצרים פעילים
                        </span>
                      )}
                    </div>
                    <div style={{ display: 'flex', gap: 8, flexShrink: 0, marginRight: 8 }}>
                      <button onClick={() => openEdit(cat)}
                        style={{ padding: '6px 14px', backgroundColor: '#007bff', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
                        ערוך
                      </button>
                      <button onClick={() => !hasProducts && handleDelete(cat)} disabled={hasProducts}
                        style={{ padding: '6px 14px', backgroundColor: hasProducts ? '#ccc' : '#dc3545', color: hasProducts ? '#888' : '#fff', border: 'none', borderRadius: 8, cursor: hasProducts ? 'not-allowed' : 'pointer', fontSize: 13, fontWeight: 600 }}>
                        מחק
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <style>{`
            .cat-table-wrap { background: #fff; border-radius: 16px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.06); }
            .cat-cards-wrap { display: none; }
            @media (max-width: 640px) {
              .cat-table-wrap { display: none; }
              .cat-cards-wrap { display: block; }
            }
          `}</style>
        </>
      )}

      {/* Add modal */}
      {modalOpen && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16 }}>
          <div style={{ backgroundColor: '#fff', borderRadius: 16, width: '100%', maxWidth: 420, direction: 'rtl', boxShadow: '0 20px 60px rgba(0,0,0,0.3)', overflow: 'hidden' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #f0f0f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: '#1e1e2e' }}>+ קטגוריה חדשה</h2>
              <button onClick={closeAdd} style={{ background: '#f4f4f4', border: 'none', borderRadius: 8, width: 34, height: 34, cursor: 'pointer', fontSize: '1.1rem', color: '#555', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
            </div>
            <div style={{ padding: '24px' }}>
              <Field label="שם">
                <input value={newName} onChange={e => setNewName(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAdd()} style={inputStyle} autoFocus placeholder="אוכל יבש" />
              </Field>
              <Field label="עדיפות (מספר קטן = מופיע ראשון)">
                <input type="number" value={newPriority} onChange={e => setNewPriority(Number(e.target.value))} style={inputStyle} min={0} />
              </Field>
            </div>
            <div style={{ padding: '16px 24px', borderTop: '1px solid #f0f0f0', display: 'flex', gap: 10, justifyContent: 'space-between', alignItems: 'center' }}>
              {error && <div style={{ flex: 1, padding: '8px 12px', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, color: '#dc2626', fontSize: '0.85rem' }}>{error}</div>}
              <div style={{ display: 'flex', gap: 10, marginRight: 'auto' }}>
                <button onClick={closeAdd} style={{ padding: '10px 20px', cursor: 'pointer', borderRadius: 8, border: '1.5px solid #e0e0e0', background: '#fff', fontWeight: 600, fontSize: '0.9rem', fontFamily: 'inherit', color: '#555' }}>ביטול</button>
                <button onClick={handleAdd} disabled={saving} style={{ padding: '10px 28px', backgroundColor: saving ? '#aaa' : '#1e1e2e', color: '#fff', border: 'none', borderRadius: 8, cursor: saving ? 'default' : 'pointer', fontWeight: 700, fontSize: '0.9rem', fontFamily: 'inherit' }}>
                  {saving ? '...' : 'שמור'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit modal */}
      {editCat && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16 }}>
          <div style={{ backgroundColor: '#fff', borderRadius: 16, width: '100%', maxWidth: 420, direction: 'rtl', boxShadow: '0 20px 60px rgba(0,0,0,0.3)', overflow: 'hidden' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #f0f0f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: '#1e1e2e' }}>✏️ עריכת קטגוריה</h2>
                <p style={{ margin: '2px 0 0', fontSize: '0.82rem', color: '#888' }}>{editCat.name}</p>
              </div>
              <button onClick={closeEdit} style={{ background: '#f4f4f4', border: 'none', borderRadius: 8, width: 34, height: 34, cursor: 'pointer', fontSize: '1.1rem', color: '#555', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
            </div>
            <div style={{ padding: '24px' }}>
              <Field label="שם">
                <input value={editName} onChange={e => setEditName(e.target.value)} style={inputStyle} autoFocus />
              </Field>
              <Field label="עדיפות (מספר קטן = מופיע ראשון)">
                <input type="number" value={editPriority} onChange={e => setEditPriority(Number(e.target.value))} style={inputStyle} min={0} />
              </Field>
            </div>
            <div style={{ padding: '16px 24px', borderTop: '1px solid #f0f0f0', display: 'flex', gap: 10, justifyContent: 'space-between', alignItems: 'center' }}>
              {editError && <div style={{ flex: 1, padding: '8px 12px', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, color: '#dc2626', fontSize: '0.85rem' }}>{editError}</div>}
              <div style={{ display: 'flex', gap: 10, marginRight: 'auto' }}>
                <button onClick={closeEdit} style={{ padding: '10px 20px', cursor: 'pointer', borderRadius: 8, border: '1.5px solid #e0e0e0', background: '#fff', fontWeight: 600, fontSize: '0.9rem', fontFamily: 'inherit', color: '#555' }}>ביטול</button>
                <button onClick={handleEdit} disabled={editSaving} style={{ padding: '10px 28px', backgroundColor: editSaving ? '#aaa' : '#1e1e2e', color: '#fff', border: 'none', borderRadius: 8, cursor: editSaving ? 'default' : 'pointer', fontWeight: 700, fontSize: '0.9rem', fontFamily: 'inherit' }}>
                  {editSaving ? '...' : 'שמור'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
