// import { useState, useEffect } from 'react';
// import { Container, Row, Col, Card,Spinner, Alert, Button } from 'react-bootstrap';
// import { FaGraduationCap, FaPlayCircle, FaBookOpen} from 'react-icons/fa';
// import { Link } from 'react-router-dom';
// import { getAuthUser } from '../../Admin/utils/auth';
// import API from '../../api/client';

// // Defines the data structure exactly as returned by your FastAPI backend
// interface EnrolledCourse {
//     id: number;
//     title: string;
//     description: string;
//     thumbnail_url: string;
// }

// const UserDashboard = () => {
//     const user = getAuthUser();
    
//     const [enrolledCourses, setEnrolledCourses] = useState<EnrolledCourse[]>([]);
//     const [loading, setLoading] = useState<boolean>(true);
//     const [error, setError] = useState<boolean>(false);

//     useEffect(() => {
//         const fetchUserEnrollments = async () => {
//             try {
//                 // Calls your exact backend route endpoint
//                 const response = await API.get<EnrolledCourse[]>('/api/v1/my-courses');
                
//                 // Direct list assignment matching your backend's flat array return format
//                 setEnrolledCourses(response.data);
//                 setError(false);
//             } catch (err: any) {
//                 setError(true);
//             } finally {
//                 setLoading(false);
//             }
//         };

//         if (user) fetchUserEnrollments();
//     }, [user]);

//     // View 1: Active Page Loading State
//     if (loading) {
//         return (
//             <div className="d-flex justify-content-center align-items-center vh-100 bg-white">
//                 <div className="text-center">
//                     <Spinner animation="border" variant="primary" className="mb-2" />
//                     <p className="text-muted small fw-bold tracking-wider text-uppercase">Loading Workspace...</p>
//                 </div>
//             </div>
//         );
//     }

//     return (
//         <div className="py-5 bg-white" style={{ minHeight: '100vh' }}>
//             <Container>
                
//                 {/* Visual Banner Header */}
//                 <Card className="border-0 shadow-sm rounded-4 p-4 p-md-5 mb-5 text-white" style={{ background: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)' }}>
//                     <Row className="align-items-center">
//                         <Col md={8}>
//                             <h1 className="fw-extrabold text-white tracking-tight mb-2">
//                                 Welcome Back, {user?.first_name || 'Learner'}!
//                             </h1>
//                             <p className="mb-0 text-white-50">
//                                 Expand your professional portfolio by processing specialized tracking objectives across active engineering domains.
//                             </p>
//                         </Col>
//                     </Row>
//                 </Card>

//                 <h3 className="fw-bold text-dark mb-4 d-flex align-items-center gap-2">
//                     <FaBookOpen className="text-primary" /> Enrolled Courses
//                 </h3>

//                 {/* View 2: Connection Error Fallback */}
//                 {error ? (
//                     <Alert variant="info" className="border-0 shadow-sm p-4 rounded-4 bg-light text-center">
//                         <FaGraduationCap size={48} className="text-primary mb-3" />
//                         <h5 className="fw-bold text-dark">Your Student Terminal is Active</h5>
//                         <p className="text-muted small mx-auto mb-4" style={{ maxWidth: '450px' }}>
//                             You're successfully logged in. Once your enrollment endpoint is live on the server, your active courses will load here automatically.
//                         </p>
//                         <Button as={Link as any} to="/courses" variant="primary" className="fw-bold px-4 py-2 border-0 rounded-3 shadow-sm" style={{ backgroundColor: '#2563eb' }}>
//                             Explore Available Courses
//                         </Button>
//                     </Alert>
//                 ) : enrolledCourses.length === 0 ? (
                    
