import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Row, Col, Card, Button, Form, Modal, Badge, Spinner } from 'react-bootstrap';
import { FaArrowLeft, FaCloudUploadAlt, FaPlus, FaTrash, FaEdit, FaFilePdf, FaVideo, FaCheckCircle } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import API from '../../api/client';

interface Lesson {
  id?: number;
  title: string;
  video_url: string;
  notes_url?: string;
  course_id: number;
}

const ManageCourse = () => {
  const { course_id } = useParams();
  const navigate = useNavigate();
  
  const [course, setCourse] = useState<any>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Creation Form States
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [lessonTitle, setLessonTitle] = useState('');

  // Editing Form States
  const [selectedLessonId, setSelectedLessonId] = useState<number | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editVideoFile, setEditVideoFile] = useState<File | null>(null);
  const [editPdfFile, setEditPdfFile] = useState<File | null>(null);
  const [existingVideoUrl, setExistingVideoUrl] = useState('');
  const [existingNotesUrl, setExistingNotesUrl] = useState('');

  const glassStyle: React.CSSProperties = {
    background: 'rgba(30, 41, 59, 0.6)',
    backdropFilter: 'blur(12px)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    color: 'white',
    borderRadius: '20px'
  };

  const uploadBoxStyle = (hasFile: boolean, type: 'video' | 'pdf'): React.CSSProperties => ({
    border: `2px dashed ${hasFile ? (type === 'pdf' ? '#ffc107' : '#0dcaf0') : '#334155'}`,
    borderRadius: '15px',
    padding: '20px',
    textAlign: 'center',
    cursor: 'pointer',
    background: hasFile ? 'rgba(255, 255, 255, 0.05)' : 'transparent',
    transition: 'all 0.3s ease'
  });

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
      console.error("Data fetch error:", err); 
    }
  };

  const handleSaveLesson = async () => {
    if (!lessonTitle || !videoFile) {
      alert("Title and Video are required.");
      return;
    }
    const formData = new FormData();
    formData.append('title', lessonTitle);
    formData.append('course_id', String(course_id));
    formData.append('video_file', videoFile);
    if (pdfFile) formData.append('notes_file', pdfFile);

    setUploading(true);
    try {
      await API.post('/api/v1/lessons', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      alert("Lesson successfully created with Azure assets!");
      handleCloseModal();
      fetchData();
    } catch (err) {
      alert("Upload failed. Ensure files are valid (MP4/PDF).");
    } finally {
      setUploading(false);
    }
  };

  const handleOpenEditModal = (lesson: Lesson) => {
    if (!lesson.id) return;
    setSelectedLessonId(lesson.id);
    setEditTitle(lesson.title);
    setExistingVideoUrl(lesson.video_url);
    setExistingNotesUrl(lesson.notes_url || '');
    setEditVideoFile(null);
    setEditPdfFile(null);
    setShowEditModal(true);
  };

  const handleUpdateLesson = async () => {
    if (!editTitle.trim()) {
      alert("Lesson title is required.");
      return;
    }

    const formData = new FormData();
    formData.append('title', editTitle);
    formData.append('course_id', String(course_id));
    
    if (editVideoFile) formData.append('video_file', editVideoFile);
    if (editPdfFile) formData.append('notes_file', editPdfFile);

    setUploading(true);
    try {
      await API.put(`/api/v1/lessons/${selectedLessonId}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      alert("Lesson updated successfully!");
      handleCloseEditModal();
      fetchData();
    } catch (err) {
      alert("Update failed. Ensure backend supports multi-part PUT endpoints.");
    } finally {
      setUploading(false);
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setUploading(false);
    setVideoFile(null);
    setPdfFile(null);
    setLessonTitle('');
  };

  const handleCloseEditModal = () => {
    setShowEditModal(false);
    setUploading(false);
    setSelectedLessonId(null);
    setEditVideoFile(null);
    setEditPdfFile(null);
    setEditTitle('');
  };

  if (!course) return <div className="text-white text-center mt-5">Loading Admin Workspace...</div>;

  return (
    <Container className="py-5">
      <Button onClick={() => navigate('/admin/coursedetails')} variant="link" className="text-info mb-4 p-0 d-flex align-items-center gap-2 text-decoration-none fw-bold">
        <FaArrowLeft /> Back to Course Directory
      </Button>

      {/* --- COURSE INFO HEADER --- */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <Card style={glassStyle} className="mb-5 overflow-hidden border-0 shadow">
          <Row className="g-0">
            <Col md={4}><img src={course.thumbnail_url} className="img-fluid h-100 w-100" style={{ objectFit: 'cover' }} alt="thumbnail" /></Col>
            <Col md={8} className="p-4 d-flex flex-column justify-content-center">
              <Badge bg="primary" className="mb-2 align-self-start">ADMIN CONTROL</Badge>
              <h1 className="fw-bold">{course.title}</h1>
              <p className="text-secondary">{course.description}</p>
            </Col>
          </Row>
        </Card>
      </motion.div>

      {/* --- CURRICULUM LIST --- */}
      <div className="d-flex justify-content-between align-items-center mb-4 text-white">
        <h3 className="fw-bold m-0">Course Curriculum</h3>
        <Button variant="info" onClick={() => setShowModal(true)} className="rounded-pill px-4 fw-bold text-white">
          <FaPlus className="me-2" /> Add Lesson
        </Button>
      </div>

      <Row>
        <Col xs={12}>
          <AnimatePresence>
            {lessons.map((lesson, index) => (
              <motion.div key={lesson.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} layout>
                <Card style={{ ...glassStyle, background: 'rgba(255,255,255,0.03)' }} className="mb-3 border-0">
                  <Card.Body className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
                    <div className="d-flex align-items-center gap-3 flex-grow-1">
                      <div className="bg-info text-white rounded-circle d-flex align-items-center justify-content-center fw-bold flex-shrink-0" style={{ width: '45px', height: '45px' }}>{index + 1}</div>
                      
                      <div className="flex-grow-1">
                        <h5 className="mb-1 fw-bold">{lesson.title}</h5>
                        <div className="d-flex gap-3 mt-1">
                          <a href={lesson.video_url} target="_blank" rel="noreferrer" className="text-info small text-decoration-none d-flex align-items-center gap-1">
                            <FaVideo size={12} /> Video
                          </a>
                          {lesson.notes_url && (
                            <a href={lesson.notes_url} target="_blank" rel="noreferrer" className="text-warning small text-decoration-none d-flex align-items-center gap-1">
                              <FaFilePdf size={12} /> PDF Notes
                            </a>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="d-flex gap-2">
                      <Button variant="outline-light" size="sm" onClick={() => handleOpenEditModal(lesson)}>
                        <FaEdit /> Edit Lesson
                      </Button>
                      <Button variant="outline-danger" size="sm" onClick={() => API.delete(`/api/v1/lessons/${lesson.id}`).then(() => fetchData())}>
                        <FaTrash />
                      </Button>
                    </div>
                  </Card.Body>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </Col>
      </Row>

      {/* --- CREATE MODAL (VIDEO + PDF) --- */}
      <Modal show={showModal} onHide={handleCloseModal} centered backdrop="static">
        <div style={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '24px', padding: '15px' }}>
          <Modal.Header closeButton closeVariant="white" className="border-0">
            <Modal.Title className="fw-bold text-white">Add New Content</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form>
              <Form.Group className="mb-4">
                <Form.Label className="small fw-bold text-info">LESSON TITLE</Form.Label>
                <Form.Control
                  type="text"
                  style={{ background: 'rgba(255,255,255,0.05)', color: 'white', border: '1px solid #334155' }}
                  placeholder="Enter lesson title..."
                  value={lessonTitle}
                  onChange={(e) => setLessonTitle(e.target.value)}
                />
              </Form.Group>

              <Form.Group className="mb-4">
                <Form.Label className="small fw-bold text-info">STEP 1: UPLOAD VIDEO (REQUIRED)</Form.Label>
                <label style={uploadBoxStyle(!!videoFile, 'video')} className="w-100 m-0">
                  {videoFile ? (
                    <div className="text-info">
                      <FaCheckCircle size={24} className="mb-2" />
                      <p className="small mb-0 text-truncate px-3">{videoFile.name}</p>
                    </div>
                  ) : (
                    <div className="text-secondary">
                      <FaCloudUploadAlt size={32} className="mb-2 text-info" />
                      <p className="small mb-0">Click or drag MP4 video asset here</p>
                    </div>
                  )}
                  <Form.Control type="file" accept="video/mp4" className="d-none" onChange={(e: any) => setVideoFile(e.target.files[0])} />
                </label>
              </Form.Group>

              <Form.Group className="mb-4">
                <Form.Label className="small fw-bold text-warning">STEP 2: UPLOAD NOTES (OPTIONAL)</Form.Label>
                <label style={uploadBoxStyle(!!pdfFile, 'pdf')} className="w-100 m-0">
                  {pdfFile ? (
                    <div className="text-warning">
                      <FaCheckCircle size={24} className="mb-2" />
                      <p className="small mb-0 text-truncate px-3">{pdfFile.name}</p>
                    </div>
                  ) : (
                    <div className="text-secondary">
                      <FaCloudUploadAlt size={32} className="mb-2 text-warning" />
                      <p className="small mb-0">Click or drag supplementary PDF here</p>
                    </div>
                  )}
                  <Form.Control type="file" accept="application/pdf" className="d-none" onChange={(e: any) => setPdfFile(e.target.files[0])} />
                </label>
              </Form.Group>
            </Form>
          </Modal.Body>
          <Modal.Footer className="border-0 pt-0">
            <Button variant="secondary" onClick={handleCloseModal} className="rounded-pill px-4" disabled={uploading}>Cancel</Button>
            <Button variant="info" onClick={handleSaveLesson} className="rounded-pill px-4 text-white fw-bold" disabled={uploading}>
              {uploading ? <Spinner animation="border" size="sm" /> : 'Upload Content'}
            </Button>
          </Modal.Footer>
        </div>
      </Modal>

      {/* --- FULL UPDATE MODAL (TITLE, VIDEO & PDF) --- */}
      <Modal show={showEditModal} onHide={handleCloseEditModal} centered backdrop="static">
        <div style={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '24px', padding: '15px' }}>
          <Modal.Header closeButton closeVariant="white" className="border-0">
            <Modal.Title className="fw-bold text-white">Update Lesson Content</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form>
              <Form.Group className="mb-4">
                <Form.Label className="small fw-bold text-info">EDIT LESSON TITLE</Form.Label>
                <Form.Control
                  type="text"
                  style={{ background: 'rgba(255,255,255,0.05)', color: 'white', border: '1px solid #334155' }}
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                />
              </Form.Group>

              {/* REPLACE VIDEO */}
              <Form.Group className="mb-4">
                <div className="d-flex justify-content-between align-items-center mb-1">
                  <Form.Label className="small fw-bold text-info m-0">REPLACE VIDEO (OPTIONAL)</Form.Label>
                  <a href={existingVideoUrl} target="_blank" rel="noreferrer" className="text-secondary small text-decoration-none">Current File</a>
                </div>
                <label style={uploadBoxStyle(!!editVideoFile, 'video')} className="w-100 m-0">
                  {editVideoFile ? (
                    <div className="text-info">
                      <FaCheckCircle size={24} className="mb-2" />
                      <p className="small mb-0 text-truncate px-3">{editVideoFile.name}</p>
                    </div>
                  ) : (
                    <div className="text-secondary">
                      <FaCloudUploadAlt size={32} className="mb-2 text-info" />
                      <p className="small mb-0">Select new file to swap existing MP4</p>
                    </div>
                  )}
                  <Form.Control type="file" accept="video/mp4" className="d-none" onChange={(e: any) => setEditVideoFile(e.target.files[0])} />
                </label>
              </Form.Group>

              {/* REPLACE OR ADD PDF */}
              <Form.Group className="mb-4">
                <div className="d-flex justify-content-between align-items-center mb-1">
                  <Form.Label className="small fw-bold text-warning m-0">REPLACE OR ADD NOTES (OPTIONAL)</Form.Label>
                  {existingNotesUrl && <a href={existingNotesUrl} target="_blank" rel="noreferrer" className="text-secondary small text-decoration-none">Current PDF</a>}
                </div>
                <label style={uploadBoxStyle(!!editPdfFile, 'pdf')} className="w-100 m-0">
                  {editPdfFile ? (
                    <div className="text-warning">
                      <FaCheckCircle size={24} className="mb-2" />
                      <p className="small mb-0 text-truncate px-3">{editPdfFile.name}</p>
                    </div>
                  ) : (
                    <div className="text-secondary">
                      <FaCloudUploadAlt size={32} className="mb-2 text-warning" />
                      <p className="small mb-0">Select new file to swap or upload PDF</p>
                    </div>
                  )}
                  <Form.Control type="file" accept="application/pdf" className="d-none" onChange={(e: any) => setEditPdfFile(e.target.files[0])} />
                </label>
              </Form.Group>
            </Form>
          </Modal.Body>
          <Modal.Footer className="border-0 pt-0">
            <Button variant="secondary" onClick={handleCloseEditModal} className="rounded-pill px-4" disabled={uploading}>Cancel</Button>
            <Button variant="warning" onClick={handleUpdateLesson} className="rounded-pill px-4 text-dark fw-bold" disabled={uploading}>
              {uploading ? <Spinner animation="border" size="sm" /> : 'Save Modifications'}
            </Button>
          </Modal.Footer>
        </div>
      </Modal>
    </Container>
  );
};

export default ManageCourse;
