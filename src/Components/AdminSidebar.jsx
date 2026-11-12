import { NavLink } from 'react-router-dom';
import './AdminSidebar.css';

const navItems = [
  { label: 'Dashboard', to: '/admin/dashboard' },
  { label: 'Add Product', to: '/admin/add-product' },
  { label: 'Manage Products', to: '/admin/manage-products' },
  { label: 'Orders', to: '/admin/orders' },
];

const AdminSidebar = () => {
  return (
    <aside className="admin-sidebar">
      <div className="admin-sidebar-header">
        <span className="admin-brand-mark">S</span>
        <div>
          <h3>SKINORA</h3>
          <p>Admin Panel</p>
        </div>
      </div>

      <nav className="admin-nav" aria-label="Admin navigation">
        {navItems.map((item) => (
          <NavLink key={item.to} to={item.to} className={({ isActive }) => `admin-nav-link ${isActive ? 'active' : ''}`}>
            {item.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
};

export default AdminSidebar;
