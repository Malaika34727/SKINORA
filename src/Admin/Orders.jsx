
import { useEffect, useMemo, useState } from 'react';
import {
  collection,
  onSnapshot,
  orderBy,
  query,
} from 'firebase/firestore';

import { superAdminDb, secondaryDb } from '../firebase';
import { updateOrderStatus } from '../services/orders';
import { useAuth } from '../context/AuthContextValue';

import AdminNavbar from '../Components/AdminNavbar';
import AdminSidebar from '../Components/AdminSidebar';
import './Orders.css';

const statuses = [
  'Pending',
  'Confirmed',
  'Processing',
  'Shipped',
  'Delivered',
  'Cancelled',
];

const Orders = () => {
  const { role, selectedPanel, permissions = {} } = useAuth();

  const isSuperAdmin = role === 'admin';

  const isOrderManager =
    !isSuperAdmin &&
    (
      selectedPanel === 'orderManager' ||
      role === 'orderManager' ||
      (
        permissions.viewOrders === true &&
        permissions.viewProducts !== true
      )
    );

  const orderDb = isSuperAdmin ? superAdminDb : secondaryDb;

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  // FETCH ORDERS
  useEffect(() => {
    setLoading(true);
    setError('');

    const ordersQuery = query(
      collection(orderDb, 'SKINORA_ORDERS'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(
      ordersQuery,
      (snapshot) => {
        const fetchedOrders = snapshot.docs.map((orderDocument) => {
          const order = {
            id: orderDocument.id,
            ...orderDocument.data(),
          };

          return {
            ...order,
            status: order.status || order.orderStatus || 'Pending',
          };
        });

        setOrders(fetchedOrders);
        setError('');
        setLoading(false);
      },
      (snapshotError) => {
        console.error('Orders Firestore error:', snapshotError);
        setError(`Could not load orders: ${snapshotError.message}`);
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [orderDb]);

  // SUMMARY CARDS
  const summary = useMemo(() => ({
    total: orders.length,
    pending: orders.filter((order) => order.status === 'Pending').length,
    processing: orders.filter((order) => order.status === 'Processing').length,
    delivered: orders.filter((order) => order.status === 'Delivered').length,
  }), [orders]);

  // SEARCH AND FILTER
  const visibleOrders = useMemo(() => {
    const term = search.trim().toLowerCase();

    return orders.filter((order) => {
      const matchesStatus =
        statusFilter === 'All' || order.status === statusFilter;

      const matchesSearch =
        !term ||
        [
          order.trackingId,
          order.orderNumber,
          order.customerName,
          order.customerEmail,
          order.customerPhone,
          order.id,
        ].some((value) =>
          String(value || '').toLowerCase().includes(term)
        );

      return matchesStatus && matchesSearch;
    });
  }, [orders, search, statusFilter]);

  // UPDATE ORDER STATUS
  const changeStatus = async (orderId, status) => {
    setError('');

    try {
      await updateOrderStatus(orderId, status, '', orderDb);
    } catch (updateError) {
      console.error('Order status update error:', updateError);
      setError(`Could not update order status: ${updateError.message}`);
    }
  };

  // DATE FORMAT
  const formatDate = (timestamp) => {
    if (timestamp?.toDate) {
      return timestamp.toDate().toLocaleDateString();
    }

    if (timestamp instanceof Date) {
      return timestamp.toLocaleDateString();
    }

    return '—';
  };

  const getStatusClass = (status) =>
    `status-${String(status || 'pending').toLowerCase()}`;

  return (
    <div className={`admin-shell ${isOrderManager ? 'order-manager-shell' : ''}`}>
      {!isOrderManager && <AdminSidebar />}

      <main className={`admin-main-panel ${isOrderManager ? 'order-manager-main' : ''}`}>
        <AdminNavbar />

        <div className="admin-panel-content order-page-content">

          {/* PAGE HEADING */}
          <div className="order-page-heading">
            <div>
              <p className="eyebrow">
                {isOrderManager ? 'ORDER MANAGEMENT' : 'SALES MANAGEMENT'}
              </p>
              <h2>Orders overview</h2>
              <p className="order-page-subtitle">
                Track, manage and monitor your customer orders.
              </p>
            </div>

            <div className="orders-live-label">
              <span className="live-dot"></span>
              Live order updates
            </div>
          </div>

          {/* SUMMARY CARDS */}
          <div className="order-summary-grid">
            <div className="order-summary-card">
              <div className="summary-card-top">
                <span className="summary-icon total-icon">▤</span>
                <span className="summary-label">ALL ORDERS</span>
              </div>
              <strong>{loading ? '—' : summary.total}</strong>
              <p>Total orders received</p>
            </div>

            <div className="order-summary-card">
              <div className="summary-card-top">
                <span className="summary-icon pending-icon">◷</span>
                <span className="summary-label">PENDING</span>
              </div>
              <strong>{loading ? '—' : summary.pending}</strong>
              <p>Waiting for confirmation</p>
            </div>

            <div className="order-summary-card">
              <div className="summary-card-top">
                <span className="summary-icon processing-icon">↻</span>
                <span className="summary-label">PROCESSING</span>
              </div>
              <strong>{loading ? '—' : summary.processing}</strong>
              <p>Orders being prepared</p>
            </div>

            <div className="order-summary-card">
              <div className="summary-card-top">
                <span className="summary-icon delivered-icon">✓</span>
                <span className="summary-label">DELIVERED</span>
              </div>
              <strong>{loading ? '—' : summary.delivered}</strong>
              <p>Successfully delivered</p>
            </div>
          </div>

          {/* ORDERS SECTION */}
          <section className="orders-content-section">
            <div className="orders-section-heading">
              <div>
                <h3>All orders</h3>
                <p>Review customer purchases and update order status.</p>
              </div>

              <span className="orders-count">
                {loading ? 'Loading…' : `${visibleOrders.length} orders`}
              </span>
            </div>

            {/* SEARCH AND FILTER */}
            <div className="table-toolbar orders-toolbar">
              <div className="orders-search-box">
                <span className="search-icon">⌕</span>
                <input
                  type="search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search by order ID, customer or email..."
                  aria-label="Search orders"
                />
              </div>

              <select
                className="orders-filter"
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
                aria-label="Filter by status"
              >
                <option value="All">All statuses</option>
                {statuses.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </div>

            {/* ERROR */}
            {error && (
              <div className="orders-error" role="alert">
                {error}
              </div>
            )}

            {/* ORDERS TABLE */}
            <div className="admin-table-wrap orders-table-container">
              <table className="admin-products-table orders-table">
                <thead>
                  <tr>
                    <th>ORDER / TRACKING ID</th>
                    <th>CUSTOMER NAME</th>
                    <th>CUSTOMER EMAIL</th>
                    <th>PHONE</th>
                    <th>PRODUCTS</th>
                    <th>TOTAL AMOUNT</th>
                    <th>STATUS</th>
                    <th>DATE</th>
                    <th>DETAILS</th>
                  </tr>
                </thead>

                <tbody>
                  {loading && (
                    <tr>
                      <td colSpan="9" className="orders-empty-state">
                        <span className="orders-loader"></span>
                        Loading orders...
                      </td>
                    </tr>
                  )}

                  {!loading && !error && visibleOrders.length === 0 && (
                    <tr>
                      <td colSpan="9" className="orders-empty-state">
                        <span className="empty-order-icon">▤</span>
                        <strong>No orders found</strong>
                        <p>
                          {orders.length
                            ? 'Try changing your search or filter.'
                            : 'Customer orders will appear here.'}
                        </p>
                      </td>
                    </tr>
                  )}

                  {visibleOrders.map((order) => (
                    <tr key={order.id}>
                      <td>
                        <span className="order-id-text">
                          {order.trackingId || order.orderNumber || order.id}
                        </span>
                      </td>

                      <td className="order-customer-name">
                        {order.customerName || '—'}
                      </td>

                      <td>{order.customerEmail || '—'}</td>
                      <td>{order.customerPhone || '—'}</td>

                      <td>
                        <div className="order-products-cell">
                          {order.items?.map((item, index) => (
                            <span key={item.productId || index}>
                              {item.name} × {item.quantity}
                            </span>
                          )) || '—'}
                        </div>
                      </td>

                      <td className="order-amount">
                        PKR {order.totalAmount ?? 0}
                      </td>

                      <td>
                        <select
                          className={`order-status-select ${getStatusClass(order.status)}`}
                          value={order.status}
                          onChange={(event) =>
                            changeStatus(order.id, event.target.value)
                          }
                          aria-label={`Update status for ${
                            order.orderNumber || order.id
                          }`}
                        >
                          {statuses.map((status) => (
                            <option
                              key={status}
                              value={status}
                              disabled={
                                (order.status === 'Cancelled' &&
                                  status !== 'Cancelled') ||
                                (status === 'Cancelled' &&
                                  ['Shipped', 'Delivered'].includes(order.status))
                              }
                            >
                              {status}
                            </option>
                          ))}
                        </select>
                      </td>

                      <td className="order-date">
                        {formatDate(order.createdAt)}
                      </td>

                      <td>
                        <details className="order-details">
                          <summary>View <span>›</span></summary>

                          <div className="order-details-content">
                            <p>
                              <strong>Tracking ID:</strong>{' '}
                              {order.trackingId || order.orderNumber || order.id}
                            </p>

                            <p>
                              <strong>Firestore Document ID:</strong> {order.id}
                            </p>

                            <h4>Order items</h4>
                            <ul>
                              {order.items?.map((item, index) => (
                                <li key={item.productId || index}>
                                  {item.name} — {item.quantity} × PKR{' '}
                                  {item.unitPrice ?? item.price ?? 0} = PKR{' '}
                                  {item.lineTotal ?? item.itemTotal ?? 0}
                                </li>
                              ))}
                            </ul>

                            {order.statusHistory?.length > 0 && (
                              <>
                                <h4>Status history</h4>
                                <ul>
                                  {order.statusHistory.map((entry, index) => (
                                    <li key={`${entry.status}-${index}`}>
                                      {entry.status} —{' '}
                                      {formatDate(entry.timestamp || entry.updatedAt)}
                                    </li>
                                  ))}
                                </ul>
                              </>
                            )}
                          </div>
                        </details>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
};

export default Orders;
