
import { useEffect } from 'react';
import {
  BrowserRouter,
  Link,
  Navigate,
  Route,
  Routes,
  useLocation,
} from 'react-router-dom';

import MagneticCursor from './Components/MagneticCursor';
import IntroScreen from './Components/IntroScreen';
import Navbar from './Components/Navbar';
import Footer from './Components/Footer';
import AdminRoute from './Components/AdminRoute';
import ProtectedRoute from './Components/ProtectedRoute';

import { AuthProvider } from './context/AuthContext';
import { StoreProvider } from './context/StoreContext';

import Home from './Pages/Home';
import Products from './Pages/Products';
import ProductDetails from './Pages/ProductDetails';
import Login from './Pages/Login';
import Account from './Pages/Account';
import Cart from './Pages/Cart';
import About from './Pages/About';
import Contact from './Pages/Contact';

import AdminLogin from './Admin/AdminLogin';
import Dashboard from './Admin/Dashboard';
import AddProduct from './Admin/AddProduct';
import ManageProducts from './Admin/ManageProducts';
import EditProduct from './Admin/EditProduct';
import Categories from './Admin/Categories';
import Orders from './Admin/Orders';
import Customers from './Admin/Customers';
import Messages from './Admin/Messages';
import Notifications from './Admin/Notifications';
import Settings from './Admin/Settings';

import './App.css';

// STOREFRONT LAYOUT
const StorefrontLayout = () => (
  <div className="app-shell">
    <Navbar />
    <IntroScreen />

    <a className="skip-link" href="#main-content">
      Skip to content
    </a>

    <main id="main-content" className="page-content">
      <Routes>
        {/* Website opens with Login */}
        <Route path="/" element={<Navigate to="/login" replace />} />

        {/* Login and Create Account */}
        <Route path="/login" element={<Login />} />
        <Route
          path="/signup"
          element={<Login initialMode="register" />}
        />

        {/* Protected customer pages */}
        <Route
          path="/home"
          element={
            <ProtectedRoute>
              <Home />
            </ProtectedRoute>
          }
        />

        <Route
          path="/products"
          element={
            <ProtectedRoute>
              <Products />
            </ProtectedRoute>
          }
        />

        <Route
          path="/product/:id"
          element={
            <ProtectedRoute>
              <ProductDetails />
            </ProtectedRoute>
          }
        />

        <Route
          path="/account"
          element={
            <ProtectedRoute>
              <Account />
            </ProtectedRoute>
          }
        />

        <Route
          path="/cart"
          element={
            <ProtectedRoute>
              <Cart />
            </ProtectedRoute>
          }
        />

        <Route
          path="/about"
          element={
            <ProtectedRoute>
              <About />
            </ProtectedRoute>
          }
        />

        <Route
          path="/contact"
          element={
            <ProtectedRoute>
              <Contact />
            </ProtectedRoute>
          }
        />

        <Route
          path="*"
          element={<Navigate to="/login" replace />}
        />
      </Routes>
    </main>

    <Footer />
  </div>
);

// HASH NAVIGATION
const HashNavigation = () => {
  const { hash, pathname } = useLocation();

  useEffect(() => {
    if (!hash) return undefined;

    const frameId = window.requestAnimationFrame(() => {
      const target = document.getElementById(hash.slice(1));

      if (!target) return;

      const behavior = window.matchMedia(
        '(prefers-reduced-motion: reduce)'
      ).matches
        ? 'auto'
        : 'smooth';

      target.scrollIntoView({
        behavior,
        block: 'start',
      });
    });

    return () => window.cancelAnimationFrame(frameId);
  }, [hash, pathname]);

  return null;
};

// ADMIN NOT FOUND
const AdminNotFound = () => (
  <main className="page-shell">
    <div
      className="container"
      style={{
        paddingBlock: '5rem',
        textAlign: 'center',
      }}
    >
      <p className="eyebrow">Admin panel</p>
      <h1>Admin page not found</h1>
      <p className="muted-copy">
        The admin URL you requested does not exist.
      </p>
      <Link to="/admin/dashboard">
        Return to dashboard
      </Link>
    </div>
  </main>
);

// MAIN APP
function App() {
  return (
    <BrowserRouter>
      <HashNavigation />

      <AuthProvider>
        <StoreProvider>
          <MagneticCursor />

          <Routes>
            {/* ADMIN ROUTES */}
            <Route
              path="/admin/login"
              element={<AdminLogin />}
            />

            <Route
              path="/admin/dashboard"
              element={
                <AdminRoute>
                  <Dashboard />
                </AdminRoute>
              }
            />

            <Route
              path="/admin/add-product"
              element={
                <AdminRoute>
                  <AddProduct />
                </AdminRoute>
              }
            />

            <Route
              path="/admin/manage-products"
              element={
                <AdminRoute>
                  <ManageProducts />
                </AdminRoute>
              }
            />

            <Route
              path="/admin/edit-product"
              element={
                <Navigate
                  to="/admin/manage-products"
                  replace
                />
              }
            />

            <Route
              path="/admin/edit-product/:id"
              element={
                <AdminRoute>
                  <EditProduct />
                </AdminRoute>
              }
            />

            <Route
              path="/admin/categories"
              element={
                <AdminRoute>
                  <Categories />
                </AdminRoute>
              }
            />

            <Route
              path="/admin/orders"
              element={
                <AdminRoute>
                  <Orders />
                </AdminRoute>
              }
            />

            <Route
              path="/admin/customers"
              element={
                <AdminRoute>
                  <Customers />
                </AdminRoute>
              }
            />

            <Route
              path="/admin/messages"
              element={
                <AdminRoute>
                  <Messages />
                </AdminRoute>
              }
            />

            <Route
              path="/admin/notifications"
              element={
                <AdminRoute>
                  <Notifications />
                </AdminRoute>
              }
            />

            <Route
              path="/admin/settings"
              element={
                <AdminRoute>
                  <Settings />
                </AdminRoute>
              }
            />

            <Route
              path="/admin/*"
              element={<AdminNotFound />}
            />

            {/* CUSTOMER WEBSITE */}
            <Route
              path="/*"
              element={<StorefrontLayout />}
            />
          </Routes>
        </StoreProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
