import { useEffect, useMemo, useState } from 'react';
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore';
import { db } from '../firebase';
import { updateOrderStatus } from '../services/orders';
import AdminNavbar from '../Components/AdminNavbar';
import AdminSidebar from '../Components/AdminSidebar';
import './Orders.css';

const statuses = ['Pending', 'Confirmed', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  useEffect(() => onSnapshot(
    query(collection(db, 'orders'), orderBy('createdAt', 'desc')),
    (snapshot) => {
      setOrders(snapshot.docs.map((orderDocument) => {
        const order = { id: orderDocument.id, ...orderDocument.data() };
        return {
          ...order,
          status: order.status || order.orderStatus || 'Pending',
        };
      }));
      setError('');
      setLoading(false);
    },
    (snapshotError) => {
      setError(`Could not load orders: ${snapshotError.message}`);
      setLoading(false);
    },
  ), []);

  const visibleOrders = useMemo(() => {
    const term = search.trim().toLowerCase();
    return orders.filter((order) => {
      const matchesStatus = statusFilter === 'All' || order.status === statusFilter;
      const matchesSearch = !term || [
        order.trackingId,
        order.orderNumber,
        order.customerName,
        order.customerEmail,
        order.customerPhone,
        order.id,
      ].some((value) => String(value || '').toLowerCase().includes(term));
      return matchesStatus && matchesSearch;
    });
  }, [orders, search, statusFilter]);

  const changeStatus = async (orderId, status) => {
    setError('');
    try {
      await updateOrderStatus(orderId, status);
    } catch (updateError) {
      setError(`Could not update order status: ${updateError.message}`);
    }
  };

  const formatDate = (timestamp) => timestamp?.toDate
    ? timestamp.toDate().toLocaleDateString()
    : '—';

  return (
    <div className="admin-shell">
      <AdminSidebar />

      <main className="admin-main-panel">
        <AdminNavbar />

        <div className="admin-panel-content">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Sales</p>
              <h2>Orders overview</h2>
            </div>
          </div>

          <div className="table-toolbar">
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search orders or customers"
              aria-label="Search orders"
            />
            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} aria-label="Filter by status">
              <option value="All">All statuses</option>
              {statuses.map((status) => <option key={status} value={status}>{status}</option>)}
            </select>
          </div>
          {error && <p role="alert">{error}</p>}
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
                {loading && <tr><td colSpan="9">Loading orders…</td></tr>}
                {!loading && !error && visibleOrders.length === 0 && (
                  <tr><td colSpan="9">{orders.length ? 'No orders match your filters.' : 'No orders have been placed yet.'}</td></tr>
                )}
                {visibleOrders.map((order) => (
                  <tr key={order.id}>
                    <td>{order.trackingId || order.orderNumber || order.id}</td>
                    <td>{order.customerName}</td>
                    <td>{order.customerEmail}</td>
                    <td>{order.customerPhone}</td>
                    <td>{order.items?.map((item) => `${item.name} × ${item.quantity}`).join(', ')}</td>
                    <td>PKR {order.totalAmount}</td>
                    <td>
                      <select value={order.status} onChange={(event) => changeStatus(order.id, event.target.value)} aria-label={`Update status for ${order.orderNumber || order.id}`}>
                        {statuses.map((status) => (
                          <option
                            key={status}
                            value={status}
                            disabled={
                              (order.status === 'Cancelled' && status !== 'Cancelled')
                              || (status === 'Cancelled' && ['Shipped', 'Delivered'].includes(order.status))
                            }
                          >
                            {status}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td>{formatDate(order.createdAt)}</td>
                    <td>
                      <details>
                        <summary>View</summary>
                        <p>Tracking ID: {order.trackingId || order.orderNumber || order.id}</p>
                        <p>Firestore Document ID: {order.id}</p>
                        <ul>
                          {order.items?.map((item) => (
                            <li key={item.productId}>
                              {item.name} — {item.quantity} × PKR {item.unitPrice} = PKR {item.lineTotal}
                            </li>
                          ))}
                        </ul>
                        {order.statusHistory?.length > 0 && (
                          <div>
                            <strong>Status history</strong>
                            <ul>
                              {order.statusHistory.map((entry, index) => (
                                <li key={`${entry.status}-${index}`}>
                                  {entry.status} — {formatDate(entry.updatedAt)}
                                </li>
                              ))}
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
