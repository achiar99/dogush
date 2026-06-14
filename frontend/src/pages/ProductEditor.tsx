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
}

type DraftProduct = Omit<Product, 'id'> & { id?: string };

const API = import.meta.env.VITE_API_BASE_URL || '';

function getToken() {
  return localStorage.getItem('adminToken') || '';
}

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
    const headers = { Authorization: `Bearer ${getToken()}` };
    Promise.all([
      fetch(`${API}/api/admin/products`, { headers }).then(r => r.json()),
      fetch(`${API}/api/admin/categories`, { headers }).then(r => r.json()),
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
      const urlRes = await fetch(`${API}/api/admin/upload-url`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
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
      await fetch(`${API}/api/admin/products/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${getToken()}` },
      });
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
      const url  = isNew ? `${API}/api/admin/products` : `${API}/api/admin/products/${draft.id}`;
      const method = isNew ? 'POST' : 'PUT';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
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
        <table style={{ width: '100%', borderCollapse: 'collapse', direction: 'rtl' }}>
          <thead>
            <tr style={{ backgroundColor: '#f9f9f9', borderBottom: '2px solid #eee' }}>
              <th style={{ textAlign: 'right', padding: 12 }}>{strings.tableHeaderName}</th>
              <th style={{ textAlign: 'right', padding: 12 }}>{strings.tableHeaderCategory}</th>
              <th style={{ textAlign: 'right', padding: 12 }}>{strings.tableHeaderPrice}</th>
              <th style={{ textAlign: 'center', padding: 12 }}>מלאי</th>
              <th style={{ textAlign: 'center', padding: 12 }}>{strings.tableHeaderActive}</th>
              <th style={{ padding: 12 }}></th>
            </tr>
          </thead>
          <tbody>
            {products.map(product => (
              <tr key={product.id} onClick={() => openEdit(product)}
                style={{
                  borderBottom: '1px solid #eee',
                  backgroundColor: product.active ? '#d4edda' : '#f8d7da',
                  cursor: 'pointer',
                }}>
                <td style={{ padding: 12 }}>
                  {product.name}
                  {savedId === product.id && (
                    <span style={{ marginRight: 8, color: '#28a745', fontSize: '0.85rem' }}>{strings.savedMessage}</span>
                  )}
                </td>
                <td style={{ padding: 12 }}>{getCategoryName(product.category)}</td>
                <td style={{ padding: 12 }}>{product.price} ₪</td>
                <td style={{ textAlign: 'center', padding: 12 }}>
                  {product.stock === undefined || product.stock === null
                    ? <span style={{ color: '#aaa' }}>—</span>
                    : product.stock === 0
                      ? <span style={{ color: '#dc3545', fontWeight: 700 }}>אזל</span>
                      : <span style={{ fontWeight: 600 }}>{product.stock}</span>
                  }
                </td>
                <td style={{ textAlign: 'center', padding: 12 }}>{product.active ? '✓' : '✗'}</td>
                <td style={{ padding: 12, textAlign: 'center' }}>
                  <button
                    onClick={e => handleDelete(product.id, e)}
                    style={{ padding: '4px 14px', backgroundColor: '#dc3545', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: '0.85rem' }}
                  >
                    מחק
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {draft && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: '#fff', padding: 24, borderRadius: 8, width: 500, maxHeight: '90vh', overflowY: 'auto', direction: 'rtl' }}>
            <h2 style={{ margin: '0 0 20px' }}>
              {isNew ? strings.addProductTitle : strings.editProductTitle}
            </h2>

            <Field label={strings.tableHeaderName}>
              <input
                value={draft.name}
                onChange={e => handleChange('name', e.target.value)}
                style={inputStyle}
                autoFocus
              />
            </Field>

            <Field label={strings.productDescription}>
              <textarea
                value={draft.description}
                onChange={e => handleChange('description', e.target.value)}
                style={{ ...inputStyle, minHeight: 80 }}
              />
            </Field>

            <Field label={strings.tableHeaderPrice}>
              <input
                type="number"
                value={draft.price || ''}
                onChange={e => handleChange('price', Number(e.target.value))}
                style={inputStyle}
                min={0}
              />
            </Field>

            <Field label="מלאי (יחידות)">
              <input
                type="number"
                value={draft.stock ?? ''}
                onChange={e => handleChange('stock', e.target.value === '' ? undefined as any : Number(e.target.value))}
                style={inputStyle}
                min={0}
                placeholder="ריק = ללא מעקב מלאי"
              />
            </Field>

            <Field label={strings.tableHeaderCategory}>
              <select
                value={draft.category}
                onChange={e => handleChange('category', e.target.value)}
                style={inputStyle}
              >
                {categories.map(cat => (
                  <option key={cat.key} value={cat.key}>{cat.name}</option>
                ))}
              </select>
            </Field>

            <Field label={strings.productImage}>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <input
                  type="text"
                  value={draft.imageFile || ''}
                  onChange={e => handleChange('imageFile', e.target.value)}
                  placeholder="URL או העלה קובץ"
                  style={{ ...inputStyle, flex: 1 }}
                />
                <label style={{ padding: '8px 14px', backgroundColor: uploadingImage ? '#aaa' : '#007bff', color: '#fff', borderRadius: 4, cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0 }}>
                  {uploadingImage ? '...' : 'העלה'}
                  <input
                    type="file"
                    accept="image/*"
                    style={{ display: 'none' }}
                    disabled={uploadingImage}
                    onChange={e => e.target.files?.[0] && handleImageUpload(e.target.files[0])}
                  />
                </label>
              </div>
              {draft.imageFile?.startsWith('http') && (
                <img src={draft.imageFile} alt="" style={{ marginTop: 8, maxHeight: 100, borderRadius: 4, objectFit: 'contain' }} />
              )}
            </Field>

            <Field label="">
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={draft.active}
                  onChange={e => handleChange('active', e.target.checked)}
                  style={{ width: 18, height: 18 }}
                />
                {strings.tableHeaderActive}
              </label>
            </Field>

            <Field label="תגית">
              <select value={draft.badge ?? ''} onChange={e => handleChange('badge', e.target.value)} style={inputStyle}>
                <option value="">ללא תגית</option>
                <option value="new">חדש 🔵</option>
                <option value="sale">מבצע 🔴</option>
              </select>
            </Field>

            {error && (
              <div style={{ marginBottom: 12, padding: 10, backgroundColor: '#fff3f3', border: '1px solid #f5c6cb', borderRadius: 4, color: '#721c24', fontSize: '0.9rem' }}>
                {error}
              </div>
            )}

            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 8 }}>
              <button onClick={closeModal} style={{ padding: '10px 20px', cursor: 'pointer', borderRadius: 4, border: '1px solid #ccc' }}>
                {strings.cancelButton}
              </button>
              <button
                onClick={save}
                disabled={saving || uploadingImage}
                style={{ padding: '10px 24px', backgroundColor: saving ? '#aaa' : '#28a745', color: '#fff', border: 'none', borderRadius: 4, cursor: saving ? 'default' : 'pointer', fontWeight: 'bold' }}
              >
                {saving ? '...' : strings.saveButton}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: 8,
  boxSizing: 'border-box',
  border: '1px solid #ccc',
  borderRadius: 4,
  fontSize: '1rem',
};

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 16 }}>
      {label && <label style={{ display: 'block', marginBottom: 4, fontWeight: 500 }}>{label}</label>}
      {children}
    </div>
  );
}
