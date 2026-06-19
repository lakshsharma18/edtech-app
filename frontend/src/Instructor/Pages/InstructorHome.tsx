import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Spinner, Alert, Form, Table, Button, Badge } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { FaPlus } from 'react-icons/fa';
import API from '../../api/client';
import '../../styles/Instructor.css';

interface PlatformStats {
  total_courses: number;
  total_enrollments: number;
  total_revenue: number;
}

interface CourseItem {
  id: number;
  title: string;
}

interface Student {
  name: string;
  email: string;
}

const InstructorHome = () => {

  const [platformStats, setPlatformStats] = useState<PlatformStats | null>(null);
  const [courses, setCourses] = useState<CourseItem[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<string>('');

  const [courseStudentsCount, setCourseStudentsCount] = useState<number>(0);
  const [courseRevenue, setCourseRevenue] = useState<number>(0);
  const [studentList, setStudentList] = useState<Student[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>('');

  const [pageLoading, setPageLoading] = useState<boolean>(true);
  const [courseLoading, setCourseLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const cardStyle: React.CSSProperties = {
    background: '#ffffff',
    border: '1px solid #e6edf3',
    borderRadius: '12px',
    color: '#0f172a',
    boxShadow: '0 10px 30px rgba(16,24,40,0.06)'
  };

  const selectStyle: React.CSSProperties = {
    background: '#ffffff',
    border: '1px solid #e6edf3',
    color: '#0f172a',
    borderRadius: '10px',
    padding: '10px 14px'
  };

  const inputStyle: React.CSSProperties = {
    background: '#ffffff',
    border: '1px solid #e6edf3',
    color: '#0f172a',
    borderRadius: '8px',
    padding: '10px 12px'
  };

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        const [statsResponse, coursesResponse] = await Promise.all([
          API.get('/api/v1/instructor/dashboard-stats'),
          API.get('/api/v1/instructor/courses')
        ]);

        setPlatformStats(statsResponse.data);
        const rawCourses = coursesResponse.data || [];
        setCourses(rawCourses);

        if (rawCourses.length > 0) {
          setSelectedCourseId(String(rawCourses[0].id));
        }

      } catch (err: any) {
        setErrorMessage(err.response?.data?.detail || "Could not synchronize instructor dashboard metrics.");
      } finally {
        setPageLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  useEffect(() => {
    if (!selectedCourseId) return;

    const loadCourseBreakdown = async () => {
      setCourseLoading(true);

      try {
        const [statsRes, usersRes] = await Promise.all([
          API.get(`/api/v1/instructor/course-stats/${selectedCourseId}`),
          API.get(`/api/v1/instructor/course-users/${selectedCourseId}`)
        ]);

        setCourseStudentsCount(statsRes.data?.total_students || 0);
        setCourseRevenue(statsRes.data?.total_revenue || 0);
        setStudentList(usersRes.data?.students || []);

      } catch (err) {
        console.error(err);
      } finally {
        setCourseLoading(false);
      }
    };

    loadCourseBreakdown();
  }, [selectedCourseId]);

  const filteredStudents = studentList.filter(student =>
    student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (pageLoading) {
    return (
      <div className="d-flex flex-column justify-content-center align-items-center vh-100" style={{ background: '#f8fafc' }}>
        <Spinner animation="border" variant="info" />
        <span className="text-info mt-3">Loading Instructor Dashboard...</span>
      </div>
    );
  }

  if (errorMessage) {
    return (
      <Container>
        <Alert variant="danger">{errorMessage}</Alert>
      </Container>
    );
  }

  return (
    <div className="instructor-page min-vh-100 py-5">
      <Container>
        <Card className="instructor-hero-card border-0 shadow-sm rounded-4 p-4 p-lg-5 mb-5">
          <Row className="align-items-center gy-4">
            <Col lg={7}>
              <Badge bg="info" className="instructor-badge-pill text-white mb-3">Instructor Workspace</Badge>
              <h1 className="display-6 fw-bold mb-3">Clean instructor analytics for every course.</h1>
              <p className="text-secondary fs-6 mb-4">
                Track enrollments, revenue, and student progress from a polished instructor dashboard with fast access to course creation.
              </p>
              <div className="d-flex flex-column flex-sm-row gap-3">
                <Button as={Link as any} to="/instructor/create-course" variant="primary" className="instructor-cta-btn px-4 py-2 shadow-sm">
                  <FaPlus className="me-2" /> Add Course
                </Button>
                <Button as={Link as any} to="/instructor/coursedetails" variant="outline-primary" className="instructor-cta-btn px-4 py-2">
                  Manage Courses
                </Button>
              </div>
            </Col>
            <Col lg={5}>
              <Card className="instructor-card p-4 h-100">
                <h5 className="fw-bold mb-3">Quick insight</h5>
                <p className="text-muted mb-4">The instructor dashboard unifies course performance metrics in one place, so you can focus on teaching and growing your catalog.</p>
                <div className="d-flex flex-column gap-3">
                  <div className="p-3 bg-light rounded-4 border">
                    <strong className="d-block">Start by selecting a course</strong>
                    <span className="text-muted small">Choose a course below to view student breakdowns and revenue.</span>
                  </div>
                  <div className="p-3 bg-light rounded-4 border">
                    <strong className="d-block">Need a new course?</strong>
                    <span className="text-muted small">Add a course from the top action button anytime.</span>
                  </div>
                </div>
              </Card>
            </Col>
          </Row>
        </Card>

        {/* Stats */}
        {platformStats && (
          <Row className="mb-5">
            <Col md={4}>
              <Card style={cardStyle} className="p-4 text-center">
                <h4 className="mb-1">{platformStats.total_courses}</h4>
                <small className="text-muted">Your Courses</small>
              </Card>
            </Col>
            <Col md={4}>
              <Card style={cardStyle} className="p-4 text-center">
                <h4 className="mb-1">{platformStats.total_enrollments}</h4>
                <small className="text-muted">Your Enrollments</small>
              </Card>
            </Col>
            <Col md={4}>
              <Card style={cardStyle} className="p-4 text-center">
                <h4 className="mb-1">₹{platformStats.total_revenue}</h4>
                <small className="text-muted">Your Revenue</small>
              </Card>
            </Col>
          </Row>
        )}

        {/* Select */}
        <Form.Select
          value={selectedCourseId}
          onChange={(e) => setSelectedCourseId(e.target.value)}
          style={selectStyle}
          className="mb-3"
        >
          <option value="">Select Course</option>
          {courses.map(c => (
            <option key={c.id} value={c.id}>{c.title}</option>
          ))}
        </Form.Select>

        {courseLoading ? (
          <Spinner className="mt-4" />
        ) : (
          selectedCourseId && (
            <Row className="mt-4">

              <Col md={4}>
                <Card style={cardStyle} className="p-4 text-center">
                  <h3 className="mb-1">{courseStudentsCount}</h3>
                  <small className="text-muted">Students</small>
                </Card>

                <Card style={cardStyle} className="p-4 mt-3 text-center">
                  <h3 className="mb-1">₹{courseRevenue}</h3>
                  <small className="text-muted">Revenue</small>
                </Card>
              </Col>

              <Col md={8}>
                <Card style={cardStyle}>
                  <Card.Header className="d-flex justify-content-between align-items-center">
                    <Form.Control
                      type="text"
                      placeholder="Search students by name or email..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      style={inputStyle}
                    />
                  </Card.Header>

                  <Card.Body>
                    {filteredStudents.length === 0 ? (
                      <div className="text-muted">No students</div>
                    ) : (
                      <Table striped bordered hover responsive className="mb-0">
                        <thead>
                          <tr>
                            <th>Name</th>
                            <th>Email</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredStudents.map((s, i) => (
                            <tr key={i}>
                              <td>{s.name}</td>
                              <td>{s.email}</td>
                            </tr>
                          ))}
                        </tbody>
                      </Table>
                    )}
                  </Card.Body>
                </Card>
              </Col>

            </Row>
          )
        )}

      </Container>
    </div>
  );
};

export default InstructorHome;