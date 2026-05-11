import React, { useState } from 'react';
import { Form, Button, Card, InputGroup } from 'react-bootstrap';
import { motion, AnimatePresence } from 'framer-motion';
import { FaEnvelope, FaLock, FaKey, FaArrowRight } from 'react-icons/fa';
import axios from 'axios';
import '../styles/Login.css';

const Login = () => {
    const [isOtpMode, setIsOtpMode] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [otp, setOtp] = useState('');
    const [otpSent, setOtpSent] = useState(false);

    // ✅ FIXED: Corrected the base URL and added the port
    const API_BASE = "http://127.0.0.1:8000/api/v1/auth";

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            // ✅ FIXED: Corrected endpoint logic
            const endpoint = isOtpMode ? '/verify-otp' : '/login';
            const payload = isOtpMode ? { email, otp } : { email, password };
            
            const response = await axios.post(`${API_BASE}${endpoint}`, payload);
            
            localStorage.setItem('token', response.data.access_token);
            alert("Login Successful!");
        } catch (error: any) {
            console.error(error);
            alert(error.response?.data?.detail || "Login failed. Check your credentials.");
        }
    };

    const requestOtp = async () => {
        if (!email) return alert("Please enter your email first");
        try {
            // ✅ FIXED: Added the full correct path for sending OTP
            await axios.post(`${API_BASE}/send-otp`, { email });
            setOtpSent(true);
            alert("OTP sent to your email!");
        } catch (error: any) {
            console.error(error);
            alert(error.response?.data?.detail || "Failed to send OTP. Is the user registered?");
        }
    };

    return (
        <div className="login-page p-3">
            <motion.div 
                initial={{ scale: 0.8, opacity: 0 }} 
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 100 }}
            >
                <Card className="bright-glass shadow-lg" style={{ width: '100%', maxWidth: '400px' }}>
                    <Card.Body className="p-5 text-center">
                        <motion.h2 className="fw-bold mb-4" layout>
                            {isOtpMode ? "Welcome Back! 🚀" : "Member Login 🔑"}
                        </motion.h2>

                        <Form onSubmit={handleLogin} autoComplete='off'>
                            <Form.Group className="mb-3 text-start">
                                <Form.Label className="small fw-bold">EMAIL ADDRESS</Form.Label>
                                <InputGroup>
                                    <InputGroup.Text className="bg-white border-end-0"><FaEnvelope /></InputGroup.Text>
                                    <Form.Control 
                                        className="border-start-0"
                                        type="email" 
                                        placeholder="name@example.com" 
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required 
                                    />
                                </InputGroup>
                            </Form.Group>

                            <AnimatePresence mode='wait'>
                                {!isOtpMode ? (
                                    <motion.div 
                                        key="pass"
                                        initial={{ x: -20, opacity: 0 }} 
                                        animate={{ x: 0, opacity: 1 }} 
                                        exit={{ x: 20, opacity: 0 }}
                                    >
                                        <Form.Group className="mb-4 text-start">
                                            <Form.Label className="small fw-bold">PASSWORD</Form.Label>
                                            <InputGroup>
                                                <InputGroup.Text className="bg-white border-end-0"><FaLock /></InputGroup.Text>
                                                <Form.Control 
                                                    className="border-start-0"
                                                    type="password" 
                                                    placeholder="••••••••" 
                                                    value={password}
                                                    onChange={(e) => setPassword(e.target.value)}
                                                    required 
                                                />
                                            </InputGroup>
                                        </Form.Group>
                                    </motion.div>
                                ) : (
                                    <motion.div 
                                        key="otp"
                                        initial={{ x: -20, opacity: 0 }} 
                                        animate={{ x: 0, opacity: 1 }} 
                                        exit={{ x: 20, opacity: 0 }}
                                    >
                                        {otpSent ? (
                                            <Form.Group className="mb-4 text-start">
                                                <Form.Label className="small fw-bold">ENTER OTP</Form.Label>
                                                <InputGroup>
                                                    <InputGroup.Text className="bg-white border-end-0"><FaKey /></InputGroup.Text>
                                                    <Form.Control 
                                                        className="border-start-0"
                                                        type="text" 
                                                        placeholder="1234" 
                                                        value={otp}
                                                        onChange={(e) => setOtp(e.target.value)}
                                                        required 
                                                    />
                                                </InputGroup>
                                            </Form.Group>
                                        ) : (
                                            <Button variant="outline-primary" className="mb-4 w-100" onClick={requestOtp}>
                                                Send OTP to Email
                                            </Button>
                                        )}
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {/* Only show Login button if in password mode OR if OTP has been sent */}
                            {(!isOtpMode || otpSent) && (
                                <Button variant="teal" type="submit" className="w-100 py-3 fw-bold rounded-pill shadow mb-3">
                                    {isOtpMode ? "Verify & Login" : "Login Now"} <FaArrowRight className="ms-2" />
                                </Button>
                            )}
                        </Form>

                        <div className="mt-3 small text-muted">
                            {isOtpMode ? "Prefer passwords?" : "Forgot password?"}{" "}
                            <span className="toggle-link" onClick={() => {setIsOtpMode(!isOtpMode); setOtpSent(false);}}>
                                {isOtpMode ? "Login with Password" : "Login with OTP"}
                            </span>
                        </div>
                    </Card.Body>
                </Card>
            </motion.div>
        </div>
    );
};

export default Login;
