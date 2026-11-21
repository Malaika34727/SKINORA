
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContextValue';

import './AdminSidebar.css';

const navItems = [
  {
    label: 'Dashboard',
    to: '/admin/dashboard',
    superAdminOnly: true,
  },
  {
    label: 'Manage Sub Admins',
    to: '/admin/manage-subadmins',
    superAdminOnly: true,
  },
  {
    label: 'Add Product',
    to: '/admin/add-product',
    permission: 'addProduct',
  },
  {
    label: 'Manage Products',
    to: '/admin/manage-products',
    permission: 'viewProducts',
  },
  {
    label: 'Categories',
    to: '/admin/categories',
    superAdminOnly: true,
  },
  {
    label: 'Orders',
    to: '/admin/orders',
    superAdminOnly: true,
  },
  {
    label: 'Customers',
    to: '/admin/customers',
    superAdminOnly: true,
  },
  {
    label: 'Messages',
    to: '/admin/messages',
    superAdminOnly: true,
  },
  {
    label: 'Notifications',
    to: '/admin/notifications',
    superAdminOnly: true,
  },
  {
    label: 'Settings',
    to: '/admin/settings',
    superAdminOnly: true,
  },

];

const AdminSidebar = () => {
  const { role, permissions = {} } = useAuth();

  const isSuperAdmin = role === 'admin';

  const visibleNavItems = navItems.filter((item) => {
    // Super Admin can see everything.
    if (isSuperAdmin) return true;

    // Dashboard and other restricted pages are Super Admin only.
    if (item.superAdminOnly) return false;

    // Sub Admin sees only permitted links.
    return item.permission && permissions[item.permission] === true;
  });

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
        {visibleNavItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `admin-nav-link ${isActive ? 'active' : ''}`
            }
          >
            {item.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
};

export default AdminSidebar;
