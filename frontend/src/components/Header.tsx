import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import heConfig from '../../../shared/he.json';
import { useCart } from '../context/CartContext';
import { useUser } from '../context/UserContext';
import CartDrawer from './CartDrawer';
import AuthModal from './AuthModal';

const { strings, logoImageFile } = heConfig as {
  strings: { logo: string; title: string; subtitle: string };
  logoImageFile?: string;
};

export default function Header({
  showCart = true,
  cartOpen: cartOpenProp,
  onCartOpenChange,
}: {
  showCart?: boolean;
  cartOpen?: boolean;
  onCartOpenChange?: (open: boolean) => void;
}) {
  const { count } = useCart();
  const { user, logout } = useUser();
  const navigate = useNavigate();
  const [cartOpenInternal, setCartOpenInternal] = useState(false);
  const cartOpen = cartOpenProp !== undefined ? cartOpenProp : cartOpenInternal;
  const setCartOpen = (v: boolean) => { setCartOpenInternal(v); onCartOpenChange?.(v); };
  const [authOpen, setAuthOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const navItems = [
    { label: '📦 מעקב הזמנה', onClick: () => { navigate('/track'); setMenuOpen(false); } },
    ...(user ? [
      { label: '🧾 ההזמנות שלי', onClick: () => { navigate('/orders'); setMenuOpen(false); } },
      { label: '👤 הפרופיל שלי', onClick: () => { navigate('/profile'); setMenuOpen(false); } },
      { label: '🚪 התנתק', onClick: () => { logout(); setMenuOpen(false); } },
    ] : [
      { label: '👤 התחבר / הרשם', onClick: () => { setAuthOpen(true); setMenuOpen(false); } },
    ]),
  ];

  return (
    <>
      <style>{`
        @media (max-width: 600px) {
          .header-nav-desktop { display: none !important; }
          .header-hamburger { display: flex !important; }
        }
        @media (min-width: 601px) {
          .header-nav-desktop { display: flex !important; }
          .header-hamburger { display: none !important; }
        }
      `}</style>

      <header className="hero">
        {showCart && (
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            marginBottom: 24, position: 'relative', zIndex: 10,
          }}>
            {/* Cart button - left */}
            <button
              onClick={() => setCartOpen(true)}
              aria-label="סל קניות"
              style={{ ...cartBtn, display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.95rem' }}
            >
              <span style={{ fontSize: 20 }}>🛒</span>
              {count > 0 && (
                <span style={{
                  background: '#e74c3c', color: '#fff', borderRadius: 999,
                  minWidth: 20, height: 20, padding: '0 5px',
                  fontSize: 11, fontWeight: 800,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {count > 99 ? '99+' : count}
                </span>
              )}
            </button>

            {/* Desktop nav */}
            <div className="header-nav-desktop" style={{ gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
              {navItems.map(item => (
                <button key={item.label} onClick={item.onClick} style={ghostBtn}>{item.label}</button>
              ))}
            </div>

            {/* Hamburger button - mobile */}
            <button
              className="header-hamburger"
              onClick={() => setMenuOpen(v => !v)}
              aria-label="תפריט"
              style={{ ...cartBtn, display: 'none', flexDirection: 'column', gap: 5, padding: '10px 14px', alignItems: 'center', justifyContent: 'center' }}
            >
              <span style={{ display: 'block', width: 22, height: 2, background: '#1e1e2e', borderRadius: 2, transition: 'transform 0.2s', transform: menuOpen ? 'rotate(45deg) translate(3px, 3px)' : 'none' }} />
              <span style={{ display: 'block', width: 22, height: 2, background: '#1e1e2e', borderRadius: 2, opacity: menuOpen ? 0 : 1, transition: 'opacity 0.2s' }} />
              <span style={{ display: 'block', width: 22, height: 2, background: '#1e1e2e', borderRadius: 2, transition: 'transform 0.2s', transform: menuOpen ? 'rotate(-45deg) translate(3px, -3px)' : 'none' }} />
            </button>
          </div>
        )}

        {/* Mobile dropdown menu */}
        {showCart && menuOpen && (
          <div style={{
            position: 'absolute', top: 70, right: 16, left: 16,
            backgroundColor: '#fff', borderRadius: 12, boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
            zIndex: 100, overflow: 'hidden', direction: 'rtl',
          }}>
            {navItems.map((item, i) => (
              <button
                key={item.label}
                onClick={item.onClick}
                style={{
                  width: '100%', padding: '14px 20px', background: 'none', border: 'none',
                  borderBottom: i < navItems.length - 1 ? '1px solid #f0f0f0' : 'none',
                  textAlign: 'right', fontSize: '1rem', fontWeight: 600, cursor: 'pointer',
                  color: '#1e1e2e', fontFamily: 'inherit',
                }}
              >
                {item.label}
              </button>
            ))}
          </div>
        )}

        {/* Logo + title centered */}
        <div className="hero__logoRow">
          <Link to="/">
            {logoImageFile ? (
              <img className="hero__logoImg" src={`/images/${logoImageFile}`} alt={strings.logo} />
            ) : (
              <div className="hero__logo">{strings.logo}</div>
            )}
          </Link>
        </div>
        <h1 className="hero__title">{strings.title}</h1>
        <p className="hero__subtitle">{strings.subtitle}</p>
      </header>

      {cartOpen && <CartDrawer onClose={() => setCartOpen(false)} />}
      {authOpen && <AuthModal onClose={() => setAuthOpen(false)} />}
    </>
  );
}

const ghostBtn: React.CSSProperties = {
  background: '#fff', border: 'none',
  borderRadius: 999, padding: '8px 16px', cursor: 'pointer', color: '#1e1e2e',
  fontWeight: 600, fontSize: '0.88rem',
  whiteSpace: 'nowrap', fontFamily: 'inherit', boxShadow: '0 2px 12px rgba(0,0,0,0.18)',
};

const cartBtn: React.CSSProperties = {
  background: '#fff', border: 'none',
  borderRadius: 999, padding: '8px 16px', cursor: 'pointer', color: '#1e1e2e',
  fontWeight: 700, fontSize: '0.95rem',
  whiteSpace: 'nowrap', fontFamily: 'inherit', boxShadow: '0 2px 12px rgba(0,0,0,0.2)',
};
