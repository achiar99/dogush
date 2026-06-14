import { useState, ReactNode } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import Header from './Header';
import heConfig from '../../../shared/he.json';

const { strings } = heConfig as {
  strings: {
    adminLogoutButton: string;
    adminNavDashboard: string;
    adminNavProducts: string;
    adminNavOrders: string;
    adminNavCategories: string;
  };
};

interface AdminLayoutProps {
  children: ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    navigate('/admin');
  };

  return (
    <div className="page">
      <Header />
      <div style={{ padding: 20 }}>
        <style>{`
          @media (max-width: 767px) {
            .admin-nav-container {
              flex-direction: column;
              gap: 12px;
            }
            .admin-nav-header {
              width: 100%;
              justify-content: space-between;
              display: flex !important;
            }
            .admin-hamburger {
              display: flex !important;
            }
            .admin-nav-links {
              display: none !important;
              flex-direction: column;
              width: 100%;
              padding-top: 12px;
              border-top: 1px solid #ddd;
            }
            .admin-nav-links.open {
              display: flex !important;
            }
            .admin-nav-links a, .admin-nav-links .logout-mobile {
              width: 100%;
              text-align: center;
            }
            .admin-logout-desktop {
              display: none !important;
            }
          }
          @media (min-width: 768px) {
            .admin-hamburger {
              display: none !important;
            }
            .admin-nav-links {
              display: flex !important;
            }
            .logout-mobile {
              display: none !important;
            }
          }
        `}</style>
        <div style={{ 
          backgroundColor: '#f5f5f5', 
          borderRadius: 8, 
          padding: 16, 
          marginBottom: 20,
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          flexWrap: 'wrap',
          gap: 12,
        }} className="admin-nav-container">
          <div className="admin-nav-header" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button 
              className="admin-hamburger"
              onClick={() => setMenuOpen(!menuOpen)}
              style={{
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                gap: 5,
                width: 44,
                height: 44,
                backgroundColor: '#fff',
                border: '2px solid #ddd',
                borderRadius: 6,
                cursor: 'pointer',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
              }}
            >
              <span style={{ display: 'block', width: 20, height: 2, backgroundColor: '#333', borderRadius: 2 }}></span>
              <span style={{ display: 'block', width: 20, height: 2, backgroundColor: '#333', borderRadius: 2 }}></span>
              <span style={{ display: 'block', width: 20, height: 2, backgroundColor: '#333', borderRadius: 2 }}></span>
            </button>
            <nav style={{ display: 'flex', gap: 12 }} className={`admin-nav-links ${menuOpen ? 'open' : ''}`}>
              <NavLink
                to="/admin/dashboard"
                onClick={() => setMenuOpen(false)}
                style={({ isActive }) => ({
                  padding: '10px 20px',
                  textDecoration: 'none',
                  borderRadius: 6,
                  backgroundColor: isActive ? '#c15f2a' : '#fff',
                  color: isActive ? '#fff' : '#333',
                  fontWeight: isActive ? 'bold' : 'normal',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                  transition: 'all 0.2s',
                })}
              >
                {strings.adminNavDashboard}
              </NavLink>
              <NavLink
                to="/admin/products"
                onClick={() => setMenuOpen(false)}
                style={({ isActive }) => ({
                  padding: '10px 20px',
                  textDecoration: 'none',
                  borderRadius: 6,
                  backgroundColor: isActive ? '#c15f2a' : '#fff',
                  color: isActive ? '#fff' : '#333',
                  fontWeight: isActive ? 'bold' : 'normal',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                  transition: 'all 0.2s',
                })}
              >
                {strings.adminNavProducts}
              </NavLink>
              <NavLink
                to="/admin/categories"
                onClick={() => setMenuOpen(false)}
                style={({ isActive }) => ({
                  padding: '10px 20px',
                  textDecoration: 'none',
                  borderRadius: 6,
                  backgroundColor: isActive ? '#c15f2a' : '#fff',
                  color: isActive ? '#fff' : '#333',
                  fontWeight: isActive ? 'bold' : 'normal',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                  transition: 'all 0.2s',
                })}
              >
                {strings.adminNavCategories}
              </NavLink>
              <NavLink
                to="/admin/orders"
                onClick={() => setMenuOpen(false)}
                style={({ isActive }) => ({
                  padding: '10px 20px',
                  textDecoration: 'none',
                  borderRadius: 6,
                  backgroundColor: isActive ? '#c15f2a' : '#fff',
                  color: isActive ? '#fff' : '#333',
                  fontWeight: isActive ? 'bold' : 'normal',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                  transition: 'all 0.2s',
                })}
              >
                {strings.adminNavOrders}
              </NavLink>
              <button 
                onClick={() => { handleLogout(); setMenuOpen(false); }}
                className="logout-mobile"
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#333',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 6,
                  cursor: 'pointer',
                }}
              >
                {strings.adminLogoutButton}
              </button>
            </nav>
          </div>
          <button 
            onClick={handleLogout}
            className="admin-logout-desktop"
            style={{
              padding: '10px 20px',
              backgroundColor: '#333',
              color: '#fff',
              border: 'none',
              borderRadius: 6,
              cursor: 'pointer',
            }}
          >
            {strings.adminLogoutButton}
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
