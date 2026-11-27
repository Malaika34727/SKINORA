
import { useEffect, useMemo, useState } from 'react';
import {
  collection,
  onSnapshot,
  orderBy,
  query,
} from 'firebase/firestore';

import { db, secondaryDb } from '../firebase';
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

  // Identify Order Manager using panel selection or permissions.
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

  // Super Admin uses main Firebase.
  // Sub Admin uses secondary Firebase.
  const orderDb = isSuperAdmin ? db : secondaryDb;

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  // ==========================================
  // FETCH ORDERS
  // ==========================================

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

        setError(
          `Could not load orders: ${snapshotError.message}`
        );

        setLoading(false);
      }
    );

    return unsubscribe;
  }, [orderDb]);

  // ==========================================
  // SEARCH AND FILTER
  // ==========================================

  const visibleOrders = useMemo(() => {
    const term = search.trim().toLowerCase();

    return orders.filter((order) => {
      const matchesStatus =
        statusFilter === 'All' ||
        order.status === statusFilter;

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

  // ==========================================
  // UPDATE ORDER STATUS
  // ==========================================

  const changeStatus = async (orderId, status) => {
    setError('');

    try {
      await updateOrderStatus(
        orderId,
        status,
        '',
        orderDb
      );
    } catch (updateError) {
      console.error('Order status update error:', updateError);

      setError(
        `Could not update order status: ${updateError.message}`
      );
    }
  };

  // ==========================================
  // DATE FORMAT
  // ==========================================

  const formatDate = (timestamp) => {
    if (timestamp?.toDate) {
      return timestamp.toDate().toLocaleDateString();
    }

    if (timestamp instanceof Date) {
      return timestamp.toLocaleDateString();
    }

    return '—';
  };

  // ==========================================
  // PAGE
  // ==========================================

  return (
    <div
      className={`admin-shell ${
        isOrderManager ? 'order-manager-shell' : ''
      }`}
    >
      {!isOrderManager && <AdminSidebar />}

      <main
        className={`admin-main-panel ${
          isOrderManager ? 'order-manager-main' : ''
        }`}
      >
        <AdminNavbar />

        <div className="admin-panel-content">
          <div className="section-heading">
            <div>
              <p className="eyebrow">
                {isOrderManager ? 'Order Management' : 'Sales'}
              </p>

              <h2>Orders overview</h2>
            </div>
          </div>

          {/* SEARCH AND FILTER */}
          <div className="table-toolbar">
            <input
              type="search"
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="Search orders or customers"
              aria-label="Search orders"
            />

            <select
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(event.target.value)
              }
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
            <p role="alert">
              {error}
            </p>
          )}

          {/* ORDERS TABLE */}
          <div className="admin-table-wrap">
            <table className="admin-products-table orders-table">
              <thead>
                <tr>
                  <th>Order / Tracking ID</th>
                  <th>Customer Name</th>
                  <th>Customer Email</th>
                  <th>Phone</th>
                  <th>Products</th>
                  <th>Total Amount</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th>Details</th>
                </tr>
              </thead>

              <tbody>
                {loading && (
                  <tr>
                    <td colSpan="9">
                      Loading orders…
                    </td>
                  </tr>
                )}

                {!loading &&
                  !error &&
                  visibleOrders.length === 0 && (
                    <tr>
                      <td colSpan="9">
                        {orders.length
                          ? 'No orders match your filters.'
                          : 'No orders have been placed yet.'}
                      </td>
                    </tr>
                  )}

                {visibleOrders.map((order) => (
                  <tr key={order.id}>
                    <td>
                      {order.trackingId ||
                        order.orderNumber ||
                        order.id}
                    </td>

                    <td>{order.customerName || '—'}</td>
                    <td>{order.customerEmail || '—'}</td>
                    <td>{order.customerPhone || '—'}</td>

                    <td>
                      {order.items
                        ?.map(
                          (item) =>
                            `${item.name} × ${item.quantity}`
                        )
                        .join(', ') || '—'}
                    </td>

                    <td>
                      PKR {order.totalAmount ?? 0}
                    </td>

                    <td>
                      <select
                        value={order.status}
                        onChange={(event) =>
                          changeStatus(
                            order.id,
                            event.target.value
                          )
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
                                ['Shipped', 'Delivered'].includes(
                                  order.status
                                ))
                            }
                          >
                            {status}
                          </option>
                        ))}
                      </select>
                    </td>

                    <td>
                      {formatDate(order.createdAt)}
                    </td>

                    <td>
                      <details>
                        <summary>View</summary>

                        <p>
                          Tracking ID:{' '}
                          {order.trackingId ||
                            order.orderNumber ||
                            order.id}
                        </p>

                        <p>
                          Firestore Document ID: {order.id}
                        </p>

                        <ul>
                          {order.items?.map((item, index) => (
                            <li key={item.productId || index}>
                              {item.name} — {item.quantity} × PKR{' '}
                              {item.unitPrice ?? item.price ?? 0} = PKR{' '}
                              {item.lineTotal ??
                                item.itemTotal ??
                                0}
                            </li>
                          ))}
                        </ul>

                        {order.statusHistory?.length > 0 && (
                          <div>
                            <strong>Status history</strong>

                            <ul>
                              {order.statusHistory.map(
                                (entry, index) => (
                                  <li
                                    key={`${entry.status}-${index}`}
                                  >
                                    {entry.status} —{' '}
                                    {formatDate(
                                      entry.timestamp ||
                                      entry.updatedAt
                                    )}
                                  </li>
                                )
                              )}
                            </ul>
                          </div>
                        )}
                      </details>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Orders;
