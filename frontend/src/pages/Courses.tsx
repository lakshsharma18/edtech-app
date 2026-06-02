
import { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Badge, Spinner, Alert, Form, InputGroup } from 'react-bootstrap';
import { FaBookOpen, FaInfoCircle, FaSearch, FaTimes, FaCheckCircle } from 'react-icons/fa';
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

    const [courses, setCourses] = useState<Course[]>([]);
    const [enrolledCourseIds, setEnrolledCourseIds] = useState<number[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');

    const isLoggedIn = !!localStorage.getItem('token');

    useEffect(() => {
        const loadInitialData = async () => {
            try {
                const coursesResponse = await API.get<Course[]>('/api/v1/courses');
                setCourses(coursesResponse.data);

                if (isLoggedIn) {
                    const enrollmentResponse = await API.get<any>('/api/v1/my-courses');

                    const rawData = Array.isArray(enrollmentResponse.data)
                        ? enrollmentResponse.data
                        : enrollmentResponse.data?.courses || enrollmentResponse.data?.data || [];

                    const ids = rawData.map((item: any) =>
                        Number(item?.id || item?.course_id || item)
                    );

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

    const handleStripeCheckout = async (courseId: number) => {
        if (!isLoggedIn) {
            navigate('/login');
            return;
        }

        try {
            localStorage.setItem('last_checkout_course_id', courseId.toString());

            const response = await API.post(
                `/api/v1/create-checkout-session/${courseId}`
            );

            if (response.data?.url) {
                window.location.href = response.data.url;
            } else {
                setError('Invalid checkout link returned from server.');
            }
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Stripe initialization failed.');
        }
    };

    const filteredCourses = courses.filter((course) =>
        course.title.toLowerCase().includes(searchQuery.toLowerCase())
    );

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

                {/* HEADER + SEARCH */}
                <Row className="mb-5 align-items-center g-4">
                    <Col md={6}>
                        <Badge bg="primary" className="mb-2 px-3 py-2 rounded-pill">
                            <FaBookOpen className="me-2" />
                            Direct Access Catalog
                        </Badge>
                        <h1 className="display-5 fw-bold text-dark m-0">
                            Explore Courses
                        </h1>
                    </Col>

                    <Col md={6} className="d-flex justify-content-md-end">
                        <InputGroup style={{ maxWidth: '400px' }}>
                            <InputGroup.Text className="bg-white border-0">
                                <FaSearch />
                            </InputGroup.Text>

                            <Form.Control
                                placeholder="Search courses..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />

                            {searchQuery && (
                                <Button variant="outline-secondary" onClick={() => setSearchQuery('')}>
                                    <FaTimes />
                                </Button>
                            )}
                        </InputGroup>
                    </Col>
                </Row>

                {/* ERROR */}
                {error && (
                    <Alert variant="danger" className="text-center">
                        {error}
                    </Alert>
                )}

                {/* COURSES */}
                {filteredCourses.length === 0 ? (
                    <Alert variant="info" className="text-center">
                        {courses.length === 0
                            ? 'No courses available.'
                            : 'No courses match your search.'}
                    </Alert>
                ) : (
                    <Row className="g-4">
                        {filteredCourses.map((course) => {
                            const isOwned = enrolledCourseIds.includes(course.id);

                            return (
                                <Col md={4} key={course.id}>
                                    <Card className="h-100 shadow-sm">

                                        {/* IMAGE */}
                                        <div style={{ height: '200px', overflow: 'hidden' }}>
                                            {course.thumbnail_url && (
                                                <img
                                                    src={course.thumbnail_url}
                                                    alt={course.title}
                                                    className="w-100 h-100 object-fit-cover"
                                                />
                                            )}
                                        </div>

                                        {/* CONTENT */}
                                        <Card.Body>
                                            <Card.Title>{course.title}</Card.Title>
                                            <Card.Text>{course.description}</Card.Text>
                                            <Badge bg="dark">₹{course.price}</Badge>
                                        </Card.Body>

                                        {/* FOOTER */}
                                        <Card.Footer className="bg-white border-0">

                                            {isOwned ? (
                                                <Button
                                                    variant="success"
                                                    className="w-100"
                                                    onClick={() =>
                                                        navigate(`/user/courses/${course.id}`)
                                                    }
                                                >
                                                    <FaCheckCircle /> Go to Classroom
                                                </Button>
                                            ) : (
                                                <div className="d-flex flex-column gap-2">
                                                    <Button
                                                        variant="outline-primary"
                                                        onClick={() =>
                                                            isLoggedIn
                                                                ? navigate(`/user/courses/${course.id}`)
                                                                : navigate('/login')
                                                        }
                                                    >
                                                        <FaInfoCircle /> View Details
                                                    </Button>

                                                    <Button
                                                        variant={isLoggedIn ? 'primary' : 'outline-secondary'}
                                                        onClick={() =>
                                                            handleStripeCheckout(course.id)
                                                        }
                                                    >
                                                        {isLoggedIn
                                                            ? 'Pay to Enroll'
                                                            : 'Login to Enroll'}
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