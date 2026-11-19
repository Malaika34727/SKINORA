import { useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import AdminNavbar from '../Components/AdminNavbar';
import AdminSidebar from '../Components/AdminSidebar';
import { useStore } from '../context/StoreContextValue';
import { importStarterCatalog } from '../services/products';
import './ManageProducts.css';

const ManageProducts = () => {
  const { products, productsLoading, productsError, deleteProduct } = useStore();
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
        ].some((value) => String(value || '').toLowerCase().includes(query));
        const matchesCategory = categoryFilter === 'All' || product.category === categoryFilter;
        const matchesStatus = statusFilter === 'All' || (product.status || 'active') === statusFilter;
        return matchesSearch && matchesCategory && matchesStatus;
      })
      .sort((first, second) => {
        if (sortBy === 'price-asc') return first.price - second.price;
        if (sortBy === 'price-desc') return second.price - first.price;
        if (sortBy === 'stock') return first.stock - second.stock;
        return String(first.name || '').localeCompare(String(second.name || ''));
      });
  }, [categoryFilter, products, searchTerm, sortBy, statusFilter]);

  const handleDelete = async (product) => {
    if (!window.confirm(`Delete "${product.name}"? This cannot be undone.`)) return;
    setError('');
    setMessage('');
    try {
      const cleanupWarning = await deleteProduct(product.id);
      setMessage(cleanupWarning || 'Product deleted successfully.');
    } catch (deleteError) {
      setError(deleteError.message || 'The product could not be deleted.');
    }
  };

  const handleImportCatalog = async () => {
    if (!window.confirm('Import the original SKINORA starter products? Existing products with matching names or IDs will be skipped.')) return;
    setImporting(true);
    setError('');
    setMessage('');
    try {
      const result = await importStarterCatalog();
      setMessage(`Catalog import finished: ${result.imported} added, ${result.skipped} already present.`);
    } catch (importError) {
      setError(importError.message || 'The starter catalog could not be imported.');
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="admin-shell">
      <AdminSidebar />

      <main className="admin-main-panel">
        <AdminNavbar />

        <div className="admin-panel-content">
          <div className="table-toolbar">
            <div>
              <p className="eyebrow">Inventory</p>
              <h2>Manage products</h2>
            </div>

            <p role="status">{message || location.state?.success}</p>
            {error && <p role="alert">{error}</p>}
            <input
              type="search"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search products"
              aria-label="Search products"
            />
            <select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)} aria-label="Filter products by category">
              <option value="All">All categories</option>
              {[...new Set(products.map((product) => product.category).filter(Boolean))].map((category) => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} aria-label="Filter products by status">
              <option value="All">All statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
            <select value={sortBy} onChange={(event) => setSortBy(event.target.value)} aria-label="Sort products">
              <option value="name">Name</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="stock">Stock: Low to High</option>
            </select>
            <button type="button" className="admin-link-button" onClick={handleImportCatalog} disabled={importing}>
              {importing ? 'Importing…' : 'Import starter catalog'}
            </button>
          </div>

          {productsError && <p role="alert">{productsError}</p>}
          <div className="admin-table-wrap">
            <table className="admin-products-table">
              <thead>
                <tr>
                  <th>Image</th>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Brand</th>
                  <th>Price</th>
                  <th>Category</th>
                  <th>Stock</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {productsLoading && <tr><td colSpan="9">Loading products…</td></tr>}
                {!productsLoading && filteredProducts.length === 0 && (
                  <tr><td colSpan="9">No products found. Add a product to get started.</td></tr>
                )}
                {filteredProducts.map((product) => (
                  <tr key={product.id}>
                    <td>
                      <div className="table-product-thumb">
                        <img src={product.imageUrl} alt={product.name} />
                      </div>
                    </td>
                    <td>{product.id}</td>
                    <td>{product.name}</td>
                    <td>{product.brand || '—'}</td>
                    <td>{product.discountPrice !== undefined && product.discountPrice < product.price
                      ? <>PKR {product.discountPrice} <del>PKR {product.price}</del></>
                      : `PKR ${product.price}`}</td>
                    <td>{product.category}</td>
                    <td>{product.stock}</td>
                    <td>{product.status || 'active'}</td>
                    <td>
                      <div className="table-actions">
                        <Link to={`/admin/edit-product/${product.id}`}>Edit</Link>
                        <button type="button" onClick={() => handleDelete(product)}>Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ManageProducts;
