import { useState } from 'react';
import Header from '../components/Header';
import heConfig from '../../../shared/he.json';

const { strings } = heConfig as {
  strings: {
    adminLoginTitle: string;
    adminUsernamePlaceholder: string;
    adminPasswordPlaceholder: string;
    adminLoginButton: string;
  };
};

export default function AdminLogin() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    window.location.href = '/admin/dashboard';
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
              onChange={(e) => setUsername(e.target.value)}
              style={{ width: '100%', padding: 8 }}
            />
          </div>
          <div style={{ marginBottom: 16 }}>
            <input
              type="password"
              placeholder={strings.adminPasswordPlaceholder}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{ width: '100%', padding: 8 }}
            />
          </div>
          <button type="submit" style={{ width: '100%', padding: 8 }}>{strings.adminLoginButton}</button>
        </form>
      </div>
    </div>
  );
}
