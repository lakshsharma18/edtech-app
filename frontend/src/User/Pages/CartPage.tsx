import { useEffect, useState } from 'react';
import { Container, Row, Col, Card, Button, ListGroup, Spinner, Alert } from 'react-bootstrap';
import { useDispatch, useSelector } from 'react-redux';

// ✅ RECTIFIED DIRECTORY IMPORT TRAVERSAL PATHS (Stepping from User/Pages/ to root src/)
import { fetchCart, removeCourseFromCart } from '../../redux/cartSlice';
import API from '../../api/client';

import { FaTrash, FaCreditCard, FaShoppingBag, FaArrowLeft } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

const CartPage = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch<any>();
  
  const { items, error } = useSelector((state: any) => state.cart);
  const [checkoutLoading, setCheckoutLoading] = useState<boolean>(false);
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    dispatch(fetchCart());
  }, [dispatch]);

  // Dynamically loops through and calculates item costs on screen
  const totalCost = items.reduce((sum: number, item: any) => sum + item.price, 0);

  const handleBulkCheckout = async () => {
    setLocalError(null);
    setCheckoutLoading(true);
    
    try {
      // 📡 Hits your secure bulk unified Stripe session creator endpoint
      const response = await API.post('/api/v1/create-cart-checkout-session');
      
      // ✅ SUCCESS TRACK: Redirect directly out to Stripe payment portal layout frame
      if (response.data?.url) {
        window.location.href = response.data.url;
      } else {
        setLocalError('Invalid response payload encountered from payment server.');
      }
    } catch (err: any) {
      // 🔒 SAFETY INTERCEPTOR: If execution fails or chokes, the code skips the clear dispatch loop!
      // This completely guarantees your items remain saved inside both Redux and DB tables.
      setLocalError(err.response?.data?.detail || "Checkout session failed to initialize. Your cart items are preserved safely.");
    } finally {
      setCheckoutLoading(false);
    }
  };

  return (
    <div className="bg-light min-vh-100 py-5">
      <Container style={{ maxWidth: '960px' }}>
        <Button variant="link" className="text-dark p-0 mb-4 fw-semibold text-decoration-none d-flex align-items-center gap-2 small" onClick={() => navigate('/courses')}>
          <FaArrowLeft size={12} /> Back to Catalog
        </Button>

        <h2 className="fw-black text-dark mb-4 tracking-tight">Shopping Cart</h2>
        
        {/* Dynamic State Alert Handlers */}
        {error && <Alert variant="danger" className="border-0 shadow-sm rounded-3 mb-4">{error}</Alert>}
        {localError && <Alert variant="danger" className="border-0 shadow-sm rounded-3 mb-4 fw-medium">{localError}</Alert>}

        {items.length === 0 ? (
          <Card className="text-center p-5 border-0 shadow-sm rounded-4 bg-white">
            <Card.Body>
              <FaShoppingBag size={48} className="text-muted mb-3" />
              <h4 className="fw-bold">Your cart is empty</h4>
              <p className="text-muted small mb-4">Explore our curriculum catalog and pick your next learning cohort track.</p>
              <Button variant="primary" onClick={() => navigate('/courses')} className="rounded-pill px-4 fw-bold">Explore Courses</Button>
            </Card.Body>
          </Card>
        ) : (
          <Row className="g-4">
            {/* Left Box Panel Module List Grid */}
            <Col md={7}>
              <Card className="border-0 shadow-sm rounded-4 overflow-hidden bg-white">
                <ListGroup variant="flush">
                  {items.map((item: any) => (
                    <ListGroup.Item key={item.course_id} className="p-4 d-flex align-items-center justify-content-between border-light">
                      <div className="text-truncate me-3">
                        <h6 className="fw-bold text-dark mb-1 text-truncate">{item.title}</h6>
                        <span className="text-muted small">₹{item.price.toLocaleString('en-IN')}</span>
                      </div>
                      <Button variant="outline-danger" size="sm" className="border-0 rounded-circle p-2" onClick={() => dispatch(removeCourseFromCart(item.course_id))}>
                        <FaTrash size={13} />
                      </Button>
                    </ListGroup.Item>
                  ))}
                </ListGroup>
              </Card>
            </Col>

            {/* Right Side Billing Statement Panel Box */}
            <Col md={5}>
              <Card className="border-0 shadow-sm rounded-4 p-4 bg-white text-dark">
                <h5 className="fw-bold mb-3">Order Summary</h5>
                <div className="d-flex justify-content-between align-items-center mb-2 small text-secondary">
                  <span>Selected Tracks</span>
                  <span>{items.length} module{items.length === 1 ? '' : 's'}</span>
                </div>
                <hr className="opacity-25" />
                <div className="d-flex justify-content-between align-items-center mb-4">
                  <span className="fw-bold">Total Cost:</span>
                  <span className="h4 fw-black m-0 text-primary">₹{totalCost.toLocaleString('en-IN')}</span>
                </div>
                <Button variant="primary" className="w-100 py-2.5 rounded-3 fw-bold d-flex align-items-center justify-content-center gap-2" onClick={handleBulkCheckout} disabled={checkoutLoading}>
                  {checkoutLoading ? <Spinner size="sm" animation="border" /> : <><FaCreditCard /> Proceed to Pay & Enroll</>}
                </Button>
              </Card>
            </Col>
          </Row>
        )}
      </Container>
    </div>
  );
};

export default CartPage;