//                     /* View 3: Empty Course List State */
//                     <Card className="border-0 shadow-sm text-center py-5 rounded-4 bg-light">
//                         <Card.Body className="p-5">
//                             <FaGraduationCap size={55} className="text-muted opacity-50 mb-3" />
//                             <h4 className="fw-bold text-dark">No Enrolled Courses Found</h4>
//                             <p className="text-muted small mx-auto mb-4" style={{ maxWidth: '350px' }}>
//                                 You haven't added any premium courses to your dashboard yet. Browse the public marketplace to begin.
//                             </p>
//                             <Button as={Link as any} to="/courses" variant="primary" className="fw-bold px-4 py-2 border-0 rounded-3 shadow-sm" style={{ backgroundColor: '#2563eb' }}>
//                                 Find Courses
//                             </Button>
//                         </Card.Body>
//                     </Card>
//                 ) : (
                    
//                     /* View 4: Enrolled Course Cards Grid Rendering */
//                     <Row className="g-4">
//                         {enrolledCourses.map((course) => (
//                             <Col xs={12} sm={6} lg={4} key={course.id}>
//                                 <Card className="h-100 border-0 shadow-sm rounded-4 overflow-hidden bg-white d-flex flex-column justify-content-between">
                                    
//                                     {/* Thumbnail Image Wrapper Section */}
//                                     <div className="position-relative overflow-hidden bg-light" style={{ height: '180px' }}>
//                                         {course.thumbnail_url ? (
//                                             <img src={course.thumbnail_url} alt={course.title} className="w-100 h-100 object-fit-cover" />
//                                         ) : (
//                                             <div className="w-100 h-100 d-flex align-items-center justify-content-center text-muted opacity-50">
//                                                 <FaGraduationCap size={50} />
//                                             </div>
//                                         )}
//                                     </div>
                                    
//                                     {/* Course Description Content */}
//                                     <Card.Body className="p-4 flex-grow-1">
//                                         <Card.Title className="fw-bold text-dark text-truncate mb-2">
//                                             {course.title}
//                                         </Card.Title>
//                                         <Card.Text 
//                                             className="text-muted small" 
//                                             style={{ display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden', height: '60px' }}
//                                         >
//                                             {course.description}
//                                         </Card.Text>
//                                     </Card.Body>
                                    
//                                     {/* Link Action Button */}
//                                     <Card.Footer className="bg-transparent border-0 px-4 pb-4 pt-0">
//                                         <Button as={Link as any} to={`/user/courses/${course.id}`} variant="primary" className="w-100 py-2.5 fw-bold rounded-3 shadow-sm d-flex align-items-center justify-content-center gap-2 border-0" style={{ backgroundColor: '#2563eb' }}>
//                                             <FaPlayCircle /> Launch Classroom
//                                         </Button>
//                                     </Card.Footer>
//                                 </Card>
//                             </Col>
//                         ))}
//                     </Row>
//                 )}
//             </Container>
//         </div>
//     );
// };

// export default UserDashboard;
import { useState, useEffect } from 'react';
import {
    Container, Row, Col, Card, Spinner,
    Alert, Button, Form, InputGroup
} from 'react-bootstrap';
import {
    FaGraduationCap, FaPlayCircle,
    FaBookOpen, FaSearch, FaTimes
} from 'react-icons/fa';
import { Link } from 'react-router-dom';
import { getAuthUser } from '../../Instructor/utils/auth';
import API from '../../api/client';

interface EnrolledCourse {
    id: number;
    title: string;
    description: string;
    thumbnail_url: string;
}

