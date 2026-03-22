import React, { useEffect, useMemo, useState } from 'react';
import FoodCard from '../components/FoodCard';
import Header from '../components/Header';
import type { Food } from '../api/foods';
import { fetchFoods } from '../api/foods';
import heConfig from '../../../shared/he.json';

type HeFoodItem = {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  active?: boolean;
  svgLabel: string;
  svgBg: string;
  svgFg: string;
  imageFile?: string;
};

type HeCategory = {
  key: string;
  name: string;
  priority: number;
};

export default function Menu() {
  const [menuData, setMenuData] = useState<Record<string, Food[] | null>>({
    starters: null,
    pizzas: null,
    desserts: null,
  });
  const [error, setError] = useState<string | null>(null);

  const { strings, foods: heFoods, categories: heCategories } = heConfig as unknown as {
    strings: {
      logo: string;
      searchPlaceholder: string;
      title: string;
      subtitle: string;
      menuTitleStarters: string;
      menuTitlePizzas: string;
      menuTitleDesserts: string;
      loading: string;
      errorLoadingMenu: string;
      orderNowButton: string;
    };
    foods: HeFoodItem[];
    categories: HeCategory[];
  };

  const sortedCategories = useMemo(() => {
    return [...heCategories].sort((a, b) => a.priority - b.priority);
  }, [heCategories]);

  const fallbackData = useMemo(() => {
    const allFoods = heFoods.map((p) => ({
      id: p.id,
      name: p.name,
      description: p.description,
      price: p.price,
      category: p.category,
      active: p.active ?? true,
      imageUrl: `/images/${p.imageFile}`
    }));
    const result: Record<string, Food[]> = {};
    for (const cat of heCategories) {
      result[cat.key] = allFoods.filter(f => f.category === cat.key);
    }
    return result;
  }, [heFoods, heCategories]);

  useEffect(() => {
    const initialData: Record<string, Food[] | null> = {};
    for (const cat of heCategories) {
      initialData[cat.key] = null;
    }
    setMenuData(initialData);

    let cancelled = false;
    (async () => {
      try {
        setError(null);
        const data = await fetchFoods();
        if (!cancelled) setMenuData({
          starters: data.starters,
          pizzas: data.pizzas,
          desserts: data.desserts,
        });
      } catch (e) {
        if (!cancelled) setMenuData(fallbackData);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [fallbackData, heCategories]);

  return (
    <div className="page">
      <Header />

      {sortedCategories.map((cat) => (
        <section key={cat.key} className="menuSection">
          <h2 className="menuSection__title">{cat.name}</h2>
          {menuData[cat.key] === null ? (
            <div className="menuLoading">{strings.loading}</div>
          ) : (
            <>
              {error ? <div className="menuError">{error}</div> : null}
              <div className="menuGrid">
                {menuData[cat.key]!.filter(item => item.active).map((item) => (
                  <FoodCard key={item.id} item={item} />
                ))}
              </div>
            </>
          )}
        </section>
      ))}
    </div>
  );
}

