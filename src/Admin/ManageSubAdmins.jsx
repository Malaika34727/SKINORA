
import { useEffect, useState } from 'react';

import AdminNavbar from '../Components/AdminNavbar';
import AdminSidebar from '../Components/AdminSidebar';
import Button from '../Components/Button';

import {
  createSubAdmin,
  getSubAdmins,
  updateSubAdminPermissions,
  updateSubAdminStatus,
} from '../services/subAdminService';

import './ManageSubAdmins.css';

const productPermissionOptions = [
  { key: 'viewProducts', label: 'View Products' },
  { key: 'addProduct', label: 'Add Products' },
  { key: 'updateProduct', label: 'Update Products' },
  { key: 'deleteProduct', label: 'Delete Products' },
  { key: 'importProducts', label: 'Import Products' },
];

const defaultProductPermissions = {
  viewProducts: true,
  addProduct: true,
  updateProduct: true,
  deleteProduct: true,
  importProducts: false,
};

const orderPermissionOptions = [
  { key: 'viewOrders', label: 'View Orders' },
  { key: 'updateOrderStatus', label: 'Update Order Status' },
  { key: 'verifyPayments', label: 'Verify Payments' },
];

const defaultOrderPermissions = {
  viewOrders: false,
  updateOrderStatus: false,
  verifyPayments: false,
};

const defaultPermissions = {
  ...defaultProductPermissions,
  ...defaultOrderPermissions,
};

const emptyForm = {
  email: '',
  password: '',
  permissions: { ...defaultPermissions },
};

const getAssignedPanels = (permissions = {}) => {
  const panels = [];

  const hasProductAccess = productPermissionOptions.some(
    (permission) => permissions[permission.key] === true
  );

  const hasOrderAccess = orderPermissionOptions.some(
    (permission) => permissions[permission.key] === true
  );

  if (hasProductAccess) panels.push('Product Manager');
  if (hasOrderAccess) panels.push('Order Manager');

  return panels.length ? panels.join(' + ') : 'No Panel Assigned';
};

