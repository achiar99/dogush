import { useState } from 'react';
import type { Item } from '../api/items';
import heConfig from '../../../shared/he.json';
import { useCart } from '../context/CartContext';
import { fireCartToast } from './CartToast';

const { strings, currencySymbol } = heConfig as {
  strings: { orderNowButton: string };
  currencySymbol: string;
};

type Props = { item: Item; onOrderNow?: () => void };

function ProductDetailsModal({ item, onClose }: { item: Item; onClose: () => void }) {
  const [tab, setTab] = useState<'ingredients' | 'nutrition' | 'feeding'>('ingredients');
  const hasIngredients = !!item.ingredients;
  const hasNutrition = (item.nutritionalValues?.length ?? 0) > 0;
  const hasFeeding = (item.feedingTable?.length ?? 0) > 0;

  const tabs = [
    hasIngredients && { key: 'ingredients' as const, label: '🧬 מרכיבים' },
    hasNutrition   && { key: 'nutrition'   as const, label: '% תכולה תזונתית' },
    hasFeeding     && { key: 'feeding'     as const, label: '📏 טבלת האכלה' },
  ].filter(Boolean) as { key: typeof tab; label: string }[];

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 2000 }} />
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0,
        background: '#fff', borderRadius: '16px 16px 0 0',
        zIndex: 2001, direction: 'rtl', maxHeight: '80vh', display: 'flex', flexDirection: 'column',
        maxWidth: 600, margin: '0 auto',
      }}>
        {/* Header */}
        <div style={{ padding: '20px 20px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>{item.name}</div>
            {item.weight && <div style={{ color: '#888', fontSize: '0.85rem', marginTop: 2 }}>⚖️ {item.weight}</div>}
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '1.4rem', cursor: 'pointer', color: '#888', padding: '0 4px' }}>✕</button>
        </div>

        {/* Tabs */}
        {tabs.length > 1 && (
          <div style={{ display: 'flex', gap: 0, padding: '12px 20px 0', borderBottom: '1px solid #eee' }}>
            {tabs.map(t => (
              <button key={t.key} onClick={() => setTab(t.key)} style={{
                padding: '8px 14px', background: 'none', border: 'none', cursor: 'pointer',
                fontWeight: tab === t.key ? 700 : 400, fontSize: '0.88rem',
                borderBottom: tab === t.key ? '2px solid #c15f2a' : '2px solid transparent',
                color: tab === t.key ? '#c15f2a' : '#555', fontFamily: 'inherit',
              }}>{t.label}</button>
            ))}
          </div>
        )}

        {/* Content */}
        <div style={{ overflowY: 'auto', padding: '16px 20px 32px', flex: 1 }}>
          {(tab === 'ingredients' || tabs.length === 1 && hasIngredients) && hasIngredients && (
            <p style={{ lineHeight: 1.7, color: '#444', fontSize: '0.95rem', margin: 0 }}>{item.ingredients}</p>
          )}

          {(tab === 'nutrition' || tabs.length === 1 && hasNutrition) && hasNutrition && (
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

          {(tab === 'feeding' || tabs.length === 1 && hasFeeding) && hasFeeding && (
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
      </div>
    </>
  );
}

export default function ItemCard({ item, onOrderNow }: Props) {
  const { add } = useCart();
  const [addedFlash, setAddedFlash] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  const hasDetails = !!(item.ingredients || (item.nutritionalValues?.length ?? 0) > 0 || (item.feedingTable?.length ?? 0) > 0);

  const handleAddToCart = () => {
    add({ id: item.id, name: item.name, price: item.price, imageFile: item.imageFile });
    fireCartToast(item.name, item.imageFile);
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
    <>
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
          {item.weight && <p style={{ margin: '0 0 6px', fontSize: '0.8rem', color: '#888' }}>⚖️ {item.weight}</p>}
          {hasDetails && (
            <button onClick={() => setShowDetails(true)} style={{
              background: 'none', border: 'none', cursor: 'pointer', padding: '0 0 8px',
              color: '#c15f2a', fontSize: '0.82rem', fontWeight: 600, fontFamily: 'inherit', textDecoration: 'underline',
            }}>
              מפרט מוצר ▾
            </button>
          )}
          <div className="item-card__footer">
            {outOfStock ? (
              <span style={{ padding: '10px 14px', borderRadius: 14, backgroundColor: '#f3f3f3', color: '#aaa', fontWeight: 700, fontSize: '0.85rem', textAlign: 'center' }}>
                אזל מהמלאי
              </span>
            ) : (
              <div className="item-card__actions">
                <div className="item-card__price-row">
                  <button
                    className={`item-card__button item-card__button--secondary${addedFlash ? ' item-card__button--added' : ''}`}
                    type="button"
                    onClick={handleAddToCart}
                    title="הוסף לסל"
                  >
                    {addedFlash ? '✓' : '🛒'}
                  </button>
                  <div className="item-card__price">{currencySymbol}{item.price}</div>
                </div>
                <button className="item-card__button" type="button" onClick={handleOrderNow}>
                  {strings.orderNowButton}
                </button>
              </div>
            )}
          </div>
        </div>
      </article>

      {showDetails && <ProductDetailsModal item={item} onClose={() => setShowDetails(false)} />}
    </>
  );
}
