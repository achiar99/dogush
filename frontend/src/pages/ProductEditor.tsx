import { useEffect, useState } from 'react';
import AdminLayout from '../components/AdminLayout';
import heConfig from '../../../shared/he.json';

const { strings } = heConfig as unknown as {
  strings: {
    adminProductsTitle: string;
    saveButton: string;
    savedMessage: string;
    tableHeaderName: string;
    tableHeaderCategory: string;
    tableHeaderPrice: string;
    tableHeaderActive: string;
    editProductTitle: string;
    addProductTitle: string;
    addProductButton: string;
    productDescription: string;
    productImage: string;
    cancelButton: string;
    loading: string;
  };
};

interface Category {
  key: string;
  name: string;
}

interface NutritionalValue { name: string; value: string; }
interface FeedingRow { petWeight: string; amount: string; }

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  active: boolean;
  imageFile?: string;
  badge?: 'new' | 'sale' | '';
  stock?: number;
  weight?: string;
  ingredients?: string;
  nutritionalValues?: NutritionalValue[];
  feedingTable?: FeedingRow[];
  feedingNote?: string;
}

type DraftProduct = Omit<Product, 'id'> & { id?: string };

import { adminFetch, adminAuthHeaders } from '../api/adminFetch';

const API = import.meta.env.VITE_API_BASE_URL || '';

function emptyProduct(categories: Category[]): DraftProduct {
  return {
    name: '',
    description: '',
    price: 0,
    category: categories[0]?.key ?? '',
    active: true,
    imageFile: '',
    badge: '',
    stock: undefined,
    weight: '',
    ingredients: '',
    nutritionalValues: [],
    feedingTable: [],
    feedingNote: '',
  };
}