const UserDashboard = () => {
    const user = getAuthUser();

    const [enrolledCourses, setEnrolledCourses] = useState<EnrolledCourse[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    // ✅ NEW: SEARCH STATE
    const [searchQuery, setSearchQuery] = useState("");

    useEffect(() => {
        const fetchUserEnrollments = async () => {
            try {
                const response = await API.get<EnrolledCourse[]>('/api/v1/my-courses');
                setEnrolledCourses(response.data);
                setError(false);
            } catch {
                setError(true);
            } finally {
                setLoading(false);
            }
        };

        if (user) fetchUserEnrollments();
    }, [user]);

    // ✅ FILTER COURSES
    const filteredCourses = enrolledCourses.filter((course) =>
        course.title.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (loading) {
        return (
            <div className="d-flex justify-content-center align-items-center vh-100 bg-white">
                <div className="text-center">
                    <Spinner animation="border" variant="primary" className="mb-2" />
                    <p className="text-muted small fw-bold text-uppercase">
                        Loading Workspace...
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="py-5 bg-white" style={{ minHeight: '100vh' }}>
            <Container>

                {/* HEADER */}
                <Card
                    className="border-0 shadow-sm rounded-4 p-4 p-md-5 mb-5 text-white"
                    style={{
                        background: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)'
                    }}
                >
                    <Row className="align-items-center">
                        <Col md={8}>
                            <h1 className="fw-bold mb-2">
                                Welcome Back, {user?.first_name || 'Learner'}!
                            </h1>
                            <p className="text-white-50 m-0">
                                Continue your learning journey.
                            </p>
                        </Col>
                    </Row>
                </Card>

                {/* TITLE + SEARCH BAR */}
                <Row className="align-items-center mb-4 g-3">
                    <Col md={6}>
                        <h3 className="fw-bold text-dark d-flex align-items-center gap-2">
                            <FaBookOpen className="text-primary" />
                            Enrolled Courses
                        </h3>
                    </Col>

                    <Col md={6} className="d-flex justify-content-md-end">
                        <InputGroup
                            className="shadow-sm rounded-4"
                            style={{ maxWidth: '400px', overflow: 'hidden' }}
                        >
                            <InputGroup.Text className="bg-white border-0 text-muted">
                                <FaSearch />
                            </InputGroup.Text>

                            <Form.Control
                                placeholder="Search your courses..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="border-0 shadow-none"
                            />

                            {searchQuery && (
                                <Button
                                    variant="light"
                                    className="border-0"
                                    onClick={() => setSearchQuery("")}
                                >
                                    <FaTimes />
                                </Button>
                            )}
                        </InputGroup>
                    </Col>
                </Row>

                {/* ERROR */}
                {error ? (
                    <Alert variant="info" className="text-center">
                        Unable to load courses. Try again.
                    </Alert>
                ) : filteredCourses.length === 0 ? (
                    <Card className="text-center py-5 bg-light">
                        <FaGraduationCap size={50} className="text-muted mb-3" />
                        <h5>No Courses Found</h5>
                        <Button as={Link as any} to="/courses">
                            Browse Courses
                        </Button>
                    </Card>
                ) : (

                    <Row className="g-4">
                        {filteredCourses.map((course) => (
                            <Col md={4} key={course.id}>
                                <Card className="h-100 shadow-sm rounded-4">

                                    <div style={{ height: '180px', overflow: 'hidden' }}>
                                        {course.thumbnail_url ? (
                                            <img
                                                src={course.thumbnail_url}
                                                alt={course.title}
                                                className="w-100 h-100 object-fit-cover"
                                            />
                                        ) : (
                                            <div className="d-flex justify-content-center align-items-center h-100">
                                                <FaGraduationCap size={40} />
                                            </div>
                                        )}
                                    </div>

                                    <Card.Body>
                                        <Card.Title>{course.title}</Card.Title>
                                        <Card.Text className="text-muted small">
                                            {course.description}
                                        </Card.Text>
                                    </Card.Body>

                                    <Card.Footer className="bg-white border-0">
                                        <Button
                                            as={Link as any}
                                            to={`/user/courses/${course.id}`}
                                            className="w-100"
                                        >
                                            <FaPlayCircle /> Continue
                                        </Button>
                                    </Card.Footer>

                                </Card>
                            </Col>
                        ))}
                    </Row>
                )}
            </Container>
        </div>
    );
};

export default UserDashboard;