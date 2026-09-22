import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Navigate, Route, Routes } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { Layout } from './components/Layout';
import { ProtectedRoute } from './components/ProtectedRoute';
import { LoginPage } from './pages/Login';
import { DashboardPage } from './pages/Dashboard';
import { UserListPage } from './pages/users/UserList';
import { UserDetailPage } from './pages/users/UserDetail';
import { CategoryListPage } from './pages/categories/CategoryList';
import { ProductListPage } from './pages/products/ProductList';
import { ProductDetailPage } from './pages/products/ProductDetail';
import { OrderListPage } from './pages/orders/OrderList';
import { OrderDetailPage } from './pages/orders/OrderDetail';
import { PaymentListPage } from './pages/payments/PaymentList';
import { LicenseListPage } from './pages/licenses/LicenseList';
import { ReviewListPage } from './pages/reviews/ReviewList';
import { ReportListPage } from './pages/reports/ReportList';

const queryClient = new QueryClient();

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="users" element={<UserListPage />} />
          <Route path="users/:id" element={<UserDetailPage />} />
          <Route path="categories" element={<CategoryListPage />} />
          <Route path="products" element={<ProductListPage />} />
          <Route path="products/:id" element={<ProductDetailPage />} />
          <Route path="orders" element={<OrderListPage />} />
          <Route path="orders/:id" element={<OrderDetailPage />} />
          <Route path="payments" element={<PaymentListPage />} />
          <Route path="licenses" element={<LicenseListPage />} />
          <Route path="reviews" element={<ReviewListPage />} />
          <Route path="reports" element={<ReportListPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </QueryClientProvider>
  );
}
