import { useState, ReactNode } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import heConfig from '../../../shared/he.json';

const { strings } = heConfig as {
  strings: {
    adminLogoutButton: string;
    adminNavDashboard: string;
    adminNavProducts: string;
    adminNavOrders: string;
    adminNavCategories: string;
    adminNavAnalytics: string;
  };
};

const navItems = (strings: any) => [
  { to: '/admin/dashboard',  label: strings.adminNavDashboard,  icon: '📊' },
  { to: '/admin/products',   label: strings.adminNavProducts,   icon: '📦' },
  { to: '/admin/categories', label: strings.adminNavCategories, icon: '🏷️' },
  { to: '/admin/orders',     label: strings.adminNavOrders,     icon: '🛒' },
  { to: '/admin/analytics',  label: strings.adminNavAnalytics,  icon: '📈' },
];

export default function AdminLayout({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    navigate('/admin');
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f4f6f9', fontFamily: 'inherit' }}>
      {/* Top bar */}
      <header style={{
        backgroundColor: '#1e1e2e',
        color: '#fff',
        padding: '0 24px',
        height: 58,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        boxShadow: '0 2px 12px rgba(0,0,0,0.25)',
        position: 'sticky',
        top: 0,
        zIndex: 100,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          {/* Hamburger (mobile) */}
          <button
            onClick={() => setMenuOpen(o => !o)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#fff', fontSize: 22, lineHeight: 1, display: 'none' }}
            className="admin-hamburger"
          >☰</button>
          <span style={{ fontWeight: 800, fontSize: '1.1rem', letterSpacing: 0.5, color: '#fff' }}>
            🐾 Dogush Admin
          </span>
        </div>

        {/* Desktop nav */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: 4 }} className="admin-nav-desktop">
          {navItems(strings).map(item => (
            <NavLink key={item.to} to={item.to} style={({ isActive }) => ({
              padding: '7px 16px',
              borderRadius: 8,
              textDecoration: 'none',
              fontWeight: 600,
              fontSize: '0.9rem',
              color: isActive ? '#fff' : 'rgba(255,255,255,0.65)',
              backgroundColor: isActive ? 'rgba(255,255,255,0.15)' : 'transparent',
              transition: 'all 0.15s',
              display: 'flex', alignItems: 'center', gap: 6,
            })}>
              <span>{item.icon}</span>{item.label}
            </NavLink>
          ))}
        </nav>

        <button onClick={handleLogout} style={{
          padding: '7px 16px', backgroundColor: 'rgba(255,255,255,0.1)',
          color: '#fff', border: '1px solid rgba(255,255,255,0.2)',
          borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem',
          transition: 'background 0.15s',
        }}>
          {strings.adminLogoutButton}
        </button>
      </header>

      {/* Mobile nav dropdown */}
      {menuOpen && (
        <div style={{
          backgroundColor: '#2a2a3e', padding: '8px 16px 16px',
          display: 'flex', flexDirection: 'column', gap: 4,
        }}>
          {navItems(strings).map(item => (
            <NavLink key={item.to} to={item.to} onClick={() => setMenuOpen(false)} style={({ isActive }) => ({
              padding: '10px 14px', borderRadius: 8, textDecoration: 'none',
              fontWeight: 600, fontSize: '0.95rem',
              color: isActive ? '#fff' : 'rgba(255,255,255,0.7)',
              backgroundColor: isActive ? 'rgba(255,255,255,0.15)' : 'transparent',
              display: 'flex', alignItems: 'center', gap: 10,
            })}>
              <span>{item.icon}</span>{item.label}
            </NavLink>
          ))}
        </div>
      )}

      {/* Page content */}
      <main style={{ padding: '28px 28px', maxWidth: 1200, margin: '0 auto' }}>
        {children}
      </main>

      <style>{`
        @media (max-width: 767px) {
          .admin-nav-desktop { display: none !important; }
          .admin-hamburger { display: block !important; }
        }
      `}</style>
    </div>
  );
}
