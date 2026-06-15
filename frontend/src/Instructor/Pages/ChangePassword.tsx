import React, { useState } from 'react';
import { Container, Card, Form, Button, Alert, Spinner } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { FaLock, FaCheckCircle } from 'react-icons/fa';
import API from '../../api/client';

const ChangePassword = () => {
  const navigate = useNavigate();
  const [resetPassword, setResetPassword] = useState<string>('');
  const [reEnterPassword, setReEnterPassword] = useState<string>('');
  
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (resetPassword.length < 6) {
      setError("Your password must be at least 6 characters long.");
      return;
    }

    // 🔒 Strict Form Matching Validation
    if (resetPassword !== reEnterPassword) {
      setError("The passwords do not match. Please re-enter carefully.");
      return;
    }

    setLoading(true);
    try {
      // Hits your updated backend schemas PUT endpoint
      await API.put('/api/v1/auth/reset-first-password', { password: resetPassword });
      setSuccess(true);
      setTimeout(() => {
        navigate('/instructor/dashboard');
      }, 2000);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to update your password profile.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ background: '#f1f5f9', minHeight: '100vh' }} className="d-flex align-items-center py-5">
      <Container style={{ maxWidth: '440px' }}>
        <Card className="border-0 shadow-lg p-4 p-md-5 rounded-4 bg-white">
          <div className="text-center mb-4">
            <div className="bg-primary bg-opacity-10 text-primary rounded-circle d-inline-flex p-3 mb-3">
              <FaLock size={22} />
            </div>
            <h4 className="fw-bold text-dark mb-1">Instructor - Password Reset</h4>
            <p className="text-muted small">Welcome! This is your initial platform entry. Please update your temporary password to secure your dashboard workspace.</p>
          </div>

          {error && <Alert variant="danger" className="border-0 small rounded-3 mb-3">{error}</Alert>}
          
          {success ? (
            <Alert variant="success" className="border-0 shadow-sm rounded-3 py-4 text-center">
              <FaCheckCircle className="text-success mb-2" size={32} />
              <h6 className="fw-bold m-0 text-success">Password Activated!</h6>
              <small className="text-muted d-block mt-1">Opening your dashboard...</small>
            </Alert>
          ) : (
            <Form onSubmit={handleSubmit}>
              <Form.Group className="mb-3">
                <Form.Label className="small fw-semibold text-secondary">Reset Password</Form.Label>
                <Form.Control 
                  type="password" 
                  placeholder="Minimum 6 characters" 
                  value={resetPassword}
                  onChange={(e) => setResetPassword(e.target.value)}
                  className="py-2.5 rounded-3 border-light-subtle"
                  required
                  disabled={loading}
                />
              </Form.Group>

              <Form.Group className="mb-4">
                <Form.Label className="small fw-semibold text-secondary">Re-enter Password</Form.Label>
                <Form.Control 
                  type="password" 
                  placeholder="Confirm reset password" 
                  value={reEnterPassword}
                  onChange={(e) => setReEnterPassword(e.target.value)}
                  className="py-2.5 rounded-3 border-light-subtle"
                  required
                  disabled={loading}
                />
              </Form.Group>

              <Button type="submit" variant="primary" className="w-100 py-2.5 rounded-3 fw-bold shadow-sm text-uppercase small tracking-wider" disabled={loading}>
                {loading ? <Spinner animation="border" size="sm" /> : "RESET PASSWORD"}
              </Button>
            </Form>
          )}
        </Card>
      </Container>
    </div>
  );
};

export default ChangePassword;
