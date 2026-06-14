import { useEffect, useMemo, useState } from 'react';
import ItemCard from '../components/ItemCard';
import Header from '../components/Header';
import type { Item } from '../api/items';
import heConfig from '../../../shared/he.json';

interface Category {
  key: string;
  name: string;
  priority: number;
}

const API = import.meta.env.VITE_API_BASE_URL || '';

export default function Menu() {
  const [items, setItems] = useState<Item[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch(`${API}/api/products`).then(r => r.json()),
      fetch(`${API}/api/categories`).then(r => r.json()),
    ])
      .then(([prods, cats]) => {
        setItems(Array.isArray(prods) ? prods : []);
        setCategories(Array.isArray(cats) ? cats.sort((a: Category, b: Category) => a.priority - b.priority) : []);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  const byCategory = useMemo(() => {
    const result: Record<string, Item[]> = {};
    for (const cat of categories) {
      result[cat.key] = items.filter(i => i.category === cat.key && i.active !== false);
    }
    // also show products whose category has no matching category entry
    for (const item of items) {
      if (item.active !== false && !categories.find(c => c.key === item.category)) {
        result[item.category] = result[item.category] ?? [];
        result[item.category].push(item);
      }
    }
    return result;
  }, [items, categories]);

  const visibleCategories = useMemo(() => {
    const fromApi = categories.filter(c => (byCategory[c.key] ?? []).length > 0);
    // add any orphan category keys not in the categories list
    const orphanKeys = Object.keys(byCategory).filter(k => !categories.find(c => c.key === k));
    const orphans: Category[] = orphanKeys.map(k => ({ key: k, name: k, priority: 999 }));
    return [...fromApi, ...orphans];
  }, [categories, byCategory]);

  if (loading) return <div className="page"><Header /><p style={{ textAlign: 'center', marginTop: 40 }}>{heConfig.strings.loading}</p></div>;
  if (error)   return <div className="page"><Header /><p style={{ textAlign: 'center', marginTop: 40 }}>{heConfig.strings.errorLoadingMenu}</p></div>;

  return (
    <div className="page">
      <Header cartOpen={cartOpen} onCartOpenChange={setCartOpen} />
      {visibleCategories.map(cat => (
        <section key={cat.key} className="menuSection">
          <h2 className="menuSection__title">{cat.name}</h2>
          <div className="menuGrid">
            {(byCategory[cat.key] ?? []).map(item => (
              <ItemCard key={item.id} item={item} onOrderNow={() => setCartOpen(true)} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
