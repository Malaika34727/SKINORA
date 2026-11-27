
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
    panel: 'productManager',
  },
  {
    label: 'Manage Products',
    to: '/admin/manage-products',
    permission: 'viewProducts',
    panel: 'productManager',
  },
  {
    label: 'Categories',
    to: '/admin/categories',
    superAdminOnly: true,
  },
  {
    label: 'Orders',
    to: '/admin/orders',
    permission: 'viewOrders',
    panel: 'orderManager',
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
  const {
    role,
    permissions = {},
    selectedPanel,
  } = useAuth();

  const isSuperAdmin =
    role === 'admin' && selectedPanel === 'superAdmin';

  const visibleNavItems = navItems.filter((item) => {
    if (isSuperAdmin) return true;

    if (item.superAdminOnly) return false;

    if (item.panel !== selectedPanel) return false;

    return permissions[item.permission] === true;
  });

  const panelLabel = isSuperAdmin
    ? 'Super Admin'
    : selectedPanel === 'orderManager'
      ? 'Order Manager'
      : selectedPanel === 'productManager'
        ? 'Product Manager'
        : 'Sub Admin';

  return (
    <aside className="admin-sidebar">
      <div className="admin-sidebar-header">
        <span className="admin-brand-mark">S</span>

        <div>
          <h3>SKINORA</h3>
          <p>{panelLabel}</p>
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
