import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useUser } from '../context/UserContext';
import Header from '../components/Header';

declare global {
  interface Window {
    google?: {
      accounts: {
        oauth2: {
          initTokenClient: (config: {
            client_id: string;
            scope: string;
            callback: (response: { access_token?: string; error?: string }) => void;
          }) => { requestAccessToken: () => void };
        };
      };
    };
  }
}

const GOOGLE_CLIENT_ID = '463119481219-u3u4o1ciif29aeus545hiibs7fhd98dt.apps.googleusercontent.com';

const API = import.meta.env.VITE_API_BASE_URL || '';

type Step = 'cart' | 'auth' | 'authForm' | 'details';

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '11px 14px', border: '1.5px solid #e0d8cc',
  borderRadius: 10, fontSize: '1rem', boxSizing: 'border-box', outline: 'none',
  fontFamily: 'inherit', background: '#fff',
};

export default function Checkout() {
  const navigate = useNavigate();
  const { items, remove, updateQty, clear, total } = useCart();
  const { user, token, login } = useUser();

  const [step, setStep] = useState<Step>(user ? 'details' : 'cart');
  const [form, setForm] = useState({
    customer: user?.name || '',
    phone: user?.phone || '',
    address: user?.address || '',
    email: user?.email || '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [authForm, setAuthForm] = useState({ email: '', password: '', name: '', phone: '', address: '' });
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const handleGoogleLogin = () => {
    if (!window.google?.accounts?.oauth2) { setAuthError('Google Sign-In לא זמין'); return; }
    setAuthError(null);
    setAuthLoading(true);
    const client = window.google.accounts.oauth2.initTokenClient({
      client_id: GOOGLE_CLIENT_ID,
      scope: 'email profile openid',
      callback: async (response: { access_token?: string; error?: string }) => {
        if (response.error || !response.access_token) { setAuthError('שגיאת Google'); setAuthLoading(false); return; }
        try {
          const userInfoRes = await fetch('https://openidconnect.googleapis.com/v1/userinfo', {
            headers: { Authorization: `Bearer ${response.access_token}` },
          });
          const userInfo = await userInfoRes.json();
          const res = await fetch(`${API}/api/auth/google`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ accessToken: response.access_token, email: userInfo.email, name: userInfo.name }),
          });
          const data = await res.json();
          if (!res.ok) { setAuthError(data.error || 'שגיאה'); return; }
          login(data.token, data.user);
          setForm({ customer: data.user.name || '', phone: data.user.phone || '', address: data.user.address || '', email: data.user.email || '' });
          setStep('details');
        } catch { setAuthError('שגיאת חיבור'); }
        finally { setAuthLoading(false); }
      },
    });
    client.requestAccessToken();
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
      setForm({ customer: data.user.name || '', phone: data.user.phone || '', address: data.user.address || '', email: data.user.email || '' });
      setStep('details');
    } catch { setAuthError('שגיאת חיבור'); }
    finally { setAuthLoading(false); }
  };

  const handleOrder = async () => {
    if (!form.customer.trim()) { setError('שם מלא חובה'); return; }
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
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'שגיאה ביצירת הזמנה'); return; }
      clear();
      const params = new URLSearchParams({ id: data.orderId });
      if (data.orderToken) params.set('token', data.orderToken);
      navigate(`/track?${params.toString()}`);
    } catch {
      setError('שגיאת חיבור, נסה שוב');
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <div className="page">
        <Header showCart={false} />
        <div style={{ maxWidth: 480, margin: '60px auto', padding: '0 20px', textAlign: 'center', direction: 'rtl' }}>
          <div style={{ fontSize: 72, marginBottom: 20 }}>🚧</div>
          <h2 style={{ fontSize: 22, fontWeight: 900, marginBottom: 12 }}>כרגע לא ניתן לעשות הזמנות</h2>
          <p style={{ color: '#555', fontSize: 16, marginBottom: 8 }}>אנא ליצור קשר במספר:</p>
          <a href="tel:0524841017" style={{ display: 'inline-block', fontSize: 22, fontWeight: 900, color: '#c15f2a', textDecoration: 'none', marginBottom: 24, letterSpacing: 1 }}>
            052-484-1017
          </a>
          <br />
          <a href="https://wa.me/972524841017" target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '12px 28px', background: '#25d366', color: '#fff', borderRadius: 12, fontWeight: 700, fontSize: '1rem', textDecoration: 'none', marginBottom: 16 }}>
            <span>📱</span> שלח וואטסאפ
          </a>
          <br />
          <button onClick={() => navigate('/')} style={{ padding: '10px 28px', background: 'transparent', color: '#888', border: 'none', cursor: 'pointer', fontSize: '0.95rem', fontFamily: 'inherit' }}>
            חזור לחנות
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="page" style={{ minHeight: '100vh', background: '#fbf7ee' }}>
      <Header showCart={false} />

      <div style={{ maxWidth: 560, margin: '0 auto', padding: '24px 16px 60px', direction: 'rtl' }}>

        {/* ── Step: Cart review ── */}
        {step === 'cart' && (
          <>
            <h2 style={{ fontSize: 22, fontWeight: 900, marginBottom: 20 }}>סל הקניות שלך</h2>

            {items.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 0', color: '#aaa' }}>
                <div style={{ fontSize: 52, marginBottom: 12 }}>🛒</div>
                <p>הסל ריק</p>
                <button onClick={() => navigate('/')} style={{ marginTop: 16, padding: '10px 24px', background: '#c15f2a', color: '#fff', border: 'none', borderRadius: 10, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                  חזור לחנות
                </button>
              </div>
            ) : (
              <>
                <div style={{ background: '#fff', borderRadius: 16, boxShadow: '0 2px 10px rgba(0,0,0,0.07)', overflow: 'hidden', marginBottom: 20 }}>
                  {items.map((item, i) => (
                    <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', borderBottom: i < items.length - 1 ? '1px solid #f0f0f0' : 'none' }}>
                      <div style={{ width: 56, height: 56, borderRadius: 10, overflow: 'hidden', flexShrink: 0, background: '#f4f0e2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {item.imageFile ? <img src={item.imageFile} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ fontSize: 24 }}>🐾</span>}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 700, fontSize: 15, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.name}</div>
                        <div style={{ color: '#888', fontSize: 13, marginTop: 2 }}>{item.price} ₪ ליחידה</div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <button onClick={() => updateQty(item.id, item.quantity - 1)} style={qtyBtn}>−</button>
                        <span style={{ minWidth: 24, textAlign: 'center', fontWeight: 700 }}>{item.quantity}</span>
                        <button onClick={() => updateQty(item.id, item.quantity + 1)} style={qtyBtn}>+</button>
                      </div>
                      <div style={{ fontWeight: 800, fontSize: 15, minWidth: 55, textAlign: 'left' }}>{item.price * item.quantity} ₪</div>
                      <button onClick={() => remove(item.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ccc', fontSize: 18, padding: 4 }}>✕</button>
                    </div>
                  ))}
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fff', borderRadius: 14, padding: '16px 20px', marginBottom: 20, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                  <span style={{ fontWeight: 700, fontSize: 17 }}>סה״כ</span>
                  <span style={{ fontWeight: 900, fontSize: 22, color: '#1e1e2e' }}>{total} ₪</span>
                </div>

                <button onClick={() => setStep('auth')} style={{ width: '100%', padding: 15, background: '#c15f2a', color: '#fff', border: 'none', borderRadius: 12, fontWeight: 800, fontSize: '1.05rem', cursor: 'pointer', fontFamily: 'inherit' }}>
                  המשך להזמנה →
                </button>
                <button onClick={() => navigate('/')} style={{ width: '100%', marginTop: 10, padding: 12, background: 'transparent', color: '#888', border: 'none', cursor: 'pointer', fontSize: '0.9rem', fontFamily: 'inherit' }}>
                  ← המשך בקנייה
                </button>
              </>
            )}
          </>
        )}

        {/* ── Step: Auth choice ── */}
        {step === 'auth' && (
          <div>
            <button onClick={() => setStep('cart')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#c15f2a', marginBottom: 28, padding: 0, fontWeight: 600, fontSize: '0.95rem', fontFamily: 'inherit' }}>
              ← חזור לסל
            </button>
            <div style={{ textAlign: 'center', marginBottom: 36 }}>
              <div style={{ fontSize: 52, marginBottom: 12 }}>🔐</div>
              <h2 style={{ margin: '0 0 8px', fontSize: 22, fontWeight: 900 }}>כניסה לחשבון</h2>
              <p style={{ margin: 0, color: '#888', fontSize: 14 }}>התחבר כדי לעקוב אחר ההזמנות שלך</p>
            </div>
            <button onClick={handleGoogleLogin} disabled={authLoading} style={{ width: '100%', padding: '11px 16px', marginBottom: 12, border: '1.5px solid #dadce0', borderRadius: 10, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, cursor: authLoading ? 'default' : 'pointer', fontSize: '0.95rem', fontWeight: 600, fontFamily: 'inherit', color: '#3c4043' }}>
              <svg width="20" height="20" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>
              המשך עם Google
            </button>
            <button onClick={() => setStep('authForm')} style={{ width: '100%', padding: 14, background: '#1e1e2e', color: '#fff', border: 'none', borderRadius: 12, fontWeight: 700, fontSize: '1rem', cursor: 'pointer', fontFamily: 'inherit', marginBottom: 12 }}>
              התחברות / הרשמה עם אימייל
            </button>
            <button onClick={() => { setForm({ customer: '', phone: '', address: '', email: '' }); setStep('details'); }} style={{ width: '100%', padding: 14, background: '#fff', color: '#555', border: '1.5px solid #ddd', borderRadius: 12, fontWeight: 600, fontSize: '1rem', cursor: 'pointer', fontFamily: 'inherit' }}>
              המשך כאורח
            </button>
          </div>
        )}

        {/* ── Step: Auth form ── */}
        {step === 'authForm' && (
          <div>
            <button onClick={() => setStep('auth')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#c15f2a', marginBottom: 24, padding: 0, fontWeight: 600, fontSize: '0.95rem', fontFamily: 'inherit' }}>
              ← חזרה
            </button>
            <div style={{ display: 'flex', marginBottom: 24, borderRadius: 12, overflow: 'hidden', border: '1.5px solid #e0d8cc' }}>
              {(['login', 'register'] as const).map(m => (
                <button key={m} onClick={() => setAuthMode(m)} style={{ flex: 1, padding: '11px 0', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: '0.95rem', fontFamily: 'inherit', background: authMode === m ? '#1e1e2e' : '#fff', color: authMode === m ? '#fff' : '#888' }}>
                  {m === 'login' ? 'התחברות' : 'הרשמה'}
                </button>
              ))}
            </div>
            {authMode === 'register' && [
              { label: 'שם מלא *', key: 'name', type: 'text', placeholder: 'ישראל ישראלי' },
              { label: 'טלפון *', key: 'phone', type: 'tel', placeholder: '050-0000000' },
              { label: 'כתובת', key: 'address', type: 'text', placeholder: 'רחוב הרצל 1' },
            ].map(f => (
              <div key={f.key} style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', marginBottom: 5, fontWeight: 600, fontSize: '0.9rem' }}>{f.label}</label>
                <input type={f.type} value={authForm[f.key as keyof typeof authForm]} onChange={e => setAuthForm(p => ({ ...p, [f.key]: e.target.value }))} placeholder={f.placeholder} style={inputStyle} />
              </div>
            ))}
            {[
              { label: 'אימייל *', key: 'email', type: 'email', placeholder: 'you@example.com' },
              { label: 'סיסמה *', key: 'password', type: 'password', placeholder: '••••••••' },
            ].map(f => (
              <div key={f.key} style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', marginBottom: 5, fontWeight: 600, fontSize: '0.9rem' }}>{f.label}</label>
                <input type={f.type} value={authForm[f.key as keyof typeof authForm]} onChange={e => setAuthForm(p => ({ ...p, [f.key]: e.target.value }))} placeholder={f.placeholder} style={inputStyle} />
              </div>
            ))}
            {authError && <div style={{ color: '#721c24', background: '#fff3f3', border: '1px solid #f5c6cb', borderRadius: 8, padding: '10px 14px', marginBottom: 14, fontSize: '0.9rem' }}>{authError}</div>}
            <button onClick={handleAuth} disabled={authLoading} style={{ width: '100%', padding: 14, background: authLoading ? '#aaa' : '#c15f2a', color: '#fff', border: 'none', borderRadius: 12, fontWeight: 700, fontSize: '1rem', cursor: 'pointer', fontFamily: 'inherit', marginTop: 4 }}>
              {authLoading ? '...' : authMode === 'login' ? 'התחבר →' : 'הרשמה →'}
            </button>
          </div>
        )}

        {/* ── Step: Details ── */}
        {step === 'details' && (
          <div>
            <button onClick={() => setStep(user ? 'cart' : 'auth')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#c15f2a', marginBottom: 24, padding: 0, fontWeight: 600, fontSize: '0.95rem', fontFamily: 'inherit' }}>
              ← חזרה
            </button>
            {user && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24, padding: '12px 16px', background: '#f0faf2', borderRadius: 12, border: '1px solid #d1fae5' }}>
                <span style={{ fontSize: 24 }}>👤</span>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>{user.name}</div>
                  <div style={{ fontSize: 12, color: '#888' }}>{user.email}</div>
                </div>
              </div>
            )}
            <h2 style={{ fontSize: 20, fontWeight: 900, marginBottom: 20 }}>פרטי הזמנה</h2>
            {[
              { label: 'שם מלא *', key: 'customer', placeholder: 'ישראל ישראלי', type: 'text' },
              { label: 'טלפון *', key: 'phone', placeholder: '050-0000000', type: 'tel' },
              { label: 'כתובת', key: 'address', placeholder: 'רחוב הרצל 1, תל אביב', type: 'text' },
              { label: 'אימייל', key: 'email', placeholder: 'email@example.com', type: 'email' },
            ].map(f => (
              <div key={f.key} style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', marginBottom: 5, fontWeight: 600, fontSize: '0.9rem' }}>{f.label}</label>
                <input type={f.type} value={form[f.key as keyof typeof form]} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))} placeholder={f.placeholder} style={inputStyle} />
              </div>
            ))}

            {/* Order summary */}
            <div style={{ background: '#fff', borderRadius: 14, padding: '14px 16px', marginBottom: 20, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
              <div style={{ fontSize: 13, color: '#888', marginBottom: 10, fontWeight: 600 }}>סיכום הזמנה</div>
              {items.map(i => (
                <div key={i.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 6, color: '#444' }}>
                  <span>{i.name} × {i.quantity}</span>
                  <span>{i.price * i.quantity} ₪</span>
                </div>
              ))}
              <div style={{ borderTop: '1px solid #f0f0f0', marginTop: 10, paddingTop: 10, display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: 16 }}>
                <span>סה״כ</span><span>{total} ₪</span>
              </div>
            </div>

            {error && <div style={{ color: '#721c24', background: '#fff3f3', border: '1px solid #f5c6cb', borderRadius: 8, padding: '10px 14px', marginBottom: 16, fontSize: '0.9rem' }}>{error}</div>}
            <button onClick={handleOrder} disabled={submitting} style={{ width: '100%', padding: 15, background: submitting ? '#aaa' : '#28a745', color: '#fff', border: 'none', borderRadius: 12, fontWeight: 800, fontSize: '1.05rem', cursor: submitting ? 'default' : 'pointer', fontFamily: 'inherit' }}>
              {submitting ? '...' : 'שלח הזמנה ✓'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

const qtyBtn: React.CSSProperties = {
  width: 30, height: 30, borderRadius: '50%', border: '1.5px solid #e0d8cc',
  background: '#f5f5f5', cursor: 'pointer', fontWeight: 'bold', fontSize: 16,
  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
};
