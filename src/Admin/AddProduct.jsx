import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../Components/Button';
import AdminNavbar from '../Components/AdminNavbar';
import AdminSidebar from '../Components/AdminSidebar';
import { useStore } from '../context/StoreContext';
import './AddProduct.css';

const emptyForm = {
  name: '',
  price: '',
  category: 'Serum',
  description: '',
  stock: '',
  image: '',
};

const AddProduct = () => {
  const { addProduct } = useStore();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [formData, setFormData] = useState(emptyForm);
  const [previewUrl, setPreviewUrl] = useState('');

  const handleImageChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
    setFormData((current) => ({ ...current, image: objectUrl }));
  };

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    if (!formData.name || !formData.price || !formData.description || !formData.stock || !formData.image) {
      return;
    }

    const nextProduct = {
      id: `P${Date.now().toString().slice(-5)}`,
      name: formData.name,
      price: Number(formData.price),
      category: formData.category,
      description: formData.description,
      stock: Number(formData.stock),
      image: formData.image,
    };

    addProduct(nextProduct);
    setFormData(emptyForm);
    setPreviewUrl('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    navigate('/admin/manage-products');
  };

  return (
    <div className="admin-shell">
      <AdminSidebar />

      <main className="admin-main-panel">
        <AdminNavbar />

        <div className="admin-panel-content">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Inventory</p>
              <h2>Add new product</h2>
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
                <span>Product Category</span>
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
                <span>Stock Quantity</span>
                <input type="number" name="stock" value={formData.stock} onChange={handleInputChange} />
              </label>
            </div>

            <label>
              <span>Product Description</span>
              <textarea name="description" rows="5" value={formData.description} onChange={handleInputChange} />
            </label>

            <label>
              <span>Product Image Upload</span>
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageChange} />
            </label>

            {previewUrl && (
              <div className="image-preview-box">
                <img src={previewUrl} alt="Product preview" />
              </div>
            )}

            <div className="admin-form-actions">
              <Button type="submit" variant="primary">Save Product</Button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
};

export default AddProduct;
