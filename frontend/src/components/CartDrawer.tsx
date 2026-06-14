import { useState } from 'react';
import { useCart } from '../context/CartContext';

const API = import.meta.env.VITE_API_BASE_URL || '';

export default function CartDrawer({ onClose }: { onClose: () => void }) {
  const { items, remove, updateQty, clear, total } = useCart();
  const [checkout, setCheckout] = useState(false);
  const [form, setForm] = useState({ customer: '', address: '', email: '' });
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleOrder = async () => {
    if (!form.customer.trim()) { setError('שם חובה'); return; }
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`${API}/api/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer: form.customer,
          address: form.address,
          email: form.email,
          items: items.map(i => ({ id: i.id, quantity: i.quantity })),
          total,
        }),
      });
      if (!res.ok) throw new Error('שגיאה בשליחת הזמנה');
      clear();
      setDone(true);
    } catch (e: any) {
      setError(e.message ?? 'שגיאה');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      {/* backdrop */}
      <div
        onClick={onClose}
        style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.45)', zIndex: 1000 }}
      />

      {/* drawer — slides in from the RIGHT (RTL) */}
      <div style={{
        position: 'fixed', top: 0, right: 0, bottom: 0, width: 380, maxWidth: '100vw',
        backgroundColor: '#fff', zIndex: 1001, display: 'flex', flexDirection: 'column',
        boxShadow: '-4px 0 32px rgba(0,0,0,0.18)', direction: 'rtl',
      }}>
        {/* header */}
        <div style={{ padding: '18px 20px', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700 }}>סל קניות</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#888', lineHeight: 1 }}>✕</button>
        </div>

        {/* body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>
          {done ? (
            <div style={{ textAlign: 'center', paddingTop: 60 }}>
              <div style={{ fontSize: 56, marginBottom: 16 }}>✅</div>
              <h3 style={{ margin: '0 0 8px' }}>ההזמנה התקבלה!</h3>
              <p style={{ color: '#666', marginBottom: 24 }}>תודה, ניצור קשר בקרוב.</p>
              <button onClick={onClose} style={{ padding: '10px 28px', backgroundColor: '#28a745', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 'bold', fontSize: '1rem' }}>
                סגור
              </button>
            </div>
          ) : checkout ? (
            <div>
              <button onClick={() => setCheckout(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#c15f2a', marginBottom: 20, padding: 0, fontWeight: 600, fontSize: '0.95rem' }}>
                ← חזור לסל
              </button>
              <h3 style={{ marginTop: 0, marginBottom: 20 }}>פרטי הזמנה</h3>
              {[
                { label: 'שם *', key: 'customer', placeholder: 'ישראל ישראלי', type: 'text' },
                { label: 'כתובת', key: 'address', placeholder: 'רחוב הרצל 1, תל אביב', type: 'text' },
                { label: 'אימייל', key: 'email', placeholder: 'email@example.com', type: 'email' },
              ].map(f => (
                <div key={f.key} style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', marginBottom: 5, fontWeight: 600, fontSize: '0.9rem' }}>{f.label}</label>
                  <input
                    type={f.type}
                    value={form[f.key as keyof typeof form]}
                    onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                    placeholder={f.placeholder}
                    style={{ width: '100%', padding: '9px 12px', border: '1px solid #ddd', borderRadius: 6, fontSize: '1rem', boxSizing: 'border-box', outline: 'none' }}
                  />
                </div>
              ))}
              {error && (
                <div style={{ color: '#721c24', backgroundColor: '#fff3f3', border: '1px solid #f5c6cb', borderRadius: 6, padding: '10px 12px', marginBottom: 12, fontSize: '0.9rem' }}>
                  {error}
                </div>
              )}
            </div>
          ) : items.length === 0 ? (
            <div style={{ textAlign: 'center', paddingTop: 60, color: '#aaa' }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>🛒</div>
              <p style={{ margin: 0 }}>הסל ריק</p>
            </div>
          ) : (
            <div>
              {items.map(item => (
                <div key={item.id} style={{ display: 'flex', gap: 12, alignItems: 'center', borderBottom: '1px solid #f0f0f0', paddingBottom: 16, marginBottom: 16 }}>
                  <div style={{ width: 56, height: 56, borderRadius: 10, overflow: 'hidden', flexShrink: 0, backgroundColor: '#f4f0e2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {item.imageFile
                      ? <img src={item.imageFile} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      : <span style={{ fontSize: 24 }}>🐾</span>
                    }
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, marginBottom: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.name}</div>
                    <div style={{ color: '#888', fontSize: '0.85rem' }}>{item.price} ₪ ליחידה</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <button onClick={() => updateQty(item.id, item.quantity - 1)} style={qtyBtn}>−</button>
                    <span style={{ minWidth: 22, textAlign: 'center', fontWeight: 600 }}>{item.quantity}</span>
                    <button onClick={() => updateQty(item.id, item.quantity + 1)} style={qtyBtn}>+</button>
                  </div>
                  <button onClick={() => remove(item.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ccc', fontSize: 18, padding: 4, flexShrink: 0 }}>✕</button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* footer */}
        {!done && items.length > 0 && (
          <div style={{ padding: '16px 20px', borderTop: '1px solid #eee' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: '1.1rem', marginBottom: 14 }}>
              <span>סה״כ</span>
              <span>{total} ₪</span>
            </div>
            {checkout ? (
              <button
                onClick={handleOrder}
                disabled={submitting}
                style={{ width: '100%', padding: 13, backgroundColor: submitting ? '#aaa' : '#28a745', color: '#fff', border: 'none', borderRadius: 8, cursor: submitting ? 'default' : 'pointer', fontWeight: 'bold', fontSize: '1rem' }}
              >
                {submitting ? '...' : 'שלח הזמנה ✓'}
              </button>
            ) : (
              <button
                onClick={() => setCheckout(true)}
                style={{ width: '100%', padding: 13, backgroundColor: '#c15f2a', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 'bold', fontSize: '1rem' }}
              >
                לתשלום →
              </button>
            )}
          </div>
        )}
      </div>
    </>
  );
}

const qtyBtn: React.CSSProperties = {
  width: 28, height: 28, borderRadius: '50%', border: '1px solid #ddd',
  background: '#f5f5f5', cursor: 'pointer', fontWeight: 'bold', fontSize: 16,
  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
};
