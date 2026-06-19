import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Navbar, Container, Nav, Button } from 'react-bootstrap';
import { FaGraduationCap, FaSignOutAlt, FaBookOpen, FaPlus, FaTachometerAlt } from 'react-icons/fa';
import '../../styles/Instructor.css';

const InstructorNavbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // ✅ Fixed path matching helper to correctly catch active sub-route strings
  const isActive = (path: string) => location.pathname === path || location.pathname.startsWith(path);

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  return (
    <Navbar expand="lg" className="bg-white border-bottom shadow-sm py-3 sticky-top instructor-navbar">
      <Container>
        {/* Brand Logo Logo Area */}
        <Navbar.Brand as={Link as any} to="/instructor/dashboard" className="fw-bold d-flex align-items-center text-primary gap-2">
          <FaGraduationCap size={26} />
          <span className="ms-1">ED-TECH Instructor</span>
        </Navbar.Brand>
        
        <Navbar.Toggle aria-controls="admin-navbar-nav" />
        
        <Navbar.Collapse id="admin-navbar-nav">
          <Nav className="ms-auto align-items-center gap-2">
            
            {/* 📊 DASHBOARD OVERVIEW LINK */}
            <Nav.Link
              as={Link as any}
              to="/instructor/dashboard"
              className={`px-3 py-2 rounded-3 d-flex align-items-center gap-2 transition-all fw-semibold ${
                isActive('/instructor/dashboard') ? 'bg-light text-primary fw-bold' : 'text-secondary'
              }`}
            >
              <FaTachometerAlt size={14} /> Dashboard
            </Nav.Link>

            {/* 📚 MANAGE COURSES DIRECTORY LINK (Aligned with your coursedetails page path) */}
            <Nav.Link
              as={Link as any}
              to="/instructor/coursedetails"
              className={`px-3 py-2 rounded-3 d-flex align-items-center gap-2 transition-all fw-semibold ${
                isActive('/instructor/coursedetails') ? 'bg-light text-primary fw-bold' : 'text-secondary'
              }`}
            >
              <FaBookOpen size={14} /> Manage Courses
            </Nav.Link>

            {/* ➕ ADD NEW COURSE FORM LINK */}
            <Nav.Link 
              as={Link as any} 
              to="/instructor/create-course" 
              className={`px-3 py-2 rounded-3 d-flex align-items-center gap-2 transition-all fw-semibold ${
                isActive('/instructor/create-course') ? 'bg-light text-primary fw-bold' : ''
              }`}
              style={{ padding: 0 }}
            >
              <Button variant="primary" className="rounded-pill px-3 py-1.5 d-flex align-items-center gap-2 fw-bold btn-sm shadow-sm">
                <FaPlus size={11} /> Add Course
              </Button>
            </Nav.Link>

            {/* 🚪 SIGN OUT LOGOUT ACTION STRIP */}
            <Button
              variant="outline-danger"
              onClick={handleLogout}
              className="ms-lg-2 rounded-pill px-3 py-1.5 d-flex align-items-center gap-2 btn-sm fw-semibold shadow-sm"
            >
              <FaSignOutAlt size={12} /> Logout
            </Button>

          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};

export default InstructorNavbar;
