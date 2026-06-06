import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Navbar, Container, Nav, Button } from 'react-bootstrap';
import { FaGraduationCap, FaSignOutAlt, FaBookOpen, FaPlus, FaTachometerAlt } from 'react-icons/fa';
import '../../styles/Instructor.css';

const InstructorNavbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const isActive = (path: string) => location.pathname === path || location.pathname.startsWith(path);

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  return (
    <Navbar expand="lg" className="bg-white border-bottom shadow-sm py-3 sticky-top instructor-navbar">
      <Container>
        <Navbar.Brand as={Link as any} to="/instructor/dashboard" className="fw-bold d-flex align-items-center text-primary gap-2">
          <FaGraduationCap size={26} />
          <span className="ms-1">ED-TECH Instructor</span>
        </Navbar.Brand>
        <Navbar.Toggle aria-controls="admin-navbar-nav" />
        <Navbar.Collapse id="admin-navbar-nav">
          <Nav className="ms-auto align-items-center gap-2">
            <Nav.Link
              as={Link as any}
              to="/instructor/dashboard"
              active={isActive('/instructor/dashboard')}
              className="px-3 d-flex align-items-center gap-2"
            >
              <FaTachometerAlt /> Dashboard
            </Nav.Link>
            <Nav.Link
              as={Link as any}
              to="/instructor/coursedetails"
              active={isActive('/instructor/coursedetails')}
              className="px-3 d-flex align-items-center gap-2"
            >
              <FaBookOpen className="me-1" /> Manage Courses
            </Nav.Link>
            <Nav.Link as={Link as any} to="/instructor/create-course" className="px-3">
              <Button variant="primary" className="rounded-pill px-3 py-1 d-flex align-items-center gap-2">
                <FaPlus className="me-1" /> Add Course
              </Button>
            </Nav.Link>
            <Button
              variant="outline-danger"
              onClick={handleLogout}
              className="ms-lg-2 rounded-pill px-3 d-flex align-items-center gap-2"
            >
              <FaSignOutAlt /> Logout
            </Button>
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};

export default InstructorNavbar;
