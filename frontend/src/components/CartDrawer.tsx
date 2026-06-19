import { useState } from 'react';
import { useCart } from '../context/CartContext';
import { useUser } from '../context/UserContext';

const API = import.meta.env.VITE_API_BASE_URL || '';

type Step = 'cart' | 'auth' | 'authForm' | 'details';

export default function CartDrawer({ onClose, initialCheckout }: { onClose: () => void; initialCheckout?: boolean }) {
  const { items, remove, updateQty, clear, total } = useCart();
  const { user, token, login } = useUser();
  const [step, setStep] = useState<Step>(
    initialCheckout ? (user ? 'details' : 'auth') : 'cart'
  );
  const [form, setForm] = useState({
    customer: user?.name || '',
    address: user?.address || '',
    email: user?.email || '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Auth form state
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [authForm, setAuthForm] = useState({ email: '', password: '', name: '', phone: '', address: '' });
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const goToCheckout = () => {
    if (user) {
      setForm({ customer: user.name || '', address: user.address || '', email: user.email || '' });
      setStep('details');
    } else {
      setStep('auth');
    }
  };

  const continueAsGuest = () => {
    setForm({ customer: '', address: '', email: '' });
    setStep('details');
  };

  const handleAuth = async () => {
    setAuthError(null);
    if (!authForm.email || !authForm.password) { setAuthError('יש למלא אימייל וסיסמה'); return; }
    if (authMode === 'register' && !authForm.name) { setAuthError('יש למלא שם'); return; }
    if (authMode === 'register' && !authForm.phone) { setAuthError('יש למלא טלפון'); return; }
    setAuthLoading(true);
    try {
      const body = authMode === 'login'
        ? { email: authForm.email, password: authForm.password }
        : { email: authForm.email, password: authForm.password, name: authForm.name, phone: authForm.phone, address: authForm.address };
      const res = await fetch(`${API}/api/auth/${authMode}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) { setAuthError(data.error || 'שגיאה'); return; }
      login(data.token, data.user);
      setForm({ customer: data.user.name || '', address: data.user.address || '', email: data.user.email || '' });
      setStep('details');
    } catch { setAuthError('שגיאת חיבור'); }
    finally { setAuthLoading(false); }
  };


  const handleOrder = async () => {
    if (!form.customer.trim()) { setError('שם חובה'); return; }
    setSubmitting(true);
    setError(null);
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const res = await fetch(`${API}/api/orders`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          customer: form.customer,
          address: form.address,
          email: form.email,
          items: items.map(i => ({ id: i.id, quantity: i.quantity })),
          total,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        if (body.error === 'out_of_stock') throw new Error('מוצר אחד או יותר אזל מהמלאי. רענן את הדף ונסה שנית.');
        throw new Error('שגיאה בשליחת הזמנה');
      }
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

          ) : step === 'auth' ? (
            /* ── Auth choice screen ── */
            <div style={{ paddingTop: 20 }}>
              <button onClick={() => setStep('cart')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#c15f2a', marginBottom: 24, padding: 0, fontWeight: 600, fontSize: '0.95rem' }}>
                ← חזור לסל
              </button>
              <div style={{ textAlign: 'center', marginBottom: 32 }}>
                <div style={{ fontSize: 42, marginBottom: 10 }}>🔐</div>
                <h3 style={{ margin: '0 0 6px', fontSize: 18, fontWeight: 800 }}>כדי לבצע הזמנה</h3>
                <p style={{ margin: 0, color: '#888', fontSize: 14 }}>התחבר כדי לעקוב אחר ההזמנות שלך</p>
              </div>
              <button onClick={() => setStep('authForm')} style={{
                width: '100%', padding: 13, backgroundColor: '#1e1e2e', color: '#fff',
                border: 'none', borderRadius: 10, cursor: 'pointer', fontWeight: 700, fontSize: '1rem', marginBottom: 12,
              }}>
                התחברות / הרשמה
              </button>
              <button onClick={continueAsGuest} style={{
                width: '100%', padding: 13, backgroundColor: '#fff', color: '#555',
                border: '1.5px solid #ddd', borderRadius: 10, cursor: 'pointer', fontWeight: 600, fontSize: '1rem',
              }}>
                המשך כאורח
              </button>
            </div>

          ) : step === 'authForm' ? (
            /* ── Login / Register form ── */
            <div>
              <button onClick={() => setStep('auth')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#c15f2a', marginBottom: 20, padding: 0, fontWeight: 600, fontSize: '0.95rem' }}>
                ← חזרה
              </button>
              <div style={{ display: 'flex', marginBottom: 20, borderRadius: 10, overflow: 'hidden', border: '1.5px solid #eee' }}>
                {(['login', 'register'] as const).map(m => (
                  <button key={m} onClick={() => setAuthMode(m)} style={{
                    flex: 1, padding: '10px 0', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: '0.9rem', fontFamily: 'inherit',
                    background: authMode === m ? '#1e1e2e' : '#fff',
                    color: authMode === m ? '#fff' : '#888',
                  }}>
                    {m === 'login' ? 'התחברות' : 'הרשמה'}
                  </button>
                ))}
              </div>
              {authMode === 'register' && [
                { label: 'שם *', key: 'name', type: 'text', placeholder: 'ישראל ישראלי' },
                { label: 'טלפון *', key: 'phone', type: 'tel', placeholder: '050-0000000' },
                { label: 'כתובת', key: 'address', type: 'text', placeholder: 'רחוב הרצל 1' },
              ].map(f => (
                <div key={f.key} style={{ marginBottom: 14 }}>
                  <label style={{ display: 'block', marginBottom: 4, fontWeight: 600, fontSize: '0.88rem' }}>{f.label}</label>
                  <input type={f.type} value={authForm[f.key as keyof typeof authForm]} onChange={e => setAuthForm(p => ({ ...p, [f.key]: e.target.value }))}
                    placeholder={f.placeholder} style={inputStyle} />
                </div>
              ))}
              {[
                { label: 'אימייל *', key: 'email', type: 'email', placeholder: 'you@example.com' },
                { label: 'סיסמה *', key: 'password', type: 'password', placeholder: '••••••••' },
              ].map(f => (
                <div key={f.key} style={{ marginBottom: 14 }}>
                  <label style={{ display: 'block', marginBottom: 4, fontWeight: 600, fontSize: '0.88rem' }}>{f.label}</label>
                  <input type={f.type} value={authForm[f.key as keyof typeof authForm]} onChange={e => setAuthForm(p => ({ ...p, [f.key]: e.target.value }))}
                    placeholder={f.placeholder} style={inputStyle} />
                </div>
              ))}
              {authError && <div style={{ color: '#721c24', background: '#fff3f3', border: '1px solid #f5c6cb', borderRadius: 6, padding: '9px 12px', marginBottom: 12, fontSize: '0.88rem' }}>{authError}</div>}
              <button onClick={handleAuth} disabled={authLoading} style={{
                width: '100%', padding: 13, backgroundColor: authLoading ? '#aaa' : '#c15f2a', color: '#fff',
                border: 'none', borderRadius: 10, cursor: 'pointer', fontWeight: 700, fontSize: '1rem', marginTop: 4,
              }}>
                {authLoading ? '...' : authMode === 'login' ? 'התחבר →' : 'הרשמה →'}
              </button>
            </div>

          ) : step === 'details' ? (
            /* ── Order details form ── */
            <div>
              <button onClick={() => setStep(user ? 'cart' : 'auth')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#c15f2a', marginBottom: 20, padding: 0, fontWeight: 600, fontSize: '0.95rem' }}>
                ← חזור לסל
              </button>
              {user && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20, padding: '10px 14px', background: '#f0faf2', borderRadius: 10 }}>
                  <span style={{ fontSize: 20 }}>👤</span>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 14 }}>{user.name}</div>
                    <div style={{ fontSize: 12, color: '#888' }}>{user.email}</div>
                  </div>
                </div>
              )}
              <h3 style={{ marginTop: 0, marginBottom: 20 }}>פרטי הזמנה</h3>
              {[
                { label: 'שם *', key: 'customer', placeholder: 'ישראל ישראלי', type: 'text' },
                { label: 'כתובת', key: 'address', placeholder: 'רחוב הרצל 1, תל אביב', type: 'text' },
                { label: 'אימייל', key: 'email', placeholder: 'email@example.com', type: 'email' },
              ].map(f => (
                <div key={f.key} style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', marginBottom: 5, fontWeight: 600, fontSize: '0.9rem' }}>{f.label}</label>
                  <input type={f.type} value={form[f.key as keyof typeof form]}
                    onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                    placeholder={f.placeholder} style={inputStyle} />
                </div>
              ))}
              {error && <div style={{ color: '#721c24', backgroundColor: '#fff3f3', border: '1px solid #f5c6cb', borderRadius: 6, padding: '10px 12px', marginBottom: 12, fontSize: '0.9rem' }}>{error}</div>}
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
              ))}
            </div>
          )}
        </div>

        {/* footer */}
        {!done && items.length > 0 && (step === 'cart' || step === 'details') && (
          <div style={{ padding: '16px 20px', borderTop: '1px solid #eee' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: '1.1rem', marginBottom: 14 }}>
              <span>סה״כ</span>
              <span>{total} ₪</span>
            </div>
            {step === 'details' ? (
              <button onClick={handleOrder} disabled={submitting} style={{ width: '100%', padding: 13, backgroundColor: submitting ? '#aaa' : '#28a745', color: '#fff', border: 'none', borderRadius: 8, cursor: submitting ? 'default' : 'pointer', fontWeight: 'bold', fontSize: '1rem' }}>
                {submitting ? '...' : 'שלח הזמנה ✓'}
              </button>
            ) : (
              <button onClick={goToCheckout} style={{ width: '100%', padding: 13, backgroundColor: '#c15f2a', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 'bold', fontSize: '1rem' }}>
                לתשלום →
              </button>
            )}
          </div>
        )}
      </div>
    </>
  );
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '9px 12px', border: '1px solid #ddd',
  borderRadius: 6, fontSize: '1rem', boxSizing: 'border-box', outline: 'none',
};

const qtyBtn: React.CSSProperties = {
  width: 28, height: 28, borderRadius: '50%', border: '1px solid #ddd',
  background: '#f5f5f5', cursor: 'pointer', fontWeight: 'bold', fontSize: 16,
  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
};
