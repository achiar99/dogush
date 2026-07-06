import { useEffect, useMemo, useRef, useState } from 'react';
import ItemCard from '../components/ItemCard';
import Header from '../components/Header';
import WhatsAppButton from '../components/WhatsAppButton';
import type { Item } from '../api/items';
import heConfig from '../../../shared/he.json';
import { trackPageView } from '../api/track';

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
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});

  useEffect(() => { trackPageView(); }, []);

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

  useEffect(() => {
    if (visibleCategories.length === 0) return;
    const observers: IntersectionObserver[] = [];
    visibleCategories.forEach(cat => {
      const el = sectionRefs.current[cat.key];
      if (!el) return;
      const obs = new IntersectionObserver(
        ([entry]) => { if (entry.isIntersecting) setActiveCategory(cat.key); },
        { rootMargin: '-20% 0px -70% 0px' }
      );
      obs.observe(el);
      observers.push(obs);
    });
    return () => observers.forEach(o => o.disconnect());
  }, [visibleCategories]);

  const scrollToCategory = (key: string) => {
    sectionRefs.current[key]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const searchResults = useMemo(() => {
    if (!search.trim()) return null;
    const q = search.toLowerCase();
    return items.filter(i => i.active !== false && (
      i.name?.toLowerCase().includes(q) || i.description?.toLowerCase().includes(q)
    ));
  }, [search, items]);

  if (loading) return <div className="page"><Header /><p style={{ textAlign: 'center', marginTop: 40 }}>{heConfig.strings.loading}</p></div>;
  if (error)   return <div className="page"><Header /><p style={{ textAlign: 'center', marginTop: 40 }}>{heConfig.strings.errorLoadingMenu}</p></div>;

  return (
    <div className="page">
      <Header cartOpen={cartOpen} onCartOpenChange={setCartOpen} />

      {/* Search bar */}
      <div className="searchBar">
        <div style={{ position: 'relative', width: '100%', maxWidth: 400 }}>
          <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 15, pointerEvents: 'none', color: '#aaa' }}>🔍</span>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={heConfig.strings.searchPlaceholder}
            style={{
              width: '100%', padding: '8px 38px 8px 36px', borderRadius: 999,
              border: '1.5px solid #ddd3c4', fontSize: '0.9rem',
              fontFamily: 'inherit', outline: 'none', background: '#fff',
              color: '#333', direction: 'rtl', boxSizing: 'border-box',
            }}
          />
          {search && (
            <button onClick={() => setSearch('')} style={{
              position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)',
              background: 'none', border: 'none', cursor: 'pointer', color: '#aaa', fontSize: 14, padding: 0,
            }}>✕</button>
          )}
        </div>
      </div>

      {/* Category nav pills */}
      {!search && visibleCategories.length > 1 && (
        <nav className="categoryNav">
          {visibleCategories.map(cat => (
            <button
              key={cat.key}
              className={`categoryNav__pill${activeCategory === cat.key ? ' categoryNav__pill--active' : ''}`}
              onClick={() => scrollToCategory(cat.key)}
            >
              {cat.name}
            </button>
          ))}
        </nav>
      )}

      {/* Search results */}
      {searchResults !== null ? (
        <section className="menuSection">
          <h2 className="menuSection__title">
            {searchResults.length > 0 ? `${searchResults.length} תוצאות` : 'לא נמצאו תוצאות'}
          </h2>
          <div className="menuGrid">
            {searchResults.map(item => (
              <ItemCard key={item.id} item={item} />
            ))}
          </div>
        </section>
      ) : (
        visibleCategories.map(cat => (
          <section
            key={cat.key}
            className="menuSection"
            ref={el => { sectionRefs.current[cat.key] = el; }}
          >
            <h2 className="menuSection__title">{cat.name}</h2>
            <div className="menuGrid">
              {(byCategory[cat.key] ?? []).map(item => (
                <ItemCard key={item.id} item={item} />
              ))}
            </div>
          </section>
        ))
      )}
      <WhatsAppButton />
    </div>
  );
}
