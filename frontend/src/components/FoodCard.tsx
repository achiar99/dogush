import React from 'react';
import type { Food } from '../api/foods';
import heConfig from '../../../shared/he.json';

type Props = {
  item: Food;
};

export default function PizzaCard({ item }: Props) {
  const { strings } = heConfig as {
    strings: {
      orderNowButton: string;
    };
  };
  const currencySymbol = (heConfig as { currencySymbol: string }).currencySymbol;

  return (
    <article className="pizza-card" aria-label={`Pizza: ${item.name}`}>
      <div className="pizza-card__imageWrap">
        <img className="pizza-card__image" src={item.imageUrl} alt={item.name} />
      </div>

      <div className="pizza-card__content">
        <h3 className="pizza-card__name">{item.name}</h3>
        <p className="pizza-card__desc">{item.description}</p>

        <div className="pizza-card__footer">
          <div className="pizza-card__price">
            {currencySymbol}
            {item.price}
          </div>
          <button className="pizza-card__button" type="button">
            {strings.orderNowButton}
          </button>
        </div>
      </div>
    </article>
  );
}

