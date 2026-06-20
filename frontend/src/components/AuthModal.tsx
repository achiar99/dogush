import { useState } from 'react';
import { useUser } from '../context/UserContext';

const API = import.meta.env.VITE_API_BASE_URL || '';
const GOOGLE_CLIENT_ID = '463119481219-u3u4o1ciif29aeus545hiibs7fhd98dt.apps.googleusercontent.com';

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

export default function AuthModal({ onClose }: { onClose: () => void }) {
  const { login } = useUser();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [form, setForm] = useState({ email: '', password: '', name: '', phone: '', address: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));

  const handleGoogleLogin = () => {
    if (!window.google?.accounts?.oauth2) {
      setError('Google Sign-In לא זמין, נסה שוב');
      return;
    }
    setError(null);
    setLoading(true);
    const client = window.google.accounts.oauth2.initTokenClient({
      client_id: GOOGLE_CLIENT_ID,
      scope: 'email profile openid',
      callback: async (response) => {
        if (response.error || !response.access_token) {
          setError('שגיאת Google');
          setLoading(false);
          return;
        }
        try {
          // Get user info from Google
          const userInfoRes = await fetch('https://openidconnect.googleapis.com/v1/userinfo', {
            headers: { Authorization: `Bearer ${response.access_token}` },
          });
          const userInfo = await userInfoRes.json();
          // Send to our backend
          const res = await fetch(`${API}/api/auth/google`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ accessToken: response.access_token, email: userInfo.email, name: userInfo.name }),
          });
          const data = await res.json();
          if (!res.ok) { setError(data.error || 'שגיאה'); return; }
          login(data.token, data.user);
          onClose();
        } catch {
          setError('שגיאת חיבור');
        } finally {
          setLoading(false);
        }
      },
    });
    client.requestAccessToken();
  };

  const submit = async () => {
    setError(null);
    if (!form.email || !form.password) { setError('יש למלא אימייל וסיסמה'); return; }
    if (mode === 'register' && !form.name) { setError('יש למלא שם'); return; }
    if (mode === 'register' && !form.phone) { setError('יש למלא מספר טלפון'); return; }
    setLoading(true);
    try {
      const body = mode === 'login'
        ? { email: form.email, password: form.password }
        : { email: form.email, password: form.password, name: form.name, phone: form.phone, address: form.address };
      const res = await fetch(`${API}/api/auth/${mode}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'שגיאה'); return; }
      login(data.token, data.user);
      onClose();
    } catch {
      setError('שגיאת חיבור');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.45)', zIndex: 1000 }} />
      <div style={{
        position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
        backgroundColor: '#fff', borderRadius: 12, padding: 32, width: 360, maxWidth: '90vw',
        zIndex: 1001, direction: 'rtl', boxShadow: '0 8px 40px rgba(0,0,0,0.18)',
      }}>
        <h2 style={{ margin: '0 0 20px', textAlign: 'center', fontSize: '1.2rem' }}>
          {mode === 'login' ? 'התחברות' : 'הרשמה'}
        </h2>

        {/* Google button */}
        <button
          onClick={handleGoogleLogin}
          disabled={loading}
          style={{
            width: '100%', padding: '10px 16px', marginBottom: 16,
            border: '1.5px solid #dadce0', borderRadius: 8, background: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
            cursor: loading ? 'default' : 'pointer', fontSize: '0.95rem', fontWeight: 600,
            fontFamily: 'inherit', color: '#3c4043', boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
          }}
        >
          <svg width="20" height="20" viewBox="0 0 48 48">
            <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
            <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
            <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
            <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
            <path fill="none" d="M0 0h48v48H0z"/>
          </svg>
          המשך עם Google
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          <div style={{ flex: 1, height: 1, background: '#e0e0e0' }} />
          <span style={{ color: '#999', fontSize: '0.8rem', whiteSpace: 'nowrap' }}>או עם אימייל</span>
          <div style={{ flex: 1, height: 1, background: '#e0e0e0' }} />
        </div>

        {mode === 'register' && (
          <>
            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}>שם מלא</label>
              <input value={form.name} onChange={e => set('name', e.target.value)}
                placeholder="ישראל ישראלי" style={inputStyle} />
            </div>
            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}>טלפון</label>
              <input type="tel" value={form.phone} onChange={e => set('phone', e.target.value)}
                placeholder="050-0000000" style={inputStyle} dir="ltr" />
            </div>
            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}>כתובת בית</label>
              <input value={form.address} onChange={e => set('address', e.target.value)}
                placeholder="רחוב הרצל 1, תל אביב" style={inputStyle} />
            </div>
          </>
        )}

        <div style={{ marginBottom: 14 }}>
          <label style={labelStyle}>אימייל</label>
          <input type="email" value={form.email} onChange={e => set('email', e.target.value)}
            placeholder="email@example.com" style={inputStyle} dir="ltr" />
        </div>

        <div style={{ marginBottom: 20 }}>
          <label style={labelStyle}>סיסמה</label>
          <input type="password" value={form.password} onChange={e => set('password', e.target.value)}
            placeholder="••••••••" style={inputStyle} dir="ltr"
            onKeyDown={e => e.key === 'Enter' && submit()} />
        </div>

        {error && (
          <div style={{ color: '#721c24', backgroundColor: '#fff3f3', border: '1px solid #f5c6cb', borderRadius: 6, padding: '10px 12px', marginBottom: 14, fontSize: '0.9rem' }}>
            {error}
          </div>
        )}

        <button onClick={submit} disabled={loading} style={{
          width: '100%', padding: 12, backgroundColor: loading ? '#aaa' : '#c15f2a',
          color: '#fff', border: 'none', borderRadius: 8, cursor: loading ? 'default' : 'pointer',
          fontWeight: 'bold', fontSize: '1rem', marginBottom: 14, fontFamily: 'inherit',
        }}>
          {loading ? '...' : mode === 'login' ? 'התחבר' : 'הרשמה'}
        </button>

        <div style={{ textAlign: 'center', fontSize: '0.9rem', color: '#666' }}>
          {mode === 'login' ? (
            <>אין לך חשבון?{' '}
              <button onClick={() => { setMode('register'); setError(null); }} style={linkBtn}>הרשם כאן</button>
            </>
          ) : (
            <>יש לך חשבון?{' '}
              <button onClick={() => { setMode('login'); setError(null); }} style={linkBtn}>התחבר</button>
            </>
          )}
        </div>
      </div>
    </>
  );
}

const labelStyle: React.CSSProperties = { display: 'block', marginBottom: 5, fontWeight: 600, fontSize: '0.9rem' };
const inputStyle: React.CSSProperties = { width: '100%', padding: '9px 12px', border: '1px solid #ddd', borderRadius: 6, fontSize: '1rem', boxSizing: 'border-box', outline: 'none' };
const linkBtn: React.CSSProperties = { background: 'none', border: 'none', cursor: 'pointer', color: '#c15f2a', fontWeight: 600, padding: 0, fontSize: '0.9rem' };
