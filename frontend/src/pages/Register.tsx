
import React, { useState } from 'react';
import { Container, Row, Col, Form, Button, Card } from 'react-bootstrap';
import { motion } from 'framer-motion';
import { FaEnvelope, FaLock, FaGraduationCap, FaRocket } from 'react-icons/fa';
import axios from 'axios';
import '../styles/Register.css'; // Import the CSS we made above

const Register = () => {
    const [formData, setFormData] = useState({ firstName: '', lastName: '', email: '', password: '' });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const response = await axios.post('http://127.0.0.1:8000/api/v1/auth/register', formData);
            alert(response.data.message);
            
            setFormData({
                firstName: '',
                lastName: '',
                email: '',
                password: ''
            });
             (e.target as HTMLFormElement).reset();
        } catch (error: any) {
            alert(error.response?.data?.detail || "Registration failed");
        }
    };

    // Animation Variants
    const containerVariants = {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
    };

    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: { y: 0, opacity: 1 }
    };

    return (
        <div className="register-page d-flex align-items-center justify-content-center">
            {/* Animated Background Shapes */}
            <motion.div
                animate={{ x: [0, 100, 0], y: [0, 50, 0] }}
                transition={{ duration: 10, repeat: Infinity }}
                className="floating-shape bg-primary"
                style={{ width: '300px', height: '300px', top: '10%', left: '5%' }}
            />
            <motion.div
                animate={{ x: [0, -80, 0], y: [0, 100, 0] }}
                transition={{ duration: 15, repeat: Infinity }}
                className="floating-shape bg-info"
                style={{ width: '400px', height: '400px', bottom: '10%', right: '5%' }}
            />

            <Container className="position-relative" style={{ zIndex: 1 }}>
                <Row className="justify-content-center">
                    <Col md={10} lg={8} className="d-flex align-items-center">
                        {/* Left Side Info - Hidden on small screens */}
                        <Col md={5} className="d-none d-md-block text-white pe-5">
                            <motion.div initial={{ x: -50, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.3 }}>
                                <h1 className="display-4 fw-bold mb-4">Level up your <span className="text-primary">Skills.</span></h1>
                                <p className="lead opacity-75">Join thousands of students and start your journey with expert-led courses.</p>
                                <div className="d-flex align-items-center mt-4 text-primary">
                                    <FaRocket className="me-3" size={24} />
                                    <span className="fw-bold">Early access to New Labs</span>
                                </div>
                            </motion.div>
                        </Col>

                        {/* Register Form Card */}
                        <Col md={7} xs={12}>
                            <motion.div variants={containerVariants} initial="hidden" animate="visible">
                                <Card className="glass-card shadow-lg border-0 rounded-4">
                                    <Card.Body className="p-4 p-md-5">
                                        <motion.div variants={itemVariants} className="text-center mb-4">
                                            <div className="bg-primary text-white rounded-circle d-inline-block p-3 mb-3 shadow">
                                                <FaGraduationCap size={30} />
                                            </div>
                                            <h2 className="fw-bold">Create Account</h2>
                                        </motion.div>

                                        <Form onSubmit={handleSubmit}>
                                            <Row>
                                                <Col md={6}>
                                                    <motion.div variants={itemVariants}>
                                                        <Form.Group className="mb-3">
                                                            <Form.Label className="small text-uppercase opacity-75">First Name</Form.Label>
                                                            <Form.Control type="text" placeholder="John" onChange={(e) => setFormData({ ...formData, firstName: e.target.value })} required />
                                                        </Form.Group>
                                                    </motion.div>
                                                </Col>
                                                <Col md={6}>
                                                    <motion.div variants={itemVariants}>
                                                        <Form.Group className="mb-3">
                                                            <Form.Label className="small text-uppercase opacity-75">Last Name</Form.Label>
                                                            <Form.Control type="text" placeholder="Doe" onChange={(e) => setFormData({ ...formData, lastName: e.target.value })} required />
                                                        </Form.Group>
                                                    </motion.div>
                                                </Col>
                                            </Row>

                                            <motion.div variants={itemVariants}>
                                                <Form.Group className="mb-3">
                                                    <Form.Label className="small text-uppercase opacity-75"><FaEnvelope className="me-2" />Email</Form.Label>
                                                    <Form.Control type="email" placeholder="john@example.com" onChange={(e) => setFormData({ ...formData, email: e.target.value })} required />
                                                </Form.Group>
                                            </motion.div>

                                            <motion.div variants={itemVariants}>
                                                <Form.Group className="mb-4">
                                                    <Form.Label className="small text-uppercase opacity-75"><FaLock className="me-2" />Password</Form.Label>
                                                    <Form.Control type="password" placeholder="••••••••" onChange={(e) => setFormData({ ...formData, password: e.target.value })} required />
                                                </Form.Group>
                                            </motion.div>

                                            <motion.div variants={itemVariants} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                                                <Button variant="primary" type="submit" className="w-100 py-3 fw-bold rounded-3 shadow border-0">
                                                    Get Started
                                                </Button>
                                            </motion.div>
                                        </Form>
                                        <motion.p variants={itemVariants} className="text-center mt-4 small opacity-75">
                                            Already a member? <a href="/login" className="text-primary text-decoration-none fw-bold">Login</a>
                                        </motion.p>
                                    </Card.Body>
                                </Card>
                            </motion.div>
                        </Col>
                    </Col>
                </Row>
            </Container>
        </div>
    );
};

export default Register;
