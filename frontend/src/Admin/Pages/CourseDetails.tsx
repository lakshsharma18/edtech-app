import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Form, InputGroup, Modal } from 'react-bootstrap';
import { FaSearch, FaEdit, FaTrashAlt, FaUndo, FaTag } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import API from '../../api/client';

interface CourseItem {
  id: number;
  title: string;
  description: string;
  price: number;
  thumbnail_url: string;
}

const CourseDetails = () => {
  const [courses, setCourses] = useState<CourseItem[]>([]);
  const [searchId, setSearchId] = useState('');
  const [loading, setLoading] = useState(false);

  // Update Modal State Definitions
  const [showEditModal, setShowEditModal] = useState(false);
  const [editCourse, setEditCourse] = useState<CourseItem | null>(null);

  // Inline JavaScript Style Objects
  const containerStyle: React.CSSProperties = {
    color: '#ffffff',
    paddingTop: '3rem',
    paddingBottom: '3rem'
  };

  const cardStyle: React.CSSProperties = {
    background: 'rgba(30, 41, 59, 0.45)',
    backdropFilter: 'blur(16px)',
    WebkitBackdropFilter: 'blur(16px)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: '20px',
    color: '#ffffff',
    overflow: 'hidden',
    height: '100%',
    display: 'flex',
    flexDirection: 'column'
  };

  const inputStyle: React.CSSProperties = {
    background: 'rgba(15, 23, 42, 0.6)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    color: '#ffffff',
    borderRadius: '10px'
  };

  const modalStyle: React.CSSProperties = {
    backgroundColor: '#1e293b',
    color: '#ffffff',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '20px'
  };

  // GET ALL COURSES: Hit @router.get("/courses")
  const loadAllCourses = async () => {
    setLoading(true);
    try {
      const response = await API.get('/api/v1/courses');
      setCourses(response.data);
    } catch (error: any) {
      alert(error.response?.data?.detail || "Could not retrieve course assets.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllCourses();
  }, []);

  // GET SINGLE COURSE BY ID: Hit @router.get("/courses/{course_id}")
  const handleIdSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchId.trim()) {
      loadAllCourses();
      return;
    }
    setLoading(true);
    try {
      const response = await API.get(`/api/v1/courses/${searchId.trim()}`);
      setCourses([response.data]); 
    } catch (error: any) {
      alert(error.response?.data?.detail || `Course ID #${searchId} not found.`);
      setCourses([]);
    } finally {
      setLoading(false);
    }
  };

  // DELETE COURSE: Hit @router.delete("/courses/{course_id}")
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

  // Open Update Modal and set current data values
  const openEditModal = (course: CourseItem) => {
    setEditCourse(course);
    setShowEditModal(true);
  };

  // UPDATE COURSE: Hit @router.put("/courses/{course_id}")
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
    <Container style={containerStyle}>
      {/* Top Banner with Right Aligned Search Input */}
      <Row className="align-items-center mb-5 g-4">
        <Col md={6}>
          <h1 className="fw-bold m-0 text-white">Course Directory</h1>
          <p style={{ color: '#94a3b8' }} className="m-0 mt-1">Review, isolate, and maintain live platform course metrics.</p>
        </Col>
        
        {/* Top-Right Search Engine Console Box */}
        <Col md={6} className="d-flex justify-content-md-end justify-content-start">
          <Form onSubmit={handleIdSearch} className="w-100" style={{ maxWidth: '400px' }}>
            <InputGroup className="shadow-lg rounded-3">
              <InputGroup.Text style={{ background: 'rgba(15, 23, 42, 0.8)', border: '1px solid rgba(255,255,255,0.1)', color: '#94a3b8' }}>
                <FaSearch />
              </InputGroup.Text>
              <Form.Control
                style={inputStyle}
                type="number"
                placeholder="Search by Course ID..."
                value={searchId}
                onChange={(e) => setSearchId(e.target.value)}
              />
              {searchId && (
                <Button variant="secondary" onClick={() => { setSearchId(''); loadAllCourses(); }}>
                  <FaUndo size={12} />
                </Button>
              )}
              <Button type="submit" variant="info" className="text-white fw-bold px-3">
                Find
              </Button>
            </InputGroup>
          </Form>
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
            {courses.length === 0 ? (
              <Col xs={12} className="text-center py-5">
                <h5 style={{ color: '#64748b' }}>No courses match the requested criteria framework.</h5>
              </Col>
            ) : (
              courses.map((course) => (
                <Col md={6} lg={4} key={course.id}>
                  <motion.div
                    layout
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.3 }}
                    style={{ height: '100%' }}
                  >
                    <Card style={cardStyle} className="shadow">
                      <div className="position-relative" style={{ height: '180px' }}>
                        <Card.Img
                          variant="top"
                          src={course.thumbnail_url || "unsplash.com"}
                          alt={course.title}
                          style={{ objectFit: 'cover', width: '100%', height: '100%' }}
                        />
                      </div>

                      <Card.Body className="p-4 d-flex flex-column flex-grow-1">
                        <Card.Title className="fw-bold mb-2 text-truncate" style={{ fontSize: '1.25rem' }}>
                          {course.title}
                        </Card.Title>
                        
                        <Card.Text style={{ color: '#94a3b8', fontSize: '0.9rem', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical' }} className="mb-3 flex-grow-1">
                          {course.description}
                        </Card.Text>

                        <div className="d-flex align-items-center gap-2 mb-4 font-monospace fw-bold" style={{ color: '#10b981', fontSize: '1.1rem' }}>
                          <FaTag size={12} /> ${course.price.toFixed(2)}
                        </div>

                        {/* Action Buttons Interface */}
                        <div className="d-flex gap-2 mt-auto pt-2">
                          <Button 
                            onClick={() => openEditModal(course)}
                            variant="outline-info" 
                            className="w-100 d-flex align-items-center justify-content-center gap-2 fw-bold py-2 rounded-3"
                          >
                            <FaEdit /> Update
                          </Button>
                          <Button 
                            onClick={() => handleDeleteClick(course.id)}
                            variant="outline-danger" 
                            className="w-100 d-flex align-items-center justify-content-center gap-2 fw-bold py-2 rounded-3"
                          >
                            <FaTrashAlt /> Delete
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
      <Modal show={showEditModal} onHide={() => setShowEditModal(false)} centered backdrop="static">
        <div style={modalStyle} className="p-2">
          <Modal.Header closeButton closeVariant="white" className="border-bottom border-secondary border-opacity-20">
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
                  <Form.Label className="small text-uppercase tracking-wider text-muted">Price ($)</Form.Label>
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
              <Modal.Footer className="border-top border-secondary border-opacity-20">
                <Button variant="outline-secondary" onClick={() => setShowEditModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="info" className="text-white fw-bold px-4">
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
