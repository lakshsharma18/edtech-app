import { Link } from 'react-router-dom';
import { Navbar, Container, Nav, Button } from 'react-bootstrap';
import { FaGraduationCap } from 'react-icons/fa';

const NavigationBar = () => {
  return (
    <Navbar bg="white" expand="lg" className="shadow-sm sticky-top">
      <Container>
        <Navbar.Brand as={Link} to="/" className="fw-bold text-primary d-flex align-items-center">
          <FaGraduationCap className="me-2" size={30} />
          ED-TECH
        </Navbar.Brand>
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="ms-auto align-items-center">
            <Nav.Link as={Link} to="/" className="px-3">Home</Nav.Link>
            <Button 
              as={Link as any} 
              to="/register" 
              variant="primary" 
              className="ms-lg-3 rounded-pill px-4 shadow-sm"
            >
              Join for Free
            </Button>
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};

export default NavigationBar;
