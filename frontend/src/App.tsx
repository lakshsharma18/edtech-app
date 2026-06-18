import { Routes, Route, useLocation, Navigate } from 'react-router-dom';
import NavigationBar from './components/Navbar';
import UserNavbar from './User/components/UserNavbar';
import UserRoute from './User/components/UserRoute';

import Register from './pages/Register';
import Login from './pages/Login';
import Home from './pages/Home';
import Courses from './pages/Courses';
import Success from './pages/Success';
import Cancel from './pages/Cancel';

// Admin Pages
import CreateCourse from './Instructor/Pages/AddCourse';
import CourseDetails from './Instructor/Pages/CourseDetails';
import ManageCourse from './Instructor/Pages/ManageCourse';
import { getAuthUser } from './Instructor/utils/auth';
import UserDashboard from './User/Pages/UserDashboard';
import WorkSpace from './User/Pages/WorkSpace';
import Chatbot from './components/Chatbot';
import PaymentHistory from './User/Pages/PaymentHistory';
import InstructorRoute from './Instructor/components/InstructorRoute';
import InstructorHome from './Instructor/Pages/InstructorHome';
import InstructorNavbar from './Instructor/components/InstructorNavbar';
import AdminRoute from './Admin/components/AdminRoute';
import AdminDashboard from './Admin/pages/AdminDashboard';
import AdminRegisterInstructor from './Admin/pages/AdminRegisterInstructor';
import AdminNavbar from './Admin/components/AdminNavbar';
import InstructorLive from './Instructor/components/InstructorLive';
import { NotificationProvider } from './User/components/NotificationProvider';
import ChangePassword from './Instructor/Pages/ChangePassword';

// ✅ INGEST THE NEW SHOPPING CART PAGE
import CartPage from './User/Pages/CartPage';
import QuizPage from './pages/QuizPage';

function App() {
  const { pathname } = useLocation();
  const user = getAuthUser();
  
  // Core structural states
  const isInstructorPath = pathname.startsWith('/instructor');
  // ✅ Pushes User light theme backgrounds to /cart layout perfectly
  const isUserPath = pathname.startsWith('/user')
  const isAdminPath = pathname.startsWith('/admin');
  const isInstructor = !!localStorage.getItem('token') && user?.role?.toLowerCase() === 'instructor';
  const isStudent = !!localStorage.getItem('token') && user?.role?.toLowerCase() === 'user';
  const isAdmin = !!localStorage.getItem('token') && user?.role?.toLowerCase() === 'admin';

  // 1. Streamlined dynamic background selector mapping
  const bgColors: Record<string, string> = { admin: '#0f172a', user: '#f8fafc', default: '#ffffff' };
  const currentBgColor = isAdminPath ? bgColors.admin : isInstructorPath ? bgColors.admin : isUserPath ? bgColors.user : bgColors.default;

  // 2. Simplified conditional layout component selection matrix
  const renderNavbar = () => {
    if (isAdminPath || isAdmin) return <AdminNavbar />;
    if (isInstructorPath || isInstructor) return <InstructorNavbar />;
    if (isUserPath || isStudent) return <UserNavbar />; // ✅ Automatically mounts student navbar on cart pages
    return <NavigationBar />;
  };

  return (
    <div style={{ backgroundColor: currentBgColor, minHeight: '100vh', transition: 'background-color 0.3s' }}>
      {renderNavbar()}

      <NotificationProvider>
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
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="register-instructor" element={<AdminRegisterInstructor />} />
        </Route>

        {/* Instructor Subtree */}
        <Route path="/instructor" element={<InstructorRoute />}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<InstructorHome />} />
          <Route path="create-course" element={<CreateCourse />} />
          <Route path="coursedetails" element={<CourseDetails />} />
          <Route path="manage-course/:course_id" element={<ManageCourse />} />
          <Route path="change-password" element={<ChangePassword />} />
          <Route path="live/:course_id" element={<InstructorLive />} />
        </Route>

        {/* Learner Subtree (🔒 FULLY PROTECTED ROUTER SUITE) */}
        <Route path="/user" element={<UserRoute />}>
          <Route path="dashboard" element={<UserDashboard />} />
          <Route path="courses/:id" element={<WorkSpace />} />
          <Route path="billing" element={<PaymentHistory />} />
          <Route path="quiz/:id" element={<QuizPage />} />
          <Route path="cart" element={<CartPage />} />
        </Route>
      </Routes>
      </NotificationProvider>
      <Chatbot />
    </div>
  );
}

export default App;
