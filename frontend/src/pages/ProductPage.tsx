import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import Header from '../components/Header';
import { fetchItems, type Item } from '../api/items';
import heConfig from '../../../shared/he.json';
import { useCart } from '../context/CartContext';
import { fireCartToast } from '../components/CartToast';

const { strings, currencySymbol } = heConfig as {
  strings: { addToCartButton: string; productNotFound: string; backToMenu: string; loading: string };
  currencySymbol: string;
};

export default function ProductPage() {
  const { id } = useParams();
  const { add } = useCart();
  const [item, setItem] = useState<Item | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'ingredients' | 'nutrition' | 'feeding'>('ingredients');
  const [addedFlash, setAddedFlash] = useState(false);

  useEffect(() => {
    fetchItems()
      .then(items => setItem(items.find(i => i.id === id) ?? null))
      .finally(() => setLoading(false));
  }, [id]);

  const handleAddToCart = () => {
    if (!item) return;
    add({ id: item.id, name: item.name, price: item.price, imageFile: item.imageFile });
    fireCartToast(item.name, item.imageFile);
    setAddedFlash(true);
    setTimeout(() => setAddedFlash(false), 1200);
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', direction: 'rtl' }}>
        <Header />
        <p style={{ textAlign: 'center', marginTop: 40 }}>{strings.loading}</p>
      </div>
    );
  }

  if (!item) {
    return (
      <div style={{ minHeight: '100vh', direction: 'rtl' }}>
        <Header />
        <div style={{ textAlign: 'center', marginTop: 40 }}>
          <p>{strings.productNotFound}</p>
          <Link to="/" style={{ color: '#c15f2a', fontWeight: 700 }}>{strings.backToMenu}</Link>
        </div>
      </div>
    );
  }

  const hasIngredients = !!item.ingredients;
  const hasNutrition = (item.nutritionalValues?.length ?? 0) > 0;
  const hasFeeding = (item.feedingTable?.length ?? 0) > 0;

  const tabs = [
    hasIngredients && { key: 'ingredients' as const, label: '🧬 מרכיבים' },
    hasNutrition   && { key: 'nutrition'   as const, label: '% תכולה תזונתית' },
    hasFeeding     && { key: 'feeding'     as const, label: '📏 טבלת האכלה' },
  ].filter(Boolean) as { key: typeof tab; label: string }[];

  const outOfStock = typeof item.stock === 'number' && item.stock === 0;

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#faf9f6', direction: 'rtl' }}>
      <Header />
      <div style={{ maxWidth: 640, margin: '0 auto', padding: '24px 16px 48px' }}>
        <Link to="/" style={{ color: '#888', fontSize: '0.85rem', textDecoration: 'none' }}>← {strings.backToMenu}</Link>

        <div style={{
          background: '#fff', borderRadius: 20, marginTop: 16, overflow: 'hidden',
          boxShadow: '0 2px 12px rgba(0,0,0,0.07)',
        }}>
          <div style={{
            height: 280, background: 'linear-gradient(145deg, #fdf8f2, #f0ebe1)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            {item.imageFile
              ? <img src={item.imageFile} alt={item.name} style={{ width: '70%', height: '82%', objectFit: 'contain' }} />
              : <span style={{ fontSize: 72 }}>🐾</span>
            }
          </div>

          <div style={{ padding: '20px 24px 28px' }}>
            <h1 style={{ margin: 0, fontSize: '1.4rem' }}>{item.name}</h1>
            {item.weight && <p style={{ color: '#888', fontSize: '0.9rem', margin: '4px 0 0' }}>⚖️ {item.weight}</p>}
            <p style={{ color: '#555', lineHeight: 1.6, marginTop: 14 }}>{item.description}</p>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 20 }}>
              <div style={{ fontWeight: 900, fontSize: 28 }}>{currencySymbol}{item.price}</div>
              {outOfStock ? (
                <span style={{ padding: '10px 18px', borderRadius: 14, backgroundColor: '#f3f3f3', color: '#aaa', fontWeight: 700, fontSize: '0.9rem' }}>
                  אזל מהמלאי
                </span>
              ) : (
                <button
                  onClick={handleAddToCart}
                  style={{
                    padding: '0 24px', height: 46, borderRadius: 14, border: 'none',
                    background: addedFlash ? '#22c55e' : '#c15f2a', color: '#fff',
                    fontWeight: 700, fontSize: 15, fontFamily: 'inherit', cursor: 'pointer',
                  }}
                >
                  {addedFlash ? '✓ נוסף לסל' : strings.addToCartButton}
                </button>
              )}
            </div>

            {tabs.length > 0 && (
              <div style={{ marginTop: 28 }}>
                {tabs.length > 1 && (
                  <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid #eee', marginBottom: 16 }}>
                    {tabs.map(t => (
                      <button key={t.key} onClick={() => setTab(t.key)} style={{
                        padding: '8px 14px', background: 'none', border: 'none', cursor: 'pointer',
                        fontWeight: tab === t.key ? 700 : 400, fontSize: '0.9rem',
                        borderBottom: tab === t.key ? '2px solid #c15f2a' : '2px solid transparent',
                        color: tab === t.key ? '#c15f2a' : '#555', fontFamily: 'inherit',
                      }}>{t.label}</button>
                    ))}
                  </div>
                )}

                {(tab === 'ingredients' || tabs.length === 1) && hasIngredients && (
                  <p style={{ lineHeight: 1.7, color: '#444', fontSize: '0.95rem', margin: 0 }}>{item.ingredients}</p>
                )}

                {(tab === 'nutrition' || tabs.length === 1) && hasNutrition && (
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ borderBottom: '2px solid #1e1e2e' }}>
                        <th style={{ textAlign: 'right', padding: '8px 4px', fontSize: '0.9rem' }}>ערך תזונתי</th>
                        <th style={{ textAlign: 'left', padding: '8px 4px', fontSize: '0.9rem' }}>תכולה</th>
                      </tr>
                    </thead>
                    <tbody>
                      {item.nutritionalValues!.map((row, i) => (
                        <tr key={i} style={{ borderBottom: '1px solid #f0f0f0' }}>
                          <td style={{ padding: '9px 4px', fontSize: '0.9rem' }}>{row.name}</td>
                          <td style={{ padding: '9px 4px', fontSize: '0.9rem', textAlign: 'left' }}>{row.value}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}

                {(tab === 'feeding' || tabs.length === 1) && hasFeeding && (
                  <>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ borderBottom: '2px solid #1e1e2e' }}>
                          <th style={{ textAlign: 'right', padding: '8px 4px', fontSize: '0.9rem' }}>משקל חיית מחמד</th>
                          <th style={{ textAlign: 'left', padding: '8px 4px', fontSize: '0.9rem' }}>כמות מומלצת ליום</th>
                        </tr>
                      </thead>
                      <tbody>
                        {item.feedingTable!.map((row, i) => (
                          <tr key={i} style={{ borderBottom: '1px solid #f0f0f0' }}>
                            <td style={{ padding: '9px 4px', fontSize: '0.9rem' }}>{row.petWeight}</td>
                            <td style={{ padding: '9px 4px', fontSize: '0.9rem', textAlign: 'left' }}>{row.amount}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {item.feedingNote && (
                      <p style={{ marginTop: 12, fontSize: '0.82rem', color: '#888', lineHeight: 1.6 }}>{item.feedingNote}</p>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
