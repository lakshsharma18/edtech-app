import { Navigate, Outlet } from 'react-router-dom';
import { getAuthUser } from '../../Instructor/utils/auth';

const AdminRoute = () => {
  const user = getAuthUser();

  if (!user || user.role?.toLowerCase() !== 'admin') {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};

export default AdminRoute;
