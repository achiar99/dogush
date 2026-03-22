import { useState } from 'react';
import AdminLayout from '../components/AdminLayout';
import heConfig from '../../../shared/he.json';

const { strings, foods: initialFoods, categories } = heConfig as unknown as {
  strings: {
    adminFoodEditorTitle: string;
    foodEditorSave: string;
    foodEditorSaved: string;
    foodEditorTableName: string;
    foodEditorTableCategory: string;
    foodEditorTablePrice: string;
    foodEditorTableActive: string;
    foodEditorModalTitle: string;
    foodEditorModalName: string;
    foodEditorModalDescription: string;
    foodEditorModalPrice: string;
    foodEditorModalCategory: string;
    foodEditorModalActive: string;
    foodEditorModalImage: string;
    foodEditorModalClose: string;
  };
  foods: Array<{
    id: string;
    name: string;
    description: string;
    price: number;
    category: string;
    active: boolean;
    imageFile?: string;
  }>;
  categories: Array<{ key: string; name: string }>;
};

type Food = typeof initialFoods[0];

export default function FoodEditor() {
  const [foods, setFoods] = useState(initialFoods);
  const [selectedFood, setSelectedFood] = useState<Food | null>(null);

  const getCategoryName = (key: string) => {
    const cat = categories.find(c => c.key === key);
    return cat?.name || key;
  };

  const openEditor = (food: Food) => {
    setSelectedFood({ ...food });
  };

  const handleModalChange = (field: keyof Food, value: string | boolean | number) => {
    if (!selectedFood) return;
    setSelectedFood({ ...selectedFood, [field]: value });
  };

  const saveChanges = () => {
    if (!selectedFood) return;
    setFoods(prev => prev.map(f => f.id === selectedFood.id ? selectedFood : f));
    setSelectedFood(null);
  };

  return (
    <AdminLayout>
      <h1>{strings.adminFoodEditorTitle}</h1>
      <table style={{ width: '100%', borderCollapse: 'collapse', direction: 'rtl' }}>
        <thead>
          <tr style={{ backgroundColor: '#f9f9f9', borderBottom: '2px solid #eee' }}>
            <th style={{ textAlign: 'right', padding: 12 }}>{strings.foodEditorTableName}</th>
            <th style={{ textAlign: 'right', padding: 12 }}>{strings.foodEditorTableCategory}</th>
            <th style={{ textAlign: 'right', padding: 12 }}>{strings.foodEditorTablePrice}</th>
            <th style={{ textAlign: 'center', padding: 12 }}>{strings.foodEditorTableActive}</th>
          </tr>
        </thead>
        <tbody>
          {foods.map(food => (
            <tr 
              key={food.id} 
              onClick={() => openEditor(food)}
              style={{ 
                borderBottom: '1px solid #eee',
                backgroundColor: food.active ? '#d4edda' : '#f8d7da',
                cursor: 'pointer',
              }}
            >
              <td style={{ padding: 12 }}>{food.name}</td>
              <td style={{ padding: 12 }}>{getCategoryName(food.category)}</td>
              <td style={{ padding: 12 }}>{food.price} ₪</td>
              <td style={{ textAlign: 'center', padding: 12 }}>
                {food.active ? '✓' : '✗'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {selectedFood && (
        <>
          <style>{`
            @media (max-width: 767px) {
              .modal-overlay {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background-color: #fff;
                z-index: 1000;
                overflow-y: auto;
              }
              .modal-content {
                padding: 16px;
                min-height: 100vh;
              }
              .modal-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding-bottom: 16px;
                border-bottom: 1px solid #ddd;
                margin-bottom: 16px;
              }
              .modal-close-btn {
                display: flex;
                flex-direction: column;
                gap: 5px;
                padding: 8px;
                background: none;
                border: none;
                cursor: pointer;
              }
              .modal-close-btn span {
                display: block;
                width: 25px;
                height: 3px;
                background-color: #333;
                border-radius: 2px;
              }
            }
            @media (min-width: 768px) {
              .modal-overlay {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background-color: rgba(0,0,0,0.5);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 1000;
              }
              .modal-content {
                background-color: #fff;
                padding: 24px;
                border-radius: 8px;
                width: 500px;
                max-height: 80vh;
                overflow-y: auto;
              }
              .mobile-close-btn {
                display: none !important;
              }
            }
          `}</style>
          <div className="modal-overlay">
            <div className="modal-content">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 16, borderBottom: '1px solid #ddd', marginBottom: 16 }}>
                <h2 style={{ margin: 0 }}>{strings.foodEditorModalTitle}</h2>
                <button 
                  onClick={() => setSelectedFood(null)} 
                  className="mobile-close-btn"
                  style={{ display: 'flex', flexDirection: 'column', gap: 5, padding: 8, background: 'none', border: 'none', cursor: 'pointer' }}
                >
                  <span style={{ display: 'block', width: 25, height: 3, backgroundColor: '#333', borderRadius: 2 }}></span>
                  <span style={{ display: 'block', width: 25, height: 3, backgroundColor: '#333', borderRadius: 2 }}></span>
                  <span style={{ display: 'block', width: 25, height: 3, backgroundColor: '#333', borderRadius: 2 }}></span>
                </button>
              </div>
            
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', marginBottom: 4 }}>{strings.foodEditorModalName}</label>
              <div style={{ padding: 8, backgroundColor: '#f5f5f5', borderRadius: 4 }}>{selectedFood.name}</div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', marginBottom: 4 }}>{strings.foodEditorModalDescription}</label>
              <textarea
                value={selectedFood.description}
                onChange={(e) => handleModalChange('description', e.target.value)}
                style={{ width: '100%', padding: 8, minHeight: 100 }}
              />
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', marginBottom: 4 }}>{strings.foodEditorModalPrice}</label>
              <input
                type="number"
                value={selectedFood.price}
                onChange={(e) => handleModalChange('price', Number(e.target.value))}
                style={{ width: '100%', padding: 8 }}
              />
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', marginBottom: 4 }}>{strings.foodEditorModalCategory}</label>
              <select
                value={selectedFood.category}
                onChange={(e) => handleModalChange('category', e.target.value)}
                style={{ width: '100%', padding: 8 }}
              >
                {categories.map(cat => (
                  <option key={cat.key} value={cat.key}>{cat.name}</option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', marginBottom: 4 }}>{strings.foodEditorModalImage}</label>
              <input
                type="text"
                value={selectedFood.imageFile || ''}
                onChange={(e) => handleModalChange('imageFile', e.target.value)}
                placeholder="image.png"
                style={{ width: '100%', padding: 8 }}
              />
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={selectedFood.active}
                  onChange={(e) => handleModalChange('active', e.target.checked)}
                  style={{ width: 18, height: 18 }}
                />
                {strings.foodEditorModalActive}
              </label>
            </div>

            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button 
                onClick={() => setSelectedFood(null)}
                style={{ padding: '10px 20px', cursor: 'pointer' }}
              >
                {strings.foodEditorModalClose}
              </button>
              <button 
                onClick={saveChanges}
                style={{ padding: '10px 20px', backgroundColor: '#28a745', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer' }}
              >
                {strings.foodEditorSave}
              </button>
            </div>
          </div>
        </div>
        </>
      )}
    </AdminLayout>
  );
}
