import { useStore } from '../context/StoreContext';
import AdminNavbar from '../Components/AdminNavbar';
import AdminSidebar from '../Components/AdminSidebar';
import './Dashboard.css';

const Dashboard = () => {
  const { products, cart } = useStore();

  const totalRevenue = products.reduce((sum, product) => sum + product.price, 0);
  const totalOrders = cart.length > 0 ? cart.length + 2 : 3;
  const totalCustomers = 1245;

  const stats = [
    { label: 'Total Products', value: products.length },
    { label: 'Total Orders', value: totalOrders },
    { label: 'Total Customers', value: totalCustomers },
    { label: 'Total Revenue', value: `PKR ${totalRevenue}` },
  ];

  const recentActivity = [
    { title: 'New serum stock received', detail: 'Vitamin C Serum updated with 12 more units.' },
    { title: 'Site traffic increased', detail: 'Conversion rate improved by 8.4% this week.' },
    { title: 'Bundle promotion launched', detail: 'Glow ritual bundles are now live on the homepage.' },
  ];

  return (
    <div className="admin-shell">
      <AdminSidebar />

      <main className="admin-main-panel">
        <AdminNavbar />

        <div className="dashboard-content">
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
              <h3>Recent activity</h3>
            </div>

            <div className="activity-list">
              {recentActivity.map((item) => (
                <div key={item.title} className="activity-item">
                  <div className="activity-dot" />
                  <div>
                    <h4>{item.title}</h4>
                    <p>{item.detail}</p>
                  </div>
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
