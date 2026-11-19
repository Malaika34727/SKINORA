import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContextValue';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <main className="page-shell"><p className="container">Loading your account…</p></main>;
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return children;
};

export default ProtectedRoute;
