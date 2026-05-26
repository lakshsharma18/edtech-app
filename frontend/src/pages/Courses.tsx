import { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Badge, Spinner, Alert } from 'react-bootstrap';
import { FaBookOpen, FaCreditCard, FaSignInAlt, FaCheckCircle, FaInfoCircle } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import API from '../api/client';

interface Course {
    id: number;
    title: string;
    description: string;
    price: number;
    thumbnail_url: string;
}

const Courses = () => {
    const navigate = useNavigate();
    
    // UI state trackers
    const [courses, setCourses] = useState<Course[]>([]);
    const [enrolledCourseIds, setEnrolledCourseIds] = useState<number[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    
    const isLoggedIn = !!localStorage.getItem('token'); 

    useEffect(() => {
        const loadInitialData = async () => {
            try {
                // 1. Fetch the entire public marketplace catalog list
                const coursesResponse = await API.get<Course[]>('/api/v1/courses');
                setCourses(coursesResponse.data);

                // 2. Fetch active user purchases if authenticated
                if (isLoggedIn) {
                    const enrollmentResponse = await API.get<any>('/api/v1/my-courses');
                    
                    // Normalizes response layout array safely whether it comes raw or inside an object property
                    const rawData = Array.isArray(enrollmentResponse.data) 
                        ? enrollmentResponse.data 
                        : enrollmentResponse.data?.courses || enrollmentResponse.data?.data || [];

                    // Strict number translation prevents matching false-negatives due to data type differences
                    const ids = rawData.map((item: any) => Number(item?.id || item?.course_id || item));
                    setEnrolledCourseIds(ids);
                }
            } catch (err: any) {
                setError('Failed to load courses. Please refresh the page.');
            } finally {
                setLoading(false);
            }
        };
        loadInitialData();
    }, [isLoggedIn]);

    // Initialize Stripe Checkout Workflow Redirect
    const handleStripeCheckout = async (courseId: number) => {
        if (!isLoggedIn) {
            navigate('/login');
            return;
        }

        try {
            localStorage.setItem('last_checkout_course_id', courseId.toString());
            const response = await API.post(`/api/v1/create-checkout-session/${courseId}`);
            
            if (response.data?.url) {
                window.location.href = response.data.url;
            } else {
                setError('Invalid checkout link returned from server.');
            }
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Stripe initialization failed.');
        }
    };

    if (loading) {
        return (
            <div className="d-flex justify-content-center align-items-center vh-100 bg-white">
                <Spinner animation="border" variant="primary" />
            </div>
        );
    }

    return (
        <div className="bg-white min-h-screen py-5">
            <Container>
                
                {/* Section Branding Title Header */}
                <Row className="mb-5 align-items-center">
                    <Col>
                        <Badge bg="primary" className="mb-2 px-3 py-2 rounded-pill">
                            <FaBookOpen className="me-2" /> Direct Access Catalog
                        </Badge>
                        <h1 className="display-5 fw-extrabold text-dark tracking-tight">Explore Courses</h1>
                    </Col>
                </Row>

                {/* Simplified Global Error Alert */}
                {error && (
                    <Alert variant="danger" className="border-0 shadow-sm rounded-4 p-3 mb-4 text-center fw-medium">
                        {error}
                    </Alert>
                )}

                {courses.length === 0 ? (
                    <Alert variant="info" className="text-center rounded-4 py-5">No courses found.</Alert>
                ) : (
                    <Row className="g-4">
                        {courses.map((course) => {
                            // Guarantees clean numeric validation checking
                            const isAlreadyOwned = enrolledCourseIds.includes(Number(course.id));

                            return (
                                <Col xs={12} sm={6} lg={4} key={course.id}>
                                    <Card className="h-100 border-0 shadow-sm rounded-4 overflow-hidden bg-white d-flex flex-column justify-content-between">
                                        
                                        {/* Thumbnail Overlay Media Header with Rupee Symbol */}
                                        <div className="position-relative overflow-hidden bg-light" style={{ height: '200px' }}>
                                            {course.thumbnail_url && (
                                                <img src={course.thumbnail_url} alt={course.title} className="w-100 h-100 object-fit-cover" />
                                            )}
                                            <Badge bg="dark" className="position-absolute bottom-0 end-0 m-3 px-3 py-2 fs-6 fw-bold">
                                                ₹{course.price}
                                            </Badge>
                                        </div>
                                        
                                        {/* Core Text Info Description Block */}
                                        <Card.Body className="p-4">
                                            <Card.Title className="fw-bold">{course.title}</Card.Title>
                                            <Card.Text className="text-muted small">{course.description}</Card.Text>
                                        </Card.Body>
                                        
                                        {/* Smart Conditional Button Logic Footer */}
                                        <Card.Footer className="bg-transparent border-0 px-4 pb-4">
                                            {isAlreadyOwned ? (
                                                /* ✅ CONDITION 1: User IS Enrolled */
                                                /* Hides "Pay to Enroll" completely and ONLY shows the single green button */
                                                <Button 
                                                    variant="success" 
                                                    className="w-100 py-2.5 fw-bold rounded-3 d-flex align-items-center justify-content-center gap-2"
                                                    onClick={() => navigate(`/user/courses/${course.id}`)}
                                                >
                                                    <FaCheckCircle /> Go to Classroom
                                                </Button>
                                            ) : (
                                                /* ❌ CONDITION 2: User NOT Enrolled */
                                                /* Shows "View Details" and "Pay to Enroll" options */
                                                <div className="d-flex flex-column gap-2">
                                                    
                                                    {/* View Details Button - Opens the module preview window */}
                                                    <Button 
                                                        variant="outline-primary" 
                                                        className="w-100 py-2 fw-bold rounded-3 d-flex align-items-center justify-content-center gap-2"
                                                        onClick={() => {
                                                            if (isLoggedIn) {
                                                                navigate(`/user/courses/${course.id}`);
                                                            } else {
                                                                navigate('/login');
                                                            }
                                                        }}
                                                    >
                                                        <FaInfoCircle /> View Details
                                                    </Button>

                                                    {/* Purchase / Login Action Button */}
                                                    <Button 
                                                        onClick={() => handleStripeCheckout(course.id)} 
                                                        variant={isLoggedIn ? "primary" : "outline-secondary"} 
                                                        className="w-100 py-2 fw-bold rounded-3 d-flex align-items-center justify-content-center gap-2"
                                                    >
                                                        {isLoggedIn ? <><FaCreditCard /> Pay to Enroll</> : <><FaSignInAlt /> Login to Enroll</>}
                                                    </Button>
                                                </div>
                                            )}
                                        </Card.Footer>
                                    </Card>
                                </Col>
                            );
                        })}
                    </Row>
                )}
            </Container>
        </div>
    );
};

export default Courses;
