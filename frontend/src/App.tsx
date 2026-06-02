import { Routes, Route, useLocation } from 'react-router-dom';
import NavigationBar from './components/Navbar';
import AdminNavbar from './Admin/components/AdminNavbar';
import AdminRoute from './Admin/components/AdminRoute';
import UserNavbar from './User/components/UserNavbar';
import UserRoute from './User/components/UserRoute';

import Register from './pages/Register';
import Login from './pages/Login';
import Home from './pages/Home';
import Courses from './pages/Courses';
import Success from './pages/Success';
import Cancel from './pages/Cancel';

// Admin Pages
import AdminHome from './Admin/Pages/AdminHome';
import CreateCourse from './Admin/Pages/AddCourse';
import CourseDetails from './Admin/Pages/CourseDetails';
import ManageCourse from './Admin/Pages/ManageCourse';
import { getAuthUser } from './Admin/utils/auth';
import UserDashboard from './User/Pages/UserDashboard';
import WorkSpace from './User/Pages/WorkSpace';
import Chatbot from './components/Chatbot';
import PaymentHistory from './User/Pages/PaymentHistory';
function App() {
  const { pathname } = useLocation();
  const user = getAuthUser();
  
  // Core structural states
  const isAdminPath = pathname.startsWith('/admin');
  const isUserPath = pathname.startsWith('/user');
  const isAdmin = !!localStorage.getItem('token') && user?.role?.toLowerCase() === 'admin';
  const isStudent = !!localStorage.getItem('token') && user?.role?.toLowerCase() === 'user';

  // 1. Streamlined dynamic background selector mapping
  const bgColors: Record<string, string> = { admin: '#0f172a', user: '#f8fafc', default: '#ffffff' };
  const currentBgColor = isAdminPath ? bgColors.admin : isUserPath ? bgColors.user : bgColors.default;

  // 2. Simplified conditional layout component selection matrix
  const renderNavbar = () => {
    if (isAdminPath || isAdmin) return <AdminNavbar />;
    if (isUserPath || isStudent) return <UserNavbar />;
    return <NavigationBar />;
  };

  return (
    <div style={{ backgroundColor: currentBgColor, minHeight: '100vh', transition: 'background-color 0.3s' }}>
      {renderNavbar()}

      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Home />} />
        <Route path="/courses" element={<Courses />} />
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route path="/success" element={<Success />} />
        <Route path="/cancel" element={<Cancel />} />

        {/* Admin Subtree */}
        <Route path="/admin" element={<AdminRoute />}>
          <Route path="dashboard" element={<AdminHome />} />
          <Route path="create-course" element={<CreateCourse />} />
          <Route path="coursedetails" element={<CourseDetails />} />
          <Route path="manage-course/:course_id" element={<ManageCourse />} />
        </Route>

        {/* Learner Subtree */}
        <Route path="/user" element={<UserRoute />}>
          <Route path="dashboard" element={<UserDashboard />} />
          <Route path="courses/:id" element={<WorkSpace />} />
          <Route path="billing" element={<PaymentHistory />} />
        </Route>
      </Routes>
      <Chatbot />
    </div>
  );
}

export default App;
