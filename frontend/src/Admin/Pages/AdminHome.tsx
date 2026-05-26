import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Button, Card, Spinner, Alert, Form, Table} from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { FaPlus} from 'react-icons/fa';
import API from '../../api/client';

interface PlatformStats {
  total_users: number;
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

const AdminHome = () => {

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
    background: 'linear-gradient(145deg, #1e293b 0%, #111827 100%)',
    border: '1px solid rgba(255, 255, 255, 0.06)',
    borderRadius: '24px',
    color: '#ffffff',
    boxShadow: '0 10px 30px -10px rgba(0,0,0,0.5)'
  };

  const selectStyle: React.CSSProperties = {
    background: '#1f2937',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    color: '#ffffff',
    borderRadius: '14px',
    padding: '12px 20px'
  };

  const inputStyle: React.CSSProperties = {
    background: '#111827',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    color: '#ffffff',
    borderRadius: '12px',
    padding: '10px 16px'
  };

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        const [statsResponse, coursesResponse] = await Promise.all([
          API.get('/api/v1/admin/platform-stats'),
          API.get('/api/v1/courses')
        ]);

        setPlatformStats(statsResponse.data);
        const rawCourses = coursesResponse.data || [];
        setCourses(rawCourses);

        if (rawCourses.length > 0) {
          setSelectedCourseId(String(rawCourses[0].id));
        }

      } catch (err: any) {
        setErrorMessage(err.response?.data?.detail || "Could not synchronize admin operational metrics.");
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
          API.get(`/api/v1/admin/course-stats/${selectedCourseId}`),
          API.get(`/api/v1/admin/course-users/${selectedCourseId}`)
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
      <div className="d-flex flex-column justify-content-center align-items-center vh-100" style={{ background: '#0f172a' }}>
        <Spinner animation="border" variant="info" />
        <span className="text-info mt-3">Loading Admin Cockpit...</span>
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
    <div style={{ background: '#0f172a', minHeight: '100vh' }} className="py-5">
      <Container>

        {/* Header */}
        <div className="d-flex justify-content-between mb-4">
          <h2 className="text-white">Admin Dashboard</h2>
          <Button as={Link as any} to="/admin/create-course" variant="info">
            <FaPlus /> Create Course
          </Button>
        </div>

        {/* Stats */}
        {platformStats && (
          <Row className="mb-5">
            <Col md={3}>
              <Card style={cardStyle} className="p-3 text-center">
                <h4>{platformStats.total_users}</h4>
                <small>Total Users</small>
              </Card>
            </Col>
            <Col md={3}>
              <Card style={cardStyle} className="p-3 text-center">
                <h4>{platformStats.total_courses}</h4>
                <small>Total Courses</small>
              </Card>
            </Col>
            <Col md={3}>
              <Card style={cardStyle} className="p-3 text-center">
                <h4>{platformStats.total_enrollments}</h4>
                <small>Total Enrollments</small>
              </Card>
            </Col>
            <Col md={3}>
              <Card style={cardStyle} className="p-3 text-center">
                <h4>₹{platformStats.total_revenue}</h4>
                <small>Total Revenue</small>
              </Card>
            </Col>
          </Row>
        )}

        {/* Select */}
        <Form.Select
          value={selectedCourseId}
          onChange={(e) => setSelectedCourseId(e.target.value)}
          style={selectStyle}
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
                <Card style={cardStyle} className="p-3 text-center">
                  <h3>{courseStudentsCount}</h3>
                  <small>Students</small>
                </Card>

                <Card style={cardStyle} className="p-3 mt-3 text-center">
                  <h3>₹{courseRevenue}</h3>
                  <small>Revenue</small>
                </Card>
              </Col>

              <Col md={8}>
                <Card style={cardStyle}>
                  <Card.Header className="d-flex justify-content-between">

                    <Form.Control
                      type="text"
                      placeholder="Search..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      style={inputStyle}
                    />

                  </Card.Header>

                  <Card.Body>
                    {filteredStudents.length === 0 ? (
                      <div>No students</div>
                    ) : (
                      <Table>
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

export default AdminHome;