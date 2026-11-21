
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

// ==========================================
// PERMISSION OPTIONS
// ==========================================

const permissionOptions = [
  { key: 'viewProducts', label: 'View Products' },
  { key: 'addProduct', label: 'Add Products' },
  { key: 'updateProduct', label: 'Update Products' },
  { key: 'deleteProduct', label: 'Delete Products' },
  { key: 'importProducts', label: 'Import Products' },
];

const defaultPermissions = {
  viewProducts: true,
  addProduct: true,
  updateProduct: true,
  deleteProduct: true,
  importProducts: false,
};

const emptyForm = {
  email: '',
  password: '',
  permissions: { ...defaultPermissions },
};

// ==========================================
// MANAGE SUB ADMINS
// ==========================================

const ManageSubAdmins = () => {
  const [subAdmins, setSubAdmins] = useState([]);

  const [form, setForm] = useState(emptyForm);
  const [showCreateForm, setShowCreateForm] = useState(false);

  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [savingUID, setSavingUID] = useState('');

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // ========================================
  // LOAD SUB ADMINS
  // ========================================

  const loadSubAdmins = async () => {
    setLoading(true);
    setError('');

    try {
      const result = await getSubAdmins();
      setSubAdmins(result);
    } catch (loadError) {
      setError(
        loadError.message || 'Could not load Sub Admins.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSubAdmins();
  }, []);

  // ========================================
  // FORM INPUT CHANGE
  // ========================================

  const handleInputChange = (event) => {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  };

  // ========================================
  // CREATE FORM PERMISSION CHANGE
  // ========================================

  const handleCreatePermissionChange = (permission, checked) => {
    setForm((current) => ({
      ...current,
      permissions: {
        ...current.permissions,
        [permission]: checked,
      },
    }));
  };

  // ========================================
  // CREATE SUB ADMIN
  // ========================================

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

  // ========================================
  // EXISTING SUB ADMIN PERMISSIONS
  // ========================================

  const handlePermissionChange = (uid, permission, checked) => {
    setSubAdmins((current) =>
      current.map((admin) =>
        admin.uid === uid
          ? {
              ...admin,
              permissions: {
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
    setSavingUID(admin.uid);
    setError('');
    setSuccess('');

    try {
      await updateSubAdminPermissions(
        admin.uid,
        admin.permissions
      );

      setSuccess(
        `Permissions updated for ${admin.email}.`
      );

    } catch (saveError) {
      setError(
        saveError.message || 'Could not update permissions.'
      );

      await loadSubAdmins();

    } finally {
      setSavingUID('');
    }
  };

  // ========================================
  // ACTIVATE / DEACTIVATE
  // ========================================

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
      await updateSubAdminStatus(
        admin.uid,
        newStatus
      );

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

  // ========================================
  // UI
  // ========================================

  return (
    <div className="admin-shell">
      <AdminSidebar />

      <main className="admin-main-panel">
        <AdminNavbar />

        <div className="admin-panel-content">

          {/* PAGE HEADER */}

          <div className="section-heading">
            <div>
              <p className="eyebrow">Administration</p>
              <h2>Manage Sub Admins</h2>
              <p>
                Create accounts, manage permissions and control access.
              </p>
            </div>

            <div className="subadmin-header-actions">
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
                {showCreateForm
                  ? 'Close Form'
                  : 'Create Sub Admin'}
              </Button>

              <Button
                type="button"
                variant="secondary"
                onClick={loadSubAdmins}
                disabled={loading || creating}
              >
                {loading ? 'Loading...' : 'Refresh'}
              </Button>
            </div>
          </div>

          {/* ERROR */}

          {error && (
            <p
              role="alert"
              className="subadmin-message error"
            >
              {error}
            </p>
          )}

          {/* SUCCESS */}

          {success && (
            <p
              role="status"
              className="subadmin-message success"
            >
              {success}
            </p>
          )}

          {/* ==================================
              CREATE SUB ADMIN FORM
          ================================== */}

          {showCreateForm && (
            <section className="subadmin-create-section">

              <div className="subadmin-create-heading">
                <h3>Create New Sub Admin</h3>
                <p>
                  Enter account details and assign product permissions.
                </p>
              </div>

              <form
                onSubmit={handleCreateSubAdmin}
                className="subadmin-create-form"
              >

                <label>
                  <span>Sub Admin Gmail</span>

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
                  <span>Password</span>

                  <input
                    type="password"
                    name="password"
                    value={form.password}
                    onChange={handleInputChange}
                    placeholder="Create password (minimum 6 characters)"
                    autoComplete="new-password"
                    minLength={6}
                    required
                    disabled={creating}
                  />
                </label>

                <label>
                  <span>Role</span>

                  <input
                    type="text"
                    value="Product Manager"
                    disabled
                    readOnly
                  />
                </label>

                <div className="subadmin-permissions">
                  <h4>Assign Permissions</h4>

                  {permissionOptions.map((permission) => (
                    <label key={permission.key}>
                      <input
                        type="checkbox"
                        checked={
                          form.permissions[permission.key] === true
                        }
                        disabled={creating}
                        onChange={(event) =>
                          handleCreatePermissionChange(
                            permission.key,
                            event.target.checked
                          )
                        }
                      />

                      <span>{permission.label}</span>
                    </label>
                  ))}
                </div>

                <div className="subadmin-card-actions">
                  <Button
                    type="submit"
                    variant="primary"
                    disabled={creating}
                  >
                    {creating
                      ? 'Creating Account...'
                      : 'Create Sub Admin'}
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

          {/* ==================================
              SUB ADMIN LIST
          ================================== */}

          {loading ? (
            <p>Loading Sub Admin accounts...</p>
          ) : subAdmins.length === 0 ? (
            <div className="subadmin-empty">
              <h3>No Sub Admins Found</h3>

              <p>
                Create your first Sub Admin account to get started.
              </p>
            </div>
          ) : (
            <div className="subadmin-list">

              {subAdmins.map((admin) => (
                <section
                  className="subadmin-card"
                  key={admin.uid}
                >

                  <div className="subadmin-card-header">
                    <div>
                      <h3>{admin.email}</h3>
                      <p>
                        {admin.roleLabel || 'Product Manager'}
                      </p>
                    </div>

                    <span
                      className={
                        admin.isActive
                          ? 'subadmin-status active'
                          : 'subadmin-status inactive'
                      }
                    >
                      {admin.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>

                  <div className="subadmin-permissions">
                    <h4>Permissions</h4>

                    {permissionOptions.map((permission) => (
                      <label key={permission.key}>
                        <input
                          type="checkbox"
                          checked={
                            admin.permissions?.[permission.key] === true
                          }
                          disabled={savingUID === admin.uid}
                          onChange={(event) =>
                            handlePermissionChange(
                              admin.uid,
                              permission.key,
                              event.target.checked
                            )
                          }
                        />

                        <span>{permission.label}</span>
                      </label>
                    ))}
                  </div>

                  <div className="subadmin-card-actions">
                    <Button
                      type="button"
                      variant="primary"
                      disabled={savingUID === admin.uid}
                      onClick={() =>
                        handleSavePermissions(admin)
                      }
                    >
                      {savingUID === admin.uid
                        ? 'Saving...'
                        : 'Save Permissions'}
                    </Button>

                    <Button
                      type="button"
                      variant="secondary"
                      disabled={savingUID === admin.uid}
                      onClick={() =>
                        handleStatusChange(admin)
                      }
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
