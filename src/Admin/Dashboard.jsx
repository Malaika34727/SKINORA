import { useEffect, useState } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import AdminNavbar from '../Components/AdminNavbar';
import AdminSidebar from '../Components/AdminSidebar';
import './Dashboard.css';

const Dashboard = () => {
  const [stats, setStats] = useState([]);
  const [recentOrders, setRecentOrders] = useState([]);
  const [lowStockProducts, setLowStockProducts] = useState([]);
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
        .filter((order) => (order.status || order.orderStatus || '').toLowerCase() !== 'cancelled')
        .reduce((sum, order) => sum + Number(order.totalAmount || 0), 0);
      const sortDate = (order) => order.createdAt?.toMillis?.() || order.orderDate?.toMillis?.() || 0;

      setStats([
        { label: 'Total Products', value: products.length },
        { label: 'Total Orders', value: orders.length },
        { label: 'Total Customers', value: customers.length },
        { label: 'Total Revenue', value: `PKR ${revenueTotal}` },
        { label: 'Pending Orders', value: pendingOrders },
      ]);
      setRecentOrders([...orders].sort((first, second) => sortDate(second) - sortDate(first)).slice(0, 5));
      setLowStockProducts(
        products
          .filter((product) => Number.isInteger(product.stock) && product.stock <= 5)
          .sort((first, second) => first.stock - second.stock)
          .slice(0, 10),
      );
      if (loadedCollections.size === 3) setLoading(false);
    };

    const subscribe = (name, collectionName, onData) => onSnapshot(
      collection(db, collectionName),
      (snapshot) => {
        onData(snapshot.docs.map((item) => ({ id: item.id, ...item.data() })));
        loadedCollections.add(name);
        formatDashboard();
      },
      (snapshotError) => {
        if (!active) return;
        setError(`Could not load ${name}: ${snapshotError.message}`);
        setLoading(false);
      },
    );

    const unsubscribe = [
      subscribe('products', 'products', (nextProducts) => { products = nextProducts; }),
      subscribe('orders', 'orders', (nextOrders) => { orders = nextOrders; }),
      subscribe('customers', 'customers', (nextCustomers) => { customers = nextCustomers; }),
    ];

    return () => {
      active = false;
      unsubscribe.forEach((stop) => stop());
    };
  }, []);

  return (
    <div className="admin-shell">
      <AdminSidebar />

      <main className="admin-main-panel">
        <AdminNavbar />

        <div className="dashboard-content">
          {error && <p role="alert">{error}</p>}
          {loading && <p>Loading dashboard…</p>}
          <section className="stats-grid">
            {stats.map((stat) => (
              <div key={stat.label} className="stat-card">
                <span>{stat.label}</span>
                <strong>{stat.value}</strong>
              </div>
            ))}
          </section>

          <section className="activity-panel">
            <div className="panel-header">
              <h3>Recent orders</h3>
            </div>

            <div className="activity-list">
              {!loading && recentOrders.length === 0 && <p>No orders yet.</p>}
              {recentOrders.map((order) => (
                <div key={order.id} className="activity-item">
                  <div className="activity-dot" />
                  <div>
                    <h4>{order.trackingId || order.orderNumber || order.id} — {order.customerName}</h4>
                    <p>PKR {order.totalAmount} · {order.status}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="activity-panel">
            <div className="panel-header"><h3>Low-stock products</h3></div>
            <div className="activity-list">
              {!loading && lowStockProducts.length === 0 && <p>No products currently have 5 or fewer units.</p>}
              {lowStockProducts.map((product) => (
                <div key={product.id} className="activity-item">
                  <div className="activity-dot" />
                  <div><h4>{product.name}</h4><p>{product.stock} units remaining</p></div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
