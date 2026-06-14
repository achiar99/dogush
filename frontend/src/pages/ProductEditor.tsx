import { useEffect, useState } from 'react';
import AdminLayout from '../components/AdminLayout';
import heConfig from '../../../shared/he.json';

const { strings, categories } = heConfig as unknown as {
  strings: {
    adminProductsTitle: string;
    saveButton: string;
    savedMessage: string;
    tableHeaderName: string;
    tableHeaderCategory: string;
    tableHeaderPrice: string;
    tableHeaderActive: string;
    editProductTitle: string;
    productDescription: string;
    productImage: string;
    cancelButton: string;
    loading: string;
  };
  categories: Array<{ key: string; name: string }>;
};

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  active: boolean;
  imageFile?: string;
}

const API = import.meta.env.VITE_API_BASE_URL || '';

function getToken() {
  return localStorage.getItem('adminToken') || '';
}

export default function FoodEditor() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Product | null>(null);
  const [saving, setSaving] = useState(false);
  const [savedId, setSavedId] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  useEffect(() => {
    fetch(`${API}/api/admin/products`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    })
      .then(r => r.json())
      .then(data => setProducts(Array.isArray(data) ? data : []))
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }, []);

  const getCategoryName = (key: string) => categories.find(c => c.key === key)?.name ?? key;

  const handleChange = (field: keyof Product, value: string | boolean | number) => {
    if (!selected) return;
    setSelected({ ...selected, [field]: value });
  };

  const handleImageUpload = async (file: File) => {
    if (!selected) return;
    setUploadingImage(true);
    try {
      const urlRes = await fetch(`${API}/api/admin/upload-url`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({ filename: file.name, contentType: file.type }),
      });
      const { uploadUrl, imageUrl } = await urlRes.json();
      await fetch(uploadUrl, { method: 'PUT', body: file, headers: { 'Content-Type': file.type } });
      setSelected({ ...selected, imageFile: imageUrl });
    } finally {
      setUploadingImage(false);
    }
  };

  const saveChanges = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      const res = await fetch(`${API}/api/admin/products/${selected.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify(selected),
      });
      if (res.ok) {
        const updated = await res.json();
        setProducts(prev => prev.map(p => p.id === updated.id ? updated : p));
        setSavedId(updated.id);
        setTimeout(() => setSavedId(null), 2000);
        setSelected(null);
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminLayout>
      <h1>{strings.adminProductsTitle}</h1>

      {loading ? (
        <p>{strings.loading}</p>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse', direction: 'rtl' }}>
          <thead>
            <tr style={{ backgroundColor: '#f9f9f9', borderBottom: '2px solid #eee' }}>
              <th style={{ textAlign: 'right', padding: 12 }}>{strings.tableHeaderName}</th>
              <th style={{ textAlign: 'right', padding: 12 }}>{strings.tableHeaderCategory}</th>
              <th style={{ textAlign: 'right', padding: 12 }}>{strings.tableHeaderPrice}</th>
              <th style={{ textAlign: 'center', padding: 12 }}>{strings.tableHeaderActive}</th>
            </tr>
          </thead>
          <tbody>
            {products.map(product => (
              <tr key={product.id} onClick={() => setSelected({ ...product })}
                style={{
                  borderBottom: '1px solid #eee',
                  backgroundColor: product.active ? '#d4edda' : '#f8d7da',
                  cursor: 'pointer',
                  position: 'relative',
                }}>
                <td style={{ padding: 12 }}>
                  {product.name}
                  {savedId === product.id && (
                    <span style={{ marginRight: 8, color: '#28a745', fontSize: '0.85rem' }}>
                      {strings.savedMessage}
                    </span>
                  )}
                </td>
                <td style={{ padding: 12 }}>{getCategoryName(product.category)}</td>
                <td style={{ padding: 12 }}>{product.price} ₪</td>
                <td style={{ textAlign: 'center', padding: 12 }}>{product.active ? '✓' : '✗'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {selected && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: '#fff', padding: 24, borderRadius: 8, width: 500, maxHeight: '80vh', overflowY: 'auto' }}>
            <h2 style={{ margin: '0 0 16px' }}>{strings.editProductTitle}</h2>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', marginBottom: 4 }}>{strings.tableHeaderName}</label>
              <input value={selected.name} onChange={e => handleChange('name', e.target.value)}
                style={{ width: '100%', padding: 8, boxSizing: 'border-box' }} />
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', marginBottom: 4 }}>{strings.productDescription}</label>
              <textarea value={selected.description} onChange={e => handleChange('description', e.target.value)}
                style={{ width: '100%', padding: 8, minHeight: 80, boxSizing: 'border-box' }} />
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', marginBottom: 4 }}>{strings.tableHeaderPrice}</label>
              <input type="number" value={selected.price} onChange={e => handleChange('price', Number(e.target.value))}
                style={{ width: '100%', padding: 8, boxSizing: 'border-box' }} />
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', marginBottom: 4 }}>{strings.tableHeaderCategory}</label>
              <select value={selected.category} onChange={e => handleChange('category', e.target.value)}
                style={{ width: '100%', padding: 8 }}>
                {categories.map(cat => (
                  <option key={cat.key} value={cat.key}>{cat.name}</option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', marginBottom: 4 }}>{strings.productImage}</label>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <input type="text" value={selected.imageFile || ''} onChange={e => handleChange('imageFile', e.target.value)}
                  placeholder="image.png or S3 URL" style={{ flex: 1, padding: 8 }} />
                <label style={{ padding: '8px 12px', backgroundColor: '#007bff', color: '#fff', borderRadius: 4, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                  {uploadingImage ? '...' : 'העלה'}
                  <input type="file" accept="image/*" style={{ display: 'none' }}
                    onChange={e => e.target.files?.[0] && handleImageUpload(e.target.files[0])} />
                </label>
              </div>
              {selected.imageFile?.startsWith('http') && (
                <img src={selected.imageFile} alt="" style={{ marginTop: 8, maxHeight: 80, borderRadius: 4 }} />
              )}
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                <input type="checkbox" checked={selected.active} onChange={e => handleChange('active', e.target.checked)}
                  style={{ width: 18, height: 18 }} />
                {strings.tableHeaderActive}
              </label>
            </div>

            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button onClick={() => setSelected(null)} style={{ padding: '10px 20px', cursor: 'pointer' }}>
                {strings.cancelButton}
              </button>
              <button onClick={saveChanges} disabled={saving || uploadingImage}
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
