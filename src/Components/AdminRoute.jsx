import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContextValue';

const AdminRoute = ({ children }) => {
  const { user, isAdmin, loading, error } = useAuth();
  const location = useLocation();

  if (loading) {
    return <main className="page-shell"><p className="container">Verifying admin access…</p></main>;
  }

  if (error) {
    return <main className="page-shell"><p className="container" role="alert">{error}</p></main>;
  }

  if (!user || !isAdmin) {
    return <Navigate to="/admin/login" replace state={{ from: location.pathname }} />;
  }

  return children;
};

export default AdminRoute;
