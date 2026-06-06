import { useState, useEffect, useRef } from 'react';
import { Container, Row, Col, Card, Button, Badge, Spinner, Alert, Form } from 'react-bootstrap';
import { FaCreditCard, FaSignInAlt, FaCheckCircle, FaInfoCircle, FaSearch } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import API from '../api/client';

interface Course {
    id: number;
    title: string;
    description: string;
    price: number;
    thumbnail_url: string;
    instructor_name?: string;
}

const Courses = () => {
    const navigate = useNavigate();
    
    const [courses, setCourses] = useState<Course[]>([]);
    const [filteredCourses, setFilteredCourses] = useState<Course[]>([]);
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const [query, setQuery] = useState<string>('');
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
                setFilteredCourses(coursesResponse.data);

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

    const normalizeQuery = (value: string) => value.toLowerCase().trim();

    const searchCourses = (value: string) => {
        if (!value) return courses;

        return courses.filter((course) => {
            const searchableText = `${course.title} ${course.description} ${course.instructor_name || ''}`.toLowerCase();
            return searchableText.includes(value);
        });
    };

    const buildSuggestions = (value: string) => {
        const search = normalizeQuery(value);
        if (!search) {
            setSuggestions([]);
            return;
        }

        const titleMatches = courses
            .filter((course) => {
                const searchableText = `${course.title} ${course.description} ${course.instructor_name || ''}`.toLowerCase();
                return searchableText.includes(search);
            })
            .slice(0, 6)
            .map((course) => course.title);

        setSuggestions(Array.from(new Set(titleMatches)));
    };

    const updateSearch = (value: string) => {
        const search = normalizeQuery(value);
        setQuery(value);
        setFilteredCourses(searchCourses(search));
        buildSuggestions(value);
    };

    const handleSuggestionClick = (suggestion: string) => {
        updateSearch(suggestion);
        setSuggestions([]);
    };

    const searchInputRef = useRef<HTMLInputElement | null>(null);

    const clearSearch = () => {
        setQuery('');
        setSuggestions([]);
        setFilteredCourses(courses);
        searchInputRef.current?.focus();
    };

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
                        <h1 className="display-5 fw-extrabold text-dark tracking-tight">Explore Courses</h1>
                    </Col>
                </Row>

                {/* Search section */}
                <Row className="mb-4">
                    <Col md={8} lg={7}>
                        <div className="p-4 rounded-4 shadow-sm bg-white border">
                            <h2 className="mb-2 fw-bold">Find your next course</h2>
                            <p className="text-muted mb-3">Search by course title, instructor name, or topic. Tap a suggestion to load matching results instantly.</p>

                            <Form.Group className="position-relative">
                                <Form.Control
                                    ref={searchInputRef}
                                    type="search"
                                    placeholder="Search courses, instructor, or topics..."
                                    value={query}
                                    onChange={(e) => updateSearch(e.target.value)}
                                    className="border rounded-3 shadow-sm"
                                />
                                <span className="position-absolute top-50 end-0 translate-middle-y pe-3 text-muted">
                                    <FaSearch />
                                </span>
                                {suggestions.length > 0 && (
                                    <div className="position-absolute bg-white border rounded-3 shadow-sm w-100 mt-1 zindex-tooltip" style={{ maxHeight: 220, overflowY: 'auto' }}>
                                        {suggestions.map((suggestion) => (
                                                <div
                                                    key={suggestion}
                                                    role="button"
                                                    tabIndex={0}
                                                    onClick={() => handleSuggestionClick(suggestion)}
                                                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { handleSuggestionClick(suggestion); } }}
                                                    className="px-3 py-2 text-dark hover-bg-light"
                                                    style={{ cursor: 'pointer' }}
                                                >
                                                    {suggestion}
                                                </div>
                                            ))}
                                    </div>
                                )}
                            </Form.Group>
                        </div>
                    </Col>

                    <Col md={4} lg={5} className="text-md-end text-start mt-3 mt-md-0">
                        <Button variant="outline-secondary" onClick={clearSearch} disabled={!query && suggestions.length === 0}>
                            Clear search
                        </Button>
                    </Col>
                </Row>

                <Row className="mb-4">
                    <Col>
                        <div className="d-flex flex-wrap align-items-center gap-2">
                            <Badge bg="secondary" className="rounded-pill px-3 py-2">
                                {filteredCourses.length} result{filteredCourses.length === 1 ? '' : 's'}
                            </Badge>
                            <span className="text-muted small">
                                Showing {filteredCourses.length} of {courses.length} courses
                            </span>
                        </div>
                    </Col>
                </Row>

                {/* Simplified Global Error Alert */}
                {error && (
                    <Alert variant="danger" className="border-0 shadow-sm rounded-4 p-3 mb-4 text-center fw-medium">
                        {error}
                    </Alert>
                )}

                {filteredCourses.length === 0 ? (
                    <Alert variant="info" className="text-center rounded-4 py-5">No courses found.</Alert>
                ) : (
                    <Row className="g-4">
                        {filteredCourses.map((course) => {
                            const isAlreadyOwned = enrolledCourseIds.includes(Number(course.id));

                            return (
                                <Col xs={12} sm={6} lg={4} key={course.id}>
                                    <Card className="h-100 border-0 shadow-sm rounded-4 overflow-hidden bg-white d-flex flex-column">
                                        <div className="position-relative overflow-hidden bg-light" style={{ height: '210px' }}>
                                            {course.thumbnail_url ? (
                                                <img src={course.thumbnail_url} alt={course.title} className="w-100 h-100 object-fit-cover" />
                                            ) : (
                                                <div className="w-100 h-100 d-flex align-items-center justify-content-center bg-secondary bg-opacity-10 text-muted">
                                                    No Image
                                                </div>
                                            )}
                                            <Badge bg="info" className="position-absolute top-0 start-0 m-3 px-3 py-2 rounded-pill text-white">
                                                {course.instructor_name || 'Instructor'}
                                            </Badge>
                                        </div>

                                        <Card.Body className="p-4 d-flex flex-column">
                                            <div className="mb-3">
                                                <Card.Title className="fw-bold mb-2" style={{ fontSize: '1.15rem' }}>
                                                    {course.title}
                                                </Card.Title>
                                                <Card.Text className="text-secondary small mb-3" style={{ overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical' }}>
                                                    {course.description}
                                                </Card.Text>
                                            </div>

                                            <div className="d-flex justify-content-between align-items-center mb-4">
                                                <div className="fw-semibold text-dark">₹{course.price.toLocaleString('en-IN')}</div>
                                                <Badge bg="light" text="dark" className="border py-2 px-3 rounded-pill">
                                                    {isAlreadyOwned ? 'Enrolled' : 'New'}
                                                </Badge>
                                            </div>

                                            <div className="mt-auto d-grid gap-2">
                                                {isAlreadyOwned ? (
                                                    <Button
                                                        variant="success"
                                                        className="py-2 fw-bold rounded-3"
                                                        onClick={() => navigate(`/user/courses/${course.id}`)}
                                                    >
                                                        <FaCheckCircle className="me-2" /> Go to Classroom
                                                    </Button>
                                                ) : (
                                                    <>
                                                        <Button
                                                            variant="outline-primary"
                                                            className="py-2 fw-bold rounded-3"
                                                            onClick={() => navigate(isLoggedIn ? `/user/courses/${course.id}` : '/login')}
                                                        >
                                                            <FaInfoCircle className="me-2" /> View Details
                                                        </Button>
                                                        <Button
                                                            variant="primary"
                                                            className="py-2 fw-bold rounded-3"
                                                            onClick={() => handleStripeCheckout(course.id)}
                                                        >
                                                            {isLoggedIn ? <><FaCreditCard className="me-2" /> Pay to Enroll</> : <><FaSignInAlt className="me-2" /> Login to Enroll</>}
                                                        </Button>
                                                    </>
                                                )}
                                            </div>
                                        </Card.Body>
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
