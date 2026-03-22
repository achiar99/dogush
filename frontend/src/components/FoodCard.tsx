import type { Food } from '../api/foods';
import heConfig from '../../../shared/he.json';

type Props = {
  item: Food;
};

export default function FoodCard({ item }: Props) {
  const { strings, currencySymbol } = heConfig as {
    strings: { orderNowButton: string };
    currencySymbol: string;
  };

  return (
    <article className="product-card" aria-label={`Product: ${item.name}`}>
      <div className="product-card__imageWrap">
        <img className="product-card__image" src={item.imageUrl} alt={item.name} />
      </div>

      <div className="product-card__content">
        <h3 className="product-card__name">{item.name}</h3>
        <p className="product-card__desc">{item.description}</p>

        <div className="product-card__footer">
          <div className="product-card__price">
            {currencySymbol}{item.price}
          </div>
          <button className="product-card__button" type="button">
            {strings.orderNowButton}
          </button>
        </div>
      </div>
    </article>
  );
}
