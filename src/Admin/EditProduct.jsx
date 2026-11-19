import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Button from '../Components/Button';
import AdminNavbar from '../Components/AdminNavbar';
import AdminSidebar from '../Components/AdminSidebar';
import { useStore } from '../context/StoreContextValue';
import { validateProductImage } from '../services/storage';
import './EditProduct.css';

const EditProduct = () => {
  const { id } = useParams();
  const { products, productsLoading } = useStore();

  if (productsLoading) {
    return <main className="page-shell"><p className="container">Loading product…</p></main>;
  }

  const product = products.find((item) => item.id === id);
  if (!product) {
    return (
      <div className="admin-shell">
        <AdminSidebar />
        <main className="admin-main-panel">
          <AdminNavbar />
          <div className="admin-panel-content"><h2>Product not found.</h2></div>
        </main>
      </div>
    );
  }

  return <EditProductForm id={id} product={product} />;
};

const EditProductForm = ({ id, product }) => {
  const { updateProduct, categories } = useStore();
  const navigate = useNavigate();
  const categoryOptions = [...new Set([
    'Serum',
    'Moisturizer',
    'Cleanser',
    'Mask',
    'Toner',
    'Sunscreen',
    product.category,
    ...categories.filter((category) => category.isActive !== false).map((category) => category.name),
  ].filter(Boolean))];
  const [formData, setFormData] = useState(() => ({
    name: product.name,
    price: product.price,
    discountPrice: product.discountPrice ?? '',
    brand: product.brand || '',
    description: product.description,
    category: product.category,
    stock: product.stock,
    status: product.status || 'active',
  }));
  const [imageFile, setImageFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
  }, [previewUrl]);

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
  };

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      validateProductImage(file);
      setError('');
      setImageFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    } catch (validationError) {
      event.target.value = '';
      setError(validationError.message);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!formData.name.trim() || !formData.price || !formData.description.trim() || formData.stock === '') {
      setError('Complete all product fields before saving.');
      return;
    }
    if (!Number.isFinite(Number(formData.price)) || Number(formData.price) < 0
      || !Number.isInteger(Number(formData.stock)) || Number(formData.stock) < 0) {
      setError('Price and stock must be valid non-negative numbers.');
      return;
    }
    if (formData.discountPrice !== ''
      && (!Number.isFinite(Number(formData.discountPrice))
        || Number(formData.discountPrice) < 0
        || Number(formData.discountPrice) > Number(formData.price))) {
      setError('Discount price must be between zero and the regular price.');
      return;
    }

    setSaving(true);
    setError('');
    try {
      const result = await updateProduct(id, {
        name: formData.name.trim(),
        price: Number(formData.price),
        discountPrice: formData.discountPrice === '' ? '' : Number(formData.discountPrice),
        brand: formData.brand.trim(),
        description: formData.description.trim(),
        category: formData.category,
        stock: Number(formData.stock),
        status: formData.status,
      }, imageFile);
      navigate('/admin/manage-products', {
        state: { success: result.cleanupWarning || 'Product updated successfully.' },
      });
    } catch (saveError) {
      setError(saveError.message || 'The product could not be updated.');
    } finally {
      setSaving(false);
    }
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
              <h2>Edit product</h2>
            </div>
          </div>

          <form className="admin-product-form" onSubmit={handleSubmit}>
            <div className="form-grid">
              <label>
                <span>Product Name</span>
                <input type="text" name="name" value={formData.name} onChange={handleInputChange} required maxLength="160" />
              </label>

              <label>
                <span>Product Price</span>
                <input type="number" min="0" step="1" name="price" value={formData.price} onChange={handleInputChange} required />
              </label>

              <label>
                <span>Discount Price (optional)</span>
                <input type="number" min="0" step="1" name="discountPrice" value={formData.discountPrice} onChange={handleInputChange} />
              </label>

              <label>
                <span>Brand</span>
                <input type="text" maxLength="120" name="brand" value={formData.brand} onChange={handleInputChange} />
              </label>

              <label>
                <span>Category</span>
                <select name="category" value={formData.category} onChange={handleInputChange}>
                  {categoryOptions.map((category) => <option key={category} value={category}>{category}</option>)}
                </select>
              </label>

              <label>
                <span>Stock</span>
                <input type="number" min="0" step="1" name="stock" value={formData.stock} onChange={handleInputChange} required />
              </label>

              <label>
                <span>Product Status</span>
                <select name="status" value={formData.status} onChange={handleInputChange}>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </label>
            </div>

            <label>
              <span>Description</span>
              <textarea name="description" rows="5" value={formData.description} onChange={handleInputChange} required />
            </label>

            <label>
              <span>Product Image</span>
              <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handleFileChange} />
            </label>

            <div className="image-preview-box">
              <img src={previewUrl || product.imageUrl} alt="Product preview" />
            </div>

            {error && <p role="alert">{error}</p>}
            <div className="admin-form-actions">
              <Button type="submit" variant="primary" disabled={saving}>{saving ? 'Saving…' : 'Update Product'}</Button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
};

export default EditProduct;
