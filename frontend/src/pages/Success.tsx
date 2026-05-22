import React, { useEffect, useState, useRef } from 'react';
import { Container, Card, Spinner, Alert, Button } from 'react-bootstrap';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { FaCheckCircle, FaExclamationTriangle, FaArrowRight } from 'react-icons/fa';
import API from '../api/client';

const Success = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    
    const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
    const [errorMsg, setErrorMsg] = useState<string>('');
    const hasRun = useRef(false); // Structural gate: Blocks duplicate rendering requests

    useEffect(() => {
        if (hasRun.current) return;
        hasRun.current = true;

        const verifyPayment = async () => {
            const sessionId = searchParams.get('session_id');
            const courseId = localStorage.getItem('last_checkout_course_id'); 

            if (!sessionId) {
                setStatus('error');
                setErrorMsg('Missing checkout validation parameters.');
                return;
            }

            try {
                await API.post('/api/v1/verify-payment', {
                    session_id: sessionId,
                    course_id: courseId ? parseInt(courseId) : 1 
                });
                setStatus('success');
                localStorage.removeItem('last_checkout_course_id');
            } catch (err: any) {
                setStatus('error');
                setErrorMsg(err.response?.data?.detail || 'Payment verification failed.');
            }
        };

        verifyPayment();
    }, [searchParams]);

    return (
        <div className="d-flex align-items-center justify-content-center min-h-screen bg-light py-5">
            <Container style={{ maxWidth: '500px' }}>
                <Card className="border-0 shadow-lg p-4 text-center rounded-4 bg-white">
                    <Card.Body className="py-4">
                        
                        {status === 'verifying' && (
                            <>
                                <Spinner animation="border" variant="primary" className="mb-3" style={{ width: '3rem', height: '3rem' }} />
                                <h4 className="fw-bold text-dark">Confirming Payment</h4>
                                <p className="text-muted small">Verifying security parameters with Stripe core registries...</p>
                            </>
                        )}

                        {status === 'success' && (
                            <>
                                <FaCheckCircle size={60} className="text-success mb-3" />
                                <h3 className="fw-extrabold text-dark tracking-tight">Enrollment Complete!</h3>
                                <p className="text-muted small px-3">Your secure payment transaction succeeded. Your course is provisioned and ready inside your workspace.</p>
                                <Button onClick={() => navigate('/user/dashboard')} variant="success" className="w-100 py-2.5 mt-3 fw-bold rounded-3 border-0 d-flex align-items-center justify-content-center gap-2">
                                    Go to My Dashboard <FaArrowRight size={12} />
                                </Button>
                            </>
                        )}

                        {status === 'error' && (
                            <>
                                <FaExclamationTriangle size={60} className="text-danger mb-3" />
                                <h4 className="fw-bold text-dark">Verification Failed</h4>
                                <Alert variant="danger" className="border-0 small py-2 rounded-3 mb-4">{errorMsg}</Alert>
                                <Button onClick={() => navigate('/courses')} variant="outline-secondary" className="w-100 py-2.5 fw-bold rounded-3">Return to Courses</Button>
                            </>
                        )}
                        
                    </Card.Body>
                </Card>
            </Container>
        </div>
    );
};

export default Success;
