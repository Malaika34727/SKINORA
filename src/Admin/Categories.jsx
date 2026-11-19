import { useEffect, useMemo, useState } from 'react';
import AdminNavbar from '../Components/AdminNavbar';
import AdminSidebar from '../Components/AdminSidebar';
import { createCategory, deleteCategory, listenToCategories, updateCategory } from '../services/adminData';
import '../Admin/AdminData.css';

const emptyForm = { name: '', description: '', imageUrl: '' };

const Categories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState('');
  const [form, setForm] = useState(emptyForm);

  useEffect(() => listenToCategories(
    (nextCategories) => {
      setCategories(nextCategories);
      setLoading(false);
    },
    (listenerError) => {
      setError(`Could not load categories: ${listenerError.message}`);
      setLoading(false);
    },
  ), []);

  const filteredCategories = useMemo(() => {
    const term = search.trim().toLowerCase();
    return categories.filter((category) => !term || [category.name, category.description].some((value) => String(value || '').toLowerCase().includes(term)));
  }, [categories, search]);

  const resetForm = () => {
    setForm(emptyForm);
    setSelectedId('');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
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
      setError(submitError.message || 'The category could not be saved.');
    }
  };

  const editCategory = (category) => {
    setSelectedId(category.id);
    setForm({ name: category.name || '', description: category.description || '', imageUrl: category.imageUrl || '' });
    setError('');
    setSuccess('');
  };

  const removeCategory = async (category) => {
    if (!window.confirm(`Delete "${category.name}"?`)) return;
    try {
      await deleteCategory(category.id);
      setSuccess('Category deleted successfully.');
      if (selectedId === category.id) resetForm();
    } catch (removeError) {
      setError(removeError.message || 'The category could not be deleted.');
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
              <p className="eyebrow">Catalog</p>
              <h2>Category management</h2>
            </div>
          </div>

          <div className="admin-two-column">
            <form className="admin-card" onSubmit={handleSubmit}>
              <h3>{selectedId ? 'Edit category' : 'Add category'}</h3>
              <div className="admin-form-grid">
                <label>
                  <span>Category name</span>
                  <input value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} placeholder="e.g. Vitamin C" />
                </label>
                <label>
                  <span>Image URL</span>
                  <input value={form.imageUrl} onChange={(event) => setForm((current) => ({ ...current, imageUrl: event.target.value }))} placeholder="https://..." />
                </label>
              </div>
              <label>
                <span>Description</span>
                <textarea rows="4" value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} placeholder="Short product category description" />
              </label>

              {error && <p role="alert">{error}</p>}
              {success && <p role="status">{success}</p>}

              <div className="admin-form-actions">
                <button type="submit" className="admin-primary-button">{selectedId ? 'Save changes' : 'Create category'}</button>
                {selectedId && <button type="button" className="admin-secondary-button" onClick={resetForm}>Cancel</button>}
              </div>
            </form>

            <div className="admin-card">
              <div className="table-toolbar small-toolbar">
                <h3>Categories</h3>
                <input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search categories" aria-label="Search categories" />
              </div>

              {loading && <p>Loading categories…</p>}
              {!loading && filteredCategories.length === 0 && <p>No categories match your search.</p>}

              <div className="admin-card-list">
                {filteredCategories.map((category) => (
                  <div key={category.id} className="admin-card-item">
                    <div className="admin-entity-header">
                      <strong>{category.name}</strong>
                      <span className="admin-pill">{category.isActive ? 'Active' : 'Inactive'}</span>
                    </div>
                    <p>{category.description || 'No description provided.'}</p>
                    {category.imageUrl && <img className="admin-entity-image" src={category.imageUrl} alt={category.name} />}
                    <div className="admin-inline-actions">
                      <button type="button" className="admin-link-button" onClick={() => editCategory(category)}>Edit</button>
                      <button type="button" className="admin-link-button danger" onClick={() => removeCategory(category)}>Delete</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Categories;
