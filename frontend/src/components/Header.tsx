import { useState } from 'react';
import { Link } from 'react-router-dom';
import heConfig from '../../../shared/he.json';
import { useCart } from '../context/CartContext';
import CartDrawer from './CartDrawer';

const { strings, logoImageFile } = heConfig as {
  strings: { logo: string; title: string; subtitle: string };
  logoImageFile?: string;
};

export default function Header({ showCart = true }: { showCart?: boolean }) {
  const { count } = useCart();
  const [cartOpen, setCartOpen] = useState(false);

  return (
    <>
      <header className="hero" style={{ position: 'relative' }}>
        {showCart && <button
          onClick={() => setCartOpen(true)}
          aria-label="סל קניות"
          style={{
            position: 'absolute', top: 16, left: 16, zIndex: 10,
            background: 'rgba(255,255,255,0.18)', border: '1.5px solid rgba(255,255,255,0.55)',
            borderRadius: 12, padding: '8px 14px',
            cursor: 'pointer', color: '#fff', fontWeight: 700, fontSize: '0.95rem',
            display: 'flex', alignItems: 'center', gap: 8,
            backdropFilter: 'blur(6px)',
          }}
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
        </button>}

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
    </>
  );
}
