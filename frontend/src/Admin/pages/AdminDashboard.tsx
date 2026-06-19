import { useEffect, useState } from 'react';
import { Container, Row, Col, Card, Table, Button, Spinner, Alert, Badge } from 'react-bootstrap';
import { FaUsers, FaBook, FaDollarSign, FaChartLine, FaRupeeSign } from 'react-icons/fa';
import API from '../../api/client';
import '../../styles/Admin.css';

interface InstructorSummary {
  id: number;
  name: string;
  email: string;
  total_courses: number;
  total_enrollments: number;
  total_revenue: number;
}

interface CourseSummary {
  id: number;
  title: string;
  price: number;
  enrollments: number;
  revenue: number;
}

const AdminDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [summary, setSummary] = useState({
    total_instructors: 0,
    total_courses: 0,
    total_enrollments: 0,
    total_revenue: 0
  });
  const [instructors, setInstructors] = useState<InstructorSummary[]>([]);
  const [selectedInstructor, setSelectedInstructor] = useState<InstructorSummary | null>(null);
  const [courses, setCourses] = useState<CourseSummary[]>([]);
  const [loadingCourses, setLoadingCourses] = useState(false);

  useEffect(() => {
    const fetchInstructors = async () => {
      try {
        setError('');
        const response = await API.get('/api/v1/admin/instructors');
        setSummary(response.data);
        setInstructors(response.data.instructors || []);
      } catch (err: any) {
        setError(err.response?.data?.detail || 'Unable to load admin data.');
      } finally {
        setLoading(false);
      }
    };

    fetchInstructors();
  }, []);

  const loadInstructorCourses = async (instructor: InstructorSummary) => {
    if (selectedInstructor?.id === instructor.id) {
      setSelectedInstructor(null);
      setCourses([]);
      return;
    }

    try {
      setLoadingCourses(true);
      const response = await API.get(`/api/v1/admin/instructors/${instructor.id}/courses`);
      setSelectedInstructor(instructor);
      setCourses(response.data || []);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Unable to load instructor courses.');
    } finally {
      setLoadingCourses(false);
    }
  };

  return (
    <div className="admin-page min-vh-100 py-5 bg-light">
      <Container>
        <Row className="align-items-center mb-4">
          <Col md={7}>
            <h1 className="display-6 fw-bold mb-2">Admin Dashboard</h1>
            <p className="text-muted mb-0">Overview of instructors, courses, enrollments and revenue.</p>
          </Col>
          <Col md={5} className="text-md-end mt-3 mt-md-0 d-flex flex-column flex-md-row align-items-md-end justify-content-md-end gap-2">
            <Badge bg="dark" className="py-2 px-3 fs-6">Admin Workspace</Badge>
          </Col>
        </Row>

        {loading && (
          <div className="text-center py-5">
            <Spinner animation="border" variant="primary" />
          </div>
        )}

        {error && <Alert variant="danger">{error}</Alert>}

        {!loading && !error && (
          <>
            <Row className="g-3 mb-4">
              <Col md={3}>
                <Card className="admin-summary-card shadow-sm border-0 p-4 h-100">
                  <div className="d-flex align-items-center mb-3 text-primary">
                    <FaUsers size={22} className="me-2" />
                    <span className="fw-semibold">Instructors</span>
                  </div>
                  <h3>{summary.total_instructors}</h3>
                  <p className="text-muted mb-0">Registered instructors</p>
                </Card>
              </Col>
              <Col md={3}>
                <Card className="admin-summary-card shadow-sm border-0 p-4 h-100">
                  <div className="d-flex align-items-center mb-3 text-info">
                    <FaBook size={22} className="me-2" />
                    <span className="fw-semibold">Courses</span>
                  </div>
                  <h3>{summary.total_courses}</h3>
                  <p className="text-muted mb-0">Total courses live</p>
                </Card>
              </Col>
              <Col md={3}>
                <Card className="admin-summary-card shadow-sm border-0 p-4 h-100">
                  <div className="d-flex align-items-center mb-3 text-success">
                    <FaChartLine size={22} className="me-2" />
                    <span className="fw-semibold">Enrollments</span>
                  </div>
                  <h3>{summary.total_enrollments}</h3>
                  <p className="text-muted mb-0">Course enrollments</p>
                </Card>
              </Col>
              <Col md={3}>
                <Card className="admin-summary-card shadow-sm border-0 p-4 h-100">
                  <div className="d-flex align-items-center mb-3 text-warning">
                    <FaRupeeSign size={22} className="me-2" />
                    <span className="fw-semibold">Revenue</span>
                  </div>
                  <h3>₹{summary.total_revenue.toLocaleString('en-IN')}</h3>
                  <p className="text-muted mb-0">Platform earnings</p>
                </Card>
              </Col>
            </Row>

            <Card className="shadow-sm border-0 mb-4">
              <Card.Body>
                <h4 className="fw-semibold mb-3" id="instructors">Instructor roster</h4>
                <Table responsive hover className="align-middle">
                  <thead className="table-light">
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Courses</th>
                      <th>Enrollments</th>
                      <th>Revenue</th>
                      <th className="text-end">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {instructors.map((instructor) => (
                      <tr key={instructor.id}>
                        <td>{instructor.name}</td>
                        <td>{instructor.email}</td>
                        <td>{instructor.total_courses}</td>
                        <td>{instructor.total_enrollments}</td>
                        <td>₹{instructor.total_revenue.toLocaleString('en-IN')}</td>
                        <td className="text-end">
                          <Button
                            variant={selectedInstructor?.id === instructor.id ? 'outline-secondary' : 'primary'}
                            size="sm"
                            onClick={() => loadInstructorCourses(instructor)}
                          >
                            {selectedInstructor?.id === instructor.id ? 'Hide Courses' : 'View Courses'}
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </Card.Body>
            </Card>

            {selectedInstructor && (
              <Card className="shadow-sm border-0 mb-5">
                <Card.Body>
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <div>
                      <h5 className="mb-1">Courses for {selectedInstructor.name}</h5>
                      <p className="text-muted mb-0">{selectedInstructor.email}</p>
                    </div>
                    <Badge bg="secondary" className="py-2 px-3">
                      {courses.length} courses
                    </Badge>
                  </div>

                  {loadingCourses ? (
                    <div className="text-center py-4">
                      <Spinner animation="border" variant="primary" />
                    </div>
                  ) : (
                    <Table responsive hover className="align-middle">
                      <thead className="table-light">
                        <tr>
                          <th>Course</th>
                          <th>Price</th>
                          <th>Enrollments</th>
                          <th>Revenue</th>
                        </tr>
                      </thead>
                      <tbody>
                        {courses.length === 0 ? (
                          <tr>
                            <td colSpan={4} className="text-center py-4 text-muted">
                              No courses found for this instructor.
                            </td>
                          </tr>
                        ) : (
                          courses.map((course) => (
                            <tr key={course.id}>
                              <td>{course.title}</td>
                              <td>₹{course.price.toLocaleString('en-IN')}</td>
                              <td>{course.enrollments}</td>
                              <td>₹{course.revenue.toLocaleString('en-IN')}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </Table>
                  )}
                </Card.Body>
              </Card>
            )}
          </>
        )}
      </Container>
    </div>
  );
};

export default AdminDashboard;