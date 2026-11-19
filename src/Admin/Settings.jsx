import { useEffect, useState } from 'react';
import AdminNavbar from '../Components/AdminNavbar';
import AdminSidebar from '../Components/AdminSidebar';
import { listenToSettings, saveStoreSettings } from '../services/adminData';
import '../Admin/AdminData.css';

const emptyForm = {
  storeName: 'SKINORA',
  storeEmail: 'hello@skinora.com',
  storePhone: '+923001234567',
  storeAddress: 'Karachi, Pakistan',
  deliveryCharges: 250,
  freeShippingThreshold: 5000,
  currency: 'PKR',
};

const Settings = () => {
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => listenToSettings(
    (settings) => {
      if (settings) {
        setForm({
          storeName: settings.storeName || '',
          storeEmail: settings.storeEmail || '',
          storePhone: settings.storePhone || '',
          storeAddress: settings.storeAddress || '',
          deliveryCharges: settings.deliveryCharges || 0,
          freeShippingThreshold: settings.freeShippingThreshold || 0,
          currency: settings.currency || 'PKR',
        });
      }
      setLoading(false);
    },
    (listenerError) => {
      setError(`Could not load settings: ${listenerError.message}`);
      setLoading(false);
    },
  ), []);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      await saveStoreSettings(form);
      setSuccess('Store settings saved successfully.');
    } catch (submitError) {
      setError(submitError.message || 'The settings could not be saved.');
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
              <p className="eyebrow">Store</p>
              <h2>Store settings</h2>
            </div>
          </div>

          {loading && <p>Loading store settings…</p>}
          {!loading && (
            <form className="admin-card admin-settings-form" onSubmit={handleSubmit}>
              <div className="admin-form-grid">
                <label><span>Store name</span><input name="storeName" value={form.storeName} onChange={handleChange} /></label>
                <label><span>Store email</span><input type="email" name="storeEmail" value={form.storeEmail} onChange={handleChange} /></label>
                <label><span>Store phone</span><input name="storePhone" value={form.storePhone} onChange={handleChange} /></label>
                <label><span>Currency</span><input name="currency" value={form.currency} onChange={handleChange} /></label>
                <label><span>Delivery charges</span><input type="number" min="0" name="deliveryCharges" value={form.deliveryCharges} onChange={handleChange} /></label>
                <label><span>Free shipping threshold</span><input type="number" min="0" name="freeShippingThreshold" value={form.freeShippingThreshold} onChange={handleChange} /></label>
              </div>

              <label>
                <span>Store address</span>
                <textarea rows="4" name="storeAddress" value={form.storeAddress} onChange={handleChange} />
              </label>

              {error && <p role="alert">{error}</p>}
              {success && <p role="status">{success}</p>}

              <div className="admin-form-actions">
                <button type="submit" className="admin-primary-button" disabled={saving}>{saving ? 'Saving…' : 'Save settings'}</button>
              </div>
            </form>
          )}
        </div>
      </main>
    </div>
  );
};

export default Settings;
