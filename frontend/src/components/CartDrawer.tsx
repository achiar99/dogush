import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';

const qtyBtn: React.CSSProperties = {
  width: 28, height: 28, borderRadius: '50%', border: '1px solid #ddd',
  background: '#f5f5f5', cursor: 'pointer', fontWeight: 'bold', fontSize: 16,
  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
};

export default function CartDrawer({ onClose }: { onClose: () => void }) {
  const navigate = useNavigate();
  const { items, remove, updateQty, total } = useCart();

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.45)', zIndex: 1000 }} />

      <div style={{
        position: 'fixed', top: 0, right: 0, bottom: 0, width: 380, maxWidth: '100vw',
        backgroundColor: '#fff', zIndex: 1001, display: 'flex', flexDirection: 'column',
        boxShadow: '-4px 0 32px rgba(0,0,0,0.18)', direction: 'rtl',
      }}>
        <div style={{ padding: '18px 20px', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700 }}>סל קניות</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#888', lineHeight: 1 }}>✕</button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>
          {items.length === 0 ? (
            <div style={{ textAlign: 'center', paddingTop: 60, color: '#aaa' }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>🛒</div>
              <p style={{ margin: 0 }}>הסל ריק</p>
            </div>
          ) : (
            items.map(item => (
              <div key={item.id} style={{ display: 'flex', gap: 12, alignItems: 'center', borderBottom: '1px solid #f0f0f0', paddingBottom: 16, marginBottom: 16 }}>
                <div style={{ width: 56, height: 56, borderRadius: 10, overflow: 'hidden', flexShrink: 0, backgroundColor: '#f4f0e2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {item.imageFile
                    ? <img src={item.imageFile} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : <span style={{ fontSize: 24 }}>🐾</span>}
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
            ))
          )}
        </div>

        {items.length > 0 && (
          <div style={{ padding: '16px 20px', borderTop: '1px solid #eee' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: '1.1rem', marginBottom: 14 }}>
              <span>סה״כ</span>
              <span>{total} ₪</span>
            </div>
            <button
              onClick={() => { onClose(); navigate('/checkout'); }}
              style={{ width: '100%', padding: 13, backgroundColor: '#c15f2a', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 'bold', fontSize: '1rem', fontFamily: 'inherit' }}
            >
              לתשלום →
            </button>
          </div>
        )}
      </div>
    </>
  );
}
