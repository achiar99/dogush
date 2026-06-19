import { Navigate, Route, Routes } from 'react-router-dom';
import Menu from './pages/Menu';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';
import AdminOrders from './pages/AdminOrders';
import ProductEditor from './pages/ProductEditor';
import CategoryEditor from './pages/CategoryEditor';
import AdminAnalytics from './pages/AdminAnalytics';
import AdminCustomers from './pages/AdminCustomers';
import RequireAdmin from './components/RequireAdmin';
import InstallPrompt from './components/InstallPrompt';
import OrderHistory from './pages/OrderHistory';
import OrderTrack from './pages/OrderTrack';

export default function App() {
  return (
    <>
    <InstallPrompt />
    <Routes>
      <Route path="/" element={<Menu />} />
      <Route path="/menu" element={<Menu />} />
      <Route path="/admin" element={<AdminLogin />} />
      <Route path="/admin/dashboard" element={<RequireAdmin><AdminDashboard /></RequireAdmin>} />
      <Route path="/admin/products" element={<RequireAdmin><ProductEditor /></RequireAdmin>} />
      <Route path="/admin/editor" element={<RequireAdmin><ProductEditor /></RequireAdmin>} />
      <Route path="/admin/orders" element={<RequireAdmin><AdminOrders /></RequireAdmin>} />
      <Route path="/admin/categories" element={<RequireAdmin><CategoryEditor /></RequireAdmin>} />
      <Route path="/admin/analytics" element={<RequireAdmin><AdminAnalytics /></RequireAdmin>} />
      <Route path="/admin/customers" element={<RequireAdmin><AdminCustomers /></RequireAdmin>} />
      <Route path="/orders" element={<OrderHistory />} />
      <Route path="/track" element={<OrderTrack />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
    </>
  );
}

