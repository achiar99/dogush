import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import type { Item } from '../api/items';
import heConfig from '../../../shared/he.json';
import { useCart } from '../context/CartContext';
import { fireCartToast } from './CartToast';

const { strings, currencySymbol } = heConfig as {
  strings: { addToCartButton: string; productSpecLink: string };
  currencySymbol: string;
};

type Props = { item: Item };

export default function ItemCard({ item }: Props) {
  const { add } = useCart();
  const navigate = useNavigate();
  const [addedFlash, setAddedFlash] = useState(false);

  const openProduct = () => navigate(`/product/${item.id}`);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    add({ id: item.id, name: item.name, price: item.price, imageFile: item.imageFile });
    fireCartToast(item.name, item.imageFile);
    setAddedFlash(true);
    setTimeout(() => setAddedFlash(false), 1200);
  };

  const badge = item.badge as 'new' | 'sale' | undefined;
  const outOfStock = typeof item.stock === 'number' && item.stock === 0;

  return (
    <article
      className="item-card"
      aria-label={item.name}
      role="link"
      tabIndex={0}
      onClick={openProduct}
      onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openProduct(); } }}
    >
      <div className="item-card__imageWrap">
        {badge && (
          <span className={`item-card__badge item-card__badge--${badge}`}>
            {badge === 'new' ? 'חדש' : 'מבצע'}
          </span>
        )}
        {item.imageFile
          ? <img className="item-card__image" src={item.imageFile} alt={item.name} />
          : <span style={{ fontSize: 52 }}>🐾</span>
        }
      </div>
      <div className="item-card__content">
        <h3 className="item-card__name">{item.name}</h3>
        <p className="item-card__desc">{item.description}</p>
        <p style={{ margin: '0 0 6px', fontSize: '0.8rem', color: '#888', visibility: item.weight ? 'visible' : 'hidden' }}>⚖️ {item.weight || ' '}</p>
        <Link to={`/product/${item.id}`} onClick={e => e.stopPropagation()} style={{
          color: '#c15f2a', fontSize: '0.82rem', fontWeight: 600, textDecoration: 'underline',
          display: 'inline-block', marginBottom: 8,
        }}>
          {strings.productSpecLink} ▾
        </Link>
        <div className="item-card__footer">
          {outOfStock ? (
            <span style={{ padding: '10px 14px', borderRadius: 14, backgroundColor: '#f3f3f3', color: '#aaa', fontWeight: 700, fontSize: '0.85rem', textAlign: 'center' }}>
              אזל מהמלאי
            </span>
          ) : (
            <>
              <div className="item-card__price">{currencySymbol}{item.price}</div>
              <button
                className={`item-card__addBtn${addedFlash ? ' item-card__addBtn--added' : ''}`}
                type="button"
                onClick={handleAddToCart}
              >
                {addedFlash ? '✓ נוסף לסל' : strings.addToCartButton}
              </button>
            </>
          )}
        </div>
      </div>
    </article>
  );
}
