
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
      (listenerError) =>
        setError(`Could not load customers: ${listenerError.message}`),
    );

    const unsubscribeOrders = listenToOrders(
      (nextOrders) => {
        setOrders(nextOrders);
        setLoading(false);
      },
      (listenerError) =>
        setError(`Could not load customer orders: ${listenerError.message}`),
    );

    return () => {
      unsubscribeCustomers();
      unsubscribeOrders();
    };
  }, []);

  const filteredCustomers = useMemo(() => {
    const term = search.trim().toLowerCase();

    return customers.filter((customer) =>
      !term ||
      [customer.name, customer.email, customer.phone, customer.id].some(
        (value) => String(value || '').toLowerCase().includes(term),
      ),
    );
  }, [customers, search]);

  const getCustomerOrders = (customer) =>
    orders.filter(
      (order) =>
        order.customerId === customer.id ||
        order.customerEmail === customer.email,
    );

  const activeCustomers = customers.filter(
    (customer) => customer.isActive,
  ).length;

  const inactiveCustomers = customers.length - activeCustomers;

  return (
    <div className="admin-shell customer-page">
      <AdminSidebar />

      <main className="admin-main-panel">
        <AdminNavbar />

        <div className="admin-panel-content customer-content">

          {/* Page Heading */}
          <div className="customer-heading">
            <div>
              <span className="customer-eyebrow">
                SKINORA / CUSTOMER MANAGEMENT
              </span>
              <h1>Customers</h1>
              <p>
                Manage customer profiles, contact information and purchase
                history.
              </p>
            </div>

            <div className="customer-total-badge">
              <span>Total Customers</span>
              <strong>{customers.length}</strong>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="customer-stats-grid">

            <div className="customer-stat-card">
              <div className="customer-stat-top">
                <span className="customer-stat-icon">♙</span>
                <span className="customer-stat-caption">CUSTOMERS</span>
              </div>
              <strong>{customers.length}</strong>
              <p>Registered customers</p>
            </div>

            <div className="customer-stat-card">
              <div className="customer-stat-top">
                <span className="customer-stat-icon">✓</span>
                <span className="customer-stat-caption">ACTIVE</span>
              </div>
              <strong>{activeCustomers}</strong>
              <p>Active customer accounts</p>
            </div>

            <div className="customer-stat-card">
              <div className="customer-stat-top">
                <span className="customer-stat-icon">○</span>
                <span className="customer-stat-caption">INACTIVE</span>
              </div>
              <strong>{inactiveCustomers}</strong>
              <p>Inactive customer accounts</p>
            </div>

            <div className="customer-stat-card">
              <div className="customer-stat-top">
                <span className="customer-stat-icon">▤</span>
                <span className="customer-stat-caption">ORDERS</span>
              </div>
              <strong>{orders.length}</strong>
              <p>Total recorded orders</p>
            </div>

          </div>

          {/* Customer Directory */}
          <section className="customer-directory">

            <div className="customer-directory-heading">
              <div>
                <span className="customer-section-label">
                  CUSTOMER DIRECTORY
                </span>
                <h2>All Customers</h2>
                <p>View customer details and their order activity.</p>
              </div>

              <span className="customer-results-count">
                {filteredCustomers.length} Results
              </span>
            </div>

            {/* Search */}
            <div className="customer-search-wrapper">
              <span className="customer-search-icon">⌕</span>

              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search by name, email, phone or customer ID..."
                aria-label="Search customers"
              />

              {search && (
                <button
                  type="button"
                  className="customer-clear-search"
                  onClick={() => setSearch('')}
                >
                  Clear
                </button>
              )}
            </div>

            {/* Error */}
            {error && (
              <div className="customer-alert customer-alert-error" role="alert">
                <span>!</span>
                {error}
              </div>
            )}

            {/* Loading */}
            {loading && (
              <div className="customer-state">
                <div className="customer-loader"></div>
                <h3>Loading customers</h3>
                <p>Please wait while customer information is retrieved.</p>
              </div>
            )}

            {/* Customer Cards */}
            {!loading && (
              <div className="customer-list">

                {filteredCustomers.length === 0 && (
                  <div className="customer-state">
                    <span className="customer-empty-icon">♙</span>
                    <h3>No customers found</h3>
                    <p>
                      {search
                        ? 'Try searching with another name, email or phone number.'
                        : 'Customer records will appear here when available.'}
                    </p>
                  </div>
                )}

                {filteredCustomers.map((customer) => {
                  const customerOrders = getCustomerOrders(customer);

                  return (
                    <article
                      key={customer.id}
                      className="customer-card"
                    >

                      {/* Customer Header */}
                      <div className="customer-card-header">

                        <div className="customer-profile">
                          <div className="customer-avatar">
                            {(customer.name || 'C')
                              .trim()
                              .charAt(0)
                              .toUpperCase()}
                          </div>

                          <div className="customer-profile-info">
                            <h3>{customer.name || 'Unnamed Customer'}</h3>
                            <p>{customer.email || 'No email provided'}</p>
                          </div>
                        </div>

                        <span
                          className={`customer-status ${
                            customer.isActive
                              ? 'customer-status-active'
                              : 'customer-status-inactive'
                          }`}
                        >
                          <span></span>
                          {customer.isActive ? 'Active' : 'Inactive'}
                        </span>

                      </div>

                      {/* Customer Information */}
                      <div className="customer-info-grid">

                        <div className="customer-info-item">
                          <span>PHONE NUMBER</span>
                          <strong>
                            {customer.phone || 'Not provided'}
                          </strong>
                        </div>

                        <div className="customer-info-item">
                          <span>REGISTERED ON</span>
                          <strong>
                            {formatDate(customer.createdAt)}
                          </strong>
                        </div>

                        <div className="customer-info-item">
                          <span>TOTAL ORDERS</span>
                          <strong>{customerOrders.length}</strong>
                        </div>

                        <div className="customer-info-item">
                          <span>CUSTOMER ID</span>
                          <strong className="customer-id">
                            {customer.id}
                          </strong>
                        </div>

                      </div>

                      {/* Addresses */}
                      {customer.addresses &&
                        customer.addresses.length > 0 && (
                          <div className="customer-detail-section">

                            <div className="customer-detail-heading">
                              <span className="customer-detail-icon">⌖</span>
                              <h4>Saved Addresses</h4>
                              <span className="customer-detail-count">
                                {customer.addresses.length}
                              </span>
                            </div>

                            <div className="customer-address-grid">
                              {customer.addresses.map((address, index) => (
                                <div
                                  key={`${customer.id}-address-${index}`}
                                  className="customer-address-card"
                                >
                                  <strong>
                                    {address.label || 'Address'}
                                  </strong>

                                  <p>
                                    {address.fullAddress}
                                    {address.city
                                      ? `, ${address.city}`
                                      : ''}
                                    {address.postalCode
                                      ? ` ${address.postalCode}`
                                      : ''}
                                  </p>
                                </div>
                              ))}
                            </div>

                          </div>
                        )}

                      {/* Order History */}
                      <div className="customer-detail-section customer-order-section">

                        <div className="customer-detail-heading">
                          <span className="customer-detail-icon">▤</span>
                          <h4>Order History</h4>
                          <span className="customer-detail-count">
                            {customerOrders.length}
                          </span>
                        </div>

                        {customerOrders.length === 0 ? (
                          <div className="customer-no-orders">
                            <span>◇</span>
                            <p>No orders found for this customer.</p>
                          </div>
                        ) : (
                          <div className="customer-orders-list">
                            {customerOrders.map((order) => (
                              <div
                                key={order.id}
                                className="customer-order-item"
                              >
                                <div className="customer-order-main">
                                  <strong>
                                    {order.orderNumber || order.id}
                                  </strong>
                                  <span>
                                    {order.status || 'Status unavailable'}
                                  </span>
                                </div>

                                <strong className="customer-order-amount">
                                  PKR {order.totalAmount}
                                </strong>
                              </div>
                            ))}
                          </div>
                        )}

                      </div>

                    </article>
                  );
                })}

              </div>
            )}

          </section>
        </div>
      </main>

      {/* Scoped Customer Page Styling */}
      <style>{`
        .customer-page {
          --customer-dark: #30231f;
          --customer-brown: #49342c;
          --customer-gold: #c6a36a;
          --customer-gold-light: #e2c99c;
          --customer-cream: #f8f4ed;
          --customer-muted: #98877c;
          --customer-border: #e9dfd2;
          --customer-text: #392c26;
        }

        .customer-content {
          padding: 30px;
          color: var(--customer-text);
        }

        .customer-heading {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
          margin-bottom: 28px;
        }

        .customer-eyebrow,
        .customer-section-label {
          color: #b18d58;
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 2px;
        }

        .customer-heading h1 {
          margin: 8px 0 6px;
          color: #30231f;
          font-family: Georgia, serif;
          font-size: clamp(28px, 3vw, 36px);
          font-weight: 600;
        }

        .customer-heading p,
        .customer-directory-heading p {
          margin: 0;
          color: #94847a;
          font-size: 13px;
          line-height: 1.7;
        }

        .customer-total-badge {
          display: flex;
          flex-direction: column;
          gap: 5px;
          padding: 15px 22px;
          background: #30231f;
          border: 1px solid #b99762;
          border-radius: 12px;
          min-width: 135px;
        }

        .customer-total-badge span {
          color: #d4c1a5;
          font-size: 10px;
          letter-spacing: 1px;
          text-transform: uppercase;
        }

        .customer-total-badge strong {
          color: #f2dfbd;
          font-family: Georgia, serif;
          font-size: 27px;
        }

        .customer-stats-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 17px;
          margin-bottom: 30px;
        }

        .customer-stat-card {
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

        .customer-stat-card::after {
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
          animation: customerCardShine 6s ease-in-out infinite;
        }

        .customer-stat-card:nth-child(2)::after {
          animation-delay: 1.2s;
        }

        .customer-stat-card:nth-child(3)::after {
          animation-delay: 2.4s;
        }

        .customer-stat-card:nth-child(4)::after {
          animation-delay: 3.6s;
        }

        @keyframes customerCardShine {
          0%, 65% { left: -80%; }
          100% { left: 150%; }
        }

        .customer-stat-card:hover {
          transform: translateY(-6px);
          border-color: #d5b77f;
          box-shadow: 0 15px 28px rgba(48, 35, 31, 0.2);
        }

        .customer-stat-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 17px;
        }

        .customer-stat-icon {
          display: grid;
          place-items: center;
          width: 35px;
          height: 35px;
          color: #e5c891;
          background: rgba(226, 201, 156, 0.12);
          border: 1px solid rgba(226, 201, 156, 0.3);
          border-radius: 10px;
          font-size: 20px;
        }

        .customer-stat-caption {
          color: #c9ad7e;
          font-size: 9px;
          font-weight: 800;
          letter-spacing: 1.5px;
        }

        .customer-stat-card > strong {
          display: block;
          color: #f4e6ce;
          font-family: Georgia, serif;
          font-size: 31px;
          font-weight: 600;
        }

        .customer-stat-card > p {
          margin: 5px 0 0;
          color: #c5b4a2;
          font-size: 11px;
        }

        .customer-directory {
          padding: 25px;
          background: #fffefa;
          border: 1px solid var(--customer-border);
          border-radius: 16px;
          box-shadow: 0 8px 25px rgba(48, 35, 31, 0.045);
        }

        .customer-directory-heading {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 15px;
          margin-bottom: 20px;
        }

        .customer-directory-heading h2 {
          margin: 7px 0 5px;
          color: #392c26;
          font-family: Georgia, serif;
          font-size: 23px;
          font-weight: 600;
        }

        .customer-results-count {
          padding: 8px 13px;
          color: #8d7047;
          background: #f6efe3;
          border: 1px solid #e8d7bb;
          border-radius: 30px;
          font-size: 11px;
          font-weight: 700;
          white-space: nowrap;
        }

        .customer-search-wrapper {
          display: flex;
          align-items: center;
          gap: 11px;
          padding: 0 15px;
          min-height: 48px;
          background: #faf7f1;
          border: 1px solid #e8dfd3;
          border-radius: 10px;
          transition: border-color 0.2s, box-shadow 0.2s;
        }

        .customer-search-wrapper:focus-within {
          border-color: #b99560;
          box-shadow: 0 0 0 3px rgba(185, 149, 96, 0.1);
        }

        .customer-search-icon {
          color: #a88960;
          font-size: 24px;
        }

        .customer-search-wrapper input {
          flex: 1;
          width: 100%;
          min-width: 0;
          border: none;
          outline: none;
          background: transparent;
          color: #392c26;
          font-size: 13px;
        }

        .customer-search-wrapper input::placeholder {
          color: #ad9f92;
        }

        .customer-clear-search {
          padding: 6px 10px;
          color: #8d7047;
          background: #f0e5d3;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-size: 11px;
          font-weight: 700;
        }

        .customer-alert {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-top: 18px;
          padding: 13px 15px;
          border-radius: 9px;
          font-size: 12px;
        }

        .customer-alert-error {
          color: #9b4242;
          background: #fff1ef;
          border: 1px solid #f0ceca;
        }

        .customer-alert-error span {
          display: grid;
          place-items: center;
          width: 20px;
          height: 20px;
          background: #f5d9d5;
          border-radius: 50%;
          font-weight: 800;
        }

        .customer-list {
          display: grid;
          gap: 18px;
          margin-top: 22px;
        }

        .customer-card {
          padding: 22px;
          background: #fff;
          border: 1px solid #ebe3d9;
          border-radius: 13px;
          transition: border-color 0.25s, box-shadow 0.25s,
            transform 0.25s;
        }

        .customer-card:hover {
          transform: translateY(-2px);
          border-color: #d3b98f;
          box-shadow: 0 10px 25px rgba(48, 35, 31, 0.07);
        }

        .customer-card-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 15px;
          padding-bottom: 19px;
          border-bottom: 1px solid #f0eae2;
        }

        .customer-profile {
          display: flex;
          align-items: center;
          gap: 13px;
          min-width: 0;
        }

        .customer-avatar {
          display: grid;
          place-items: center;
          flex-shrink: 0;
          width: 48px;
          height: 48px;
          color: #ead4ad;
          background: linear-gradient(135deg, #30231f, #5a4033);
          border: 1px solid #c4a36d;
          border-radius: 13px;
          font-family: Georgia, serif;
          font-size: 21px;
        }

        .customer-profile-info {
          min-width: 0;
        }

        .customer-profile-info h3 {
          margin: 0 0 5px;
          color: #392c26;
          font-family: Georgia, serif;
          font-size: 17px;
          font-weight: 600;
          overflow-wrap: anywhere;
        }

        .customer-profile-info p {
          margin: 0;
          color: #9a8a7d;
          font-size: 12px;
          overflow-wrap: anywhere;
        }

        .customer-status {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          padding: 7px 11px;
          border-radius: 30px;
          font-size: 10px;
          font-weight: 800;
          white-space: nowrap;
        }

        .customer-status > span {
          width: 6px;
          height: 6px;
          border-radius: 50%;
        }

        .customer-status-active {
          color: #477653;
          background: #edf5ed;
          border: 1px solid #d4e7d4;
        }

        .customer-status-active > span {
          background: #5d9b69;
        }

        .customer-status-inactive {
          color: #946e45;
          background: #f8f0e4;
          border: 1px solid #ead8ba;
        }

        .customer-status-inactive > span {
          background: #c49b62;
        }

        .customer-info-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 15px;
          padding: 20px 0;
        }

        .customer-info-item {
          display: flex;
          flex-direction: column;
          gap: 8px;
          min-width: 0;
        }

        .customer-info-item > span {
          color: #a18e7d;
          font-size: 9px;
          font-weight: 800;
          letter-spacing: 1px;
        }

        .customer-info-item > strong {
          color: #49372e;
          font-size: 12px;
          font-weight: 600;
          overflow-wrap: anywhere;
        }

        .customer-info-item > strong.customer-id {
          color: #98794f;
          font-size: 10px;
        }

        .customer-detail-section {
          padding-top: 17px;
          margin-top: 5px;
          border-top: 1px solid #f0eae2;
        }

        .customer-detail-heading {
          display: flex;
          align-items: center;
          gap: 9px;
          margin-bottom: 13px;
        }

        .customer-detail-icon {
          display: grid;
          place-items: center;
          width: 27px;
          height: 27px;
          color: #a48150;
          background: #f7f0e5;
          border-radius: 8px;
          font-size: 16px;
        }

        .customer-detail-heading h4 {
          margin: 0;
          color: #49372e;
          font-size: 13px;
          font-weight: 700;
        }

        .customer-detail-count {
          display: grid;
          place-items: center;
          min-width: 22px;
          height: 22px;
          padding: 0 6px;
          color: #94754b;
          background: #f5ecde;
          border-radius: 20px;
          font-size: 10px;
          font-weight: 700;
        }

        .customer-address-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 10px;
        }

        .customer-address-card {
          padding: 13px;
          background: #faf7f2;
          border: 1px solid #eee5d9;
          border-radius: 9px;
        }

        .customer-address-card strong {
          color: #856943;
          font-size: 11px;
        }

        .customer-address-card p {
          margin: 6px 0 0;
          color: #807166;
          font-size: 11px;
          line-height: 1.7;
          overflow-wrap: anywhere;
        }

        .customer-order-section {
          margin-top: 18px;
        }

        .customer-orders-list {
          display: grid;
          gap: 8px;
        }

        .customer-order-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 15px;
          padding: 12px 14px;
          background: #faf8f4;
          border: 1px solid #eee7dc;
          border-radius: 9px;
        }

        .customer-order-main {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 10px;
        }

        .customer-order-main > strong {
          color: #49372e;
          font-size: 11px;
        }

        .customer-order-main > span {
          padding: 5px 9px;
          color: #8e7049;
          background: #f1e7d7;
          border-radius: 20px;
          font-size: 9px;
          font-weight: 700;
          text-transform: capitalize;
        }

        .customer-order-amount {
          color: #927044;
          font-size: 12px;
          white-space: nowrap;
        }

        .customer-no-orders {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 13px;
          background: #faf8f4;
          border: 1px dashed #e5d9c9;
          border-radius: 9px;
        }

        .customer-no-orders span {
          color: #b18d58;
          font-size: 20px;
        }

        .customer-no-orders p {
          margin: 0;
          color: #9a897c;
          font-size: 11px;
        }

        .customer-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 55px 20px;
          text-align: center;
        }

        .customer-state h3 {
          margin: 12px 0 6px;
          color: #49372e;
          font-family: Georgia, serif;
          font-size: 20px;
        }

        .customer-state p {
          margin: 0;
          color: #9a897c;
          font-size: 12px;
          line-height: 1.7;
        }

        .customer-empty-icon {
          display: grid;
          place-items: center;
          width: 55px;
          height: 55px;
          color: #a88960;
          background: #f5eee3;
          border: 1px solid #e6d6bc;
          border-radius: 15px;
          font-size: 27px;
        }

        .customer-loader {
          width: 32px;
          height: 32px;
          border: 3px solid #eee3d3;
          border-top-color: #aa8755;
          border-radius: 50%;
          animation: customerSpin 0.8s linear infinite;
        }

        @keyframes customerSpin {
          to { transform: rotate(360deg); }
        }

        @media (max-width: 1100px) {
          .customer-stats-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }

          .customer-info-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }

        @media (max-width: 650px) {
          .customer-content {
            padding: 16px;
          }

          .customer-heading {
            align-items: flex-start;
            flex-direction: column;
          }

          .customer-total-badge {
            width: 100%;
          }

          .customer-stats-grid {
            gap: 10px;
          }

          .customer-stat-card {
            padding: 15px;
            min-height: 130px;
          }

          .customer-directory {
            padding: 15px;
          }

          .customer-directory-heading {
            align-items: flex-start;
            flex-direction: column;
          }

          .customer-card {
            padding: 15px;
          }

          .customer-card-header {
            align-items: flex-start;
          }

          .customer-profile {
            gap: 9px;
          }

          .customer-avatar {
            width: 40px;
            height: 40px;
          }

          .customer-profile-info h3 {
            font-size: 14px;
          }

          .customer-profile-info p {
            font-size: 10px;
          }

          .customer-info-grid {
            gap: 17px 10px;
          }

          .customer-address-grid {
            grid-template-columns: 1fr;
          }

          .customer-order-item {
            align-items: flex-start;
            flex-direction: column;
            gap: 9px;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .customer-stat-card::after {
            animation: none;
          }

          .customer-loader {
            animation-duration: 2s;
          }

          .customer-card,
          .customer-stat-card {
            transition: none;
          }
        }
      `}</style>
    </div>
  );
};

export default Customers;
