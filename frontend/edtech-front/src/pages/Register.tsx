import React, { useState } from 'react';
import { Container, Row, Col, Form, Button, Card } from 'react-bootstrap';
import { motion } from 'framer-motion';
import { FaUser, FaEnvelope, FaLock, FaGraduationCap } from 'react-icons/fa';
import axios from 'axios';

const Register = () => {
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        password: ''
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const response = await axios.post('http://localhost:8000/api/v1/auth/register', formData);
            alert(response.data.message);
        } catch (error: any) {
            alert(error.response?.data?.detail || "Registration failed");
        }
    };

    return (
        <Container className="d-flex align-items-center justify-content-center" style={{ minHeight: '100vh' }}>
            <motion.div 
                initial={{ opacity: 0, y: 20 }} 
                animate={{ opacity: 1, y: 0 }} 
                transition={{ duration: 0.6 }}
                style={{ width: '100%', maxWidth: '500px' }}
            >
                <Card className="shadow-lg border-0 rounded-4">
                    <Card.Body className="p-5">
                        <div className="text-center mb-4">
                            <div className="bg-primary text-white rounded-circle d-inline-block p-3 mb-2">
                                <FaGraduationCap size={40} />
                            </div>
                            <h2 className="fw-bold">Create Account</h2>
                            <p className="text-muted">Start your learning journey today</p>
                        </div>

                        <Form onSubmit={handleSubmit}>
                            <Row>
                                <Col md={6}>
                                    <Form.Group className="mb-3">
                                        <Form.Label><FaUser className="me-2"/>First Name</Form.Label>
                                        <Form.Control 
                                            type="text" 
                                            placeholder="John" 
                                            onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                                            required 
                                        />
                                    </Form.Group>
                                </Col>
                                <Col md={6}>
                                    <Form.Group className="mb-3">
                                        <Form.Label>Last Name</Form.Label>
                                        <Form.Control 
                                            type="text" 
                                            placeholder="Doe" 
                                            onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                                            required 
                                        />
                                    </Form.Group>
                                </Col>
                            </Row>

                            <Form.Group className="mb-3">
                                <Form.Label><FaEnvelope className="me-2"/>Email Address</Form.Label>
                                <Form.Control 
                                    type="email" 
                                    placeholder="name@example.com" 
                                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                                    required 
                                />
                            </Form.Group>

                            <Form.Group className="mb-4">
                                <Form.Label><FaLock className="me-2"/>Password</Form.Label>
                                <Form.Control 
                                    type="password" 
                                    placeholder="••••••••" 
                                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                                    required 
                                />
                            </Form.Group>

                            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                                <Button variant="primary" type="submit" className="w-100 py-2 fw-bold rounded-3">
                                    Sign Up
                                </Button>
                            </motion.div>
                        </Form>

                        <div className="text-center mt-4">
                            <span className="text-muted small">Already have an account? <a href="/login" className="text-decoration-none">Login</a></span>
                        </div>
                    </Card.Body>
                </Card>
            </motion.div>
        </Container>
    );
};

export default Register;
