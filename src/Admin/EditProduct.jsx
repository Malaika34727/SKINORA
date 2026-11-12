import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Button from '../Components/Button';
import AdminNavbar from '../Components/AdminNavbar';
import AdminSidebar from '../Components/AdminSidebar';
import { useStore } from '../context/StoreContext';
import './EditProduct.css';

const EditProduct = () => {
  const { id } = useParams();
  const { products, updateProduct } = useStore();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    description: '',
    category: '',
    stock: '',
    image: '',
  });

  useEffect(() => {
    const product = products.find((item) => item.id === id);
    if (product) {
      setFormData({
        name: product.name,
        price: product.price,
        description: product.description,
        category: product.category,
        stock: product.stock,
        image: product.image,
      });
    }
  }, [id, products]);

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
  };

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setFormData((current) => ({ ...current, image: URL.createObjectURL(file) }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    updateProduct(id, {
      name: formData.name,
      price: Number(formData.price),
      description: formData.description,
      category: formData.category,
      stock: Number(formData.stock),
      image: formData.image,
    });
    navigate('/admin/manage-products');
  };

  if (!products.some((item) => item.id === id)) {
    return (
      <div className="admin-shell">
        <AdminSidebar />
        <main className="admin-main-panel">
          <AdminNavbar />
          <div className="admin-panel-content">
            <h2>Product not found.</h2>
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

        <div className="admin-panel-content">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Inventory</p>
              <h2>Edit product</h2>
            </div>
          </div>

          <form className="admin-product-form" onSubmit={handleSubmit}>
            <div className="form-grid">
              <label>
                <span>Product Name</span>
                <input type="text" name="name" value={formData.name} onChange={handleInputChange} />
              </label>

              <label>
                <span>Product Price</span>
                <input type="number" name="price" value={formData.price} onChange={handleInputChange} />
              </label>

              <label>
                <span>Category</span>
                <select name="category" value={formData.category} onChange={handleInputChange}>
                  <option value="Serum">Serum</option>
                  <option value="Moisturizer">Moisturizer</option>
                  <option value="Cleanser">Cleanser</option>
                  <option value="Mask">Mask</option>
                  <option value="Toner">Toner</option>
                  <option value="Sunscreen">Sunscreen</option>
                </select>
              </label>

              <label>
                <span>Stock</span>
                <input type="number" name="stock" value={formData.stock} onChange={handleInputChange} />
              </label>
            </div>

            <label>
              <span>Description</span>
              <textarea name="description" rows="5" value={formData.description} onChange={handleInputChange} />
            </label>

            <label>
              <span>Product Image</span>
              <input type="file" accept="image/*" onChange={handleFileChange} />
            </label>

            <div className="image-preview-box">
              <img src={formData.image} alt="Product preview" />
            </div>

            <div className="admin-form-actions">
              <Button type="submit" variant="primary">Update Product</Button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
};

export default EditProduct;
