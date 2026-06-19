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
    adminNavCustomers: string;
  };
};

const navItems = (strings: any) => [
  { to: '/admin/dashboard',  label: strings.adminNavDashboard,  icon: '📊' },
  { to: '/admin/products',   label: strings.adminNavProducts,   icon: '📦' },
  { to: '/admin/categories', label: strings.adminNavCategories, icon: '🏷️' },
  { to: '/admin/orders',     label: strings.adminNavOrders,     icon: '🛒' },
  { to: '/admin/analytics',  label: strings.adminNavAnalytics,  icon: '📈' },
  { to: '/admin/customers',  label: strings.adminNavCustomers,  icon: '👥' },
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

      {/* Top bar — logo + logout only */}
      <header style={{
        backgroundColor: '#1e1e2e',
        color: '#fff',
        padding: '0 24px',
        height: 54,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        boxShadow: '0 1px 0 rgba(255,255,255,0.06)',
        position: 'sticky',
        top: 0,
        zIndex: 100,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {/* Hamburger (mobile only) */}
          <button
            onClick={() => setMenuOpen(o => !o)}
            className="admin-hamburger"
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#fff', fontSize: 22, lineHeight: 1, display: 'none' }}
          >☰</button>
          <span style={{ fontWeight: 800, fontSize: '1.05rem', letterSpacing: 0.3, color: '#fff' }}>
            🐾 Dogush Admin
          </span>
        </div>

        <button onClick={handleLogout} style={{
          padding: '6px 14px', backgroundColor: 'rgba(255,255,255,0.08)',
          color: '#fff', border: '1px solid rgba(255,255,255,0.18)',
          borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: '0.82rem',
          fontFamily: 'inherit',
        }}>
          {strings.adminLogoutButton}
        </button>
      </header>

      {/* Sub-header nav (desktop) */}
      <nav className="admin-subnav" style={{
        backgroundColor: '#16162a',
        padding: '0 24px',
        display: 'flex',
        alignItems: 'center',
        gap: 2,
        height: 44,
        position: 'sticky',
        top: 54,
        zIndex: 99,
        borderBottom: '1px solid rgba(255,255,255,0.05)',
      }}>
        {navItems(strings).map(item => (
          <NavLink key={item.to} to={item.to} style={({ isActive }) => ({
            padding: '5px 14px',
            borderRadius: 7,
            textDecoration: 'none',
            fontWeight: 600,
            fontSize: '0.85rem',
            color: isActive ? '#fff' : 'rgba(255,255,255,0.55)',
            backgroundColor: isActive ? 'rgba(255,255,255,0.12)' : 'transparent',
            transition: 'all 0.15s',
            display: 'flex', alignItems: 'center', gap: 6,
            whiteSpace: 'nowrap',
          })}>
            <span style={{ fontSize: '0.95em' }}>{item.icon}</span>{item.label}
          </NavLink>
        ))}
      </nav>

      {/* Mobile nav dropdown */}
      {menuOpen && (
        <div style={{
          backgroundColor: '#2a2a3e', padding: '8px 16px 16px',
          display: 'flex', flexDirection: 'column', gap: 4,
          position: 'sticky', top: 54, zIndex: 98,
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
      <main style={{ padding: '28px', maxWidth: 1200, margin: '0 auto' }}>
        {children}
      </main>

      <style>{`
        @media (max-width: 767px) {
          .admin-subnav { display: none !important; }
          .admin-hamburger { display: block !important; }
        }
      `}</style>
    </div>
  );
}
