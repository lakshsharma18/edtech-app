
import { Routes, Route, useLocation } from 'react-router-dom';
import NavigationBar from './components/Navbar';
import AdminNavbar from './Admin/components/AdminNavbar';
import AdminRoute from './Admin/components/AdminRoute';
import Register from './pages/Register';
import Login from './pages/Login';
import Home from './pages/Home';
import AdminHome from './Admin/Pages/AdminHome';
import CreateCourse from './Admin/Pages/AddCourse';
import CourseDetails from './Admin/Pages/CourseDetails';


function App() {
  const location = useLocation();
  const isAdminPath = location.pathname.startsWith('/admin');

  return (
    <div style={{ backgroundColor: isAdminPath ? '#0f172a' : '#ffffff', minHeight: '100vh', transition: 'background-color 0.3s' }}>
      {/* Dynamic Navbar Selection */}
      {isAdminPath ? <AdminNavbar /> : <NavigationBar />}

      <Routes>
        {/* Public Application Routes */}
        <Route path="/" element={<Home />} />
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />

        {/* Guarded Admin Context Subtree */}
        <Route path="/admin" element={<AdminRoute />}>
          <Route path="dashboard" element={<AdminHome />} />
          <Route path="create-course" element={<CreateCourse />} />
          <Route path='coursedetails' element={<CourseDetails/>}/>
        </Route>
      </Routes>
    </div>
  );
}

export default App;
