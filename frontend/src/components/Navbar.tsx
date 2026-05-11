import { Link, useLocation } from 'react-router-dom';
import { Navbar, Container, Nav, Button } from 'react-bootstrap';
import { FaGraduationCap, FaHome, FaBook, FaSignInAlt } from 'react-icons/fa';
import { motion } from 'framer-motion';
import '../styles/Navbar.css';
const NavigationBar = () => {
  const location = useLocation();

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
              
              <Nav.Link as={Link as any} to="/courses" className="nav-item-custom">
                <FaBook className="me-1 mb-1" /> Courses
              </Nav.Link>

              <div className="vr d-none d-lg-block mx-2 opacity-25"></div>

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
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>
    </motion.div>
  );
};

export default NavigationBar;
