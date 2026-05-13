
import { Navigate, Outlet } from 'react-router-dom';
import { getAuthUser } from '../utils/auth';

const AdminRoute = () => {
  const user = getAuthUser();

  // If not logged in, or logged in but NOT an admin, block access
  if (!user || user.role !== 'admin') {
    return <Navigate to="/login" replace />;
  }

  // If admin, render the requested child route components
  return <Outlet />;
};

export default AdminRoute;
