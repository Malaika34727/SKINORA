
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

  const handleInputChange = (event) => {
    const { name, value } = event.target;

    setFormData((current) => ({
      ...current,
      [name]: value,
    }));
  };

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

  if (authLoading) {
    return (
      <div className="admin-shell">
        <AdminSidebar />

        <main className="admin-main-panel">
          <AdminNavbar />

          <div className="admin-panel-content add-product-page">
            <div className="add-product-loading">
              <span className="add-product-loader" />
              <p>Verifying administrator permissions...</p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (!canAddProduct) {
    return (
      <div className="admin-shell">
        <AdminSidebar />

        <main className="admin-main-panel">
          <AdminNavbar />

          <div className="admin-panel-content add-product-page">
            <div className="add-product-restricted">
              <span className="restricted-icon">!</span>
              <p className="add-product-eyebrow">ACCESS CONTROL</p>
              <h2>Access Restricted</h2>
              <p>
                You do not have permission to add products.
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

        <div className="admin-panel-content add-product-page">
          <div className="add-product-heading">
            <div>
              <p className="add-product-eyebrow">
                SKINORA / INVENTORY MANAGEMENT
              </p>

              <h1>Add New Product</h1>

              <p className="add-product-description">
                Add a new skincare product to your store inventory.
              </p>
            </div>

            <div className="add-product-heading-mark">
              <span>+</span>
            </div>
          </div>

          <form
            className="admin-product-form"
            onSubmit={handleSubmit}
          >
            <div className="product-form-section">
              <div className="product-section-heading">
                <div className="product-section-number">01</div>

                <div>
                  <h3>Product Information</h3>
                  <p>Enter the basic details of your product.</p>
                </div>
              </div>

              <div className="form-grid">
                <label className="product-field">
                  <span>Product Name <i>*</i></span>
                  <input
                    type="text"
                    name="name"
                    placeholder="e.g. Vitamin C Brightening Serum"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    maxLength="160"
                  />
                </label>

                <label className="product-field">
                  <span>Brand Name</span>
                  <input
                    type="text"
                    name="brand"
                    placeholder="Enter brand name"
                    maxLength="120"
                    value={formData.brand}
                    onChange={handleInputChange}
                  />
                </label>

                <label className="product-field">
                  <span>Product Category <i>*</i></span>
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

                <label className="product-field">
                  <span>Product Status <i>*</i></span>
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

              <label className="product-field product-description-field">
                <span>Product Description <i>*</i></span>
                <textarea
                  name="description"
                  rows="5"
                  placeholder="Describe the product, its benefits and key features..."
                  value={formData.description}
                  onChange={handleInputChange}
                  required
                />
                <small>Write a clear description for your customers.</small>
              </label>
            </div>

            <div className="product-form-divider" />

            <div className="product-form-section">
              <div className="product-section-heading">
                <div className="product-section-number">02</div>

                <div>
                  <h3>Pricing & Inventory</h3>
                  <p>Set the product price and available stock.</p>
                </div>
              </div>

              <div className="form-grid">
                <label className="product-field">
                  <span>Regular Price (PKR) <i>*</i></span>
                  <div className="product-input-prefix">
                    <span>Rs.</span>
                    <input
                      type="number"
                      name="price"
                      min="0"
                      step="1"
                      placeholder="0"
                      value={formData.price}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </label>

                <label className="product-field">
                  <span>Discount Price (PKR)</span>
                  <div className="product-input-prefix">
                    <span>Rs.</span>
                    <input
                      type="number"
                      name="discountPrice"
                      min="0"
                      step="1"
                      placeholder="Optional"
                      value={formData.discountPrice}
                      onChange={handleInputChange}
                    />
                  </div>
                </label>

                <label className="product-field">
                  <span>Stock Quantity <i>*</i></span>
                  <input
                    type="number"
                    name="stock"
                    min="0"
                    step="1"
                    placeholder="Enter available quantity"
                    value={formData.stock}
                    onChange={handleInputChange}
                    required
                  />
                </label>
              </div>
            </div>

            <div className="product-form-divider" />

            <div className="product-form-section">
              <div className="product-section-heading">
                <div className="product-section-number">03</div>

                <div>
                  <h3>Product Photography</h3>
                  <p>Upload a clear image of your product.</p>
                </div>
              </div>

              <div className="product-upload-layout">
                <label className="product-upload-box">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleImageChange}
                    required
                  />

                  <span className="product-upload-icon">↑</span>
                  <strong>Choose product image</strong>
                  <span>Click here to browse your files</span>
                  <small>Supported formats: JPG, PNG, WEBP</small>
                </label>

                {previewUrl && (
                  <div className="product-image-preview">
                    <p>IMAGE PREVIEW</p>
                    <img
                      src={previewUrl}
                      alt="Product preview"
                    />
                    <span>{imageFile?.name}</span>
                  </div>
                )}
              </div>
            </div>

            {error && (
              <div className="add-product-error" role="alert">
                <span>!</span>
                {error}
              </div>
            )}

            <div className="admin-form-actions">
              <p>Fields marked with * are required.</p>

              <Button
                type="submit"
                variant="primary"
                disabled={saving}
              >
                {saving ? 'Saving Product...' : 'Save Product'}
              </Button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
};

export default AddProduct;
