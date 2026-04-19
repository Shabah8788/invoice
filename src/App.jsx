import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import { base44 } from '@/api/base44Client';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Invoices from './pages/Invoices';
import InvoiceCreate from './pages/InvoiceCreate';
import InvoiceDetail from './pages/InvoiceDetail';
import Customers from './pages/Customers';
import Products from './pages/Products';
import Settings from './pages/Settings';
import Pricing from './pages/Pricing';

// Renders nothing until auth check is done — then either shows app or redirects to login
function AuthGate({ children }) {
  const { isAuthenticated, isLoadingAuth, authError } = useAuth();

  // Always show spinner while checking auth — no page content leaks through
  if (isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin" />
      </div>
    );
  }

  if (authError?.type === 'user_not_registered') {
    return <UserNotRegisteredError />;
  }

  // Not authenticated — redirect immediately, render nothing
  if (!isAuthenticated) {
    base44.auth.redirectToLogin(window.location.href);
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin" />
      </div>
    );
  }

  return children;
}

function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <AuthGate>
          <Router>
            <Routes>
              <Route element={<Layout />}>
                <Route path="/" element={<Dashboard />} />
                <Route path="/invoices" element={<Invoices />} />
                <Route path="/invoices/new" element={<InvoiceCreate />} />
                <Route path="/invoices/:id" element={<InvoiceDetail />} />
                <Route path="/customers" element={<Customers />} />
                <Route path="/products" element={<Products />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/pricing" element={<Pricing />} />
              </Route>
              <Route path="*" element={<PageNotFound />} />
            </Routes>
          </Router>
        </AuthGate>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  );
}

export default App