import React, { useState } from 'react';
import { Container, Form, Button, Card, Row, Col, InputGroup } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaHeading, FaDollarSign, FaImage, FaFileAlt, FaArrowLeft, FaCloudUploadAlt } from 'react-icons/fa';
import API from '../../api/client'; // ✅ Uses your custom auto-token axios instance

const CreateCourse = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [course, setCourse] = useState({
    title: '',
    description: '',
    price: 0,
    thumbnail_url: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      // ✅ Hits your @router.post("/courses") endpoint with auto-injected authorization header
      const response = await API.post('/api/v1/courses', course);
      alert(response.data.message || "Course deployment successful!");
      navigate('/admin/dashboard');
    } catch (error: any) {
      console.error(error);
      alert(error.response?.data?.detail || "An operational anomaly occurred during database deployment.");
    } finally {
      setLoading(false);
    }
  };

  // Inline styling frameworks
  const glassStyle: React.CSSProperties = {
    background: 'rgba(30, 41, 59, 0.4)',
    backdropFilter: 'blur(16px)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: '24px',
    color: '#ffffff'
  };

  const inputStyle: React.CSSProperties = {
    background: 'rgba(15, 23, 42, 0.6)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    color: '#ffffff',
    borderRadius: '10px'
  };

  return (
    <Container className="py-5" style={{ maxWidth: '900px' }}>
      {/* Structural Escape Anchor Link */}
      <div className="mb-4">
        <Button 
          onClick={() => navigate('/admin/dashboard')} 
          variant="link" 
          className="text-info p-0 d-flex align-items-center gap-2 text-decoration-none fw-bold"
        >
          <FaArrowLeft /> Back to Course Core Hub
        </Button>
      </div>

      <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.4 }}>
        <Card style={glassStyle} className="p-4 p-md-5 shadow-2xl">
          <Card.Body>
            <div className="text-center mb-5">
              <div style={{ background: 'rgba(13, 202, 240, 0.1)', display: 'inline-block', padding: '16px', borderRadius: '50%', color: '#0dcaf0' }} className="mb-3">
                <FaCloudUploadAlt size={40} />
              </div>
              <h2 className="fw-bold text-white">Deploy Academic Course</h2>
              <p style={{ color: '#94a3b8' }}>Fill out the programmatic parameters to serialize a new educational asset into the ecosystem.</p>
            </div>

            <Form onSubmit={handleSubmit}>
              <Row className="g-4">
                {/* Course Title */}
                <Col xs={12}>
                  <Form.Group>
                    <Form.Label className="fw-semibold small text-uppercase tracking-wider text-info">Course Title</Form.Label>
                    <InputGroup>
                      <InputGroup.Text style={{ background: 'rgba(15, 23, 42, 0.8)', border: '1px solid rgba(255, 255, 255, 0.1)', color: '#94a3b8' }}><FaHeading /></InputGroup.Text>
                      <Form.Control
                        style={inputStyle}
                        type="text"
                        placeholder="e.g., Mastering Full-Stack Development with FastAPI & React"
                        value={course.title}
                        onChange={(e) => setCourse({ ...course, title: e.target.value })}
                        required
                      />
                    </InputGroup>
                  </Form.Group>
                </Col>

                {/* Pricing Structure */}
                <Col md={6}>
                  <Form.Group>
                    <Form.Label className="fw-semibold small text-uppercase tracking-wider text-info">Tuition Fee (USD)</Form.Label>
                    <InputGroup>
                      <InputGroup.Text style={{ background: 'rgba(15, 23, 42, 0.8)', border: '1px solid rgba(255, 255, 255, 0.1)', color: '#94a3b8' }}><FaDollarSign /></InputGroup.Text>
                      <Form.Control
                        style={inputStyle}
                        type="number"
                        placeholder="49.99"
                        value={course.price || ''}
                        onChange={(e) => setCourse({ ...course, price: parseFloat(e.target.value) || 0 })}
                        required
                      />
                    </InputGroup>
                  </Form.Group>
                </Col>

                {/* Thumbnail Asset Link */}
                <Col md={6}>
                  <Form.Group>
                    <Form.Label className="fw-semibold small text-uppercase tracking-wider text-info">Thumbnail Asset URL</Form.Label>
                    <InputGroup>
                      <InputGroup.Text style={{ background: 'rgba(15, 23, 42, 0.8)', border: '1px solid rgba(255, 255, 255, 0.1)', color: '#94a3b8' }}><FaImage /></InputGroup.Text>
                      <Form.Control
                        style={inputStyle}
                        type="url"
                        placeholder="unsplash.com..."
                        value={course.thumbnail_url}
                        onChange={(e) => setCourse({ ...course, thumbnail_url: e.target.value })}
                        required
                      />
                    </InputGroup>
                  </Form.Group>
                </Col>

                {/* Description Textarea Area */}
                <Col xs={12}>
                  <Form.Group>
                    <Form.Label className="fw-semibold small text-uppercase tracking-wider text-info">Syllabus Executive Summary</Form.Label>
                    <div className="d-flex align-items-start position-relative">
                      <span style={{ position: 'absolute', top: '12px', left: '12px', color: '#94a3b8' }}><FaFileAlt /></span>
                      <Form.Control
                        style={{ ...inputStyle, paddingLeft: '40px' }}
                        as="textarea"
                        rows={5}
                        placeholder="Provide an extensive syllabus description outlining learning outcomes, targeted technologies, and project workflows..."
                        value={course.description}
                        onChange={(e) => setCourse({ ...course, description: e.target.value })}
                        required
                      />
                    </div>
                  </Form.Group>
                </Col>

                {/* Execution Management Trigger Button */}
                <Col xs={12} className="mt-5">
                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <Button
                      type="submit"
                      variant="info"
                      disabled={loading}
                      style={{ width: '100%', fontWeight: 800, padding: '14px', borderRadius: '12px', letterSpacing: '0.5px' }}
                      className="shadow-lg text-white"
                    >
                      {loading ? 'Serializing Assets to Server...' : 'Confirm and Publish Asset'}
                    </Button>
                  </motion.div>
                </Col>
              </Row>
            </Form>
          </Card.Body>
        </Card>
      </motion.div>
    </Container>
  );
};

export default CreateCourse;
