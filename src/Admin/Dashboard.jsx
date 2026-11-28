
import { useEffect, useState } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';

import { superAdminDb } from '../firebase';

import AdminNavbar from '../Components/AdminNavbar';
import AdminSidebar from '../Components/AdminSidebar';

import './Dashboard.css';

const formatCurrency = (amount) =>
  `PKR ${Number(amount || 0).toLocaleString('en-PK')}`;

const getOrderDate = (order) =>
  order.createdAt?.toDate?.() ||
  order.orderDate?.toDate?.() ||
  null;

const Dashboard = () => {
  const [stats, setStats] = useState([]);
  const [recentOrders, setRecentOrders] = useState([]);
  const [lowStockProducts, setLowStockProducts] = useState([]);
  const [weeklyRevenue, setWeeklyRevenue] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    let products = [];
    let orders = [];
    let customers = [];

    const loadedCollections = new Set();

    const formatDashboard = () => {
      if (!active) return;

      const pendingOrders = orders.filter((order) => (
        (order.status || order.orderStatus || '').toLowerCase() === 'pending'
      )).length;

      const revenueTotal = orders
        .filter((order) => (
          (order.status || order.orderStatus || '').toLowerCase() !== 'cancelled'
        ))
        .reduce(
          (sum, order) => sum + Number(order.totalAmount || 0),
          0
        );

      const sortDate = (order) =>
        getOrderDate(order)?.getTime() || 0;

      // WEEKLY REVENUE

      const today = new Date();
      const days = [];

      for (let i = 6; i >= 0; i--) {
        const date = new Date(today);
        date.setHours(0, 0, 0, 0);
        date.setDate(today.getDate() - i);

        const nextDate = new Date(date);
        nextDate.setDate(date.getDate() + 1);

        const dayRevenue = orders
          .filter((order) => {
            const status = (
              order.status ||
              order.orderStatus ||
              ''
            ).toLowerCase();

            const orderDate = getOrderDate(order);

            return (
              status !== 'cancelled' &&
              orderDate &&
              orderDate >= date &&
              orderDate < nextDate
            );
          })
          .reduce(
            (sum, order) => sum + Number(order.totalAmount || 0),
            0
          );

        days.push({
          label: date.toLocaleDateString('en', {
            weekday: 'short',
          }),
          amount: dayRevenue,
        });
      }

      setWeeklyRevenue(days);

      // STATISTICS

      setStats([
        {
          label: 'Total Products',
          value: products.length.toLocaleString('en-PK'),
          icon: '◇',
          description: 'Products in your store',
          style: 'products',
        },
        {
          label: 'Total Orders',
          value: orders.length.toLocaleString('en-PK'),
          icon: '▤',
          description: 'Orders received',
          style: 'orders',
        },
        {
          label: 'Total Customers',
          value: customers.length.toLocaleString('en-PK'),
          icon: '♙',
          description: 'Registered customers',
          style: 'customers',
        },
        {
          label: 'Total Revenue',
          value: formatCurrency(revenueTotal),
          icon: '₨',
          description: 'Excluding cancelled orders',
          style: 'revenue',
        },
        {
          label: 'Pending Orders',
          value: pendingOrders.toLocaleString('en-PK'),
          icon: '◷',
          description: 'Awaiting processing',
          style: 'pending',
        },
      ]);

      // RECENT ORDERS

      setRecentOrders(
        [...orders]
          .sort(
            (first, second) =>
              sortDate(second) - sortDate(first)
          )
          .slice(0, 5)
      );

      // LOW STOCK PRODUCTS

      setLowStockProducts(
        products
          .filter(
            (product) =>
              Number.isInteger(product.stock) &&
              product.stock <= 5
          )
          .sort(
            (first, second) => first.stock - second.stock
          )
          .slice(0, 10)
      );

      if (loadedCollections.size === 3) {
        setLoading(false);
      }
    };

    // FIRESTORE LISTENER

    const subscribe = (name, collectionName, onData) => {
      return onSnapshot(
        collection(superAdminDb, collectionName),

        (snapshot) => {
          if (!active) return;

          onData(
            snapshot.docs.map((item) => ({
              id: item.id,
              ...item.data(),
            }))
          );

          loadedCollections.add(name);
          formatDashboard();
        },

        (snapshotError) => {
          if (!active) return;

          console.error(
            `Dashboard ${name} listener error:`,
            snapshotError
          );

          setError(
            `Could not load ${name}: ${snapshotError.message}`
          );

          setLoading(false);
        }
      );
    };

    // COLLECTIONS

    const unsubscribe = [
      subscribe('products', 'products', (nextProducts) => {
        products = nextProducts;
      }),

      subscribe('orders', 'SKINORA_ORDERS', (nextOrders) => {
        orders = nextOrders;
      }),

      subscribe('customers', 'CREATEACCUSER', (nextCustomers) => {
        customers = nextCustomers;
      }),
    ];

    return () => {
      active = false;
      unsubscribe.forEach((stop) => stop());
    };
  }, []);

  const maxWeeklyRevenue = Math.max(
    ...weeklyRevenue.map((day) => day.amount),
    1
  );

  const getStatusClass = (status) => {
    const normalized = (status || 'Pending')
      .toLowerCase()
      .replace(/\s+/g, '-');

    return `status-${normalized}`;
  };

  return (
    <div className="admin-shell">
      <AdminSidebar />

      <main className="admin-main-panel">
        <AdminNavbar />

        <div className="dashboard-content">

          {/* PAGE INTRO */}

          <section className="dashboard-intro">
            <div>
              <span className="dashboard-eyebrow">
                SKINORA CONTROL CENTER
              </span>

              <h1>Dashboard Overview</h1>

              <p>
                Here's what's happening with your store today.
              </p>
            </div>

            <div className="dashboard-live">
              <span className="live-indicator" />
              Live store data
            </div>
          </section>

          {/* ERROR */}

          {error && (
            <div className="dashboard-error" role="alert">
              {error}
            </div>
          )}

          {/* LOADING */}

          {loading && (
            <div className="dashboard-loading">
              <span className="dashboard-spinner" />
              <p>Loading your dashboard...</p>
            </div>
          )}

          {/* STATISTICS */}

          <section className="stats-section">
            <div className="section-heading">
              <div>
                <span className="section-eyebrow">
                  AT A GLANCE
                </span>
                <h2>Store Statistics</h2>
              </div>

              <span className="section-note">
                Live overview
              </span>
            </div>

            <div className="stats-grid">
              {stats.map((stat) => (
                <article
                  key={stat.label}
                  className={`stat-card stat-${stat.style}`}
                >
                  <div className="stat-card-top">
                    <span className="stat-label">
                      {stat.label}
                    </span>

                    <span className="stat-icon">
                      {stat.icon}
                    </span>
                  </div>

                  <strong className="stat-value">
                    {stat.value}
                  </strong>

                  <span className="stat-description">
                    {stat.description}
                  </span>
                </article>
              ))}
            </div>
          </section>

          {/* REVENUE OVERVIEW */}

          <section className="revenue-panel">
            <div className="panel-heading">
              <div>
                <span className="section-eyebrow">
                  PERFORMANCE
                </span>
                <h2>Revenue Overview</h2>
                <p>Daily revenue from the last 7 days</p>
              </div>

              <span className="revenue-period">
                LAST 7 DAYS
              </span>
            </div>

            <div className="revenue-chart">
              {weeklyRevenue.map((day, index) => (
                <div
                  className="revenue-chart-column"
                  key={`${day.label}-${index}`}
                >
                  <span className="revenue-bar-value">
                    {day.amount > 0
                      ? day.amount.toLocaleString('en-PK')
                      : '—'}
                  </span>

                  <div className="revenue-bar-track">
                    <div
                      className="revenue-bar"
                      style={{
                        height: `${
                          day.amount > 0
                            ? Math.max(
                                (day.amount / maxWeeklyRevenue) * 100,
                                5
                              )
                            : 0
                        }%`,
                      }}
                    />
                  </div>

                  <span className="revenue-day">
                    {day.label}
                  </span>
                </div>
              ))}
            </div>

            <div className="revenue-chart-footer">
              <span>
                <span className="revenue-legend-dot" />
                Daily order revenue
              </span>

              <span>Currency: PKR</span>
            </div>
          </section>

          {/* RECENT ORDERS + LOW STOCK */}

          <div className="dashboard-bottom-grid">

            <section className="activity-panel">
              <div className="panel-heading">
                <div>
                  <span className="section-eyebrow">
                    LATEST ACTIVITY
                  </span>
                  <h2>Recent Orders</h2>
                </div>

                <span className="panel-count">
                  {recentOrders.length} orders
                </span>
              </div>

              <div className="activity-list">

                {!loading && recentOrders.length === 0 && (
                  <div className="empty-state">
                    <span>▤</span>
                    <p>No orders yet.</p>
                  </div>
                )}

                {recentOrders.map((order) => {
                  const status =
                    order.status ||
                    order.orderStatus ||
                    'Pending';

                  return (
                    <div
                      key={order.id}
                      className="activity-item"
                    >
                      <div className="order-avatar">
                        {(order.customerName || 'C')
                          .charAt(0)
                          .toUpperCase()}
                      </div>

                      <div className="activity-details">
                        <h4>
                          {order.trackingId ||
                            order.orderNumber ||
                            order.id}
                        </h4>

                        <p>
                          {order.customerName || 'Customer'}
                        </p>

                        <span className="activity-date">
                          {getOrderDate(order)
                            ? getOrderDate(order).toLocaleDateString()
                            : 'Date unavailable'}
                        </span>
                      </div>

                      <div className="order-meta">
                        <strong>
                          {formatCurrency(order.totalAmount)}
                        </strong>

                        <span
                          className={`order-status ${getStatusClass(status)}`}
                        >
                          {status}
                        </span>
                      </div>
                    </div>
                  );
                })}

              </div>
            </section>

            {/* LOW STOCK */}

            <section className="activity-panel low-stock-panel">
              <div className="panel-heading">
                <div>
                  <span className="section-eyebrow">
                    INVENTORY ALERT
                  </span>
                  <h2>Low Stock Products</h2>
                </div>

                <span className="panel-count warning-count">
                  {lowStockProducts.length} items
                </span>
              </div>

              <div className="activity-list">

                {!loading && lowStockProducts.length === 0 && (
                  <div className="empty-state">
                    <span>✓</span>
                    <p>
                      No products currently have 5 or fewer units.
                    </p>
                  </div>
                )}

                {lowStockProducts.map((product) => (
                  <div
                    key={product.id}
                    className="stock-item"
                  >
                    <div className="stock-product-icon">
                      ◇
                    </div>

                    <div className="stock-product-details">
                      <h4>
                        {product.name || 'Unnamed product'}
                      </h4>
                      <p>Stock availability</p>
                    </div>

                    <span
                      className={`stock-quantity ${
                        product.stock === 0
                          ? 'stock-empty'
                          : 'stock-warning'
                      }`}
                    >
                      {product.stock} left
                    </span>
                  </div>
                ))}

              </div>
            </section>

          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
