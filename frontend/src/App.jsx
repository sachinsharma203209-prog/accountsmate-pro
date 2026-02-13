import { BrowserRouter, Route, Routes } from 'react-router-dom';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import { AuthProvider } from './context/AuthContext';
import HomePage from './pages/HomePage';
import ProductDetailsPage from './pages/ProductDetailsPage';
import CartPage from './pages/CartPage';
import LoginPage from './pages/LoginPage';
import OrdersPage from './pages/OrdersPage';
import OrderDetailsPage from './pages/OrderDetailsPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import AdminProductsPage from './pages/AdminProductsPage';
import AdminCategoriesPage from './pages/AdminCategoriesPage';
import AdminOrdersPage from './pages/AdminOrdersPage';
import AdminUsersPage from './pages/AdminUsersPage';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<HomePage />} />
            <Route path="products/:id" element={<ProductDetailsPage />} />
            <Route path="login" element={<LoginPage />} />
            <Route path="cart" element={<ProtectedRoute><CartPage /></ProtectedRoute>} />
            <Route path="orders" element={<ProtectedRoute><OrdersPage /></ProtectedRoute>} />
            <Route path="orders/:id" element={<ProtectedRoute><OrderDetailsPage /></ProtectedRoute>} />

            <Route path="admin" element={<ProtectedRoute adminOnly><AdminDashboardPage /></ProtectedRoute>} />
            <Route path="admin/products" element={<ProtectedRoute adminOnly><AdminProductsPage /></ProtectedRoute>} />
            <Route path="admin/categories" element={<ProtectedRoute adminOnly><AdminCategoriesPage /></ProtectedRoute>} />
            <Route path="admin/orders" element={<ProtectedRoute adminOnly><AdminOrdersPage /></ProtectedRoute>} />
            <Route path="admin/users" element={<ProtectedRoute adminOnly><AdminUsersPage /></ProtectedRoute>} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