export default function ProductEditor() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState<DraftProduct | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedId, setSavedId] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      adminFetch('/api/admin/products').then(r => r.json()),
      adminFetch('/api/admin/categories').then(r => r.json()),
    ])
      .then(([prods, cats]) => {
        setProducts(Array.isArray(prods) ? prods : []);
        setCategories(Array.isArray(cats) ? cats : []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const getCategoryName = (key: string) => categories.find(c => c.key === key)?.name ?? key;

  const openNew = () => {
    setIsNew(true);
    setDraft(emptyProduct(categories));
    setError(null);
  };

  const openEdit = (product: Product) => {
    setIsNew(false);
    setDraft({ ...product });
    setError(null);
  };

  const closeModal = () => {
    setDraft(null);
    setIsNew(false);
    setError(null);
  };

  const handleChange = (field: keyof DraftProduct, value: string | boolean | number) => {
    if (!draft) return;
    setDraft({ ...draft, [field]: value });
  };

  const handleImageUpload = async (file: File) => {
    if (!draft) return;
    setUploadingImage(true);
    setError(null);
    try {
      const urlRes = await adminFetch('/api/admin/upload-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename: file.name, contentType: file.type }),
      });
      if (!urlRes.ok) throw new Error('Failed to get upload URL');
      const { uploadUrl, imageUrl } = await urlRes.json();
      const uploadRes = await fetch(uploadUrl, {
        method: 'PUT',
        body: file,
        headers: { 'Content-Type': file.type },
      });
      if (!uploadRes.ok) throw new Error('Failed to upload image');
      setDraft(prev => prev ? { ...prev, imageFile: imageUrl } : prev);
    } catch (e: any) {
      setError(e.message ?? 'Image upload failed');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('למחוק מוצר זה?')) return;
    try {
      await adminFetch(`/api/admin/products/${id}`, { method: 'DELETE' });
      setProducts(prev => prev.filter(p => p.id !== id));
    } catch {
      alert('שגיאה במחיקה');
    }
  };

  const save = async () => {
    if (!draft) return;
    if (!draft.name.trim()) { setError('שם המוצר חובה'); return; }
    if (draft.price <= 0)   { setError('מחיר חייב להיות גדול מ-0'); return; }

    setSaving(true);
    setError(null);
    try {
      const path = isNew ? '/api/admin/products' : `/api/admin/products/${draft.id}`;
      const res = await adminFetch(path, {
        method: isNew ? 'POST' : 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(draft),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }
      const saved: Product = await res.json();
      if (isNew) {
        setProducts(prev => [saved, ...prev]);
      } else {
        setProducts(prev => prev.map(p => p.id === saved.id ? saved : p));
      }
      setSavedId(saved.id);
      setTimeout(() => setSavedId(null), 2500);
      closeModal();
    } catch (e: any) {
      setError(e.message ?? 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminLayout>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, direction: 'rtl' }}>
        <h1 style={{ margin: 0 }}>{strings.adminProductsTitle}</h1>
        <button
          onClick={openNew}
          style={{ padding: '10px 20px', backgroundColor: '#28a745', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 'bold', fontSize: '1rem' }}
        >
          + {strings.addProductButton}
        </button>
      </div>

      {loading ? (
        <p style={{ direction: 'rtl' }}>{strings.loading}</p>
      ) : (
        <>
          {/* Desktop table */}
          <div className="prod-table-wrap">
            <table style={{ width: '100%', borderCollapse: 'collapse', direction: 'rtl' }}>
              <thead>
                <tr style={{ backgroundColor: '#f9f9f9', borderBottom: '2px solid #eee' }}>
                  <th style={{ textAlign: 'right', padding: '12px 10px' }}>{strings.tableHeaderName}</th>
                  <th style={{ textAlign: 'right', padding: '12px 10px' }}>{strings.tableHeaderCategory}</th>
                  <th style={{ textAlign: 'right', padding: '12px 10px' }}>{strings.tableHeaderPrice}</th>
                  <th style={{ textAlign: 'center', padding: '12px 10px' }}>מלאי</th>
                  <th style={{ textAlign: 'center', padding: '12px 10px' }}>{strings.tableHeaderActive}</th>
                  <th style={{ padding: '12px 10px' }}></th>
                </tr>
              </thead>
              <tbody>
                {products.map(product => (
                  <tr key={product.id} onClick={() => openEdit(product)}
                    style={{ borderBottom: '1px solid #eee', backgroundColor: product.active ? '#d4edda' : '#f8d7da', cursor: 'pointer' }}>
                    <td style={{ padding: '10px 10px' }}>
                      {product.name}
                      {savedId === product.id && <span style={{ marginRight: 8, color: '#28a745', fontSize: '0.85rem' }}>{strings.savedMessage}</span>}
                    </td>
                    <td style={{ padding: '10px 10px' }}>{getCategoryName(product.category)}</td>
                    <td style={{ padding: '10px 10px' }}>{product.price} ₪</td>
                    <td style={{ textAlign: 'center', padding: '10px 10px' }}>
                      {product.stock == null ? <span style={{ color: '#aaa' }}>—</span>
                        : product.stock === 0 ? <span style={{ color: '#dc3545', fontWeight: 700 }}>אזל</span>
                        : <span style={{ fontWeight: 600 }}>{product.stock}</span>}
                    </td>
                    <td style={{ textAlign: 'center', padding: '10px 10px' }}>{product.active ? '✓' : '✗'}</td>
                    <td style={{ padding: '10px 10px', textAlign: 'center' }}>
                      <button onClick={e => handleDelete(product.id, e)}
                        style={{ padding: '4px 12px', backgroundColor: '#dc3545', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: '0.82rem' }}>
                        מחק
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="prod-cards-wrap">
            {products.map(product => (
              <div key={product.id} onClick={() => openEdit(product)} style={{
                background: product.active ? '#f0faf2' : '#fff5f5',
                borderRadius: 14, padding: '12px 14px', marginBottom: 10,
                boxShadow: '0 2px 6px rgba(0,0,0,0.06)', cursor: 'pointer', direction: 'rtl',
                borderRight: `4px solid ${product.active ? '#22c55e' : '#ef4444'}`,
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 15 }}>
                      {product.name}
                      {savedId === product.id && <span style={{ marginRight: 8, color: '#28a745', fontSize: 12 }}>{strings.savedMessage}</span>}
                    </div>
                    <div style={{ fontSize: 12, color: '#777', marginTop: 3 }}>
                      {getCategoryName(product.category)}
                      {product.stock != null && <span style={{ marginRight: 8, color: product.stock === 0 ? '#dc3545' : '#555' }}>
                        · מלאי: {product.stock === 0 ? 'אזל' : product.stock}
                      </span>}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0, marginRight: 8 }}>
                    <span style={{ fontWeight: 800, fontSize: 16 }}>{product.price} ₪</span>
                    <button onClick={e => handleDelete(product.id, e)}
                      style={{ padding: '4px 10px', backgroundColor: '#dc3545', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 12 }}>
                      מחק
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <style>{`
            .prod-table-wrap { background: #fff; border-radius: 16px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.06); }
            .prod-cards-wrap { display: none; }
            @media (max-width: 640px) {
              .prod-table-wrap { display: none; }
              .prod-cards-wrap { display: block; }
            }
          `}</style>
        </>
      )}

      {draft && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16 }}>
          <div style={{ backgroundColor: '#fff', borderRadius: 16, width: '100%', maxWidth: 620, maxHeight: '92vh', display: 'flex', flexDirection: 'column', direction: 'rtl', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>

            {/* Header */}
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #f0f0f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
              <div>
                <h2 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700, color: '#1e1e2e' }}>
                  {isNew ? '+ ' + strings.addProductTitle : '✏️ ' + strings.editProductTitle}
                </h2>
                {!isNew && draft.name && <p style={{ margin: '2px 0 0', fontSize: '0.82rem', color: '#888' }}>{draft.name}</p>}
              </div>
              <button onClick={closeModal} style={{ background: '#f4f4f4', border: 'none', borderRadius: 8, width: 34, height: 34, cursor: 'pointer', fontSize: '1.1rem', color: '#555', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
            </div>

            {/* Scrollable body */}
            <div style={{ overflowY: 'auto', padding: '24px', flex: 1 }}>

              {/* Section: Basic info */}
              <SectionTitle>פרטים בסיסיים</SectionTitle>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
                <div style={{ gridColumn: '1 / -1' }}>
                  <Field label={strings.tableHeaderName}>
                    <input value={draft.name} onChange={e => handleChange('name', e.target.value)} style={inputStyle} autoFocus />
                  </Field>
                </div>
                <Field label={`${strings.tableHeaderPrice} (₪)`}>
                  <input type="number" value={draft.price || ''} onChange={e => handleChange('price', Number(e.target.value))} style={inputStyle} min={0} />
                </Field>
                <Field label="מלאי (יחידות)">
                  <input type="number" value={draft.stock ?? ''} onChange={e => handleChange('stock', e.target.value === '' ? undefined as any : Number(e.target.value))} style={inputStyle} min={0} placeholder="ריק = ללא מעקב" />
                </Field>
                <Field label={strings.tableHeaderCategory}>
                  <select value={draft.category} onChange={e => handleChange('category', e.target.value)} style={inputStyle}>
                    {categories.map(cat => <option key={cat.key} value={cat.key}>{cat.name}</option>)}
                  </select>
                </Field>
                <Field label="תגית">
                  <select value={draft.badge ?? ''} onChange={e => handleChange('badge', e.target.value)} style={inputStyle}>
                    <option value="">ללא תגית</option>
                    <option value="new">חדש 🔵</option>
                    <option value="sale">מבצע 🔴</option>
                  </select>
                </Field>
              </div>

              <Field label={strings.productDescription}>
                <textarea value={draft.description} onChange={e => handleChange('description', e.target.value)} style={{ ...inputStyle, minHeight: 72, resize: 'vertical' }} />
              </Field>

              {/* Active toggle */}
              <div style={{ marginBottom: 20, padding: '12px 16px', background: '#f8f8f8', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{strings.tableHeaderActive}</span>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                  <input type="checkbox" checked={draft.active} onChange={e => handleChange('active', e.target.checked)} style={{ width: 18, height: 18, cursor: 'pointer' }} />
                  <span style={{ fontSize: '0.85rem', color: draft.active ? '#22c55e' : '#ef4444', fontWeight: 600 }}>{draft.active ? 'פעיל' : 'לא פעיל'}</span>
                </label>
              </div>

              {/* Section: Image */}
              <SectionTitle>תמונה</SectionTitle>
              <Field label="">
                <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 8 }}>
                  <input type="text" value={draft.imageFile || ''} onChange={e => handleChange('imageFile', e.target.value)} placeholder="URL תמונה" style={{ ...inputStyle, flex: 1 }} />
                  <label style={{ padding: '9px 16px', backgroundColor: uploadingImage ? '#aaa' : '#1e1e2e', color: '#fff', borderRadius: 8, cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0, fontSize: '0.88rem', fontWeight: 600 }}>
                    {uploadingImage ? '...' : '⬆ העלה'}
                    <input type="file" accept="image/*" style={{ display: 'none' }} disabled={uploadingImage} onChange={e => e.target.files?.[0] && handleImageUpload(e.target.files[0])} />
                  </label>
                </div>
                {draft.imageFile && (
                  <img src={draft.imageFile} alt="" style={{ maxHeight: 110, borderRadius: 8, objectFit: 'contain', border: '1px solid #eee' }} />
                )}
              </Field>

              {/* Section: Product specs */}
              <SectionTitle>מפרט מוצר</SectionTitle>

              <Field label="⚖️ משקל תכולה">
                <input value={draft.weight ?? ''} onChange={e => setDraft(p => p ? { ...p, weight: e.target.value } : p)}
                  placeholder='למשל: 12 ק"ג' style={inputStyle} />
              </Field>

              <Field label="🧬 מרכיבים">
                <textarea value={draft.ingredients ?? ''} onChange={e => setDraft(p => p ? { ...p, ingredients: e.target.value } : p)}
                  placeholder="קמח עוף, תירס, חיטה..." style={{ ...inputStyle, minHeight: 72, resize: 'vertical' }} />
              </Field>

              <Field label="% תכולה תזונתית">
                {(draft.nutritionalValues ?? []).length > 0 && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 100px 36px', gap: 6, marginBottom: 4 }}>
                    <span style={{ fontSize: '0.78rem', color: '#888', paddingRight: 2 }}>שם</span>
                    <span style={{ fontSize: '0.78rem', color: '#888' }}>ערך</span>
                    <span />
                  </div>
                )}
                {(draft.nutritionalValues ?? []).map((row, i) => (
                  <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 100px 36px', gap: 6, marginBottom: 6 }}>
                    <input value={row.name} onChange={e => { const nv = [...(draft.nutritionalValues ?? [])]; nv[i] = { ...nv[i], name: e.target.value }; setDraft(p => p ? { ...p, nutritionalValues: nv } : p); }} placeholder="חלבון" style={inputStyle} />
                    <input value={row.value} onChange={e => { const nv = [...(draft.nutritionalValues ?? [])]; nv[i] = { ...nv[i], value: e.target.value }; setDraft(p => p ? { ...p, nutritionalValues: nv } : p); }} placeholder="22%" style={inputStyle} />
                    <button onClick={() => setDraft(p => p ? { ...p, nutritionalValues: (p.nutritionalValues ?? []).filter((_, j) => j !== i) } : p)}
                      style={{ background: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 700 }}>✕</button>
                  </div>
                ))}
                <button onClick={() => setDraft(p => p ? { ...p, nutritionalValues: [...(p.nutritionalValues ?? []), { name: '', value: '' }] } : p)}
                  style={addRowBtn}>+ הוסף שורה</button>
              </Field>

              <Field label="📏 טבלת האכלה">
                {(draft.feedingTable ?? []).length > 0 && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 36px', gap: 6, marginBottom: 4 }}>
                    <span style={{ fontSize: '0.78rem', color: '#888' }}>משקל חיית מחמד</span>
                    <span style={{ fontSize: '0.78rem', color: '#888' }}>כמות מומלצת</span>
                    <span />
                  </div>
                )}
                {(draft.feedingTable ?? []).map((row, i) => (
                  <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 36px', gap: 6, marginBottom: 6 }}>
                    <input value={row.petWeight} onChange={e => { const ft = [...(draft.feedingTable ?? [])]; ft[i] = { ...ft[i], petWeight: e.target.value }; setDraft(p => p ? { ...p, feedingTable: ft } : p); }} placeholder='10 ק"ג' style={inputStyle} />
                    <input value={row.amount} onChange={e => { const ft = [...(draft.feedingTable ?? [])]; ft[i] = { ...ft[i], amount: e.target.value }; setDraft(p => p ? { ...p, feedingTable: ft } : p); }} placeholder="160-190 גרם" style={inputStyle} />
                    <button onClick={() => setDraft(p => p ? { ...p, feedingTable: (p.feedingTable ?? []).filter((_, j) => j !== i) } : p)}
                      style={{ background: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 700 }}>✕</button>
                  </div>
                ))}
                <button onClick={() => setDraft(p => p ? { ...p, feedingTable: [...(p.feedingTable ?? []), { petWeight: '', amount: '' }] } : p)}
                  style={addRowBtn}>+ הוסף שורה</button>
              </Field>

              <Field label="הערה לטבלת האכלה">
                <textarea value={draft.feedingNote ?? ''} onChange={e => setDraft(p => p ? { ...p, feedingNote: e.target.value } : p)}
                  placeholder="כמויות האכלה המצוינות הינן כלליות בלבד..." style={{ ...inputStyle, minHeight: 60, resize: 'vertical' }} />
              </Field>

            </div>

            {/* Footer */}
            <div style={{ padding: '16px 24px', borderTop: '1px solid #f0f0f0', flexShrink: 0, display: 'flex', gap: 10, justifyContent: 'space-between', alignItems: 'center' }}>
              {error && (
                <div style={{ flex: 1, padding: '8px 12px', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, color: '#dc2626', fontSize: '0.85rem' }}>
                  {error}
                </div>
              )}
              <div style={{ display: 'flex', gap: 10, marginRight: 'auto' }}>
                <button onClick={closeModal} style={{ padding: '10px 20px', cursor: 'pointer', borderRadius: 8, border: '1.5px solid #e0e0e0', background: '#fff', fontWeight: 600, fontSize: '0.9rem', fontFamily: 'inherit', color: '#555' }}>
                  {strings.cancelButton}
                </button>
                <button onClick={save} disabled={saving || uploadingImage} style={{ padding: '10px 28px', backgroundColor: saving ? '#aaa' : '#1e1e2e', color: '#fff', border: 'none', borderRadius: 8, cursor: saving ? 'default' : 'pointer', fontWeight: 700, fontSize: '0.9rem', fontFamily: 'inherit' }}>
                  {saving ? '...' : strings.saveButton}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
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
  transition: 'border-color 0.15s',
  background: '#fafafa',
};

const addRowBtn: React.CSSProperties = {
  padding: '6px 14px',
  background: '#f0f0f8',
  border: '1.5px dashed #c0c0e0',
  borderRadius: 8,
  cursor: 'pointer',
  fontSize: '0.83rem',
  color: '#555',
  fontFamily: 'inherit',
  marginTop: 2,
};

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 14 }}>
      {label && <label style={{ display: 'block', marginBottom: 5, fontWeight: 600, fontSize: '0.83rem', color: '#555', textTransform: 'uppercase', letterSpacing: '0.03em' }}>{label}</label>}
      {children}
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '20px 0 14px' }}>
      <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#1e1e2e', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{children}</span>
      <div style={{ flex: 1, height: 1, background: '#e8e8ee' }} />
    </div>
  );
}
