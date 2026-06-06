import React, { useState, useEffect, useRef } from 'react';
import { Container, Row, Col, Card, Button, Form, InputGroup, Modal, Badge } from 'react-bootstrap';
import { FaSearch, FaEdit, FaTrashAlt } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import API from '../../api/client';
import '../../styles/Instructor.css';

interface CourseItem {
  id: number;
  title: string;
  description: string;
  price: number;
  thumbnail_url: string;
}

const CourseDetails = () => {
  const navigate = useNavigate();
  const [courses, setCourses] = useState<CourseItem[]>([]);
  const [filteredCourses, setFilteredCourses] = useState<CourseItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const searchInputRef = useRef<HTMLInputElement | null>(null);

  const [showEditModal, setShowEditModal] = useState(false);
  const [editCourse, setEditCourse] = useState<CourseItem | null>(null);

  const containerStyle: React.CSSProperties = {
    backgroundColor: '#f8fafc',
    color: '#0f172a',
    paddingTop: '3rem',
    paddingBottom: '3rem'
  };

  const cardStyle: React.CSSProperties = {
    background: '#ffffff',
    border: '1px solid #e2e8f0',
    borderRadius: '20px',
    color: '#0f172a',
    overflow: 'hidden',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: '0 20px 50px rgba(15, 23, 42, 0.08)'
  };

  const inputStyle: React.CSSProperties = {
    background: '#ffffff',
    border: '1px solid #cbd5e1',
    color: '#0f172a',
    borderRadius: '10px'
  };

  const modalStyle: React.CSSProperties = {
    backgroundColor: '#1e293b',
    color: '#ffffff',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '20px'
  };

  const loadAllCourses = async () => {
    setLoading(true);
    try {
      const response = await API.get('/api/v1/instructor/courses');
      setCourses(response.data);
      setFilteredCourses(response.data);
    } catch (error: any) {
      alert(error.response?.data?.detail || "Could not retrieve course assets.");
    } finally {
      setLoading(false);
    }
  };

  const normalizeQuery = (value: string) => value.toLowerCase().trim();

  const searchInstructorCourses = (value: string) => {
    if (!value) return courses;

    return courses.filter((course) => {
      const searchableText = `${course.title} ${course.description}`.toLowerCase();
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
        const searchableText = `${course.title} ${course.description}`.toLowerCase();
        return searchableText.includes(search);
      })
      .slice(0, 5)
      .map((course) => course.title);

    setSuggestions(Array.from(new Set(titleMatches)));
  };

  const updateSearch = (value: string) => {
    const search = normalizeQuery(value);
    setSearchQuery(value);
    setFilteredCourses(searchInstructorCourses(search));
    buildSuggestions(value);
  };

  const handleSuggestionClick = (suggestion: string) => {
    updateSearch(suggestion);
    setSuggestions([]);
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSuggestions([]);
    setFilteredCourses(courses);
  };

  useEffect(() => {
    searchInputRef.current?.focus();
  }, []);

  useEffect(() => {
    loadAllCourses();
  }, []);

  const handleSearchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      setFilteredCourses(courses);
      return;
    }

    const search = searchQuery.toLowerCase().trim();
    
    setFilteredCourses(
      courses.filter((course) =>
        course.title.toLowerCase().includes(search) ||
        course.description.toLowerCase().includes(search)
      )
    );
    setSuggestions([]);
  };

  const handleDeleteClick = async (id: number) => {
    if (!window.confirm("Are you sure you want to permanently delete this course?")) return;
    try {
      const response = await API.delete(`/api/v1/courses/${id}`);
      alert(response.data.message || "Course deleted successfully.");
      setCourses(courses.filter(c => c.id !== id));
    } catch (error: any) {
      alert(error.response?.data?.detail || "Delete operation failed.");
    }
  };

  const openEditModal = (course: CourseItem) => {
    setEditCourse(course);
    setShowEditModal(true);
  };

  const handleUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editCourse) return;
    try {
      const response = await API.put(`/api/v1/courses/${editCourse.id}`, {
        title: editCourse.title,
        description: editCourse.description,
        price: editCourse.price,
        thumbnail_url: editCourse.thumbnail_url
      });
      alert(response.data.message || "Course updated successfully!");
      setShowEditModal(false);
      loadAllCourses();
    } catch (error: any) {
      alert(error.response?.data?.detail || "Update operation failed.");
    }
  };

  return (
    <Container className="instructor-page" style={containerStyle}>
      <Row className="align-items-center mb-4">
        <Col lg={8}>
          <Card className="instructor-hero-card border-0 shadow-sm rounded-4 p-4 p-lg-5">
            <div className="mb-4">
              <h1 className="fw-bold mb-3">Instructor Course Dashboard</h1>
              <p className="text-secondary mb-4">Search your courses quickly, update content, and manage lessons from one clean, modern workspace.</p>
            </div>
            <Form onSubmit={handleSearchSubmit} className="position-relative">
              <InputGroup className="shadow-sm rounded-3 border">
                <InputGroup.Text style={{ background: '#f8fafc', color: '#0f172a', border: 'none' }}>
                  <FaSearch />
                </InputGroup.Text>
                <Form.Control
                  ref={searchInputRef}
                  style={{ ...inputStyle, background: '#f8fafc', color: '#0f172a' }}
                  type="text"
                  placeholder="Search courses by title or description..."
                  value={searchQuery}
                  onChange={(e) => updateSearch(e.target.value)}
                />
                <Button variant="outline-secondary" onClick={clearSearch} disabled={!searchQuery && suggestions.length === 0}>
                  Clear
                </Button>
                <Button type="submit" variant="info" className="text-white fw-bold px-4">
                  Search
                </Button>
              </InputGroup>
            </Form>
            {suggestions.length > 0 && (
              <div className="position-absolute bg-white border rounded-3 shadow-sm w-100 mt-2" style={{ zIndex: 10 }}>
                {suggestions.map((suggestion) => (
                  <div
                    key={suggestion}
                    onClick={() => handleSuggestionClick(suggestion)}
                    className="px-3 py-2 text-dark instructor-suggestion-item"
                    style={{ cursor: 'pointer' }}
                  >
                    {suggestion}
                  </div>
                ))}
              </div>
            )}
          </Card>
        </Col>

        <Col lg={4} className="mt-3 mt-lg-0">
          <Card className="instructor-card p-4 d-flex flex-column justify-content-center h-100">
            <h5 className="fw-bold mb-3">Course Inventory</h5>
            <p className="text-muted mb-4">{filteredCourses.length} courses available. Use the search to filter quickly by title or description.</p>
            <div className="d-flex flex-column gap-2">
              <div className="p-3 bg-light rounded-4 border">
                <strong className="d-block">Matched Courses</strong>
                <span className="text-muted small">{filteredCourses.length} of {courses.length}</span>
              </div>
              <div className="p-3 bg-light rounded-4 border">
                <strong className="d-block">Quick Actions</strong>
                <span className="text-muted small">Use the edit actions on the right of each course card below.</span>
              </div>
            </div>
          </Card>
        </Col>
      </Row>

      {/* Course Cards Grid */}
      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-info" role="status"></div>
          <p className="mt-3 text-muted">Synchronizing relational schema structures...</p>
        </div>
      ) : (
        <Row className="g-4">
          <AnimatePresence>
            {filteredCourses.length === 0 ? (
              <Col xs={12} className="text-center py-5">
                <h5 style={{ color: '#64748b' }}>No courses match the requested criteria framework.</h5>
              </Col>
            ) : (
              filteredCourses.map((course) => (
                <Col md={6} lg={4} key={course.id}>
                  <motion.div
                    layout
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.3 }}
                    style={{ height: '100%' }}
                  >
                    <Card style={cardStyle} className="shadow-sm">
                      <div className="position-relative" style={{ height: '180px' }}>
                        {course.thumbnail_url ? (
                          <Card.Img
                            variant="top"
                            src={course.thumbnail_url}
                            alt={course.title}
                            style={{ objectFit: 'cover', width: '100%', height: '100%' }}
                          />
                        ) : (
                          <div className="w-100 h-100 d-flex align-items-center justify-content-center bg-secondary bg-opacity-10 text-muted">
                            No image available
                          </div>
                        )}
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
                          <Badge bg="info" className="text-white rounded-pill py-2 px-3">
                            ₹{course.price.toLocaleString('en-IN')}
                          </Badge>
                          <span className="text-muted small">Instructor course</span>
                        </div>

                        <div className="mt-auto d-grid gap-2">
                          <div className="d-flex gap-2">
                            <Button
                              onClick={() => openEditModal(course)}
                              variant="outline-primary"
                              className="w-100 py-2 fw-bold rounded-3"
                            >
                              <FaEdit /> Update
                            </Button>
                            <Button
                              onClick={() => handleDeleteClick(course.id)}
                              variant="outline-danger"
                              className="w-100 py-2 fw-bold rounded-3"
                            >
                              <FaTrashAlt /> Delete
                            </Button>
                          </div>
                          <Button
                            onClick={() => navigate(`/instructor/manage-course/${course.id}`)}
                            variant="primary"
                            className="w-100 py-2 fw-bold rounded-3 text-white"
                          >
                            View & Manage Lessons
                          </Button>
                        </div>
                      </Card.Body>
                    </Card>
                  </motion.div>
                </Col>
              ))
            )}
          </AnimatePresence>
        </Row>
      )}

      {/* Form Update Popup Component Layout */}
      <Modal show={showEditModal} onHide={() => setShowEditModal(false)} centered backdrop="static" contentClassName="border-0 bg-transparent">
        <div style={modalStyle} className="p-4 shadow-2xl">
          <Modal.Header closeButton closeVariant="white" className="border-bottom border-secondary border-opacity-20 pb-2">
            <Modal.Title className="fw-bold text-info">Modify Course Configuration</Modal.Title>
          </Modal.Header>
          {editCourse && (
            <Form onSubmit={handleUpdateSubmit}>
              <Modal.Body className="d-flex flex-column gap-3">
                <Form.Group>
                  <Form.Label className="small text-uppercase tracking-wider text-muted">Title</Form.Label>
                  <Form.Control
                    style={{ ...inputStyle, background: '#0f172a' }}
                    type="text"
                    value={editCourse.title}
                    onChange={(e) => setEditCourse({ ...editCourse, title: e.target.value })}
                    required
                  />
                </Form.Group>

                <Form.Group>
                  <Form.Label className="small text-uppercase tracking-wider text-muted">Price (₹)</Form.Label>
                  <Form.Control
                    style={{ ...inputStyle, background: '#0f172a' }}
                    type="number"
                    step="0.01"
                    value={editCourse.price}
                    onChange={(e) => setEditCourse({ ...editCourse, price: parseFloat(e.target.value) || 0 })}
                    required
                  />
                </Form.Group>

                <Form.Group>
                  <Form.Label className="small text-uppercase tracking-wider text-muted">Thumbnail Image URL</Form.Label>
                  <Form.Control
                    style={{ ...inputStyle, background: '#0f172a' }}
                    type="url"
                    value={editCourse.thumbnail_url}
                    onChange={(e) => setEditCourse({ ...editCourse, thumbnail_url: e.target.value })}
                    required
                  />
                </Form.Group>

                <Form.Group>
                  <Form.Label className="small text-uppercase tracking-wider text-muted">Description Summary</Form.Label>
                  <Form.Control
                    style={{ ...inputStyle, background: '#0f172a' }}
                    as="textarea"
                    rows={4}
                    value={editCourse.description}
                    onChange={(e) => setEditCourse({ ...editCourse, description: e.target.value })}
                    required
                  />
                </Form.Group>
              </Modal.Body>
              <Modal.Footer className="border-top border-secondary border-opacity-20 pt-3">
                <Button variant="outline-secondary" className="px-4 rounded-3 text-white-50 border-secondary" onClick={() => setShowEditModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="info" className="text-white fw-bold px-4 rounded-3">
                  Apply Updates
                </Button>
              </Modal.Footer>
            </Form>
          )}
        </div>
      </Modal>
    </Container>
  );
};

export default CourseDetails;
