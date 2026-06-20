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

  return (
    <>
      <header className="hero">
        {/* Top bar: cart left, nav right */}
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

            {/* Nav buttons - right */}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
              <button onClick={() => navigate('/track')} style={ghostBtn}>📦 מעקב הזמנה</button>
              {user ? (
                <>
                  <button onClick={() => navigate('/orders')} style={ghostBtn}>ההזמנות שלי</button>
                  <button onClick={() => navigate('/profile')} style={ghostBtn}>הפרופיל שלי</button>
                  <button onClick={logout} style={ghostBtn}>התנתק</button>
                </>
              ) : (
                <button onClick={() => setAuthOpen(true)} style={ghostBtn}>👤 התחבר / הרשם</button>
              )}
            </div>
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
