import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import heConfig from '../../../shared/he.json';

const { strings } = heConfig as {
  strings: {
    adminLoginTitle: string;
    adminUsernamePlaceholder: string;
    adminPasswordPlaceholder: string;
    adminLoginButton: string;
    adminLoginError: string;
    adminConnectionError: string;
  };
};

const API = import.meta.env.VITE_API_BASE_URL || '';

export default function AdminLogin() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch(`${API}/api/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      if (res.ok) {
        const { token } = await res.json();
        localStorage.setItem('adminToken', token);
        navigate('/admin/dashboard');
      } else {
        setError(strings.adminLoginError);
      }
    } catch {
      setError(strings.adminConnectionError);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page">
      <Header />
      <div style={{ maxWidth: 400, margin: '40px auto', padding: 20 }}>
        <h1 style={{ textAlign: 'center' }}>{strings.adminLoginTitle}</h1>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 16 }}>
            <input
              type="text"
              placeholder={strings.adminUsernamePlaceholder}
              value={username}
              onChange={e => setUsername(e.target.value)}
              style={{ width: '100%', padding: 8, boxSizing: 'border-box' }}
              required
            />
          </div>
          <div style={{ marginBottom: 16 }}>
            <input
              type="password"
              placeholder={strings.adminPasswordPlaceholder}
              value={password}
              onChange={e => setPassword(e.target.value)}
              style={{ width: '100%', padding: 8, boxSizing: 'border-box' }}
              required
            />
          </div>
          {error && (
            <div style={{ marginBottom: 12, color: '#dc3545', textAlign: 'center' }}>{error}</div>
          )}
          <button type="submit" disabled={loading}
            style={{ width: '100%', padding: 10, backgroundColor: '#007bff', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: '1rem' }}>
            {loading ? '...' : strings.adminLoginButton}
          </button>
        </form>
      </div>
    </div>
  );
}
