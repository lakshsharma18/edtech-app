import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Navbar, Container, Nav, Button } from 'react-bootstrap';
import { FaUserShield, FaSignOutAlt, FaChartBar, FaUserPlus } from 'react-icons/fa';
import '../../styles/Admin.css';

const AdminNavbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const isActive = (path: string) => location.pathname === path || location.pathname.startsWith(path);

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  return (
    <Navbar expand="lg" className="admin-navbar sticky-top shadow-sm py-3">
      <Container>
        <Navbar.Brand as={Link as any} to="/admin/dashboard" className="fw-bold d-flex align-items-center gap-2 text-white">
          <FaUserShield size={24} />
          <span>ED-TECH Admin</span>
        </Navbar.Brand>
        <Navbar.Toggle aria-controls="admin-navbar-nav" className="border-white" />
        <Navbar.Collapse id="admin-navbar-nav">
          <Nav className="ms-auto align-items-center gap-2">
            <Nav.Link
              as={Link as any}
              to="/admin/dashboard"
              active={isActive('/admin/dashboard')}
              className="px-3 text-white d-flex align-items-center gap-2"
            >
              <FaChartBar /> Dashboard
            </Nav.Link>
            <Nav.Link
              as={Link as any}
              to="/admin/register-instructor"
              active={isActive('/admin/register-instructor')}
              className="px-3 text-white d-flex align-items-center gap-2"
            >
              <FaUserPlus /> Register
            </Nav.Link>
            <Button variant="outline-light" onClick={handleLogout} className="ms-lg-2 rounded-pill px-3 d-flex align-items-center gap-2">
              <FaSignOutAlt /> Logout
            </Button>
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};

export default AdminNavbar;
