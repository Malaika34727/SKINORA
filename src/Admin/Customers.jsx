import { useEffect, useMemo, useState } from 'react';
import AdminNavbar from '../Components/AdminNavbar';
import AdminSidebar from '../Components/AdminSidebar';
import { listenToCustomers, listenToOrders } from '../services/adminData';
import '../Admin/AdminData.css';

const formatDate = (timestamp) => {
  const date = timestamp?.toDate?.();
  return date ? date.toLocaleDateString() : '—';
};

const Customers = () => {
  const [customers, setCustomers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    const unsubscribeCustomers = listenToCustomers(
      (nextCustomers) => {
        setCustomers(nextCustomers);
      },
      (listenerError) => setError(`Could not load customers: ${listenerError.message}`),
    );
    const unsubscribeOrders = listenToOrders(
      (nextOrders) => {
        setOrders(nextOrders);
        setLoading(false);
      },
      (listenerError) => setError(`Could not load customer orders: ${listenerError.message}`),
    );

    return () => {
      unsubscribeCustomers();
      unsubscribeOrders();
    };
  }, []);

  const filteredCustomers = useMemo(() => {
    const term = search.trim().toLowerCase();
    return customers.filter((customer) => !term || [customer.name, customer.email, customer.phone, customer.id].some((value) => String(value || '').toLowerCase().includes(term)));
  }, [customers, search]);

  const getCustomerOrders = (customer) => orders.filter((order) => order.customerId === customer.id || order.customerEmail === customer.email);

  return (
    <div className="admin-shell">
      <AdminSidebar />
      <main className="admin-main-panel">
        <AdminNavbar />

        <div className="admin-panel-content">
          <div className="section-heading">
            <div>
              <p className="eyebrow">People</p>
              <h2>Customers</h2>
            </div>
          </div>

          <div className="table-toolbar">
            <input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search customer name, email or phone" aria-label="Search customers" />
          </div>

          {error && <p role="alert">{error}</p>}
          {loading && <p>Loading customers…</p>}

          <div className="admin-card-list">
            {!loading && filteredCustomers.length === 0 && <p>No customers match your search.</p>}
            {filteredCustomers.map((customer) => {
              const customerOrders = getCustomerOrders(customer);
              return (
                <div key={customer.id} className="admin-card admin-card-list-item">
                  <div className="admin-entity-header">
                    <div>
                      <strong>{customer.name}</strong>
                      <p>{customer.email}</p>
                    </div>
                    <span className="admin-pill">{customer.isActive ? 'Active' : 'Inactive'}</span>
                  </div>

                  <div className="admin-metadata-grid">
                    <span>Phone: {customer.phone || 'Not provided'}</span>
                    <span>Registered: {formatDate(customer.createdAt)}</span>
                    <span>Orders: {customerOrders.length}</span>
                    <span>Customer ID: {customer.id}</span>
                  </div>

                  {customer.addresses && customer.addresses.length > 0 && (
                    <div>
                      <h4>Addresses</h4>
                      {customer.addresses.map((address, index) => (
                        <p key={`${customer.id}-address-${index}`}>{address.label}: {address.fullAddress}, {address.city} {address.postalCode}</p>
                      ))}
                    </div>
                  )}

                  <div>
                    <h4>Order history</h4>
                    {customerOrders.length === 0 ? <p>No orders found for this customer.</p> : (
                      <ul className="admin-order-list">
                        {customerOrders.map((order) => (
                          <li key={order.id}>
                            <strong>{order.orderNumber || order.id}</strong> — {order.status} — PKR {order.totalAmount}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Customers;
