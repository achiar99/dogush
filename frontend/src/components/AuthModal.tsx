import { useState } from 'react';
import { useUser } from '../context/UserContext';

const API = import.meta.env.VITE_API_BASE_URL || '';

export default function AuthModal({ onClose }: { onClose: () => void }) {
  const { login } = useUser();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [form, setForm] = useState({ email: '', password: '', name: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));

  const submit = async () => {
    setError(null);
    if (!form.email || !form.password) { setError('יש למלא אימייל וסיסמה'); return; }
    if (mode === 'register' && !form.name) { setError('יש למלא שם'); return; }
    setLoading(true);
    try {
      const body = mode === 'login'
        ? { email: form.email, password: form.password }
        : { email: form.email, password: form.password, name: form.name };
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

        {mode === 'register' && (
          <div style={{ marginBottom: 14 }}>
            <label style={labelStyle}>שם מלא</label>
            <input value={form.name} onChange={e => set('name', e.target.value)}
              placeholder="ישראל ישראלי" style={inputStyle} />
          </div>
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
          fontWeight: 'bold', fontSize: '1rem', marginBottom: 14,
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
