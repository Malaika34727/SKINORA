
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContextValue';

import './AdminSidebar.css';

const navItems = [
  {
    label: 'Dashboard',
    to: '/admin/dashboard',
    icon: '⌂',
    superAdminOnly: true,
  },
  {
    label: 'Manage Sub Admins',
    to: '/admin/manage-subadmins',
    icon: '♙',
    superAdminOnly: true,
  },
  {
    label: 'Add Product',
    to: '/admin/add-product',
    icon: '✚',
    permission: 'addProduct',
    panel: 'productManager',
  },
  {
    label: 'Manage Products',
    to: '/admin/manage-products',
    icon: '◇',
    permission: 'viewProducts',
    panel: 'productManager',
  },
  {
    label: 'Categories',
    to: '/admin/categories',
    icon: '▦',
    superAdminOnly: true,
  },
  {
    label: 'Orders',
    to: '/admin/orders',
    icon: '▤',
    permission: 'viewOrders',
    panel: 'orderManager',
  },
  {
    label: 'Customers',
    to: '/admin/customers',
    icon: '♧',
    superAdminOnly: true,
  },
  {
    label: 'Messages',
    to: '/admin/messages',
    icon: '✉',
    superAdminOnly: true,
  },
  {
    label: 'Notifications',
    to: '/admin/notifications',
    icon: '♧',
    superAdminOnly: true,
  },
  {
    label: 'Settings',
    to: '/admin/settings',
    icon: '⚙',
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

      {/* BRAND HEADER */}

      <div className="admin-sidebar-header">

        <div className="admin-brand-mark">
          <span>S</span>
        </div>

        <div className="admin-brand-info">
          <h3>SKINORA</h3>
          <p>Luxury Skincare</p>
        </div>

      </div>

      {/* PANEL PROFILE */}

      <div className="admin-sidebar-profile">

        <div className="admin-profile-icon">
          ✦
        </div>

        <div className="admin-profile-details">
          <span>CONTROL PANEL</span>
          <strong>{panelLabel}</strong>
        </div>

        <span className="admin-profile-status" />
      </div>

      {/* NAVIGATION */}

      <nav className="admin-nav" aria-label="Admin navigation">

        <p className="admin-nav-heading">
          MAIN MENU
        </p>

        {visibleNavItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `admin-nav-link ${isActive ? 'active' : ''}`
            }
          >

            <span className="admin-nav-icon">
              {item.icon}
            </span>

            <span className="admin-nav-label">
              {item.label}
            </span>

            <span className="admin-nav-arrow">
              ›
            </span>

          </NavLink>
        ))}

      </nav>

      {/* SIDEBAR FOOTER */}

      <div className="admin-sidebar-footer">

        <div className="admin-footer-line" />

        <div className="admin-footer-brand">
          <span>✦</span>
          <p>BEAUTY IN EVERY DETAIL</p>
        </div>

        <small>SKINORA ADMIN PANEL</small>

      </div>

    </aside>
  );
};

export default AdminSidebar;
