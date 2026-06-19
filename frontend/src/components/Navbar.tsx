import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Navbar, Container, Nav, Button, Badge } from 'react-bootstrap';
import { FaGraduationCap, FaHome, FaBook, FaSignInAlt, FaUserCircle, FaSignOutAlt } from 'react-icons/fa';
import { motion } from 'framer-motion';
import { getAuthUser } from '../Instructor/utils/auth'; // Importing your token decoder helper
import '../styles/Navbar.css';

const NavigationBar = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // ✅ Extract authentication tokens and decode properties 
  const token = localStorage.getItem('token');
  const user = getAuthUser();
  const isLoggedIn = !!token && !!user;

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/'); // Route back to safety cleanly
  };

  return (
    <motion.div
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5, type: 'spring', stiffness: 120 }}
    >
      <Navbar expand="lg" className="navbar-custom py-3 sticky-top">
        <Container>
          <Navbar.Brand as={Link as any} to="/" className="d-flex align-items-center logo-brand">
            <motion.div
              whileHover={{ rotate: 360 }}
              transition={{ duration: 0.6 }}
              className="logo-icon-wrapper me-2"
            >
              <FaGraduationCap size={32} />
            </motion.div>
            <span className="brand-text">ED<span className="text-primary">-</span>TECH</span>
          </Navbar.Brand>

          <Navbar.Toggle aria-controls="basic-navbar-nav" className="border-0 shadow-none" />

          <Navbar.Collapse id="basic-navbar-nav">
            <Nav className="ms-auto align-items-center gap-2">
              <Nav.Link as={Link as any} to="/" className={`nav-item-custom ${location.pathname === '/' ? 'active' : ''}`}>
                <FaHome className="me-1 mb-1" /> Home
              </Nav.Link>
              
              <Nav.Link as={Link as any} to="/courses" className={`nav-item-custom ${location.pathname === '/courses' ? 'active' : ''}`}>
                <FaBook className="me-1 mb-1" /> Courses
              </Nav.Link>

              <div className="vr d-none d-lg-block mx-2 opacity-25" style={{ height: '24px' }}></div>

              {/* ✅ DYNAMIC AUTHENTICATION ACTION SELECTION BLOCK */}
              {isLoggedIn ? (
                <>
                  {/* Account Metadata Identifier Badge */}
                  <Badge bg="light" className="text-dark border px-3 py-2 rounded-pill d-flex align-items-center gap-2 me-lg-2 my-2 my-lg-0">
                    <FaUserCircle size={16} className="text-primary" />
                    <span className="fw-bold text-dark">Hi, {user.first_name}</span>
                  </Badge>

                  {/* Route context selector button matching security roles */}
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button 
                      as={Link as any} 
                      to={user.role.toLowerCase() === 'admin' ? "/admin/dashboard" : "/user/dashboard"}
                      className="btn-signup rounded-pill px-4 btn-sm"
                    >
                      Workspace
                    </Button>
                  </motion.div>

                  {/* Secondary Sign out control link */}
                  <Button 
                    onClick={handleLogout} 
                    variant="link" 
                    className="nav-item-custom text-danger border-0 bg-transparent px-3 text-decoration-none d-flex align-items-center gap-1 my-2 my-lg-0"
                  >
                    <FaSignOutAlt size={14} /> Exit
                  </Button>
                </>
              ) : (
                <>
                  {/* Default fallback actions shown exclusively to guest/anonymous visitors */}
                  <Nav.Link as={Link as any} to="/login" className="nav-item-custom login-link">
                    <FaSignInAlt className="me-1 mb-1" /> Login
                  </Nav.Link>

                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button 
                      as={Link as any} 
                      to="/register" 
                      className="btn-signup rounded-pill px-4"
                    >
                      Join for Free
                    </Button>
                  </motion.div>
                </>
              )}
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>
    </motion.div>
  );
};

export default NavigationBar;
