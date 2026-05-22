import { useState, useEffect } from 'react';
import { Container, Row, Col, ListGroup, Card, Button, Spinner, Alert, Badge } from 'react-bootstrap';
import { useParams, useNavigate } from 'react-router-dom';
import { FaPlayCircle, FaFilePdf, FaArrowLeft, FaGraduationCap, FaChevronRight, FaLock, FaCreditCard } from 'react-icons/fa';
import API from '../../api/client';

interface Lesson { id: number; title: string; video_url: string; notes_url: string | null; course_id: number; }

const WorkSpace = () => {
    const { id } = useParams<{ id: string }>();

    const navigate = useNavigate();

    const [lessons, setLessons] = useState<Lesson[]>([]);
    const [activeLesson, setActiveLesson] = useState<Lesson | null>(null);

    const [isEnrolled, setIsEnrolled] = useState<boolean>(false);
    const [loading, setLoading] = useState<boolean>(true);

    const [error, setError] = useState<string | null>(null);
    const [checkoutLoading, setCheckoutLoading] = useState<boolean>(false);

    useEffect(() => {
        if (!id) return;
        (async () => {
            try {
                const [enrollRes, lessonsRes] = await Promise.all([
                    API.get<any>('/api/v1/my-courses'),
                    API.get<Lesson[]>(`/api/v1/courses/${Number(id)}/lessons`)
                ]);
                const ownedIds = (Array.isArray(enrollRes.data) ? enrollRes.data : []).map((item: any) => Number(item?.id || item?.course_id || item));
                const rawLessons = Array.isArray(lessonsRes.data) ? lessonsRes.data : [];
                
                setIsEnrolled(ownedIds.includes(Number(id)));
                setLessons(rawLessons);
                if (rawLessons.length > 0) setActiveLesson(rawLessons[0]);
            } catch (err: any) {
                setError(err.response?.data?.detail || "Failed to load the course data.");
            } finally {
                setLoading(false);
            }
        })();
    }, [id]);

    const handlePurchase = async () => {
        setCheckoutLoading(true);
        try {
            const res = await API.post(`/api/v1/create-checkout-session/${Number(id)}`);
            if (res.data?.url) window.location.href = res.data.url;
        } catch (err: any) {
            alert(err.response?.data?.detail || "Stripe initialization failed.");
        } finally {
            setCheckoutLoading(false);
        }
    };

    if (loading) return <div className="d-flex justify-content-center align-items-center vh-100 bg-light"><Spinner animation="border" variant="primary" /></div>;
    if (error) return <Container className="py-5"><Alert variant="danger" className="border-0 shadow-sm rounded-3">{error}</Alert></Container>;

    return (
        <div className="bg-light min-vh-100 py-4">
            <Container fluid="lg">
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <Button onClick={() => navigate('/courses')} variant="link" className="p-0 text-dark text-decoration-none fw-semibold d-flex align-items-center gap-2 small">
                        <FaArrowLeft size={12} /> Back to Catalog
                    </Button>
                </div>

                {lessons.length === 0 ? (
                    <Alert variant="info" className="text-center py-5 border-0 shadow-sm rounded-3 bg-white">
                        <FaGraduationCap size={40} className="text-muted mb-2" />
                        <h4 className="text-dark fw-bold">Syllabus is Empty</h4>
                    </Alert>
                ) : (
                    <Row className="g-4">
                        <Col lg={8}>
                            {activeLesson && (
                                <>
                                    <Card className="ratio ratio-16x9 bg-black mb-4 overflow-hidden rounded-4 border-0 shadow-sm">
                                        {isEnrolled ? (
                                            <iframe src={activeLesson.video_url} title={activeLesson.title} allowFullScreen className="border-0 w-100 h-100" />
                                        ) : (
                                            <div className="d-flex flex-column align-items-center justify-content-center text-white p-4" style={{ background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)' }}>
                                                <FaLock size={28} className="text-warning mb-2" />
                                                <h5 className="fw-bold mb-2">Content Locked</h5>
                                                <p className="text-white-50 small mb-3 text-center" style={{ maxWidth: '300px' }}>Enroll in this course to unlock complete video lessons and notes.</p>
                                                <Button onClick={handlePurchase} disabled={checkoutLoading} variant="primary" size="sm" className="rounded-pill px-4 py-2 fw-semibold d-flex align-items-center gap-2 shadow-sm">
                                                    <FaCreditCard size={12} /> {checkoutLoading ? 'Processing...' : 'Unlock Full Access'}
                                                </Button>
                                            </div>
                                        )}
                                    </Card>

                                    <Card className="p-4 border-0 shadow-sm rounded-4 bg-white">
                                        <h4 className="fw-bold text-dark mb-3">{activeLesson.title}</h4>
                                        <hr className="text-muted opacity-25 my-3" />
                                        {isEnrolled ? (
                                            activeLesson.notes_url ? (
                                                <div className="d-flex justify-content-between align-items-center border border-light-subtle rounded-3 p-3 bg-light">
                                                    <div className="d-flex align-items-center gap-2 text-dark small fw-medium">
                                                        <FaFilePdf className="text-danger" size={16} />
                                                        <span>Lecture Notes</span>
                                                    </div>
                                                    <Button as="a" href={activeLesson.notes_url} target="_blank" rel="noopener noreferrer" variant="outline-primary" size="sm" className="rounded-pill px-3">View PDF</Button>
                                                </div>
                                            ) : <div className="text-muted small">No notes available for this segment.</div>
                                        ) : <div className="text-muted small d-flex align-items-center gap-2"><FaLock size={12} /> Notes are locked until enrollment</div>}
                                    </Card>
                                </>
                            )}
                        </Col>

                        <Col lg={4}>
                            <Card className="border-0 shadow-sm rounded-4 overflow-hidden bg-white">
                                <Card.Header className="bg-white border-bottom fw-bold text-dark py-3">Modules ({lessons.length})</Card.Header>
                                <ListGroup variant="flush">
                                    {lessons.map((lesson, idx) => {
                                        const isActive = activeLesson?.id === lesson.id;
                                        return (
                                            <ListGroup.Item 
                                                key={lesson.id} 
                                                action 
                                                onClick={() => setActiveLesson(lesson)}
                                                className={`d-flex align-items-center justify-content-between py-3 border-0 ${
                                                    isActive ? 'bg-primary bg-opacity-10 text-primary fw-semibold' : 'text-secondary bg-white'
                                                }`}
                                                style={{ borderLeft: isActive ? '4px solid #0d6efd' : '4px solid transparent' }}
                                            >
                                                <div className="d-flex align-items-center gap-2 text-truncate small">
                                                    <FaPlayCircle className={isActive ? 'text-primary' : 'text-muted opacity-50'} />
                                                    <span className="text-truncate">{idx + 1}. {lesson.title}</span>
                                                </div>
                                                <FaChevronRight size={10} className={`ms-2 ${isActive ? 'text-primary' : 'text-muted opacity-40'}`} />
                                            </ListGroup.Item>
                                        );
                                    })}
                                </ListGroup>
                            </Card>
                        </Col>
                    </Row>
                )}
            </Container>
        </div>
    );
};

export default WorkSpace;
