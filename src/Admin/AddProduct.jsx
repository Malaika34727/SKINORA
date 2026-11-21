
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import Button from '../Components/Button';
import AdminNavbar from '../Components/AdminNavbar';
import AdminSidebar from '../Components/AdminSidebar';

import { useStore } from '../context/StoreContextValue';
import { useAuth } from '../context/AuthContextValue';

import { validateProductImage } from '../services/storage';

import './AddProduct.css';

const emptyForm = {
  name: '',
  price: '',
  discountPrice: '',
  brand: '',
  category: 'Serum',
  description: '',
  stock: '',
  status: 'active',
};

const defaultCategories = [
  'Serum',
  'Moisturizer',
  'Cleanser',
  'Mask',
  'Toner',
  'Sunscreen',
];

const AddProduct = () => {
  const { addProduct, categories } = useStore();

  const { role, permissions = {}, loading: authLoading } = useAuth();

  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [formData, setFormData] = useState(emptyForm);
  const [previewUrl, setPreviewUrl] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  // Super Admin has all permissions.
  const isSuperAdmin = role === 'admin';

  const canAddProduct =
    isSuperAdmin || permissions.addProduct === true;

  const categoryOptions = [...new Set([
    ...defaultCategories,
    ...categories
      .filter((category) => category.isActive !== false)
      .map((category) => category.name),
  ])];

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  // IMAGE SELECTION
  const handleImageChange = (event) => {
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

  // FORM INPUT
  const handleInputChange = (event) => {
    const { name, value } = event.target;

    setFormData((current) => ({
      ...current,
      [name]: value,
    }));
  };

  // SAVE PRODUCT
  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!canAddProduct) {
      setError('You do not have permission to add products.');
      return;
    }

    if (
      !formData.name.trim()
      || !formData.price
      || !formData.description.trim()
      || formData.stock === ''
    ) {
      setError('Complete all product fields before saving.');
      return;
    }

    if (
      !Number.isFinite(Number(formData.price))
      || Number(formData.price) < 0
      || !Number.isInteger(Number(formData.stock))
      || Number(formData.stock) < 0
    ) {
      setError('Price and stock must be valid non-negative numbers.');
      return;
    }

    if (
      formData.discountPrice !== ''
      && (
        !Number.isFinite(Number(formData.discountPrice))
        || Number(formData.discountPrice) < 0
        || Number(formData.discountPrice) > Number(formData.price)
      )
    ) {
      setError('Discount price must be between zero and the regular price.');
      return;
    }

    setSaving(true);
    setError('');

    try {
      await addProduct({
        name: formData.name.trim(),
        price: Number(formData.price),

        ...(formData.discountPrice === ''
          ? {}
          : { discountPrice: Number(formData.discountPrice) }),

        brand: formData.brand.trim(),
        category: formData.category,
        description: formData.description.trim(),
        stock: Number(formData.stock),
        status: formData.status,
      }, imageFile);

      setFormData(emptyForm);
      setImageFile(null);
      setPreviewUrl('');

      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      navigate('/admin/manage-products', {
        state: {
          success: 'Product saved successfully.',
        },
      });

    } catch (saveError) {
      setError(
        saveError.message || 'The product could not be saved.'
      );

    } finally {
      setSaving(false);
    }
  };

  // AUTH LOADING
  if (authLoading) {
    return (
      <div className="admin-shell">
        <AdminSidebar />

        <main className="admin-main-panel">
          <AdminNavbar />

          <div className="admin-panel-content">
            <p>Verifying administrator permissions...</p>
          </div>
        </main>
      </div>
    );
  }

  // PERMISSION CHECK
  if (!canAddProduct) {
    return (
      <div className="admin-shell">
        <AdminSidebar />

        <main className="admin-main-panel">
          <AdminNavbar />

          <div className="admin-panel-content">
            <h2>Access Restricted</h2>

            <p>
              You do not have permission to add products.
              Please contact your Super Admin.
            </p>
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
              <h2>Add new product</h2>
            </div>
          </div>

          <form
            className="admin-product-form"
            onSubmit={handleSubmit}
          >
            <div className="form-grid">

              <label>
                <span>Product Name</span>

                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  maxLength="160"
                />
              </label>

              <label>
                <span>Product Price</span>

                <input
                  type="number"
                  name="price"
                  min="0"
                  step="1"
                  value={formData.price}
                  onChange={handleInputChange}
                  required
                />
              </label>

              <label>
                <span>Discount Price (optional)</span>

                <input
                  type="number"
                  name="discountPrice"
                  min="0"
                  step="1"
                  value={formData.discountPrice}
                  onChange={handleInputChange}
                />
              </label>

              <label>
                <span>Brand</span>

                <input
                  type="text"
                  name="brand"
                  maxLength="120"
                  value={formData.brand}
                  onChange={handleInputChange}
                />
              </label>

              <label>
                <span>Product Category</span>

                <select
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                >
                  {categoryOptions.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                <span>Stock Quantity</span>

                <input
                  type="number"
                  name="stock"
                  min="0"
                  step="1"
                  value={formData.stock}
                  onChange={handleInputChange}
                  required
                />
              </label>

              <label>
                <span>Product Status</span>

                <select
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </label>

            </div>

            <label>
              <span>Product Description</span>

              <textarea
                name="description"
                rows="5"
                value={formData.description}
                onChange={handleInputChange}
                required
              />
            </label>

            <label>
              <span>Product Image Upload</span>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleImageChange}
                required
              />
            </label>

            {previewUrl && (
              <div className="image-preview-box">
                <img
                  src={previewUrl}
                  alt="Product preview"
                />
              </div>
            )}

            {error && (
              <p role="alert">{error}</p>
            )}

            <div className="admin-form-actions">
              <Button
                type="submit"
                variant="primary"
                disabled={saving}
              >
                {saving ? 'Saving…' : 'Save Product'}
              </Button>
            </div>

          </form>
        </div>
      </main>
    </div>
  );
};

export default AddProduct;
