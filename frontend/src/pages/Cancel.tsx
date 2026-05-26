import { Container, Card, Alert, Button } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { FaExclamationTriangle, FaShoppingBag, FaArrowLeft } from 'react-icons/fa';

const Cancel = () => {
    const navigate = useNavigate();

    return (
        <div className="d-flex align-items-center justify-content-center min-h-screen bg-light py-5">
            <Container style={{ maxWidth: '500px' }}>
                <Card className="border-0 shadow-lg p-4 text-center rounded-4 bg-white">
                    <Card.Body className="py-4">
                        
                        {/* Warning Graphic Icon */}
                        <FaExclamationTriangle size={60} className="text-warning mb-3" />
                        
                        <h3 className="fw-extrabold text-dark tracking-tight mb-2">Checkout Cancelled</h3>
                        
                        <p className="text-muted small px-3 mb-4">
                            Your payment transaction was aborted. No money has been deducted from your account.
                        </p>

                        <Alert variant="warning" className="border-0 small py-2 rounded-3 mb-4 fw-medium text-start">
                            Need help? If this was an accident, you can retry your payment inside the catalog store anytime.
                        </Alert>

                        {/* Interactive Navigation Control Grid */}
                        <div className="d-flex flex-column gap-2">
                            <Button 
                                onClick={() => navigate('/courses')} 
                                variant="primary" 
                                className="w-100 py-2.5 fw-bold rounded-3 border-0 d-flex align-items-center justify-content-center gap-2"
                                style={{ backgroundColor: '#2563eb' }}
                            >
                                <FaShoppingBag size={12} /> Browse Catalog Courses
                            </Button>
                            
                            <Button 
                                onClick={() => navigate('/user/dashboard')} 
                                variant="outline-secondary" 
                                className="w-100 py-2.5 fw-bold rounded-3 d-flex align-items-center justify-content-center gap-2"
                            >
                                <FaArrowLeft size={12} /> Return to Dashboard
                            </Button>
                        </div>
                        
                    </Card.Body>
                </Card>
            </Container>
        </div>
    );
};

export default Cancel;
