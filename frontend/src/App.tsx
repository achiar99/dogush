import { Navigate, Route, Routes } from 'react-router-dom';
import Menu from './pages/Menu';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';
import AdminOrders from './pages/AdminOrders';
import ProductEditor from './pages/ProductEditor';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Menu />} />
      <Route path="/menu" element={<Menu />} />
      <Route path="/admin" element={<AdminLogin />} />
      <Route path="/admin/dashboard" element={<AdminDashboard />} />
      <Route path="/admin/products" element={<ProductEditor />} />
      <Route path="/admin/editor" element={<ProductEditor />} />
      <Route path="/admin/orders" element={<AdminOrders />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

