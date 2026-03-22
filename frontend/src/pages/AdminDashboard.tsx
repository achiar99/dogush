import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import type { Food } from '../api/foods';
import heConfig from '../../../shared/he.json';

export default function AdminDashboard() {
  const [foods, setFoods] = useState<Food[]>([]);
  const [editing, setEditing] = useState<Food | null>(null);
  const [saveStatus, setSaveStatus] = useState('');
  const navigate = useNavigate();

  const config = heConfig as {
    categories: Array<{ key: string; name: string }>;
    adminLogoutButton: string;
    adminDashboardTitle: string;
    tableHeaderName: string;
    tableHeaderPrice: string;
    tableHeaderCategory: string;
    tableHeaderActive: string;
    tableHeaderActions: string;
    editButton: string;
    saveButton: string;
    cancelButton: string;
    editProductTitle: string;
    savedMessage: string;
    activeYes: string;
    activeNo: string;
  };

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      navigate('/admin');
      return;
    }
    fetchFoods();
  }, [navigate]);

  const fetchFoods = async () => {
    const res = await fetch('/api/admin/foods');
    if (res.ok) {
      const data = await res.json();
      setFoods(data);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    navigate('/admin');
  };

  const handleSave = async () => {
    if (!editing) return;
    const res = await fetch('/api/admin/foods', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editing),
    });
    if (res.ok) {
      setFoods(foods.map(f => f.id === editing.id ? editing : f));
      setEditing(null);
      setSaveStatus(config.savedMessage);
      setTimeout(() => setSaveStatus(''), 2000);
    }
  };

  return (
    <div className="page">
      <Header />
      <div className="admin-dashboard">
        <header className="admin-header">
          <h1>{config.adminDashboardTitle}</h1>
          <button onClick={handleLogout}>{config.adminLogoutButton}</button>
        </header>

        {saveStatus && <div className="save-status">{saveStatus}</div>}

        <table className="admin-table">
          <thead>
            <tr>
              <th>{config.tableHeaderName}</th>
              <th>{config.tableHeaderPrice}</th>
              <th>{config.tableHeaderCategory}</th>
              <th>{config.tableHeaderActive}</th>
              <th>{config.tableHeaderActions}</th>
            </tr>
          </thead>
          <tbody>
            {foods.map(food => (
              <tr key={food.id}>
                <td>{food.name}</td>
                <td>₪{food.price}</td>
                <td>{config.categories.find(c => c.key === food.category)?.name || food.category}</td>
                <td>{food.active ? config.activeYes : config.activeNo}</td>
                <td>
                  <button onClick={() => setEditing({ ...food })}>{config.editButton}</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {editing && (
          <div className="modal">
            <div className="modal-content">
              <h2>{config.editProductTitle}</h2>
              <label>
                {config.tableHeaderName}:
                <input
                  type="text"
                  value={editing.name}
                  onChange={e => setEditing({ ...editing, name: e.target.value })}
                />
              </label>
              <label>
                {config.tableHeaderPrice}:
                <input
                  type="number"
                  value={editing.price}
                  onChange={e => setEditing({ ...editing, price: Number(e.target.value) })}
                />
              </label>
              <label>
                {config.tableHeaderCategory}:
                <select
                  value={editing.category}
                  onChange={e => setEditing({ ...editing, category: e.target.value })}
                >
                  {config.categories.map(c => (
                    <option key={c.key} value={c.key}>{c.name}</option>
                  ))}
                </select>
              </label>
              <label className="checkbox-label">
                {config.tableHeaderActive}:
                <input
                  type="checkbox"
                  checked={editing.active}
                  onChange={e => setEditing({ ...editing, active: e.target.checked })}
                />
              </label>
              <div className="modal-buttons">
                <button onClick={handleSave}>{config.saveButton}</button>
                <button onClick={() => setEditing(null)}>{config.cancelButton}</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