const getInitials = (email = '') => {
  const firstPart = email.split('@')[0] || 'SA';

  return firstPart
    .split(/[._-]/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('');
};

const ManageSubAdmins = () => {
  const [subAdmins, setSubAdmins] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [showCreateForm, setShowCreateForm] = useState(false);

  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [savingUID, setSavingUID] = useState('');

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const activeCount = subAdmins.filter(
    (admin) => admin.isActive
  ).length;

  const inactiveCount = subAdmins.length - activeCount;

  const productManagerCount = subAdmins.filter((admin) =>
    productPermissionOptions.some(
      (permission) => admin.permissions?.[permission.key] === true
    )
  ).length;

  const orderManagerCount = subAdmins.filter((admin) =>
    orderPermissionOptions.some(
      (permission) => admin.permissions?.[permission.key] === true
    )
  ).length;

  const loadSubAdmins = async () => {
    setLoading(true);
    setError('');

    try {
      const result = await getSubAdmins();
      setSubAdmins(result);
    } catch (loadError) {
      setError(loadError.message || 'Could not load Sub Admins.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSubAdmins();
  }, []);

  const handleInputChange = (event) => {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const handleCreatePermissionChange = (permission, checked) => {
    setForm((current) => ({
      ...current,
      permissions: {
        ...current.permissions,
        [permission]: checked,
      },
    }));
  };

  const handleCreateSubAdmin = async (event) => {
    event.preventDefault();

    setError('');
    setSuccess('');

    const normalizedEmail = form.email.trim().toLowerCase();

    if (!normalizedEmail || !form.password) {
      setError('Please enter Gmail and password.');
      return;
    }

    if (form.password.length < 6) {
      setError('Password must contain at least 6 characters.');
      return;
    }

    const hasAnyPermission = Object.values(
      form.permissions
    ).some((permission) => permission === true);

    if (!hasAnyPermission) {
      setError('Assign at least one panel permission.');
      return;
    }

    setCreating(true);

    try {
      const result = await createSubAdmin({
        email: normalizedEmail,
        password: form.password,
        role: 'productManager',
        permissions: form.permissions,
      });

      setForm(emptyForm);
      setShowCreateForm(false);

      await loadSubAdmins();

      setSuccess(
        `Sub Admin account created for ${result.email}. Email verification has been requested.`
      );
    } catch (createError) {
      console.error('Sub Admin creation failed:', createError);

      setError(
        createError.message || 'Could not create Sub Admin account.'
      );
    } finally {
      setCreating(false);
    }
  };

  const handlePermissionChange = (uid, permission, checked) => {
    setSubAdmins((current) =>
      current.map((admin) =>
        admin.uid === uid
          ? {
              ...admin,
              permissions: {
                ...defaultPermissions,
                ...admin.permissions,
                [permission]: checked,
              },
            }
          : admin
      )
    );

    setSuccess('');
  };

  const handleSavePermissions = async (admin) => {
    const hasAnyPermission = Object.values(
      admin.permissions || {}
    ).some((permission) => permission === true);

    if (!hasAnyPermission) {
      setError('Assign at least one panel permission.');
      return;
    }

    setSavingUID(admin.uid);
    setError('');
    setSuccess('');

    try {
      await updateSubAdminPermissions(admin.uid, {
        ...defaultPermissions,
        ...admin.permissions,
      });

      setSuccess(`Permissions updated for ${admin.email}.`);
    } catch (saveError) {
      setError(
        saveError.message || 'Could not update permissions.'
      );

      await loadSubAdmins();
    } finally {
      setSavingUID('');
    }
  };

  const handleStatusChange = async (admin) => {
    const newStatus = !admin.isActive;

    const confirmed = window.confirm(
      `Are you sure you want to ${
        newStatus ? 'activate' : 'deactivate'
      } ${admin.email}?`
    );

    if (!confirmed) return;

    setSavingUID(admin.uid);
    setError('');
    setSuccess('');

    try {
      await updateSubAdminStatus(admin.uid, newStatus);

      setSubAdmins((current) =>
        current.map((item) =>
          item.uid === admin.uid
            ? { ...item, isActive: newStatus }
            : item
        )
      );

      setSuccess(
        `${admin.email} has been ${
          newStatus ? 'activated' : 'deactivated'
        }.`
      );
    } catch (statusError) {
      setError(
        statusError.message || 'Could not update account status.'
      );
    } finally {
      setSavingUID('');
    }
  };

  const renderPermissionGroup = (
    title,
    options,
    permissions,
    onChange,
    disabled
  ) => (
    <div className="subadmin-permissions">
      <h4>{title}</h4>

      <div className="subadmin-permission-grid">
        {options.map((permission) => (
          <label
            className="subadmin-permission-option"
            key={permission.key}
          >
            <input
              type="checkbox"
              checked={permissions?.[permission.key] === true}
              disabled={disabled}
              onChange={(event) =>
                onChange(permission.key, event.target.checked)
              }
            />

            <span className="custom-checkbox" />
            <span className="permission-label">
              {permission.label}
            </span>
          </label>
        ))}
      </div>
    </div>
  );

  return (
    <div className="admin-shell">
      <AdminSidebar />

      <main className="admin-main-panel">
        <AdminNavbar />

        <div className="admin-panel-content subadmin-page">

          <div className="subadmin-page-heading">
            <div>
              <p className="subadmin-eyebrow">
                SKINORA / ACCESS MANAGEMENT
              </p>

              <h1>Manage Sub Admins</h1>

              <p className="subadmin-heading-description">
                Manage your team, assign responsibilities and control
                administrative access.
              </p>
            </div>

            <div className="subadmin-heading-mark">
              <span>♙</span>
            </div>
          </div>

          {/* SUMMARY CARDS */}

          <div className="subadmin-stats-grid">
            <div className="subadmin-stat-card">
              <div className="subadmin-stat-icon">♙</div>
              <div className="subadmin-stat-content">
                <p>Total Sub Admins</p>
                <h3>{subAdmins.length}</h3>
                <span>Registered accounts</span>
              </div>
            </div>

            <div className="subadmin-stat-card">
              <div className="subadmin-stat-icon active-icon">✓</div>
              <div className="subadmin-stat-content">
                <p>Active Accounts</p>
                <h3>{activeCount}</h3>
                <span>Currently enabled</span>
              </div>
            </div>

            <div className="subadmin-stat-card">
              <div className="subadmin-stat-icon inactive-icon">Ⅱ</div>
              <div className="subadmin-stat-content">
                <p>Inactive Accounts</p>
                <h3>{inactiveCount}</h3>
                <span>Currently disabled</span>
              </div>
            </div>

            <div className="subadmin-stat-card">
              <div className="subadmin-stat-icon manager-icon">✧</div>
              <div className="subadmin-stat-content">
                <p>Manager Assignments</p>
                <h3>{productManagerCount + orderManagerCount}</h3>
                <span>
                  {productManagerCount} Product · {orderManagerCount} Order
                </span>
              </div>
            </div>
          </div>

          <div className="subadmin-toolbar">
            <div>
              <p className="subadmin-toolbar-label">TEAM DIRECTORY</p>
              <h2>Administrator Accounts</h2>
            </div>

            <div className="subadmin-header-actions">
              <Button
                type="button"
                variant="secondary"
                onClick={loadSubAdmins}
                disabled={loading || creating}
              >
                {loading ? 'Loading...' : '↻ Refresh'}
              </Button>

              <Button
                type="button"
                variant="primary"
                onClick={() => {
                  setShowCreateForm((current) => !current);
                  setError('');
                  setSuccess('');
                }}
                disabled={creating}
              >
                {showCreateForm ? 'Close Form' : '+ Create Sub Admin'}
              </Button>
            </div>
          </div>

          {error && (
            <div role="alert" className="subadmin-message error">
              <span>!</span>
              {error}
            </div>
          )}

          {success && (
            <div role="status" className="subadmin-message success">
              <span>✓</span>
              {success}
            </div>
          )}

          {showCreateForm && (
            <section className="subadmin-create-section">
              <div className="subadmin-create-heading">
                <div>
                  <p className="subadmin-eyebrow">NEW TEAM MEMBER</p>
                  <h2>Create Sub Admin Account</h2>
                  <p>
                    Enter account credentials and choose the required
                    management permissions.
                  </p>
                </div>

                <span className="create-section-mark">+</span>
              </div>

              <form
                onSubmit={handleCreateSubAdmin}
                className="subadmin-create-form"
              >
                <div className="subadmin-create-fields">
                  <label>
                    <span>Sub Admin Gmail <i>*</i></span>

                    <input
                      type="email"
                      name="email"
                      value={form.email}
                      onChange={handleInputChange}
                      placeholder="Enter Sub Admin Gmail"
                      autoComplete="off"
                      required
                      disabled={creating}
                    />
                  </label>

                  <label>
                    <span>Password <i>*</i></span>

                    <input
                      type="password"
                      name="password"
                      value={form.password}
                      onChange={handleInputChange}
                      placeholder="Minimum 6 characters"
                      autoComplete="new-password"
                      minLength={6}
                      required
                      disabled={creating}
                    />
                  </label>
                </div>

                <div className="subadmin-assignment-preview">
                  <span>ASSIGNED PANELS</span>
                  <strong>{getAssignedPanels(form.permissions)}</strong>
                </div>

                {renderPermissionGroup(
                  'Product Manager Permissions',
                  productPermissionOptions,
                  form.permissions,
                  handleCreatePermissionChange,
                  creating
                )}

                {renderPermissionGroup(
                  'Order Manager Permissions',
                  orderPermissionOptions,
                  form.permissions,
                  handleCreatePermissionChange,
                  creating
                )}

                <div className="subadmin-card-actions">
                  <Button
                    type="submit"
                    variant="primary"
                    disabled={creating}
                  >
                    {creating ? 'Creating Account...' : 'Create Sub Admin'}
                  </Button>

                  <Button
                    type="button"
                    variant="secondary"
                    disabled={creating}
                    onClick={() => {
                      setForm(emptyForm);
                      setShowCreateForm(false);
                      setError('');
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </section>
          )}

          <div className="subadmin-list-heading">
            <div>
              <p className="subadmin-eyebrow">YOUR TEAM</p>
              <h2>All Sub Admins</h2>
            </div>

            <span className="subadmin-count">
              {subAdmins.length} {subAdmins.length === 1 ? 'ACCOUNT' : 'ACCOUNTS'}
            </span>
          </div>

          {loading ? (
            <div className="subadmin-loading">
              <span className="subadmin-spinner" />
              <p>Loading Sub Admin accounts...</p>
            </div>
          ) : subAdmins.length === 0 ? (
            <div className="subadmin-empty">
              <div className="subadmin-empty-icon">♙</div>
              <h3>No Sub Admins Found</h3>
              <p>
                Create your first Sub Admin account to get started.
              </p>

              <Button
                type="button"
                variant="primary"
                onClick={() => setShowCreateForm(true)}
              >
                + Create First Sub Admin
              </Button>
            </div>
          ) : (
            <div className="subadmin-list">
              {subAdmins.map((admin) => (
                <section className="subadmin-card" key={admin.uid}>
                  <div className="subadmin-card-header">
                    <div className="subadmin-identity">
                      <div className="subadmin-avatar">
                        {getInitials(admin.email)}
                      </div>

                      <div className="subadmin-identity-details">
                        <h3>{admin.email}</h3>
                        <p>{getAssignedPanels(admin.permissions)}</p>
                      </div>
                    </div>

                    <span
                      className={
                        admin.isActive
                          ? 'subadmin-status active'
                          : 'subadmin-status inactive'
                      }
                    >
                      <span />
                      {admin.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>

                  <div className="subadmin-card-divider" />

                  {renderPermissionGroup(
                    'Product Manager Permissions',
                    productPermissionOptions,
                    {
                      ...defaultPermissions,
                      ...admin.permissions,
                    },
                    (permission, checked) =>
                      handlePermissionChange(
                        admin.uid,
                        permission,
                        checked
                      ),
                    savingUID === admin.uid
                  )}

                  <div className="subadmin-permission-divider" />

                  {renderPermissionGroup(
                    'Order Manager Permissions',
                    orderPermissionOptions,
                    {
                      ...defaultPermissions,
                      ...admin.permissions,
                    },
                    (permission, checked) =>
                      handlePermissionChange(
                        admin.uid,
                        permission,
                        checked
                      ),
                    savingUID === admin.uid
                  )}

                  <div className="subadmin-card-actions">
                    <Button
                      type="button"
                      variant="primary"
                      disabled={savingUID === admin.uid}
                      onClick={() => handleSavePermissions(admin)}
                    >
                      {savingUID === admin.uid
                        ? 'Saving...'
                        : 'Save Permissions'}
                    </Button>

                    <Button
                      type="button"
                      variant="secondary"
                      disabled={savingUID === admin.uid}
                      onClick={() => handleStatusChange(admin)}
                    >
                      {admin.isActive
                        ? 'Deactivate Account'
                        : 'Activate Account'}
                    </Button>
                  </div>
                </section>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default ManageSubAdmins;
