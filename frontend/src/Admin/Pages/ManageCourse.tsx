
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Row, Col, Card, Button, Form, Modal, ProgressBar, Badge } from 'react-bootstrap';
import { FaArrowLeft, FaCloudUploadAlt, FaPlus, FaTrash, FaCopy, FaExternalLinkAlt, FaEdit } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import API from '../../api/client';

interface Lesson {
  id?: number;
  title: string;
  video_url: string;
  notes: string;
  course_id: number;
}

const ManageCourse = () => {
  const { course_id } = useParams();
  const navigate = useNavigate();

  // Core State
  const [course, setCourse] = useState<any>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  
  // Current Lesson state for both Add and Update
  const [lessonData, setLessonData] = useState<Lesson>({
    title: '',
    video_url: '',
    notes: '',
    course_id: Number(course_id)
  });

  const glassStyle: React.CSSProperties = {
    background: 'rgba(30, 41, 59, 0.6)',
    backdropFilter: 'blur(12px)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    color: 'white',
    borderRadius: '20px'
  };

  useEffect(() => {
    fetchData();
  }, [course_id]);

  const fetchData = async () => {
    try {
      const [courseRes, lessonsRes] = await Promise.all([
        API.get(`/api/v1/courses/${course_id}`),
        API.get(`/api/v1/courses/${course_id}/lessons`)
      ]);
      setCourse(courseRes.data);
      setLessons(lessonsRes.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    setUploading(true);
    try {
      const res = await API.post('/api/v1/upload-video', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setLessonData({ ...lessonData, video_url: res.data.video_url });
    } catch (err) {
      alert("Azure Blob Storage upload failed.");
    } finally {
      setUploading(false);
    }
  };

  const handleSaveLesson = async () => {
    try {
      if (isEditing && lessonData.id) {
        // ✅ UPDATE LOGIC
        await API.put(`/api/v1/lessons/${lessonData.id}`, lessonData);
        alert("Lesson updated successfully!");
      } else {
        // ✅ CREATE LOGIC
        await API.post('/api/v1/lessons', lessonData);
        alert("Lesson created successfully!");
      }
      handleCloseModal();
      fetchData();
    } catch (err) {
      alert("Failed to save lesson to database.");
    }
  };

  const openAddModal = () => {
    setIsEditing(false);
    setLessonData({ title: '', video_url: '', notes: '', course_id: Number(course_id) });
    setShowModal(true);
  };

  const openEditModal = (lesson: Lesson) => {
    setIsEditing(true);
    setLessonData(lesson);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setUploading(false);
  };

  const copyToClipboard = (url: string) => {
    navigator.clipboard.writeText(url);
    alert("Video URL copied to clipboard!");
  };

  const handleDeleteLesson = async (id: number) => {
    if (!window.confirm("Delete this lesson? This action is irreversible.")) return;
    try {
      await API.delete(`/api/v1/lessons/${id}`);
      fetchData();
    } catch (err) {
      alert("Lesson deleted. If it was the last lesson, the course may have been removed.");
      navigate('/admin/coursedetails');
    }
  };

  if (!course) return <div className="text-white text-center mt-5">Initializing Control Panel...</div>;

  return (
    <Container className="py-5">
      <Button onClick={() => navigate('/admin/coursedetails')} variant="link" className="text-info mb-4 p-0 d-flex align-items-center gap-2 text-decoration-none fw-bold">
        <FaArrowLeft /> Exit to Course List
      </Button>

      {/* --- COURSE HEADER --- */}
      <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }}>
        <Card style={glassStyle} className="mb-5 overflow-hidden border-0 shadow-lg">
          <Row className="g-0">
            <Col md={4}>
              <img src={course.thumbnail_url} alt={course.title} className="img-fluid h-100 w-100" style={{ objectFit: 'cover', minHeight: '200px' }} />
            </Col>
            <Col md={8} className="p-4 d-flex flex-column justify-content-center">
              <Badge bg="info" className="mb-2 align-self-start">Course ID: #{course.id}</Badge>
              <h1 className="fw-bold text-white">{course.title}</h1>
              <p className="text-secondary mb-3">{course.description}</p>
              <h4 className="text-success fw-bold">${course.price}</h4>
            </Col>
          </Row>
        </Card>
      </motion.div>

      {/* --- LESSONS SECTION --- */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h3 className="fw-bold text-white m-0">Content Curriculum</h3>
        <Button variant="info" onClick={openAddModal} className="rounded-pill px-4 fw-bold shadow-sm text-white">
          <FaPlus className="me-2" /> New Lesson
        </Button>
      </div>

      <Row>
        <Col xs={12}>
          <AnimatePresence>
            {lessons.length === 0 ? (
              <div className="text-center py-5 text-muted" style={{ border: '2px dashed rgba(255,255,255,0.1)', borderRadius: '20px' }}>
                No video assets found for this course node.
              </div>
            ) : (
              lessons.map((lesson, index) => (
                <motion.div key={lesson.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }} layout>
                  <Card style={{ ...glassStyle, background: 'rgba(255,255,255,0.03)' }} className="mb-3 border-0 shadow-sm">
                    <Card.Body className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
                      <div className="d-flex align-items-center gap-3">
                        <div style={{ width: '45px', height: '45px', background: 'rgba(13, 202, 240, 0.1)', color: '#0dcaf0' }} className="rounded-circle d-flex align-items-center justify-content-center fw-bold">
                          {index + 1}
                        </div>
                        <div>
                          <h5 className="mb-1 fw-bold text-white">{lesson.title}</h5>
                          <div className="d-flex flex-wrap align-items-center gap-3 mt-1">
                            <a href={lesson.video_url} target="_blank" rel="noopener noreferrer" style={{ color: '#0dcaf0', fontSize: '0.85rem', textDecoration: 'none' }} className="d-flex align-items-center gap-1">
                              <FaExternalLinkAlt size={12} /> Source Asset
                            </a>
                            <Button variant="link" className="p-0 text-secondary d-flex align-items-center gap-1" style={{ fontSize: '0.85rem', textDecoration: 'none' }} onClick={() => copyToClipboard(lesson.video_url)}>
                              <FaCopy size={12} /> Copy Link
                            </Button>
                          </div>
                        </div>
                      </div>

                      <div className="d-flex gap-2">
                        <Button variant="outline-info" size="sm" className="rounded-pill px-3" onClick={() => openEditModal(lesson)}>
                          <FaEdit className="me-1" /> Update
                        </Button>
                        <Button variant="outline-danger" size="sm" className="rounded-pill px-3" onClick={() => handleDeleteLesson(lesson.id!)}>
                          <FaTrash className="me-1" /> Delete
                        </Button>
                      </div>
                    </Card.Body>
                  </Card>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </Col>
      </Row>

      {/* --- ADD/EDIT LESSON MODAL --- */}
      <Modal show={showModal} onHide={handleCloseModal} centered>
        <div style={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '24px', padding: '10px' }}>
          <Modal.Header closeButton closeVariant="white" className="border-0">
            <Modal.Title className="fw-bold text-white">{isEditing ? "Update Lesson" : "Configure New Lesson"}</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form>
              <Form.Group className="mb-3">
                <Form.Label className="small fw-bold text-info">TITLE</Form.Label>
                <Form.Control 
                  type="text" 
                  style={{ background: 'rgba(255,255,255,0.05)', color: 'white', border: '1px solid #334155' }}
                  value={lessonData.title}
                  onChange={(e) => setLessonData({ ...lessonData, title: e.target.value })}
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label className="small fw-bold text-info">VIDEO ASSET</Form.Label>
                <div style={{ border: '2px dashed #334155', borderRadius: '15px' }} className="p-4 text-center">
                  {uploading ? (
                    <ProgressBar animated now={100} variant="info" />
                  ) : (
                    <div>
                      <small className="text-muted d-block mb-2 text-truncate">{lessonData.video_url || "No video linked"}</small>
                      <label style={{ cursor: 'pointer' }} className="text-info small fw-bold">
                        <FaCloudUploadAlt className="me-1" /> {lessonData.video_url ? "Change Video" : "Upload Video"}
                        <input type="file" hidden accept="video/*" onChange={handleVideoUpload} />
                      </label>
                    </div>
                  )}
                </div>
              </Form.Group>

              <Form.Group className="mb-4">
                <Form.Label className="small fw-bold text-info">NOTES</Form.Label>
                <Form.Control 
                  as="textarea" 
                  rows={3} 
                  style={{ background: 'rgba(255,255,255,0.05)', color: 'white', border: '1px solid #334155' }}
                  value={lessonData.notes}
                  onChange={(e) => setLessonData({ ...lessonData, notes: e.target.value })}
                />
              </Form.Group>

              <Button variant="info" className="w-100 py-3 fw-bold rounded-pill text-white shadow" onClick={handleSaveLesson} disabled={uploading}>
                {isEditing ? "Save Changes" : "Publish Lesson"}
              </Button>
            </Form>
          </Modal.Body>
        </div>
      </Modal>
    </Container>
  );
};

export default ManageCourse;

