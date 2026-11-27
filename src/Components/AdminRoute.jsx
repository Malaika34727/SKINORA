
import { Navigate, Outlet } from 'react-router-dom';

import { useAuth } from '../context/AuthContextValue';

const PANEL_PERMISSIONS = {
  productManager: [
    'viewProducts',
    'addProduct',
    'updateProduct',
    'deleteProduct',
    'importProducts',
  ],

  orderManager: [
    'viewOrders',
    'updateOrderStatus',
    'verifyPayments',
  ],
};

const AdminRoute = ({
  children,
  requiredPermission,
}) => {
  const {
    user,
    isAdmin,
    role,
    permissions = {},
    selectedPanel,
    loading,
  } = useAuth();

  if (loading) {
    return (
      <div className="page-shell">
        Verifying administrator access...
      </div>
    );
  }

  if (!user || !isAdmin || !selectedPanel) {
    return <Navigate to="/skinora-admin" replace />;
  }

  // Super Admin gets every admin route.
  if (
    selectedPanel === 'superAdmin' &&
    role === 'admin'
  ) {
    return children || <Outlet />;
  }

  // Sub Admin must have a valid panel.
  const allowedPermissions =
    PANEL_PERMISSIONS[selectedPanel];

  if (!allowedPermissions || !requiredPermission) {
    return <Navigate to="/skinora-admin" replace />;
  }

  // A panel cannot access another panel's pages.
  if (!allowedPermissions.includes(requiredPermission)) {
    return (
      <Navigate
        to={
          selectedPanel === 'orderManager'
            ? '/admin/orders'
            : '/admin/manage-products'
        }
        replace
      />
    );
  }

  if (permissions[requiredPermission] !== true) {
    return (
      <main className="page-shell">
        <div
          className="container"
          style={{
            paddingBlock: '5rem',
            textAlign: 'center',
          }}
        >
          <p className="eyebrow">Access restricted</p>
          <h1>Permission Denied</h1>
          <p className="muted-copy">
            Your account does not have permission to access this page.
            Please contact the Super Admin.
          </p>
        </div>
      </main>
    );
  }

  return children || <Outlet />;
};

export default AdminRoute;
