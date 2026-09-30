import { lazy, Suspense } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Navigate, Route, Routes } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { Layout } from './components/Layout';
import { ProtectedRoute } from './components/ProtectedRoute';

const LoginPage = lazy(() => import('./pages/Login').then((module) => ({ default: module.LoginPage })));
const DashboardPage = lazy(() => import('./pages/Dashboard').then((module) => ({ default: module.DashboardPage })));
const UserListPage = lazy(() => import('./pages/users/UserList').then((module) => ({ default: module.UserListPage })));
const UserDetailPage = lazy(() => import('./pages/users/UserDetail').then((module) => ({ default: module.UserDetailPage })));
const CategoryListPage = lazy(() => import('./pages/categories/CategoryList').then((module) => ({ default: module.CategoryListPage })));
const ProductListPage = lazy(() => import('./pages/products/ProductList').then((module) => ({ default: module.ProductListPage })));
const ProductDetailPage = lazy(() => import('./pages/products/ProductDetail').then((module) => ({ default: module.ProductDetailPage })));
const OrderListPage = lazy(() => import('./pages/orders/OrderList').then((module) => ({ default: module.OrderListPage })));
const OrderDetailPage = lazy(() => import('./pages/orders/OrderDetail').then((module) => ({ default: module.OrderDetailPage })));
const PaymentListPage = lazy(() => import('./pages/payments/PaymentList').then((module) => ({ default: module.PaymentListPage })));
const LicenseListPage = lazy(() => import('./pages/licenses/LicenseList').then((module) => ({ default: module.LicenseListPage })));
const ReviewListPage = lazy(() => import('./pages/reviews/ReviewList').then((module) => ({ default: module.ReviewListPage })));
const ReportListPage = lazy(() => import('./pages/reports/ReportList').then((module) => ({ default: module.ReportListPage })));
const WalletListPage = lazy(() => import('./pages/wallets/WalletList').then((module) => ({ default: module.WalletListPage })));

const queryClient = new QueryClient();

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
      <Suspense fallback={<div className="p-8 text-sm text-slate-500">Đang tải...</div>}>
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
          <Route path="wallets" element={<WalletListPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
      </Suspense>
    </QueryClientProvider>
  );
}
