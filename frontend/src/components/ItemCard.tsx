import { useState } from 'react';
import type { Item } from '../api/items';
import heConfig from '../../../shared/he.json';
import { useCart } from '../context/CartContext';

const { strings, currencySymbol } = heConfig as {
  strings: { orderNowButton: string };
  currencySymbol: string;
};

type Props = { item: Item; onOrderNow?: () => void };

export default function ItemCard({ item, onOrderNow }: Props) {
  const { add } = useCart();
  const [addedFlash, setAddedFlash] = useState(false);

  const handleAddToCart = () => {
    add({ id: item.id, name: item.name, price: item.price, imageFile: item.imageFile });
    setAddedFlash(true);
    setTimeout(() => setAddedFlash(false), 1200);
  };

  const handleOrderNow = () => {
    add({ id: item.id, name: item.name, price: item.price, imageFile: item.imageFile });
    onOrderNow?.();
  };

  const badge = item.badge as 'new' | 'sale' | undefined;
  const outOfStock = typeof item.stock === 'number' && item.stock === 0;

  return (
    <article className="item-card" aria-label={item.name}>
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
        <div className="item-card__footer">
          <div className="item-card__price">
            {currencySymbol}{item.price}
          </div>
          {outOfStock ? (
            <span style={{ padding: '6px 14px', borderRadius: 999, backgroundColor: '#f3f3f3', color: '#aaa', fontWeight: 700, fontSize: '0.85rem' }}>
              אזל מהמלאי
            </span>
          ) : (
            <div className="item-card__actions">
              <button className="item-card__button item-card__button--secondary" type="button" onClick={handleOrderNow}>
                {strings.orderNowButton}
              </button>
              <button
                className={`item-card__button${addedFlash ? ' item-card__button--added' : ''}`}
                type="button"
                onClick={handleAddToCart}
              >
                {addedFlash ? '✓ נוסף לסל' : 'הוסף לסל 🛒'}
              </button>
            </div>
          )}
        </div>
      </div>
    </article>
  );
}
