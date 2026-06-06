import { useState } from 'react';
import { Container, Row, Col, Form, Button, Card, Alert, Spinner } from 'react-bootstrap';
import { FaUserPlus, FaArrowLeft } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import API from '../../api/client';
import '../../styles/Admin.css';

const AdminRegisterInstructor = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ firstName: '', lastName: '', email: '', password: '' });
  const [status, setStatus] = useState<{ type: 'success' | 'danger' | null; msg: string }>({ type: null, msg: '' });
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setStatus({ type: null, msg: '' });

    try {
      const response = await API.post('/api/v1/admin/instructors', {
        ...formData
      });
      setStatus({ type: 'success', msg: response.data.message || 'Instructor added successfully.' });
      setFormData({ firstName: '', lastName: '', email: '', password: '' });
    } catch (error: any) {
      setStatus({ type: 'danger', msg: error.response?.data?.detail || 'Unable to register instructor.' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="admin-page min-vh-100 py-5 bg-light">
      <Container>
        <Row className="align-items-center mb-4">
          <Col md={8}>
            <h1 className="display-6 fw-bold mb-2">Register Instructor</h1>
            <p className="text-muted mb-0">Add new instructors securely. Duplicate entries are banned.</p>
          </Col>
          <Col md={4} className="text-md-end mt-3 mt-md-0">
            <Button variant="outline-primary" onClick={() => navigate('/admin/dashboard')} className="rounded-pill px-4">
              <FaArrowLeft className="me-2" /> Back to Dashboard
            </Button>
          </Col>
        </Row>

        <Row className="justify-content-center">
          <Col lg={6}>
            <Card className="shadow-sm border-0">
              <Card.Body>
                <Form onSubmit={handleSubmit}>
                  <Form.Group className="mb-3" controlId="firstName">
                    <Form.Label className="fw-semibold">First Name</Form.Label>
                    <Form.Control
                      type="text"
                      placeholder="Enter first name"
                      value={formData.firstName}
                      onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                      required
                    />
                  </Form.Group>

                  <Form.Group className="mb-3" controlId="lastName">
                    <Form.Label className="fw-semibold">Last Name</Form.Label>
                    <Form.Control
                      type="text"
                      placeholder="Enter last name"
                      value={formData.lastName}
                      onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                      required
                    />
                  </Form.Group>

                  <Form.Group className="mb-3" controlId="email">
                    <Form.Label className="fw-semibold">Email</Form.Label>
                    <Form.Control
                      type="email"
                      placeholder="instructor@example.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      required
                    />
                  </Form.Group>

                  <Form.Group className="mb-4" controlId="password">
                    <Form.Label className="fw-semibold">Password</Form.Label>
                    <Form.Control
                      type="password"
                      placeholder="Set a secure password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      required
                    />
                  </Form.Group>

                  <Button type="submit" disabled={isLoading} className="w-100 rounded-pill py-2 shadow-sm" style={{ backgroundColor: '#2563eb', border: 'none' }}>
                    {isLoading ? <Spinner size="sm" animation="border" /> : <><FaUserPlus className="me-2" /> Register Instructor</>}
                  </Button>
                </Form>

                {status.type && (
                  <Alert variant={status.type} className="mt-4 mb-0 text-center rounded-3">
                    {status.msg}
                  </Alert>
                )}
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default AdminRegisterInstructor;
