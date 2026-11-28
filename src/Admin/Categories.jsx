
import { useEffect, useMemo, useState } from 'react';

import AdminNavbar from '../Components/AdminNavbar';
import AdminSidebar from '../Components/AdminSidebar';
import {
  createCategory,
  deleteCategory,
  listenToCategories,
  updateCategory,
} from '../services/adminData';

import '../Admin/AdminData.css';

const emptyForm = {
  name: '',
  description: '',
  imageUrl: '',
};

const Categories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState('');
  const [form, setForm] = useState(emptyForm);

  useEffect(
    () =>
      listenToCategories(
        (nextCategories) => {
          setCategories(nextCategories);
          setLoading(false);
        },
        (listenerError) => {
          setError(`Could not load categories: ${listenerError.message}`);
          setLoading(false);
        },
      ),
    [],
  );

  const filteredCategories = useMemo(() => {
    const term = search.trim().toLowerCase();

    return categories.filter(
      (category) =>
        !term ||
        [category.name, category.description].some((value) =>
          String(value || '').toLowerCase().includes(term),
        ),
    );
  }, [categories, search]);

  const resetForm = () => {
    setForm(emptyForm);
    setSelectedId('');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError('');
    setSuccess('');

    try {
      if (!form.name.trim()) {
        throw new Error('Category name is required.');
      }

      if (selectedId) {
        await updateCategory(selectedId, form);
        setSuccess('Category updated successfully.');
      } else {
        await createCategory(form);
        setSuccess('Category created successfully.');
      }

      resetForm();
    } catch (submitError) {
      setError(
        submitError.message || 'The category could not be saved.',
      );
    }
  };

  const editCategory = (category) => {
    setSelectedId(category.id);

    setForm({
      name: category.name || '',
      description: category.description || '',
      imageUrl: category.imageUrl || '',
    });

    setError('');
    setSuccess('');
  };

  const removeCategory = async (category) => {
    if (!window.confirm(`Delete "${category.name}"?`)) return;

    setError('');
    setSuccess('');

    try {
      await deleteCategory(category.id);

      setSuccess('Category deleted successfully.');

      if (selectedId === category.id) {
        resetForm();
      }
    } catch (removeError) {
      setError(
        removeError.message || 'The category could not be deleted.',
      );
    }
  };

  return (
    <div className="admin-shell">
      <AdminSidebar />

      <main className="admin-main-panel">
        <AdminNavbar />

        <div className="admin-panel-content categories-page">

          {/* PAGE HEADER */}
          <div className="categories-heading">
            <div>
              <p className="categories-eyebrow">
                SKINORA / CATALOG
              </p>

              <h2>Category Management</h2>

              <p className="categories-heading-description">
                Organize your skincare collection and manage product
                categories in one place.
              </p>
            </div>

            <div className="categories-total-card">
              <span className="categories-total-icon">◇</span>
              <div>
                <strong>{categories.length}</strong>
                <span>Total Categories</span>
              </div>
            </div>
          </div>

          {/* FEEDBACK */}
          {error && (
            <div className="categories-feedback categories-error" role="alert">
              <span>!</span>
              {error}
            </div>
          )}

          {success && (
            <div className="categories-feedback categories-success" role="status">
              <span>✓</span>
              {success}
            </div>
          )}

          {/* MAIN CONTENT */}
          <div className="categories-layout">

            {/* CATEGORY FORM */}
            <section className="categories-form-card">
              <div className="categories-card-heading">
                <div>
                  <span className="categories-section-label">
                    CATEGORY DETAILS
                  </span>

                  <h3>
                    {selectedId ? 'Edit Category' : 'Create Category'}
                  </h3>
                </div>

                <span className="categories-heading-symbol">
                  {selectedId ? '✎' : '+'}
                </span>
              </div>

              <form onSubmit={handleSubmit}>
                <div className="categories-form-fields">

                  <label className="categories-field">
                    <span>Category Name</span>

                    <input
                      value={form.name}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          name: event.target.value,
                        }))
                      }
                      placeholder="e.g. Vitamin C"
                    />
                  </label>

                  <label className="categories-field">
                    <span>Image URL</span>

                    <input
                      value={form.imageUrl}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          imageUrl: event.target.value,
                        }))
                      }
                      placeholder="https://..."
                    />
                  </label>

                  <label className="categories-field">
                    <span>Description</span>

                    <textarea
                      rows="5"
                      value={form.description}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          description: event.target.value,
                        }))
                      }
                      placeholder="Write a short description for this category..."
                    />
                  </label>

                </div>

                {form.imageUrl && (
                  <div className="categories-image-preview">
                    <span>IMAGE PREVIEW</span>
                    <img
                      src={form.imageUrl}
                      alt="Category preview"
                    />
                  </div>
                )}

                <div className="categories-form-actions">
                  <button type="submit" className="categories-save-button">
                    {selectedId ? 'Save Changes' : 'Create Category'}
                  </button>

                  {selectedId && (
                    <button
                      type="button"
                      className="categories-cancel-button"
                      onClick={resetForm}
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </form>
            </section>

            {/* CATEGORY LIST */}
            <section className="categories-list-card">
              <div className="categories-card-heading">
                <div>
                  <span className="categories-section-label">
                    YOUR COLLECTION
                  </span>

                  <h3>All Categories</h3>
                </div>

                <span className="categories-list-count">
                  {filteredCategories.length} Found
                </span>
              </div>

              <div className="categories-search">
                <span>⌕</span>

                <input
                  type="search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search categories..."
                  aria-label="Search categories"
                />
              </div>

              {loading && (
                <div className="categories-state">
                  <span className="categories-spinner" />
                  <p>Loading categories...</p>
                </div>
              )}

              {!loading && filteredCategories.length === 0 && (
                <div className="categories-state categories-empty">
                  <span>◇</span>
                  <strong>No categories found</strong>
                  <p>
                    {search
                      ? 'Try another search term.'
                      : 'Create your first category to get started.'}
                  </p>
                </div>
              )}

              {!loading && filteredCategories.length > 0 && (
                <div className="categories-list">
                  {filteredCategories.map((category) => (
                    <article
                      key={category.id}
                      className="category-item"
                    >
                      <div className="category-item-top">

                        <div className="category-image-box">
                          {category.imageUrl ? (
                            <img
                              src={category.imageUrl}
                              alt={category.name}
                            />
                          ) : (
                            <span>◇</span>
                          )}
                        </div>

                        <div className="category-item-details">
                          <div className="category-item-title">
                            <h4>{category.name}</h4>

                            <span
                              className={`category-status ${
                                category.isActive
                                  ? 'category-active'
                                  : 'category-inactive'
                              }`}
                            >
                              <span />
                              {category.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </div>

                          <p>
                            {category.description ||
                              'No description provided.'}
                          </p>
                        </div>
                      </div>

                      <div className="category-item-actions">
                        <button
                          type="button"
                          className="category-edit-button"
                          onClick={() => editCategory(category)}
                        >
                          Edit Category
                        </button>

                        <button
                          type="button"
                          className="category-delete-button"
                          onClick={() => removeCategory(category)}
                        >
                          Delete
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>

          </div>
        </div>
      </main>

      <style>{`
        /* SCOPED CATEGORY PAGE STYLES */

        .categories-page {
          padding-bottom: 40px;
          color: #382820;
        }

        .categories-heading {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 22px;
          margin-bottom: 28px;
        }

        .categories-eyebrow,
        .categories-section-label {
          display: block;
          margin: 0 0 8px;
          color: #a17b48;
          font-size: 0.69rem;
          font-weight: 800;
          letter-spacing: 0.17em;
          text-transform: uppercase;
        }

        .categories-heading h2 {
          margin: 0;
          color: #382820;
          font-family: var(--font-display, Georgia, serif);
          font-size: clamp(2rem, 3vw, 2.7rem);
          font-weight: 600;
        }

        .categories-heading-description {
          margin: 9px 0 0;
          color: #8c7d70;
          font-size: 0.9rem;
          line-height: 1.65;
        }

        .categories-total-card {
          display: flex;
          align-items: center;
          gap: 13px;
          min-width: 175px;
          padding: 16px 20px;
          border: 1px solid rgba(207, 173, 135, 0.35);
          border-radius: 14px;
          background: linear-gradient(135deg, #30231f, #49342c 65%, #392821);
          box-shadow: 0 8px 22px rgba(48, 35, 31, 0.14);
          color: #f3e4cf;
        }

        .categories-total-icon {
          display: grid;
          width: 39px;
          height: 39px;
          place-items: center;
          border: 1px solid rgba(218, 185, 137, 0.35);
          border-radius: 11px;
          background: rgba(218, 185, 137, 0.12);
          color: #e5c697;
          font-size: 1.5rem;
        }

        .categories-total-card div {
          display: flex;
          flex-direction: column;
          gap: 3px;
        }

        .categories-total-card strong {
          color: #fff3df;
          font-family: Georgia, serif;
          font-size: 1.65rem;
        }

        .categories-total-card div span {
          color: #d2b99b;
          font-size: 0.72rem;
        }

        .categories-feedback {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 18px;
          padding: 13px 16px;
          border-radius: 11px;
          font-size: 0.86rem;
        }

        .categories-feedback > span {
          display: grid;
          width: 24px;
          height: 24px;
          place-items: center;
          border-radius: 50%;
          background: rgba(0,0,0,0.06);
          font-weight: 800;
        }

        .categories-error {
          border: 1px solid #ead3cc;
          background: #fff3ef;
          color: #984c40;
        }

        .categories-success {
          border: 1px solid #d8e4d2;
          background: #f1f6ee;
          color: #52734b;
        }

        .categories-layout {
          display: grid;
          grid-template-columns: minmax(290px, 0.85fr) minmax(0, 1.35fr);
          align-items: start;
          gap: 22px;
        }

        .categories-form-card,
        .categories-list-card {
          min-width: 0;
          padding: 23px;
          border: 1px solid #e9dfd2;
          border-radius: 17px;
          background: linear-gradient(145deg, #fffefa, #faf5ed);
          box-shadow: 0 9px 26px rgba(61, 43, 32, 0.055);
        }

        .categories-card-heading {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          margin-bottom: 22px;
        }

        .categories-card-heading h3 {
          margin: 0;
          color: #3b2a22;
          font-family: var(--font-display, Georgia, serif);
          font-size: 1.45rem;
          font-weight: 600;
        }

        .categories-heading-symbol {
          display: grid;
          width: 39px;
          height: 39px;
          place-items: center;
          border: 1px solid #e6d4bb;
          border-radius: 11px;
          background: #f6eee2;
          color: #94703d;
          font-size: 1.4rem;
        }

        .categories-form-fields {
          display: flex;
          flex-direction: column;
          gap: 17px;
        }

        .categories-field {
          display: flex;
          flex-direction: column;
          gap: 8px;
          min-width: 0;
        }

        .categories-field > span {
          color: #5c493b;
          font-size: 0.79rem;
          font-weight: 750;
        }

        .categories-field input,
        .categories-field textarea {
          width: 100%;
          box-sizing: border-box;
          border: 1px solid #e5d9cb;
          border-radius: 10px;
          outline: none;
          background: #fff;
          color: #49372d;
          font: inherit;
          font-size: 0.85rem;
          transition: border-color 0.2s, box-shadow 0.2s;
        }

        .categories-field input {
          height: 46px;
          padding: 0 13px;
        }

        .categories-field textarea {
          min-height: 115px;
          padding: 12px 13px;
          resize: vertical;
          line-height: 1.6;
        }

        .categories-field input::placeholder,
        .categories-field textarea::placeholder {
          color: #ad9e90;
        }

        .categories-field input:focus,
        .categories-field textarea:focus {
          border-color: #b89565;
          box-shadow: 0 0 0 3px rgba(184, 149, 101, 0.13);
        }

        .categories-image-preview {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          margin-top: 18px;
          padding: 11px;
          border: 1px solid #eadfce;
          border-radius: 11px;
          background: #faf5ed;
        }

        .categories-image-preview > span {
          color: #94703d;
          font-size: 0.66rem;
          font-weight: 800;
          letter-spacing: 0.1em;
        }

        .categories-image-preview img {
          width: 65px;
          height: 65px;
          border-radius: 9px;
          object-fit: cover;
        }

        .categories-form-actions {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          margin-top: 23px;
        }

        .categories-save-button,
        .categories-cancel-button {
          min-height: 43px;
          padding: 0 18px;
          border-radius: 10px;
          font: inherit;
          font-size: 0.81rem;
          font-weight: 750;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .categories-save-button {
          border: 1px solid #6a4d39;
          background: linear-gradient(135deg, #30231f, #49342c);
          color: #f4e6d2;
          box-shadow: 0 5px 13px rgba(48, 35, 31, 0.13);
        }

        .categories-save-button:hover {
          transform: translateY(-2px);
          border-color: #c9a875;
          box-shadow: 0 8px 18px rgba(48, 35, 31, 0.2);
        }

        .categories-cancel-button {
          border: 1px solid #e2d5c5;
          background: #fff;
          color: #725b47;
        }

        .categories-cancel-button:hover {
          background: #f5eee4;
        }

        .categories-list-count {
          padding: 7px 11px;
          border: 1px solid #e8d9c4;
          border-radius: 999px;
          background: #f5ecdf;
          color: #80613c;
          font-size: 0.72rem;
          font-weight: 750;
          white-space: nowrap;
        }

        .categories-search {
          position: relative;
          margin-bottom: 18px;
        }

        .categories-search > span {
          position: absolute;
          top: 50%;
          left: 13px;
          transform: translateY(-55%);
          color: #a17b48;
          font-size: 1.5rem;
          pointer-events: none;
        }

        .categories-search input {
          width: 100%;
          height: 45px;
          box-sizing: border-box;
          padding: 0 13px 0 39px;
          border: 1px solid #e6dbce;
          border-radius: 10px;
          outline: none;
          background: #fff;
          color: #49372d;
          font: inherit;
          font-size: 0.84rem;
        }

        .categories-search input:focus {
          border-color: #b89565;
          box-shadow: 0 0 0 3px rgba(184, 149, 101, 0.13);
        }

        .categories-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .category-item {
          padding: 15px;
          border: 1px solid #ece2d6;
          border-radius: 13px;
          background: #fff;
          transition: border-color 0.2s, transform 0.2s, box-shadow 0.2s;
        }

        .category-item:hover {
          transform: translateY(-2px);
          border-color: #d7c2a3;
          box-shadow: 0 7px 17px rgba(61, 43, 32, 0.07);
        }

        .category-item-top {
          display: flex;
          align-items: flex-start;
          gap: 13px;
        }

        .category-image-box {
          display: grid;
          flex: 0 0 72px;
          width: 72px;
          height: 72px;
          overflow: hidden;
          place-items: center;
          border: 1px solid #e9dfd2;
          border-radius: 11px;
          background: #f6efe5;
          color: #a17b48;
          font-size: 1.8rem;
        }

        .category-image-box img {
          display: block;
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .category-item-details {
          flex: 1;
          min-width: 0;
        }

        .category-item-title {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 8px;
        }

        .category-item-title h4 {
          margin: 0;
          color: #403027;
          font-family: var(--font-display, Georgia, serif);
          font-size: 1.05rem;
          font-weight: 650;
        }

        .category-item-details > p {
          margin: 8px 0 0;
          color: #928275;
          font-size: 0.78rem;
          line-height: 1.55;
          overflow-wrap: anywhere;
        }

        .category-status {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 5px 8px;
          border-radius: 999px;
          font-size: 0.65rem;
          font-weight: 800;
          text-transform: capitalize;
        }

        .category-status > span {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: currentColor;
        }

        .category-active {
          border: 1px solid #d8e5d2;
          background: #f0f6ed;
          color: #52734b;
        }

        .category-inactive {
          border: 1px solid #eadbd5;
          background: #f8efec;
          color: #946054;
        }

        .category-item-actions {
          display: flex;
          justify-content: flex-end;
          gap: 8px;
          margin-top: 13px;
          padding-top: 12px;
          border-top: 1px solid #f0e8de;
        }

        .category-edit-button,
        .category-delete-button {
          min-height: 32px;
          padding: 0 12px;
          border-radius: 8px;
          font: inherit;
          font-size: 0.72rem;
          font-weight: 750;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .category-edit-button {
          border: 1px solid #d8c3a5;
          background: #f7efe3;
          color: #785832;
        }

        .category-edit-button:hover {
          background: #eee0cb;
        }

        .category-delete-button {
          border: 1px solid #ead5d0;
          background: #fff5f2;
          color: #a34f43;
        }

        .category-delete-button:hover {
          background: #f8e7e2;
        }

        .categories-state {
          display: flex;
          align-items: center;
          justify-content: center;
          flex-direction: column;
          gap: 10px;
          min-height: 180px;
          color: #948477;
          text-align: center;
        }

        .categories-state p {
          margin: 0;
          font-size: 0.82rem;
        }

        .categories-empty > span {
          color: #b18c5c;
          font-size: 2.2rem;
        }

        .categories-empty strong {
          color: #49372d;
          font-family: var(--font-display, Georgia, serif);
          font-size: 1.1rem;
        }

        .categories-spinner {
          width: 24px;
          height: 24px;
          border: 2px solid #e8d9c4;
          border-top-color: #8e6b42;
          border-radius: 50%;
          animation: categoriesSpin 0.8s linear infinite;
        }

        @keyframes categoriesSpin {
          to { transform: rotate(360deg); }
        }

        @media (max-width: 1050px) {
          .categories-layout {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 650px) {
          .categories-heading {
            align-items: flex-start;
            flex-direction: column;
          }

          .categories-total-card {
            width: 100%;
            box-sizing: border-box;
          }

          .categories-form-card,
          .categories-list-card {
            padding: 17px;
          }
        }

        @media (max-width: 420px) {
          .category-item-top {
            flex-direction: column;
          }

          .category-item-title {
            align-items: flex-start;
            flex-direction: column;
          }

          .category-item-actions {
            justify-content: flex-start;
          }
        }
      `}</style>
    </div>
  );
};

export default Categories;
