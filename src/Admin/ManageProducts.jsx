
import { useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

import AdminNavbar from '../Components/AdminNavbar';
import AdminSidebar from '../Components/AdminSidebar';
import { useStore } from '../context/StoreContextValue';
import { useAuth } from '../context/AuthContextValue';
import { importStarterCatalog } from '../services/products';

import './ManageProducts.css';

const ManageProducts = () => {
  const {
    products,
    productsLoading,
    productsError,
    deleteProduct,
  } = useStore();

  const { role, permissions = {} } = useAuth();

  // Super Admin has every permission.
  const isSuperAdmin = role === 'admin';

  const canViewProducts =
    isSuperAdmin || permissions.viewProducts === true;

  const canUpdateProducts =
    isSuperAdmin || permissions.updateProduct === true;

  const canDeleteProducts =
    isSuperAdmin || permissions.deleteProduct === true;

  const canImportProducts =
    isSuperAdmin || permissions.importProducts === true;

  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [sortBy, setSortBy] = useState('name');

  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [importing, setImporting] = useState(false);

  const location = useLocation();

  const filteredProducts = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    return products
      .filter((product) => {
        const matchesSearch = [
          product.name,
          product.brand,
          product.category,
        ].some((value) =>
          String(value || '').toLowerCase().includes(query)
        );

        const matchesCategory =
          categoryFilter === 'All' ||
          product.category === categoryFilter;

        const matchesStatus =
          statusFilter === 'All' ||
          (product.status || 'active') === statusFilter;

        return matchesSearch && matchesCategory && matchesStatus;
      })
      .sort((first, second) => {
        if (sortBy === 'price-asc') {
          return first.price - second.price;
        }

        if (sortBy === 'price-desc') {
          return second.price - first.price;
        }

        if (sortBy === 'stock') {
          return first.stock - second.stock;
        }

        return String(first.name || '').localeCompare(
          String(second.name || '')
        );
      });
  }, [
    categoryFilter,
    products,
    searchTerm,
    sortBy,
    statusFilter,
  ]);

  // DELETE PRODUCT
  const handleDelete = async (product) => {
    if (!canDeleteProducts) {
      setError('You do not have permission to delete products.');
      return;
    }

    if (
      !window.confirm(
        `Delete "${product.name}"? This cannot be undone.`
      )
    ) {
      return;
    }

    setError('');
    setMessage('');

    try {
      const cleanupWarning = await deleteProduct(product.id);

      setMessage(
        cleanupWarning || 'Product deleted successfully.'
      );
    } catch (deleteError) {
      setError(
        deleteError.message || 'The product could not be deleted.'
      );
    }
  };

  // IMPORT STARTER CATALOG
  const handleImportCatalog = async () => {
    if (!canImportProducts) {
      setError('You do not have permission to import products.');
      return;
    }

    if (
      !window.confirm(
        'Import the original SKINORA starter products? Existing products with matching names or IDs will be skipped.'
      )
    ) {
      return;
    }

    setImporting(true);
    setError('');
    setMessage('');

    try {
      const result = await importStarterCatalog();

      setMessage(
        `Catalog import finished: ${result.imported} added, ${result.skipped} already present.`
      );
    } catch (importError) {
      setError(
        importError.message || 'The starter catalog could not be imported.'
      );
    } finally {
      setImporting(false);
    }
  };

  // VIEW PERMISSION CHECK
  if (!canViewProducts) {
    return (
      <div className="admin-shell">
        <AdminSidebar />

        <main className="admin-main-panel">
          <AdminNavbar />

          <div className="admin-panel-content">
            <div className="products-access-card">
              <span className="products-eyebrow">Restricted Area</span>
              <h2>Access Restricted</h2>
              <p>
                You do not have permission to view products.
                Please contact your Super Admin.
              </p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="admin-shell">
      <AdminSidebar />

      <main className="admin-main-panel">
        <AdminNavbar />

        <div className="admin-panel-content manage-products-page">

          <div className="manage-products-heading">
            <div>
              <p className="products-eyebrow">SKINORA / INVENTORY</p>
              <h2>Manage Products</h2>
              <p className="products-heading-description">
                Organize your product catalog, monitor stock and manage
                your store inventory.
              </p>
            </div>

            {canImportProducts && (
              <button
                type="button"
                className="products-import-button"
                onClick={handleImportCatalog}
                disabled={importing}
              >
                <span className="import-button-icon">↓</span>
                {importing ? 'Importing...' : 'Import Starter Catalog'}
              </button>
            )}
          </div>

          {(message || location.state?.success) && (
            <div className="products-feedback products-success" role="status">
              <span className="feedback-symbol">✓</span>
              {message || location.state?.success}
            </div>
          )}

          {error && (
            <div className="products-feedback products-error" role="alert">
              <span className="feedback-symbol">!</span>
              {error}
            </div>
          )}

          <section className="products-filter-panel">
            <div className="products-filter-heading">
              <div>
                <span className="products-section-label">CATALOG TOOLS</span>
                <h3>Find Products</h3>
              </div>

              <span className="products-result-count">
                {filteredProducts.length} products
              </span>
            </div>

            <div className="products-filter-controls">
              <div className="products-search-field">
                <span className="search-symbol">⌕</span>
                <input
                  type="search"
                  value={searchTerm}
                  onChange={(event) =>
                    setSearchTerm(event.target.value)
                  }
                  placeholder="Search by name, brand or category..."
                  aria-label="Search products"
                />
              </div>

              <select
                value={categoryFilter}
                onChange={(event) =>
                  setCategoryFilter(event.target.value)
                }
                aria-label="Filter products by category"
              >
                <option value="All">All categories</option>

                {[
                  ...new Set(
                    products
                      .map((product) => product.category)
                      .filter(Boolean)
                  ),
                ].map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>

              <select
                value={statusFilter}
                onChange={(event) =>
                  setStatusFilter(event.target.value)
                }
                aria-label="Filter products by status"
              >
                <option value="All">All statuses</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>

              <select
                value={sortBy}
                onChange={(event) => setSortBy(event.target.value)}
                aria-label="Sort products"
              >
                <option value="name">Sort: Name</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
                <option value="stock">Stock: Low to High</option>
              </select>
            </div>
          </section>

          {productsError && (
            <div className="products-feedback products-error" role="alert">
              {productsError}
            </div>
          )}

          <section className="products-table-section">
            <div className="products-table-heading">
              <div>
                <span className="products-section-label">YOUR COLLECTION</span>
                <h3>Product Inventory</h3>
              </div>
              <span className="products-table-note">
                Manage your store products
              </span>
            </div>

            <div className="admin-table-wrap">
              <table className="admin-products-table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Product ID</th>
                    <th>Brand</th>
                    <th>Price</th>
                    <th>Category</th>
                    <th>Stock</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {productsLoading && (
                    <tr>
                      <td colSpan="8" className="products-table-message">
                        <span className="products-loader" />
                        Loading products...
                      </td>
                    </tr>
                  )}

                  {!productsLoading &&
                    filteredProducts.length === 0 && (
                      <tr>
                        <td colSpan="8" className="products-table-message">
                          <div className="products-empty-state">
                            <span className="empty-state-icon">◇</span>
                            <strong>No products found</strong>
                            <span>
                              Try changing your search or filter settings.
                            </span>
                          </div>
                        </td>
                      </tr>
                    )}

                  {filteredProducts.map((product) => {
                    const productStatus = product.status || 'active';

                    return (
                      <tr key={product.id}>
                        <td>
                          <div className="table-product-info">
                            <div className="table-product-thumb">
                              <img
                                src={product.imageUrl}
                                alt={product.name}
                              />
                            </div>
                            <span className="table-product-name">
                              {product.name}
                            </span>
                          </div>
                        </td>

                        <td>
                          <span className="product-id">
                            {product.id}
                          </span>
                        </td>

                        <td>{product.brand || '—'}</td>

                        <td>
                          <div className="product-price">
                            {product.discountPrice !== undefined &&
                            product.discountPrice < product.price ? (
                              <>
                                <strong>
                                  PKR {product.discountPrice}
                                </strong>
                                <del>PKR {product.price}</del>
                              </>
                            ) : (
                              <strong>PKR {product.price}</strong>
                            )}
                          </div>
                        </td>

                        <td>{product.category}</td>

                        <td>
                          <span className="product-stock">
                            {product.stock}
                          </span>
                        </td>

                        <td>
                          <span
                            className={`product-status ${
                              productStatus === 'active'
                                ? 'status-active'
                                : 'status-inactive'
                            }`}
                          >
                            <span className="status-dot" />
                            {productStatus}
                          </span>
                        </td>

                        <td>
                          <div className="table-actions">
                            {canUpdateProducts && (
                              <Link
                                className="product-edit-action"
                                to={`/admin/edit-product/${product.id}`}
                              >
                                Edit
                              </Link>
                            )}

                            {canDeleteProducts && (
                              <button
                                type="button"
                                className="product-delete-action"
                                onClick={() => handleDelete(product)}
                              >
                                Delete
                              </button>
                            )}

                            {!canUpdateProducts &&
                              !canDeleteProducts && (
                                <span className="product-view-only">
                                  View only
                                </span>
                              )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>

        </div>
      </main>
    </div>
  );
};

export default ManageProducts;
