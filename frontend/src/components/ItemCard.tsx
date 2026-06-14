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

  const handleAddToCart = () => {
    add({ id: item.id, name: item.name, price: item.price, imageFile: item.imageFile });
  };

  const handleOrderNow = () => {
    add({ id: item.id, name: item.name, price: item.price, imageFile: item.imageFile });
    onOrderNow?.();
  };

  return (
    <article className="item-card" aria-label={item.name}>
      <div className="item-card__imageWrap">
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
          <div style={{ display: 'flex', gap: 8, flexDirection: 'column' }}>
            <button
              className="item-card__button"
              type="button"
              onClick={handleOrderNow}
            >
              {strings.orderNowButton}
            </button>
            <button
              className="item-card__button item-card__button--secondary"
              type="button"
              onClick={handleAddToCart}
            >
              הוסף לסל 🛒
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}
