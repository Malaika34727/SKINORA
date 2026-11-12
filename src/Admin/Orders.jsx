import AdminNavbar from '../Components/AdminNavbar';
import AdminSidebar from '../Components/AdminSidebar';
import { sampleOrders } from '../data/products';
import './Orders.css';

const Orders = () => {
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

          <div className="admin-table-wrap">
            <table className="admin-products-table orders-table">
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Customer Name</th>
                  <th>Customer Email</th>
                  <th>Products</th>
                  <th>Total Amount</th>
                  <th>Status</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {sampleOrders.map((order) => (
                  <tr key={order.id}>
                    <td>{order.id}</td>
                    <td>{order.customerName}</td>
                    <td>{order.email}</td>
                    <td>{order.products}</td>
                    <td>PKR {order.total}</td>
                    <td>
                      <span className="status-pill">{order.status}</span>
                    </td>
                    <td>{order.date}</td>
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
