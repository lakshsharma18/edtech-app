import React, { useState } from 'react';
import { Form, Button, Card, InputGroup, Alert, Spinner } from 'react-bootstrap';
import { FaEnvelope, FaLock, FaKey, FaArrowRight, FaExchangeAlt, FaCheckCircle, FaExclamationCircle } from 'react-icons/fa';
import { useNavigate, Link } from 'react-router-dom';
import { getAuthUser } from '../Admin/utils/auth';
import API from '../api/client'; 
import '../styles/Login.css';

const Login = () => {
    const navigate = useNavigate();
    
    // UI Mode Switches
    const [isOtpMode, setIsOtpMode] = useState<boolean>(false);
    const [otpSent, setOtpSent] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [status, setStatus] = useState<{ type: 'success' | 'danger' | null; msg: string }>({ type: null, msg: '' });

    // Input States
    const [email, setEmail] = useState<string>('');
    const [password, setPassword] = useState<string>('');
    const [otp, setOtp] = useState<string>('');

    // Shared Authentication Submission Handler
    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setStatus({ type: null, msg: '' });

        try {
            const endpoint = isOtpMode ? '/api/v1/auth/verify-otp' : '/api/v1/auth/login';
            const payload = isOtpMode ? { email, otp } : { email, password };

            const response = await API.post(endpoint, payload);
            localStorage.setItem('token', response.data.access_token);
            
            const user = getAuthUser();
            const isAdmin = user?.role?.toLowerCase() === 'admin';
            navigate(isAdmin ? '/admin/dashboard' : '/user/dashboard');
        } catch (error: any) {
            setStatus({ 
                type: 'danger', 
                msg: error.response?.data?.detail || "Authentication failed. Please check your credentials." 
            });
        } finally {
            setIsLoading(false);
        }
    };

    // OTP Code Requester
    const requestOtp = async () => {
        if (!email) {
            setStatus({ type: 'danger', msg: "Please enter your email address first." });
            return;
        }
        setIsLoading(true);
        setStatus({ type: null, msg: '' });

        try {
            await API.post('/api/v1/auth/send-otp', { email });
            setOtpSent(true);
            setStatus({ type: 'success', msg: "A security verification OTP was sent to your email." });
        } catch (error: any) {
            setStatus({ 
                type: 'danger', 
                msg: error.response?.data?.detail || "Failed to send OTP verification code." 
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="login-page p-3 d-flex align-items-center justify-content-center min-h-screen bg-light">
            <div className="w-100 d-flex justify-content-center">
                <Card className="bright-glass shadow-lg border-0 rounded-4 w-100" style={{ maxWidth: '420px', backgroundColor: '#ffffff' }}>
                    <Card.Body className="p-4 p-md-5 text-center">
                        
                        <h2 className="fw-extrabold text-dark tracking-tight mb-4">
                            {isOtpMode ? "Welcome Back! 🚀" : "Member Login 🔑"}
                        </h2>

                        {/* Simplified Clean Alert Box */}
                        {status.type && (
                            <Alert variant={status.type} className="d-flex align-items-center gap-2 small text-start border-0 py-2.5 px-3 rounded-3 mb-4">
                                {status.type === 'success' ? <FaCheckCircle className="shrink-0 text-success" /> : <FaExclamationCircle className="shrink-0 text-danger" />}
                                <div className="fw-medium">{status.msg}</div>
                            </Alert>
                        )}

                        <Form onSubmit={handleLogin} autoComplete="off">
                            {/* Always Visible Email Field */}
                            <Form.Group className="mb-3 text-start">
                                <Form.Label className="small fw-bold text-muted text-uppercase tracking-wider">Email Address</Form.Label>
                                <InputGroup className="shadow-sm rounded-3 overflow-hidden">
                                    <InputGroup.Text className="bg-white border-end-0 text-muted"><FaEnvelope size={14} /></InputGroup.Text>
                                    <Form.Control
                                        className="border-start-0 py-2.5 text-sm"
                                        type="email"
                                        placeholder="name@gmail.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        disabled={isLoading || otpSent}
                                        required
                                    />
                                </InputGroup>
                            </Form.Group>

                            {/* Condition 1: Password Mode Active */}
                            {!isOtpMode && (
                                <Form.Group className="mb-4 text-start">
                                    <Form.Label className="small fw-bold text-muted text-uppercase tracking-wider">Password</Form.Label>
                                    <InputGroup className="shadow-sm rounded-3 overflow-hidden">
                                        <InputGroup.Text className="bg-white border-end-0 text-muted"><FaLock size={14} /></InputGroup.Text>
                                        <Form.Control
                                            className="border-start-0 py-2.5 text-sm"
                                            type="password"
                                            placeholder="••••••••"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            disabled={isLoading}
                                            required
                                        />
                                    </InputGroup>
                                </Form.Group>
                            )}

                            {/* Condition 2: OTP Mode Active & Code Sent */}
                            {(isOtpMode && otpSent) && (
                                <Form.Group className="mb-4 text-start">
                                    <Form.Label className="small fw-bold text-muted text-uppercase tracking-wider">Enter OTP</Form.Label>
                                    <InputGroup className="shadow-sm rounded-3 overflow-hidden">
                                        <InputGroup.Text className="bg-white border-end-0 text-muted"><FaKey size={14} /></InputGroup.Text>
                                        <Form.Control
                                            className="border-start-0 py-2.5 text-sm"
                                            type="text"
                                            placeholder="123456"
                                            value={otp}
                                            onChange={(e) => setOtp(e.target.value)}
                                            disabled={isLoading}
                                            required
                                        />
                                    </InputGroup>
                                </Form.Group>
                            )}

                            {/* Condition 3: OTP Mode Active but Code NOT Sent Yet */}
                            {(isOtpMode && !otpSent) && (
                                <Button 
                                    variant="outline-primary" 
                                    className="mb-4 w-100 py-2.5 fw-bold rounded-3 d-flex align-items-center justify-content-center gap-2 border-2" 
                                    onClick={requestOtp}
                                    disabled={isLoading}
                                >
                                    {isLoading ? <Spinner size="sm" animation="border" /> : "Request OTP Verification Token"}
                                </Button>
                            )}

                            {/* Main Sign In/Verify Submission Button */}
                            {(!isOtpMode || otpSent) && (
                                <Button 
                                    type="submit" 
                                    disabled={isLoading}
                                    className="w-100 py-2.5 fw-bold rounded-3 shadow mb-3 border-0 d-flex align-items-center justify-content-center gap-2"
                                    style={{ backgroundColor: '#2563eb' }}
                                >
                                    {isLoading ? (
                                        <Spinner size="sm" animation="border" />
                                    ) : (
                                        <>
                                            {isOtpMode ? "Verify & Log In" : "Secure Log In"} <FaArrowRight size={12} />
                                        </>
                                    )}
                                </Button>
                            )}
                        </Form>

                        {/* View Switcher Controls Footer */}
                        <div className="mt-4 pt-3 border-top small text-muted d-flex align-items-center justify-content-center gap-1">
                            <span>{isOtpMode ? "Remember your credential password?" : "Trouble with passwords?"}</span>{" "}
                            <span 
                                className="text-primary fw-bold text-decoration-none ms-1"
                                style={{ cursor: 'pointer' }}
                                onClick={() => { 
                                    setIsOtpMode(!isOtpMode); 
                                    setOtpSent(false);
                                    setStatus({ type: null, msg: '' });
                                }}
                            >
                                <FaExchangeAlt size={11} /> {isOtpMode ? "Use Password" : "Login with OTP"}
                            </span>
                        </div>

                        {/* Signup Redirection Router Link */}
                        <p className="text-center mt-3 mb-0 small text-muted">
                            New to the platform?{' '}
                            <Link to="/register" className="text-primary fw-bold text-decoration-none">
                                Create Account
                            </Link>
                        </p>

                    </Card.Body>
                </Card>
            </div>
        </div>
    );
};

export default Login;
