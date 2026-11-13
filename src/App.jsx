import { BrowserRouter, Link, Navigate, Route, Routes } from 'react-router-dom';
import MagneticCursor from './Components/MagneticCursor';
import IntroScreen from './Components/IntroScreen';
import Navbar from './Components/Navbar';
import Footer from './Components/Footer';
import { StoreProvider } from './context/StoreContext';
import Home from './Pages/Home';
import Products from './Pages/Products';
import ProductDetails from './Pages/ProductDetails';
import Login from './Pages/Login';
import Cart from './Pages/Cart';
import About from './Pages/About';
import Contact from './Pages/Contact';
import AdminLogin from './Admin/AdminLogin';
import Dashboard from './Admin/Dashboard';
import AddProduct from './Admin/AddProduct';
import ManageProducts from './Admin/ManageProducts';
import EditProduct from './Admin/EditProduct';
import Orders from './Admin/Orders';
import './App.css';

const StorefrontLayout = () => (
  <div className="app-shell">
    <Navbar />
    <IntroScreen />
    <main className="page-content">
      <Routes>
        <Route path="/" element={<HomeRoute />} />
        <Route path="/products" element={<Products />} />
        <Route path="/product/:id" element={<ProductDetails />} />
        <Route path="/login" element={<Login />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </main>
    <Footer />
  </div>
);

const HomeRoute = () => (
  <>
    <IntroScreen />
    <Home />
  </>
);

const AdminNotFound = () => (
  <main className="page-shell">
    <div className="container" style={{ paddingBlock: '5rem', textAlign: 'center' }}>
      <p className="eyebrow">Admin panel</p>
      <h1>Admin page not found</h1>
      <p className="muted-copy">The admin URL you requested does not exist.</p>
      <Link to="/admin/dashboard">Return to dashboard</Link>
    </div>
  </main>
);

function App() {
  return (
    <BrowserRouter>
      <StoreProvider>
        <MagneticCursor />
        <Routes>
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin/dashboard" element={<Dashboard />} />
          <Route path="/admin/add-product" element={<AddProduct />} />
          <Route path="/admin/manage-products" element={<ManageProducts />} />
          <Route path="/admin/edit-product" element={<Navigate to="/admin/manage-products" replace />} />
          <Route path="/admin/edit-product/:id" element={<EditProduct />} />
          <Route path="/admin/orders" element={<Orders />} />
          <Route path="/admin/*" element={<AdminNotFound />} />
          <Route path="/*" element={<StorefrontLayout />} />
        </Routes>
      </StoreProvider>
    </BrowserRouter>
  );
}

export default App;
