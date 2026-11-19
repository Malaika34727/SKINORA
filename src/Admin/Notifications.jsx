import { useEffect, useMemo, useState } from 'react';
import AdminNavbar from '../Components/AdminNavbar';
import AdminSidebar from '../Components/AdminSidebar';
import { createNotification, deleteNotification, listenToNotifications, updateNotification } from '../services/adminData';
import '../Admin/AdminData.css';

const emptyForm = { title: '', message: '', type: 'general', customerId: 'all' };

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState('');
  const [form, setForm] = useState(emptyForm);

  useEffect(() => listenToNotifications(
    (nextNotifications) => {
      setNotifications(nextNotifications);
      setLoading(false);
    },
    (listenerError) => {
      setError(`Could not load notifications: ${listenerError.message}`);
      setLoading(false);
    },
  ), []);

  const filteredNotifications = useMemo(() => {
    const term = search.trim().toLowerCase();
    return notifications.filter((notification) => !term || [notification.title, notification.message, notification.type].some((value) => String(value || '').toLowerCase().includes(term)));
  }, [notifications, search]);

  const resetForm = () => {
    setForm(emptyForm);
    setSelectedId('');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      if (!form.title.trim() || !form.message.trim()) {
        throw new Error('Notification title and message are required.');
      }

      if (selectedId) {
        await updateNotification(selectedId, form);
        setSuccess('Notification updated successfully.');
      } else {
        await createNotification(form);
        setSuccess('Notification created successfully.');
      }

      resetForm();
    } catch (submitError) {
      setError(submitError.message || 'The notification could not be saved.');
    }
  };

  const handleDelete = async (notificationId) => {
    if (!window.confirm('Delete this notification?')) return;
    try {
      await deleteNotification(notificationId);
      setSuccess('Notification deleted successfully.');
      if (selectedId === notificationId) resetForm();
    } catch (deleteError) {
      setError(deleteError.message || 'The notification could not be deleted.');
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
              <p className="eyebrow">Communications</p>
              <h2>Notifications</h2>
            </div>
          </div>

          <div className="admin-two-column">
            <form className="admin-card" onSubmit={handleSubmit}>
              <h3>{selectedId ? 'Edit notification' : 'Create notification'}</h3>
              <label>
                <span>Title</span>
                <input value={form.title} onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))} placeholder="Order received" />
              </label>
               <label>
                <span>Type</span>
                <select value={form.type} onChange={(event) => setForm((current) => ({ ...current, type: event.target.value }))}>
                  <option value="general">General</option>
                  <option value="order">Order</option>
                  <option value="shipping">Shipping</option>
                  <option value="delivery">Delivery</option>
                </select>
              </label>
              <label>
                <span>Message</span>
                <textarea rows="5" value={form.message} onChange={(event) => setForm((current) => ({ ...current, message: event.target.value }))} placeholder="Notification message" />
              </label>
              {error && <p role="alert">{error}</p>}
              {success && <p role="status">{success}</p>}
              <div className="admin-form-actions">
                <button type="submit" className="admin-primary-button">{selectedId ? 'Save changes' : 'Create notification'}</button>
                {selectedId && <button type="button" className="admin-secondary-button" onClick={resetForm}>Cancel</button>}
              </div>
            </form>

            <div className="admin-card">
              <div className="table-toolbar small-toolbar">
                <h3>Inbox</h3>
                <input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search notifications" aria-label="Search notifications" />
              </div>
              {loading && <p>Loading notifications…</p>}
              {!loading && filteredNotifications.length === 0 && <p>No notifications found.</p>}

              <div className="admin-card-list">
                {filteredNotifications.map((notification) => (
                  <div key={notification.id} className="admin-card-item">
                    <div className="admin-entity-header">
                      <strong>{notification.title}</strong>
                      <span className="admin-pill">{notification.type}</span>
                    </div>
                    <p>{notification.message}</p>
                    <div className="admin-inline-actions">
                      <button type="button" className="admin-link-button" onClick={() => {
                        setSelectedId(notification.id);
                        setForm({ title: notification.title, message: notification.message, type: notification.type || 'general', customerId: notification.customerId || 'all' });
                      }}>Edit</button>
                      <button type="button" className="admin-link-button danger" onClick={() => handleDelete(notification.id)}>Delete</button>
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

export default Notifications;
