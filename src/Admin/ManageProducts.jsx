import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import AdminNavbar from '../Components/AdminNavbar';
import AdminSidebar from '../Components/AdminSidebar';
import { useStore } from '../context/StoreContext';
import './ManageProducts.css';

const ManageProducts = () => {
  const { products, deleteProduct } = useStore();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredProducts = useMemo(() => {
    const query = searchTerm.toLowerCase();
    return products.filter((product) => product.name.toLowerCase().includes(query) || product.category.toLowerCase().includes(query));
  }, [products, searchTerm]);

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

            <input
              type="search"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search products"
              aria-label="Search products"
            />
          </div>

          <div className="admin-table-wrap">
            <table className="admin-products-table">
              <thead>
                <tr>
                  <th>Image</th>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Price</th>
                  <th>Category</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((product) => (
                  <tr key={product.id}>
                    <td>
                      <div className="table-product-thumb">
                        <img src={product.image} alt={product.name} />
                      </div>
                    </td>
                    <td>{product.id}</td>
                    <td>{product.name}</td>
                    <td>PKR {product.price}</td>
                    <td>{product.category}</td>
                    <td>
                      <div className="table-actions">
                        <Link to={`/admin/edit-product/${product.id}`}>Edit</Link>
                        <button type="button" onClick={() => deleteProduct(product.id)}>Delete</button>
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
