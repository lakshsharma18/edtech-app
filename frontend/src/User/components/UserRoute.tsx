import { Navigate, Outlet } from 'react-router-dom';
import { getAuthUser } from '../../Instructor/utils/auth';

const UserRoute = () => {
  const user = getAuthUser();

  // If not logged in, or logged in but NOT a user, block access
  if (!user || user.role !== 'user') {
    return <Navigate to="/login" replace />;
  }

  // If user, render the requested child route components
  return <Outlet />;
};

export default UserRoute;
