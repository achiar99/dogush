import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import { useUser } from '../context/UserContext';

const API = import.meta.env.VITE_API_BASE_URL || '';

export default function Profile() {
  const { user, token, login } = useUser();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', phone: '', address: '' });
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) { navigate('/'); return; }
    if (user) setForm({ name: user.name || '', phone: user.phone || '', address: user.address || '' });
  }, [token, user]);

  const set = (k: string, v: string) => { setForm(p => ({ ...p, [k]: v })); setSaved(false); };

  const submit = async () => {
    setError(null);
    if (!form.name.trim()) { setError('יש למלא שם'); return; }
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/auth/me`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'שגיאה'); return; }
      login(token!, data);
      setSaved(true);
    } catch {
      setError('שגיאת חיבור');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#faf9f6', direction: 'rtl' }}>
      <Header />
      <div style={{ maxWidth: 480, margin: '0 auto', padding: '32px 16px' }}>
        <h1 style={{ marginBottom: 6 }}>הפרופיל שלי</h1>
        {user && <p style={{ color: '#888', marginBottom: 28, fontSize: '0.9rem' }}>{user.email}</p>}

        <div style={{ backgroundColor: '#fff', borderRadius: 12, padding: 28, boxShadow: '0 2px 12px rgba(0,0,0,0.07)' }}>
          <div style={{ marginBottom: 18 }}>
            <label style={labelStyle}>שם מלא</label>
            <input value={form.name} onChange={e => set('name', e.target.value)}
              placeholder="ישראל ישראלי" style={inputStyle} />
          </div>
          <div style={{ marginBottom: 18 }}>
            <label style={labelStyle}>טלפון</label>
            <input type="tel" value={form.phone} onChange={e => set('phone', e.target.value)}
              placeholder="050-0000000" style={inputStyle} dir="ltr" />
          </div>
          <div style={{ marginBottom: 24 }}>
            <label style={labelStyle}>כתובת בית</label>
            <input value={form.address} onChange={e => set('address', e.target.value)}
              placeholder="רחוב הרצל 1, תל אביב" style={inputStyle} />
          </div>

          {error && (
            <div style={{ color: '#721c24', backgroundColor: '#fff3f3', border: '1px solid #f5c6cb', borderRadius: 6, padding: '10px 12px', marginBottom: 16, fontSize: '0.9rem' }}>
              {error}
            </div>
          )}

          {saved && (
            <div style={{ color: '#1e7e34', backgroundColor: '#e6f4ea', border: '1px solid #b7dfbe', borderRadius: 6, padding: '10px 12px', marginBottom: 16, fontSize: '0.9rem' }}>
              ✓ הפרטים עודכנו בהצלחה
            </div>
          )}

          <button onClick={submit} disabled={loading} style={{
            width: '100%', padding: 12, backgroundColor: loading ? '#aaa' : '#c15f2a',
            color: '#fff', border: 'none', borderRadius: 8, cursor: loading ? 'default' : 'pointer',
            fontWeight: 'bold', fontSize: '1rem', fontFamily: 'inherit',
          }}>
            {loading ? '...' : 'שמור שינויים'}
          </button>
        </div>
      </div>
    </div>
  );
}

const labelStyle: React.CSSProperties = { display: 'block', marginBottom: 6, fontWeight: 600, fontSize: '0.9rem' };
const inputStyle: React.CSSProperties = { width: '100%', padding: '10px 12px', border: '1px solid #ddd', borderRadius: 8, fontSize: '1rem', boxSizing: 'border-box', outline: 'none', fontFamily: 'inherit' };
