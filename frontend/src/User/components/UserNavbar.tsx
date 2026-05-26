import { Navbar, Container, Nav, Button } from 'react-bootstrap';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { FaGraduationCap, FaSignOutAlt, FaBook, FaThLarge } from 'react-icons/fa';
import { getAuthUser } from '../../Admin/utils/auth';

const UserNavbar = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const user = getAuthUser();

    const handleLogout = () => {
        localStorage.removeItem('token');
        navigate('/login', { replace: true });
    };

    return (
        <Navbar expand="lg" className="bg-white border-bottom shadow-sm py-2.5 sticky-top">
            <Container>
                {/* Brand Logo */}
                <Navbar.Brand as={Link} to="/user/dashboard" className="fw-extrabold text-primary d-flex align-items-center gap-2" style={{ letterSpacing: '0.5px' }}>
                    <FaGraduationCap size={28} className="text-primary" />
                    <span className="fs-5 text-dark">EDTECH</span>
                </Navbar.Brand>
                
                {/* Mobile Menu Toggle Button */}
                <Navbar.Toggle aria-controls="user-navbar-nav" className="border-0 shadow-none px-0" />
                
                <Navbar.Collapse id="user-navbar-nav">
                    {/* Navigation Links */}
                    <Nav className="me-auto ms-lg-4 gap-1">
                        <Nav.Link 
                            as={Link} 
                            to="/user/dashboard" 
                            className={`fw-semibold px-3 py-2 rounded-2 d-flex align-items-center gap-2 transition-all ${
                                location.pathname === '/user/dashboard' ? 'bg-light text-primary' : 'text-secondary'
                            }`}
                        >
                            <FaThLarge size={14} /> My Workspace
                        </Nav.Link>
                        
                        <Nav.Link 
                            as={Link} 
                            to="/courses" 
                            className={`fw-semibold px-3 py-2 rounded-2 d-flex align-items-center gap-2 transition-all ${
                                location.pathname === '/courses' ? 'bg-light text-primary' : 'text-secondary'
                            }`}
                        >
                            <FaBook size={14} /> Catalog Store
                        </Nav.Link>
                    </Nav>
                    
                    {/* User Profile Info & Logout */}
                    <Nav className="align-items-lg-center gap-3 mt-3 mt-lg-0 pt-3 pt-lg-0 border-top border-lg-0">
                        {user && (
                            <div className="d-flex align-items-center gap-2 bg-light border px-3 py-1.5 rounded-pill shadow-sm">
                                <div className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center fw-bold" style={{ width: '24px', height: '24px', fontSize: '11px' }}>
                                    {user.first_name?.[0]?.toUpperCase() || 'U'}
                                </div>
                                <span className="text-dark small fw-bold">
                                    {user.first_name}
                                </span>
                            </div>
                        )}
                        
                        <Button 
                            onClick={handleLogout} 
                            variant="outline-danger" 
                            className="d-flex align-items-center justify-content-center gap-2 fw-bold px-3.5 py-2 rounded-3 btn-sm shadow-sm transition-all w-100 w-lg-auto"
                        >
                            <FaSignOutAlt size={14} /> Logout
                        </Button>
                    </Nav>
                </Navbar.Collapse>
            </Container>
        </Navbar>
    );
};

export default UserNavbar;
