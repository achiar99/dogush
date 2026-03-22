import React from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import Menu from './pages/Menu';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';
import FoodEditor from './pages/FoodEditor';
import Tables from './pages/Tables';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Menu />} />
      <Route path="/menu" element={<Menu />} />
      <Route path="/admin" element={<AdminLogin />} />
      <Route path="/admin/dashboard" element={<AdminDashboard />} />
      <Route path="/admin/editor" element={<FoodEditor />} />
      <Route path="/admin/tables" element={<Tables />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

