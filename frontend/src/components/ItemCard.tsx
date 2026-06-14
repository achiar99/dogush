import type { Item } from '../api/items';
import heConfig from '../../../shared/he.json';

const { strings, currencySymbol } = heConfig as {
  strings: { orderNowButton: string };
  currencySymbol: string;
};

type Props = { item: Item };

export default function ItemCard({ item }: Props) {
  return (
    <article className="item-card" aria-label={item.name}>
      <div className="item-card__imageWrap">
        <img className="item-card__image" src={item.imageUrl} alt={item.name} />
      </div>
      <div className="item-card__content">
        <h3 className="item-card__name">{item.name}</h3>
        <p className="item-card__desc">{item.description}</p>
        <div className="item-card__footer">
          <div className="item-card__price">
            {currencySymbol}{item.price}
          </div>
          <button className="item-card__button" type="button">
            {strings.orderNowButton}
          </button>
        </div>
      </div>
    </article>
  );
}
