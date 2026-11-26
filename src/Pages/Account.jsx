
import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import Button from '../Components/Button';
import { useAuth } from '../context/AuthContextValue';
import {
  getCustomerProfile,
  updateCustomerProfile,
} from '../services/authService';
import { listenToCustomerOrders } from '../services/orders';
import './Account.css';

const formatDate = (timestamp) => {
  const date = timestamp?.toDate?.();
  return date ? date.toLocaleDateString() : '—';
};

const Account = () => {
  const { customerUser, loading: authLoading } = useAuth();
  const user = customerUser;

  const location = useLocation();

  const [profile, setProfile] = useState({
    name: '',
    phone: '',
  });

  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState('');
  const [success, setSuccess] = useState(
    location.state?.success || ''
  );

  // ==========================================
  // LOAD CUSTOMER PROFILE
  // ==========================================

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      setLoading(false);
      setOrdersLoading(false);
      setError('Please sign in to view your account.');
      return;
    }

    let active = true;

    setLoading(true);
    setError('');

    setProfile({
      name: user.displayName || '',
      phone: '',
    });

    getCustomerProfile(user.uid)
      .then((customer) => {
        if (!active) return;

        if (customer) {
          setProfile({
            name: customer.name || user.displayName || '',
            phone: customer.phone || '',
          });
        } else {
          setError(
            'Your customer profile has not been created yet. Sign out and sign in again, or contact support.'
 
          );
        }
      })
      .catch((profileError) => {
        if (active) {
          setError(
            `Could not load your profile: ${profileError.message}`
          );
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [user, authLoading]);

  // ==========================================
  // LOAD CUSTOMER ORDER HISTORY
  // ==========================================

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      setOrders([]);
      setOrdersLoading(false);
      return;
    }

    setOrdersLoading(true);

    const unsubscribe = listenToCustomerOrders(
      user.uid,
      (nextOrders) => {
        setOrders(nextOrders);
        setOrdersLoading(false);
      },
      (ordersError) => {
        setError(
          `Could not load your order history: ${ordersError.message}`
        );
        setOrdersLoading(false);
      }
    );

    return () => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, [user, authLoading]);

  // ==========================================
  // SAVE CUSTOMER PROFILE
  // ==========================================

  const handleProfileSave = async (event) => {
    event.preventDefault();

    if (!user) return;

    setSaving(true);
    setError('');
    setSuccess('');

    try {
      await updateCustomerProfile(user.uid, profile);
      setSuccess('Your profile was updated.');
    } catch (saveError) {
      setError(
        `Could not update your profile: ${saveError.message}`
      );
    } finally {
      setSaving(false);
    }
  };

  // ==========================================
  // UI
  // ==========================================

  if (authLoading) {
    return (
      <div className="page-shell account-page">
        <div className="container account-shell">
          <p>Loading your account...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="page-shell account-page">
        <div className="container account-shell">
          <p>Please sign in to view your account.</p>
          <Link to="/login">Go to login</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="page-shell account-page">
      <div className="container account-shell">

        <div className="section-heading">
          <div>
            <p className="eyebrow">Your SKINORA account</p>
            <h1>My account</h1>
          </div>
        </div>

        {error && <p role="alert">{error}</p>}
        {success && <p role="status">{success}</p>}

        <div className="account-grid">

          {/* PROFILE */}

          <section className="account-panel">
            <h2>Profile</h2>

            {/* CUSTOMER EMAIL FROM MAIN AUTH ONLY */}
            <p>{user.email}</p>

            <form
              className="account-form"
              onSubmit={handleProfileSave}
            >
              <label>
                <span>Full name</span>

                <input
                  type="text"
                  value={profile.name}
                  onChange={(event) =>
                    setProfile((current) => ({
                      ...current,
                      name: event.target.value,
                    }))
                  }
                  autoComplete="name"
                  minLength="2"
                  maxLength="120"
                  required
                />
              </label>

              <label>
                <span>Phone number</span>

                <input
                  type="tel"
                  value={profile.phone}
                  onChange={(event) =>
                    setProfile((current) => ({
                      ...current,
                      phone: event.target.value,
                    }))
                  }
                  autoComplete="tel"
                  maxLength="30"
                />
              </label>

              <Button
                type="submit"
                variant="primary"
                disabled={saving || loading}
              >
                {saving ? 'Saving…' : 'Save profile'}
              </Button>
            </form>
          </section>

          {/* ORDER HISTORY */}

          <section className="account-panel">
            <h2>Order history</h2>

            {ordersLoading && (
              <p>Loading your order history…</p>
            )}

            {!ordersLoading && orders.length === 0 && (
              <p>You have not placed any orders yet.</p>
            )}

            {orders.length > 0 && (
              <div className="account-orders">
                {orders.map((order) => (
                  <article
                    className="account-order"
                    key={order.id}
                  >
                    <div>
                      <strong>
                        {order.trackingId ||
                          order.orderNumber ||
                          order.id}
                      </strong>

                      <span>
                        {formatDate(
                          order.createdAt || order.orderDate
                        )}
                      </span>
                    </div>

                    <p>
                      {order.status || 'Pending'} · PKR{' '}
                      {order.totalAmount}
                    </p>

                    <ul>
                      {order.items?.map((item, index) => (
                        <li
                          key={
                            item.productId ||
                            item.id ||
                            `${item.name}-${index}`
                          }
                        >
                          {item.name} × {item.quantity}
                        </li>
                      ))}
                    </ul>

                    {order.statusHistory?.length > 0 && (
                      <details>
                        <summary>Tracking history</summary>

                        <ul>
                          {order.statusHistory.map(
                            (entry, index) => (
                              <li
                                key={`${entry.status}-${index}`}
                              >
                                {entry.status} ·{' '}
                                {formatDate(entry.updatedAt)}
                              </li>
                            )
                          )}
                        </ul>
                      </details>
                    )}
                  </article>
                ))}
              </div>
            )}

            <Link
              to="/products"
              className="account-shop-link"
            >
              Continue shopping
            </Link>
          </section>

        </div>
      </div>
    </div>
  );
};

export default Account;
