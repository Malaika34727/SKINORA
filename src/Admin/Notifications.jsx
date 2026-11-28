
import { useEffect, useMemo, useState } from 'react';
import AdminNavbar from '../Components/AdminNavbar';
import AdminSidebar from '../Components/AdminSidebar';
import {
  createNotification,
  deleteNotification,
  listenToNotifications,
  updateNotification,
} from '../services/adminData';
import '../Admin/AdminData.css';

const emptyForm = {
  title: '',
  message: '',
  type: 'general',
  customerId: 'all',
};

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState('');
  const [form, setForm] = useState(emptyForm);

  useEffect(
    () =>
      listenToNotifications(
        (nextNotifications) => {
          setNotifications(nextNotifications);
          setLoading(false);
        },
        (listenerError) => {
          setError(`Could not load notifications: ${listenerError.message}`);
          setLoading(false);
        },
      ),
    [],
  );

  const filteredNotifications = useMemo(() => {
    const term = search.trim().toLowerCase();

    return notifications.filter(
      (notification) =>
        !term ||
        [
          notification.title,
          notification.message,
          notification.type,
        ].some((value) =>
          String(value || '').toLowerCase().includes(term),
        ),
    );
  }, [notifications, search]);

  const typeCounts = {
    general: notifications.filter((item) => item.type === 'general').length,
    order: notifications.filter((item) => item.type === 'order').length,
    shipping: notifications.filter((item) => item.type === 'shipping').length,
    delivery: notifications.filter((item) => item.type === 'delivery').length,
  };

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
      setError(
        submitError.message || 'The notification could not be saved.',
      );
    }
  };

  const handleEdit = (notification) => {
    setSelectedId(notification.id);
    setForm({
      title: notification.title,
      message: notification.message,
      type: notification.type || 'general',
      customerId: notification.customerId || 'all',
    });
  };

  const handleDelete = async (notificationId) => {
    if (!window.confirm('Delete this notification?')) return;

    try {
      await deleteNotification(notificationId);
      setSuccess('Notification deleted successfully.');

      if (selectedId === notificationId) resetForm();
    } catch (deleteError) {
      setError(
        deleteError.message || 'The notification could not be deleted.',
      );
    }
  };

  return (
    <div className="admin-shell notifications-page">
      <AdminSidebar />

      <main className="admin-main-panel">
        <AdminNavbar />

        <div className="admin-panel-content notifications-content">

          {/* Page Heading */}
          <div className="notifications-heading">
            <div>
              <span className="notifications-eyebrow">
                SKINORA / COMMUNICATIONS
              </span>
              <h1>Notifications</h1>
              <p>
                Create announcements and manage customer notifications from
                one place.
              </p>
            </div>

            <div className="notifications-total-badge">
              <span>Total Notifications</span>
              <strong>{notifications.length}</strong>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="notifications-stats-grid">

            <div className="notifications-stat-card">
              <div className="notifications-stat-top">
                <span className="notifications-stat-icon">♧</span>
                <span className="notifications-stat-label">ALL</span>
              </div>
              <strong>{notifications.length}</strong>
              <p>Total notifications</p>
            </div>

            <div className="notifications-stat-card">
              <div className="notifications-stat-top">
                <span className="notifications-stat-icon">✦</span>
                <span className="notifications-stat-label">GENERAL</span>
              </div>
              <strong>{typeCounts.general}</strong>
              <p>General announcements</p>
            </div>

            <div className="notifications-stat-card">
              <div className="notifications-stat-top">
                <span className="notifications-stat-icon">▤</span>
                <span className="notifications-stat-label">ORDERS</span>
              </div>
              <strong>{typeCounts.order}</strong>
              <p>Order notifications</p>
            </div>

            <div className="notifications-stat-card">
              <div className="notifications-stat-top">
                <span className="notifications-stat-icon">◇</span>
                <span className="notifications-stat-label">DELIVERY</span>
              </div>
              <strong>{typeCounts.shipping + typeCounts.delivery}</strong>
              <p>Shipping and delivery</p>
            </div>

          </div>

          {/* Main Layout */}
          <div className="notifications-layout">

            {/* Create / Edit Form */}
            <section className="notifications-form-card">

              <div className="notifications-panel-heading">
                <div className="notifications-panel-icon">✉</div>

                <div>
                  <span className="notifications-section-label">
                    {selectedId ? 'UPDATE MESSAGE' : 'NEW ANNOUNCEMENT'}
                  </span>
                  <h2>
                    {selectedId
                      ? 'Edit Notification'
                      : 'Create Notification'}
                  </h2>
                  <p>
                    {selectedId
                      ? 'Make changes to your existing notification.'
                      : 'Compose a new notification for your customers.'}
                  </p>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="notifications-form">

                <label className="notifications-field">
                  <span>Notification Title</span>
                  <input
                    type="text"
                    value={form.title}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        title: event.target.value,
                      }))
                    }
                    placeholder="e.g. Order received"
                  />
                </label>

                <label className="notifications-field">
                  <span>Notification Type</span>
                  <select
                    value={form.type}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        type: event.target.value,
                      }))
                    }
                  >
                    <option value="general">General</option>
                    <option value="order">Order</option>
                    <option value="shipping">Shipping</option>
                    <option value="delivery">Delivery</option>
                  </select>
                </label>

                <label className="notifications-field">
                  <span>Notification Message</span>
                  <textarea
                    rows="6"
                    value={form.message}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        message: event.target.value,
                      }))
                    }
                    placeholder="Write your notification message here..."
                  />
                </label>

                <div className="notifications-preview">
                  <span className="notifications-preview-icon">✦</span>
                  <div>
                    <span>MESSAGE PREVIEW</span>
                    <strong>
                      {form.title.trim() || 'Your notification title'}
                    </strong>
                    <p>
                      {form.message.trim() ||
                        'Your notification message will appear here.'}
                    </p>
                  </div>
                </div>

                {error && (
                  <div className="notifications-feedback notifications-error" role="alert">
                    <span>!</span>
                    {error}
                  </div>
                )}

                {success && (
                  <div className="notifications-feedback notifications-success" role="status">
                    <span>✓</span>
                    {success}
                  </div>
                )}

                <div className="notifications-form-actions">
                  <button type="submit" className="notifications-submit-button">
                    {selectedId ? 'Save Changes' : 'Create Notification'}
                  </button>

                  {selectedId && (
                    <button
                      type="button"
                      className="notifications-cancel-button"
                      onClick={resetForm}
                    >
                      Cancel
                    </button>
                  )}
                </div>

              </form>
            </section>

            {/* Notification Inbox */}
            <section className="notifications-inbox-card">

              <div className="notifications-inbox-heading">
                <div>
                  <span className="notifications-section-label">
                    NOTIFICATION CENTER
                  </span>
                  <h2>Inbox</h2>
                  <p>View and manage your announcements.</p>
                </div>

                <span className="notifications-results-count">
                  {filteredNotifications.length} Results
                </span>
              </div>

              {/* Search */}
              <div className="notifications-search">
                <span>⌕</span>
                <input
                  type="search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search notifications..."
                  aria-label="Search notifications"
                />

                {search && (
                  <button
                    type="button"
                    onClick={() => setSearch('')}
                    className="notifications-clear-button"
                  >
                    Clear
                  </button>
                )}
              </div>

              {/* Notification List */}
              {loading && (
                <div className="notifications-state">
                  <div className="notifications-loader"></div>
                  <h3>Loading notifications</h3>
                  <p>Please wait while notifications are retrieved.</p>
                </div>
              )}

              {!loading && filteredNotifications.length === 0 && (
                <div className="notifications-state">
                  <span className="notifications-empty-icon">✉</span>
                  <h3>No notifications found</h3>
                  <p>
                    {search
                      ? 'Try another search term.'
                      : 'Your created notifications will appear here.'}
                  </p>
                </div>
              )}

              {!loading && filteredNotifications.length > 0 && (
                <div className="notifications-list">

                  {filteredNotifications.map((notification) => (
                    <article
                      key={notification.id}
                      className={`notification-item ${
                        selectedId === notification.id
                          ? 'notification-item-selected'
                          : ''
                      }`}
                    >

                      <div className="notification-item-top">
                        <div className="notification-type-icon">
                          {notification.type === 'order'
                            ? '▤'
                            : notification.type === 'shipping'
                              ? '◇'
                              : notification.type === 'delivery'
                                ? '✓'
                                : '✦'}
                        </div>

                        <span
                          className={`notification-type-badge notification-type-${(
                            notification.type || 'general'
                          ).toLowerCase()}`}
                        >
                          {notification.type || 'general'}
                        </span>
                      </div>

                      <h3>{notification.title}</h3>

                      <p className="notification-item-message">
                        {notification.message}
                      </p>

                      <div className="notification-item-footer">
                        <span className="notification-recipient">
                          Recipient: {notification.customerId || 'all'}
                        </span>

                        <div className="notification-actions">
                          <button
                            type="button"
                            className="notification-edit-button"
                            onClick={() => handleEdit(notification)}
                          >
                            Edit
                          </button>

                          <button
                            type="button"
                            className="notification-delete-button"
                            onClick={() => handleDelete(notification.id)}
                          >
                            Delete
                          </button>
                        </div>
                      </div>

                    </article>
                  ))}

                </div>
              )}

            </section>
          </div>
        </div>
      </main>

      {/* Scoped Styling */}
      <style>{`
        .notifications-page {
          --nt-dark: #30231f;
          --nt-brown: #49342c;
          --nt-gold: #c6a36a;
          --nt-cream: #f8f4ed;
          --nt-text: #392c26;
          --nt-muted: #98877c;
          --nt-border: #e9dfd2;
        }

        .notifications-content {
          padding: 30px;
          color: var(--nt-text);
        }

        .notifications-heading {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
          margin-bottom: 28px;
        }

        .notifications-eyebrow,
        .notifications-section-label {
          color: #b18d58;
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 2px;
        }

        .notifications-heading h1 {
          margin: 8px 0 6px;
          color: #30231f;
          font-family: Georgia, serif;
          font-size: clamp(28px, 3vw, 36px);
          font-weight: 600;
        }

        .notifications-heading p,
        .notifications-panel-heading p,
        .notifications-inbox-heading p {
          margin: 0;
          color: #94847a;
          font-size: 12px;
          line-height: 1.7;
        }

        .notifications-total-badge {
          display: flex;
          flex-direction: column;
          gap: 5px;
          padding: 15px 22px;
          min-width: 145px;
          background: #30231f;
          border: 1px solid #b99762;
          border-radius: 12px;
        }

        .notifications-total-badge span {
          color: #d4c1a5;
          font-size: 10px;
          letter-spacing: 1px;
          text-transform: uppercase;
        }

        .notifications-total-badge strong {
          color: #f2dfbd;
          font-family: Georgia, serif;
          font-size: 27px;
        }

        .notifications-stats-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 17px;
          margin-bottom: 30px;
        }

        .notifications-stat-card {
          position: relative;
          isolation: isolate;
          overflow: hidden;
          padding: 21px;
          min-height: 145px;
          background: linear-gradient(
            135deg,
            #30231f 0%,
            #49342c 65%,
            #392821 100%
          );
          border: 1px solid rgba(198, 163, 106, 0.5);
          border-radius: 15px;
          box-shadow: 0 8px 20px rgba(48, 35, 31, 0.1),
            inset 0 1px 0 rgba(255,255,255,0.08);
          transition: transform 0.3s ease, box-shadow 0.3s ease;
        }

        .notifications-stat-card::after {
          content: '';
          position: absolute;
          top: -100%;
          left: -70%;
          width: 45%;
          height: 300%;
          z-index: -1;
          background: linear-gradient(
            90deg,
            transparent,
            rgba(255, 229, 184, 0.13),
            transparent
          );
          transform: rotate(25deg);
          animation: notificationsCardShine 6s ease-in-out infinite;
        }

        .notifications-stat-card:nth-child(2)::after {
          animation-delay: 1.2s;
        }

        .notifications-stat-card:nth-child(3)::after {
          animation-delay: 2.4s;
        }

        .notifications-stat-card:nth-child(4)::after {
          animation-delay: 3.6s;
        }

        @keyframes notificationsCardShine {
          0%, 65% { left: -80%; }
          100% { left: 150%; }
        }

        .notifications-stat-card:hover {
          transform: translateY(-6px);
          border-color: #d5b77f;
          box-shadow: 0 15px 28px rgba(48, 35, 31, 0.2);
        }

        .notifications-stat-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 17px;
        }

        .notifications-stat-icon {
          display: grid;
          place-items: center;
          width: 35px;
          height: 35px;
          color: #e5c891;
          background: rgba(226, 201, 156, 0.12);
          border: 1px solid rgba(226, 201, 156, 0.3);
          border-radius: 10px;
          font-size: 19px;
        }

        .notifications-stat-label {
          color: #c9ad7e;
          font-size: 9px;
          font-weight: 800;
          letter-spacing: 1.5px;
        }

        .notifications-stat-card > strong {
          display: block;
          color: #f4e6ce;
          font-family: Georgia, serif;
          font-size: 31px;
          font-weight: 600;
        }

        .notifications-stat-card > p {
          margin: 5px 0 0;
          color: #c5b4a2;
          font-size: 11px;
        }

        .notifications-layout {
          display: grid;
          grid-template-columns: minmax(300px, 0.85fr) minmax(0, 1.15fr);
          align-items: start;
          gap: 20px;
        }

        .notifications-form-card,
        .notifications-inbox-card {
          min-width: 0;
          padding: 23px;
          background: #fffefa;
          border: 1px solid var(--nt-border);
          border-radius: 16px;
          box-shadow: 0 8px 25px rgba(48, 35, 31, 0.045);
        }

        .notifications-panel-heading {
          display: flex;
          align-items: flex-start;
          gap: 13px;
          padding-bottom: 20px;
          margin-bottom: 20px;
          border-bottom: 1px solid #f0eae2;
        }

        .notifications-panel-icon {
          display: grid;
          place-items: center;
          flex-shrink: 0;
          width: 43px;
          height: 43px;
          color: #e5c891;
          background: linear-gradient(135deg, #30231f, #5a4033);
          border: 1px solid #c4a36d;
          border-radius: 12px;
          font-size: 20px;
        }

        .notifications-panel-heading h2,
        .notifications-inbox-heading h2 {
          margin: 6px 0 5px;
          color: #392c26;
          font-family: Georgia, serif;
          font-size: 21px;
          font-weight: 600;
        }

        .notifications-form {
          display: flex;
          flex-direction: column;
          gap: 17px;
        }

        .notifications-field {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .notifications-field > span {
          color: #806c5d;
          font-size: 11px;
          font-weight: 700;
        }

        .notifications-field input,
        .notifications-field select,
        .notifications-field textarea {
          width: 100%;
          padding: 12px 13px;
          color: #49372e;
          background: #faf7f1;
          border: 1px solid #e8dfd3;
          border-radius: 9px;
          outline: none;
          font-family: inherit;
          font-size: 12px;
          transition: border-color 0.2s, box-shadow 0.2s;
        }

        .notifications-field input:focus,
        .notifications-field select:focus,
        .notifications-field textarea:focus {
          border-color: #b99560;
          box-shadow: 0 0 0 3px rgba(185, 149, 96, 0.1);
        }

        .notifications-field input::placeholder,
        .notifications-field textarea::placeholder {
          color: #ad9f92;
        }

        .notifications-field textarea {
          resize: vertical;
          min-height: 125px;
          line-height: 1.7;
        }

        .notifications-preview {
          display: flex;
          gap: 12px;
          padding: 15px;
          background: #f8f3e9;
          border: 1px solid #e8d9bf;
          border-radius: 10px;
        }

        .notifications-preview-icon {
          display: grid;
          place-items: center;
          flex-shrink: 0;
          width: 32px;
          height: 32px;
          color: #e4c68f;
          background: #49342c;
          border-radius: 9px;
        }

        .notifications-preview > div {
          min-width: 0;
        }

        .notifications-preview > div > span {
          color: #a48659;
          font-size: 9px;
          font-weight: 800;
          letter-spacing: 1px;
        }

        .notifications-preview strong {
          display: block;
          margin: 6px 0;
          color: #49372e;
          font-family: Georgia, serif;
          font-size: 14px;
          overflow-wrap: anywhere;
        }

        .notifications-preview p {
          margin: 0;
          color: #8b796b;
          font-size: 11px;
          line-height: 1.7;
          white-space: pre-wrap;
          overflow-wrap: anywhere;
        }

        .notifications-feedback {
          display: flex;
          align-items: center;
          gap: 9px;
          padding: 11px 13px;
          border-radius: 8px;
          font-size: 11px;
          line-height: 1.5;
        }

        .notifications-feedback > span {
          display: grid;
          place-items: center;
          flex-shrink: 0;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          font-weight: 800;
        }

        .notifications-error {
          color: #9b4242;
          background: #fff1ef;
          border: 1px solid #f0ceca;
        }

        .notifications-error > span {
          background: #f5d9d5;
        }

        .notifications-success {
          color: #477653;
          background: #edf5ed;
          border: 1px solid #d4e7d4;
        }

        .notifications-success > span {
          background: #d8ead8;
        }

        .notifications-form-actions {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          margin-top: 3px;
        }

        .notifications-submit-button,
        .notifications-cancel-button {
          min-height: 43px;
          padding: 11px 17px;
          border-radius: 8px;
          cursor: pointer;
          font-size: 11px;
          font-weight: 700;
          transition: transform 0.2s, box-shadow 0.2s;
        }

        .notifications-submit-button {
          flex: 1;
          color: #f6e7cd;
          background: linear-gradient(135deg, #30231f, #594033);
          border: 1px solid #b99762;
          box-shadow: 0 4px 10px rgba(48, 35, 31, 0.12);
        }

        .notifications-submit-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 7px 15px rgba(48, 35, 31, 0.18);
        }

        .notifications-cancel-button {
          color: #806b59;
          background: #f5eee4;
          border: 1px solid #e7d9c6;
        }

        .notifications-cancel-button:hover {
          background: #eee3d4;
        }

        .notifications-inbox-heading {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          margin-bottom: 18px;
        }

        .notifications-results-count {
          padding: 7px 11px;
          color: #8d7047;
          background: #f6efe3;
          border: 1px solid #e8d7bb;
          border-radius: 30px;
          font-size: 10px;
          font-weight: 700;
          white-space: nowrap;
        }

        .notifications-search {
          display: flex;
          align-items: center;
          gap: 10px;
          min-height: 45px;
          padding: 0 13px;
          margin-bottom: 17px;
          background: #faf7f1;
          border: 1px solid #e8dfd3;
          border-radius: 9px;
        }

        .notifications-search:focus-within {
          border-color: #b99560;
          box-shadow: 0 0 0 3px rgba(185, 149, 96, 0.1);
        }

        .notifications-search > span {
          color: #a88960;
          font-size: 23px;
        }

        .notifications-search input {
          flex: 1;
          width: 100%;
          min-width: 0;
          padding: 10px 0;
          color: #49372e;
          background: transparent;
          border: none;
          outline: none;
          font-size: 11px;
        }

        .notifications-search input::placeholder {
          color: #ad9f92;
        }

        .notifications-clear-button {
          padding: 6px 9px;
          color: #8d7047;
          background: #f0e5d3;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-size: 10px;
          font-weight: 700;
        }

        .notifications-list {
          display: grid;
          gap: 12px;
        }

        .notification-item {
          padding: 16px;
          background: #fff;
          border: 1px solid #ebe3d9;
          border-radius: 11px;
          transition: border-color 0.2s, box-shadow 0.2s,
            transform 0.2s;
        }

        .notification-item:hover {
          transform: translateY(-2px);
          border-color: #d3b98f;
          box-shadow: 0 8px 18px rgba(48, 35, 31, 0.06);
        }

        .notification-item-selected {
          border-color: #b99560;
          box-shadow: 0 0 0 2px rgba(185, 149, 96, 0.12);
        }

        .notification-item-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          margin-bottom: 13px;
        }

        .notification-type-icon {
          display: grid;
          place-items: center;
          width: 32px;
          height: 32px;
          color: #e4c68f;
          background: linear-gradient(135deg, #30231f, #594033);
          border: 1px solid #b99762;
          border-radius: 9px;
          font-size: 15px;
        }

        .notification-type-badge {
          padding: 6px 10px;
          border-radius: 20px;
          font-size: 9px;
          font-weight: 800;
          text-transform: capitalize;
        }

        .notification-type-general {
          color: #8d7047;
          background: #f6efe3;
          border: 1px solid #e8d7bb;
        }

        .notification-type-order {
          color: #477653;
          background: #edf5ed;
          border: 1px solid #d4e7d4;
        }

        .notification-type-shipping {
          color: #79608e;
          background: #f3eef7;
          border: 1px solid #e1d4ed;
        }

        .notification-type-delivery {
          color: #527c78;
          background: #edf5f3;
          border: 1px solid #d1e5df;
        }

        .notification-item h3 {
          margin: 0 0 8px;
          color: #49372e;
          font-family: Georgia, serif;
          font-size: 16px;
          font-weight: 600;
          overflow-wrap: anywhere;
        }

        .notification-item-message {
          margin: 0;
          color: #88786b;
          font-size: 11px;
          line-height: 1.8;
          white-space: pre-wrap;
          overflow-wrap: anywhere;
        }

        .notification-item-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 12px;
          padding-top: 13px;
          margin-top: 14px;
          border-top: 1px solid #f0eae2;
        }

        .notification-recipient {
          color: #a18e7d;
          font-size: 9px;
          overflow-wrap: anywhere;
        }

        .notification-actions {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .notification-edit-button,
        .notification-delete-button {
          padding: 7px 12px;
          border-radius: 7px;
          cursor: pointer;
          font-size: 10px;
          font-weight: 700;
          transition: background 0.2s;
        }

        .notification-edit-button {
          color: #8d7047;
          background: #f7f0e5;
          border: 1px solid #e8d7bb;
        }

        .notification-edit-button:hover {
          background: #eee2cf;
        }

        .notification-delete-button {
          color: #a14e48;
          background: #fff5f3;
          border: 1px solid #efd5d0;
        }

        .notification-delete-button:hover {
          background: #fce8e5;
        }

        .notifications-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 45px 15px;
          text-align: center;
        }

        .notifications-state h3 {
          margin: 12px 0 6px;
          color: #49372e;
          font-family: Georgia, serif;
          font-size: 18px;
        }

        .notifications-state p {
          margin: 0;
          color: #9a897c;
          font-size: 11px;
          line-height: 1.7;
        }

        .notifications-empty-icon {
          display: grid;
          place-items: center;
          width: 50px;
          height: 50px;
          color: #a88960;
          background: #f5eee3;
          border: 1px solid #e6d6bc;
          border-radius: 14px;
          font-size: 23px;
        }

        .notifications-loader {
          width: 30px;
          height: 30px;
          border: 3px solid #eee3d3;
          border-top-color: #aa8755;
          border-radius: 50%;
          animation: notificationsSpin 0.8s linear infinite;
        }

        @keyframes notificationsSpin {
          to { transform: rotate(360deg); }
        }

        @media (max-width: 1100px) {
          .notifications-stats-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }

          .notifications-layout {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 650px) {
          .notifications-content {
            padding: 16px;
          }

          .notifications-heading {
            align-items: flex-start;
            flex-direction: column;
          }

          .notifications-total-badge {
            width: 100%;
          }

          .notifications-stats-grid {
            gap: 10px;
          }

          .notifications-stat-card {
            padding: 15px;
            min-height: 130px;
          }

          .notifications-form-card,
          .notifications-inbox-card {
            padding: 16px;
          }

          .notifications-inbox-heading {
            align-items: flex-start;
            flex-direction: column;
          }

          .notification-item {
            padding: 13px;
          }

          .notification-item-footer {
            align-items: flex-start;
            flex-direction: column;
          }

          .notifications-form-actions {
            flex-direction: column;
          }

          .notifications-submit-button,
          .notifications-cancel-button {
            width: 100%;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .notifications-stat-card::after {
            animation: none;
          }

          .notifications-loader {
            animation-duration: 2s;
          }

          .notifications-stat-card,
          .notification-item {
            transition: none;
          }
        }
      `}</style>
    </div>
  );
};

export default Notifications;
