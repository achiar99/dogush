import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import heConfig from '../../../shared/he.json';

export default function AdminLogin() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const config = heConfig as {
    adminLoginTitle: string;
    adminUsernamePlaceholder: string;
    adminPasswordPlaceholder: string;
    adminLoginButton: string;
    adminLoginError: string;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      if (res.ok) {
        localStorage.setItem('adminToken', 'true');
        navigate('/admin/dashboard');
      } else {
        setError(config.adminLoginError);
      }
    } catch {
      setError('שגיאת חיבור');
    }
  };

  return (
    <div className="page">
      <Header />
      <div className="admin-login">
        <h1>{config.adminLoginTitle}</h1>
        <form onSubmit={handleLogin}>
          <input
            type="text"
            placeholder={config.adminUsernamePlaceholder}
            value={username}
            onChange={e => setUsername(e.target.value)}
          />
          <input
            type="password"
            placeholder={config.adminPasswordPlaceholder}
            value={password}
            onChange={e => setPassword(e.target.value)}
          />
          {error && <p className="error">{error}</p>}
          <button type="submit">{config.adminLoginButton}</button>
        </form>
      </div>
    </div>
  );
}
