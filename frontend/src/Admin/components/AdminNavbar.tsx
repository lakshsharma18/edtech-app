import { Link, useNavigate } from 'react-router-dom';
import { Navbar, Container, Nav, Button } from 'react-bootstrap';
import { FaGraduationCap, FaSignOutAlt, FaBookOpen } from 'react-icons/fa';

const AdminNavbar = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  return (
    <Navbar bg="dark" variant="dark" expand="lg" className="py-3 shadow sticky-top">
      <Container>
        <Navbar.Brand as={Link as any} to="/admin/dashboard" className="fw-bold d-flex align-items-center text-info">
          <FaGraduationCap className="me-2" size={30} />
          ED-TECH ADMIN
        </Navbar.Brand>
        <Navbar.Toggle aria-controls="admin-navbar-nav" />
        <Navbar.Collapse id="admin-navbar-nav">
          <Nav className="ms-auto align-items-center gap-2">
            <Nav.Link as={Link as any} to="/admin/coursedetails" className="px-3">
              <FaBookOpen className="me-1" /> Manage Courses
            </Nav.Link>
            <Button 
              variant="outline-danger" 
              onClick={handleLogout}
              className="ms-lg-3 rounded-pill px-4 d-flex align-items-center gap-2"
            >
              <FaSignOutAlt /> Logout
            </Button>
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};

export default AdminNavbar;
