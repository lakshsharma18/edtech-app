import { useState, useEffect } from 'react';
import { Container, Row, Col, ListGroup, Card, Button, Spinner, Alert, Badge, ProgressBar } from 'react-bootstrap';
import { useParams, useNavigate } from 'react-router-dom';
import { FaPlayCircle, FaFilePdf, FaArrowLeft, FaGraduationCap, FaChevronRight, FaLock, FaCheckCircle } from 'react-icons/fa';
import API from '../../api/client';

interface Lesson {
    id: number;
    title: string;
    video_url: string;
    notes_url: string | null;
    course_id: number;
}

const WorkSpace = () => {
    const { id } = useParams<{ id?: string }>();
    const navigate = useNavigate();

    const [lessons, setLessons] = useState<Lesson[]>([]);
    const [activeLesson, setActiveLesson] = useState<Lesson | null>(null);

    const [isEnrolled, setIsEnrolled] = useState<boolean>(false);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [checkoutLoading, setCheckoutLoading] = useState<boolean>(false);

    const [completedLessonIds, setCompletedLessonIds] = useState<number[]>([]);
    const [completionPercent, setCompletionPercent] = useState<number>(0);
    const [hasWatchedVideo, setHasWatchedVideo] = useState<boolean>(false);
    const [hasViewedNotes, setHasViewedNotes] = useState<boolean>(false);

    const [quizPassed, setQuizPassed] = useState<boolean>(false);
    const [checkingQuiz, setCheckingQuiz] = useState<boolean>(false);
    const [certificateLoading, setCertificateLoading] = useState<boolean>(false);

    useEffect(() => {
        if (!id) return;
        (async () => {
            try {
                const [enrollRes, lessonsRes, progressRes] = await Promise.all([
                    API.get<any>('/api/v1/my-courses'),
                    API.get<Lesson[]>(`/api/v1/courses/${Number(id)}/lessons`),
                    API.get<any>(`/api/v1/progress/${Number(id)}`).catch(() => ({ data: { progress: 0 } }))
                ]);

                const ownedIds = (Array.isArray(enrollRes.data) ? enrollRes.data : []).map((item: any) =>
                    Number(item?.id || item?.course_id || item)
                );
                const rawLessons = Array.isArray(lessonsRes.data) ? lessonsRes.data : [];
                const enrollmentStatus = ownedIds.includes(Number(id));

                setIsEnrolled(enrollmentStatus);
                setLessons(rawLessons);

                if (enrollmentStatus) {
                    const progressVal = progressRes.data?.progress || 0;
                    setCompletionPercent(progressVal);

                    if (progressVal === 100) {
                        setCompletedLessonIds(rawLessons.map((l: Lesson) => l.id));
                        try {
                            setCheckingQuiz(true);
                            const res = await API.get(`/api/v1/quiz/attempts/${Number(id)}`);
                            setQuizPassed(res.data?.passed || false);
                        } catch {
                            setQuizPassed(false);
                        } finally {
                            setCheckingQuiz(false);
                        }
                    }
                }

                if (rawLessons.length > 0) setActiveLesson(rawLessons[0]);
            } catch (err: any) {
                setError(err.response?.data?.detail || 'Failed to load the course data.');
            } finally {
                setLoading(false);
            }
        })();
    }, [id]);

    useEffect(() => {
        if (!activeLesson) return;
        const isCurrentLessonDone = completedLessonIds.includes(activeLesson.id);
        setHasWatchedVideo(isCurrentLessonDone);
        setHasViewedNotes(activeLesson.notes_url ? isCurrentLessonDone : true);
    }, [activeLesson, completedLessonIds]);

    useEffect(() => {
        if (!activeLesson || !isEnrolled) return;
        if (completedLessonIds.includes(activeLesson.id)) return;

        if (hasWatchedVideo && hasViewedNotes) {
            (async () => {
                try {
                    await API.post('/api/v1/mark-complete', {
                        lesson_id: activeLesson.id,
                        watched: true,
                        notes_viewed: true
                    });

                    const nextIds = [...completedLessonIds, activeLesson.id];
                    setCompletedLessonIds(nextIds);

                    const calculatedPercentage = lessons.length ? Math.round((nextIds.length / lessons.length) * 100) : 0;
                    setCompletionPercent(calculatedPercentage);

                    if (calculatedPercentage === 100) {
                        try {
                            setCheckingQuiz(true);
                            const res = await API.get(`/api/v1/quiz/attempts/${Number(id)}`);
                            setQuizPassed(res.data?.passed || false);
                        } catch {
                            setQuizPassed(false);
                        } finally {
                            setCheckingQuiz(false);
                        }
                    }
                } catch (err) {
                    console.error('Progress sync failed:', err);
                }
            })();
        }
    }, [hasWatchedVideo, hasViewedNotes, activeLesson, isEnrolled, completedLessonIds, lessons.length, id]);

    const handlePurchase = async () => {
        setCheckoutLoading(true);
        try {
            const res = await API.post(`/api/v1/create-checkout-session/${Number(id)}`);
            if (res.data?.url) window.location.href = res.data.url;
        } catch (err: any) {
            alert(err.response?.data?.detail || 'Stripe initialization failed.');
        } finally {
            setCheckoutLoading(false);
        }
    };

    const handleCertificate = async () => {
        try {
            setCertificateLoading(true);

            const response = await API.post(`/api/v1/certificate/${Number(id)}`, {}, { responseType: 'blob' });
            const fileBlob = new Blob([response.data], { type: 'application/pdf' });
            const temporaryObjectUrl = window.URL.createObjectURL(fileBlob);

            const a = document.createElement('a');
            a.href = temporaryObjectUrl;
            a.setAttribute('download', `Certificate_Course_${id}.pdf`);
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(temporaryObjectUrl);
        } catch (err: any) {
            alert(err.response?.data?.detail || 'Certificate error');
        } finally {
            setCertificateLoading(false);
        }
    };

    const checkQuizStatus = async () => {
        try {
            setCheckingQuiz(true);
            const res = await API.get(`/api/v1/quiz/attempts/${Number(id)}`);
            setQuizPassed(res.data?.passed || false);
        } catch {
            setQuizPassed(false);
        } finally {
            setCheckingQuiz(false);
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

                {isEnrolled && lessons.length > 0 && (
                    <Card className="border-0 shadow-sm rounded-3 p-3 bg-white mb-4">
                        <div className="d-flex justify-content-between align-items-center mb-2 small fw-semibold text-dark">
                            <span>Course Progress Tracker</span>
                            <span>{completedLessonIds.length} / {lessons.length} Modules Done ({completionPercent}%)</span>
                        </div>
                        <ProgressBar variant="success" now={completionPercent} style={{ height: '8px' }} className="rounded-pill" />
                    </Card>
                )}

                {isEnrolled && completionPercent === 100 && (
                    <Card className="p-3 mb-4 shadow-sm border-0 rounded-3 bg-white">
                        <div className="d-flex justify-content-between align-items-center">
                            {!quizPassed ? (
                                <Button variant="primary" size="sm" onClick={() => navigate(`/user/quiz/${id}`)}>Start Quiz</Button>
                            ) : (
                                <Badge bg="success">Quiz Passed ✅</Badge>
                            )}

                            {quizPassed && (
                                <Button variant="outline-success" size="sm" onClick={handleCertificate} disabled={certificateLoading}>
                                    {certificateLoading ? 'Generating...' : 'Download Certificate'}
                                </Button>
                            )}
                        </div>
                    </Card>
                )}

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
                                    <Card className="ratio ratio-16x9 bg-black mb-4 overflow-hidden rounded-4 border-0 shadow-sm position-relative">
                                        {isEnrolled ? (
                                            <video controls preload="metadata" className="border-0 w-100 h-100" onEnded={() => setHasWatchedVideo(true)}>
                                                <source src={activeLesson.video_url} type="video/mp4" />
                                                Your browser does not support the video tag.
                                            </video>
                                        ) : (
                                            <div className="d-flex flex-column align-items-center justify-content-center text-white p-4" style={{ background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)' }}>
                                                <FaLock size={28} className="text-warning mb-2" />
                                                <h5 className="fw-bold mb-2">Content Locked</h5>
                                                <p className="text-white-50 small mb-3 text-center" style={{ maxWidth: '300px' }}>
                                                    Enroll in this course to unlock complete video lessons and notes.
                                                </p>
                                                <Button onClick={handlePurchase} disabled={checkoutLoading} variant="primary">
                                                    {checkoutLoading ? 'Processing...' : 'Unlock Full Access'}
                                                </Button>
                                            </div>
                                        )}
                                    </Card>

                                    <Card className="p-3 mb-4">
                                        <h5 className="fw-semibold">{activeLesson.title}</h5>
                                        {isEnrolled ? (
                                            activeLesson.notes_url ? (
                                                <div className="d-flex align-items-center gap-3 mt-3">
                                                    <div>
                                                        <FaFilePdf size={20} className="text-secondary" />
                                                    </div>
                                                    <div className="flex-grow-1">
                                                        <div className="small text-muted">Lecture Notes</div>
                                                        <div>
                                                            <Button as="a" href={activeLesson.notes_url || undefined} target="_blank" rel="noopener noreferrer" variant={hasViewedNotes ? 'outline-secondary' : 'outline-primary'} size="sm" className="rounded-pill px-3" onClick={() => setHasViewedNotes(true)}>
                                                                View PDF
                                                            </Button>
                                                            {hasViewedNotes && <Badge bg="success" className="ms-2">Viewed</Badge>}
                                                        </div>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="text-muted mt-3">No notes available for this segment.</div>
                                            )
                                        ) : (
                                            <div className="text-muted mt-3">Notes are locked until enrollment</div>
                                        )}
                                    </Card>
                                </>
                            )}
                        </Col>

                        <Col lg={4}>
                            <Card className="shadow-sm rounded-3">
                                <Card.Header className="bg-white border-bottom fw-bold text-dark py-3">Modules ({lessons.length})</Card.Header>
                                <ListGroup variant="flush">
                                    {lessons.map((lesson, idx) => {
                                        const isActive = activeLesson?.id === lesson.id;
                                        const isCompleted = completedLessonIds.includes(lesson.id);

                                        return (
                                            <ListGroup.Item key={lesson.id} action onClick={() => setActiveLesson(lesson)} className={`d-flex align-items-center justify-content-between py-3 border-0 ${isActive ? 'bg-primary bg-opacity-10 text-primary fw-semibold' : 'text-secondary bg-white'}`} style={{ borderLeft: isActive ? '4px solid #0d6efd' : '4px solid transparent' }}>
                                                <div className="d-flex align-items-center gap-3">
                                                    {isEnrolled && isCompleted ? (
                                                        <FaCheckCircle className="text-success" />
                                                    ) : (
                                                        <FaPlayCircle className={isActive ? 'text-primary flex-shrink-0' : 'text-muted opacity-50 flex-shrink-0'} size={16} />
                                                    )}
                                                    <span className={`text-truncate ${isEnrolled && isCompleted ? 'text-decoration-line-through text-muted opacity-50' : ''}`}>
                                                        {idx + 1}. {lesson.title}
                                                    </span>
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