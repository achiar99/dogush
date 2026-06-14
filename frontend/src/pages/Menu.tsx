import { useEffect, useMemo, useState } from 'react';
import ItemCard from '../components/ItemCard';
import Header from '../components/Header';
import type { Item } from '../api/items';
import { fetchItems } from '../api/items';
import heConfig from '../../../shared/he.json';

type HeCategory = { key: string; name: string; priority: number };

export default function Menu() {
  const [itemsByCategory, setItemsByCategory] = useState<Record<string, Item[]>>({});

  const { foods: heItems, categories: heCategories } = heConfig as {
    foods: Array<{ id: string; name: string; description: string; price: number; category: string; active?: boolean; imageFile?: string }>;
    categories: HeCategory[];
  };

  const sortedCategories = useMemo(
    () => [...heCategories].sort((a, b) => a.priority - b.priority),
    [heCategories],
  );

  const fallbackByCategory = useMemo(() => {
    const result: Record<string, Item[]> = {};
    for (const cat of heCategories) {
      result[cat.key] = heItems
        .filter(p => p.category === cat.key)
        .map(p => ({
          id: p.id, name: p.name, description: p.description,
          price: p.price, category: p.category, active: p.active ?? true,
          imageUrl: `/images/${p.imageFile}`,
        }));
    }
    return result;
  }, [heItems, heCategories]);

  useEffect(() => {
    fetchItems()
      .then(items => {
        const byCategory: Record<string, Item[]> = {};
        for (const cat of heCategories) {
          byCategory[cat.key] = items.filter(i => i.category === cat.key && i.active);
        }
        setItemsByCategory(byCategory);
      })
      .catch(() => setItemsByCategory(fallbackByCategory));
  }, []);

  const data = Object.keys(itemsByCategory).length > 0 ? itemsByCategory : fallbackByCategory;

  return (
    <div className="page">
      <Header />
      {sortedCategories
        .filter(cat => (data[cat.key] ?? []).length > 0)
        .map(cat => (
          <section key={cat.key} className="menuSection">
            <h2 className="menuSection__title">{cat.name}</h2>
            <div className="menuGrid">
              {(data[cat.key] ?? []).map(item => (
                <ItemCard key={item.id} item={item} />
              ))}
            </div>
          </section>
        ))}
    </div>
  );
}
