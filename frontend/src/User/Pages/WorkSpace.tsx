import { useState, useEffect, useRef } from 'react';
import { Container, Row, Col, ListGroup, Card, Button, Spinner, Alert, Badge, ProgressBar } from 'react-bootstrap';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { FaPlayCircle, FaFilePdf, FaArrowLeft, FaGraduationCap, FaChevronRight, FaLock, FaCreditCard, FaCheckCircle } from 'react-icons/fa';
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
    const [searchParams] = useSearchParams();
 
    // Core Course Mechanics State Engine
    const [lessons, setLessons] = useState<Lesson[]>([]);
    const [activeLesson, setActiveLesson] = useState<Lesson | null>(null);
    const [isEnrolled, setIsEnrolled] = useState<boolean>(false);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [checkoutLoading, setCheckoutLoading] = useState<boolean>(false);
 
    // Progress Tracker local state memories
    const [completedLessonIds, setCompletedLessonIds] = useState<number[]>([]);
    const [completionPercent, setCompletionPercent] = useState<number>(0);
    const [hasWatchedVideo, setHasWatchedVideo] = useState<boolean>(false);
    const [hasViewedNotes, setHasViewedNotes] = useState<boolean>(false);
 
    // Quiz and Certificate Validation States
    const [quizPassed, setQuizPassed] = useState<boolean>(false);
    const [checkingQuiz, setCheckingQuiz] = useState<boolean>(false);
    const [certificateLoading, setCertificateLoading] = useState<boolean>(false);
 
    // 📡 DYNAMIC WEBRTC STREAMING CONTROL STATES
    const [isLiveActive, setIsLiveActive] = useState<boolean>(false);
    const [backendLiveStatus, setBackendLiveStatus] = useState<boolean>(false);
    const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
    const studentPcRef = useRef<RTCPeerConnection | null>(null);
    const studentWsRef = useRef<WebSocket | null>(null);
    const [liveStreamObject, setLiveStreamObject] = useState<MediaStream | null>(null);
    // Step 1: Initial core data loader
    useEffect(() => {
        if (!id) return;
        (async () => {
            try {
                const [enrollRes, lessonsRes, progressRes, liveCheckRes] = await Promise.all([
                    API.get<any>('/api/v1/my-courses'),
                    API.get<Lesson[]>(`/api/v1/courses/${Number(id)}/lessons`),
                    API.get<any>(`/api/v1/progress/${Number(id)}`).catch(() => ({ data: { progress: 0 } })),
                    API.get<any>(`/api/v1/check-active-stream/${Number(id)}`).catch(() => ({ data: { live_active: false } }))
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
                    setBackendLiveStatus(liveCheckRes.data?.live_active || false);
 
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
 
                    // 🚀 AUTO-JOIN MECHANISM: If student landed here from a Toast notification or passive check is true
                    if (searchParams.get('joinLive') === 'true' || liveCheckRes.data?.live_active) {
                        setTimeout(() => handleJoinLiveClass(), 500);
                    }
                }
 
                if (rawLessons.length > 0) setActiveLesson(rawLessons[0]);
            } catch (err: any) {
                setError(err.response?.data?.detail || 'Failed to load the course data.');
            } finally {
                setLoading(false);
            }
        })();
    }, [id, searchParams]);
    // Step 2: Reset interaction parameters when active lesson changes
    useEffect(() => {
        if (!activeLesson) return;
        const isCurrentLessonDone = completedLessonIds.includes(activeLesson.id);
        setHasWatchedVideo(isCurrentLessonDone);
        setHasViewedNotes(activeLesson.notes_url ? isCurrentLessonDone : true);
    }, [activeLesson, completedLessonIds]);
 
    // Step 3: Observer effect hits your exact unmodified "/mark-complete" route
    useEffect(() => {
        if (!activeLesson || !isEnrolled || isLiveActive) return;
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
                    console.error('Progress automation sync failed:', err);
                }
            })();
        }
    }, [hasWatchedVideo, hasViewedNotes, activeLesson, isEnrolled, completedLessonIds, lessons.length, id, isLiveActive]);
 
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
    // 📡 HIGH-SPEED WEBRTC REAL-TIME STUDENT HANDSHAKE CONNECT ENGINE
    const handleJoinLiveClass = async () => {
        setIsLiveActive(true);
 
        // 1. Opens connection tunnel straight into your course specific signaling switchboard websocket room
        const ws = new WebSocket(`ws://127.0.0.1:8000/api/v1/live/ws/${id}`);
        studentWsRef.current = ws;
 
        const pc = new RTCPeerConnection({ iceServers: [] });
        studentPcRef.current = pc;
 
        // 2. Map arriving video tracks straight onto your local state container
        pc.ontrack = (event) => {
            console.log("🎥 WEBRTC STREAM PACKET RECOVERED NATIVELY:", event.streams);
            if (event.streams && event.streams[0]) {
                setLiveStreamObject(event.streams[0]);
            }
        };
 
        // Ensures candidate data pushes check socket readiness first!
        pc.onicecandidate = (event) => {
            if (event.candidate && studentWsRef.current && studentWsRef.current.readyState === WebSocket.OPEN) {
                studentWsRef.current.send(JSON.stringify({ 'ice': event.candidate }));
            }
        };
 
        // 3. Announce student presence immediately upon connection opening
        ws.onopen = () => {
            console.log("📡 Student successfully entered room. Announcing presence to instructor.");
            if (ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({ type: "USER_JOINED" }));
            }
        };
        // 4. Complete WebRTC handshakes dynamically across the WebSocket incoming lines
        ws.onmessage = async (event) => {
            const data = JSON.parse(event.data);
 
            if (data.offer) {
                // 🔒 FIXED THE INVALIDSTATEERROR STATE CRASH ENGINE
                if (pc.signalingState === "stable") {
                    try {
                        await pc.setRemoteDescription(new RTCSessionDescription(data.offer));
                        const answer = await pc.createAnswer();
                        await pc.setLocalDescription(answer);
 
                        if (studentWsRef.current && studentWsRef.current.readyState === WebSocket.OPEN) {
                            studentWsRef.current.send(JSON.stringify({ 'answer': answer }));
                        }
                    } catch (err) {
                        console.error("Failed to compile WebRTC local Answer profile:", err);
                    }
                } else {
                    console.log(`ℹ️ Prevented a state crash by filtering out an out-of-order WebRTC Offer. State: ${pc.signalingState}`);
                }
            } else if (data.ice) {
                if (pc.remoteDescription) {
                    await pc.addIceCandidate(new RTCIceCandidate(data.ice)).catch(() => {});
                }
            }
        };
    };
 
    const handleLeaveLiveClass = () => {
        if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
        if (studentWsRef.current) studentWsRef.current.close();
        if (studentPcRef.current) studentPcRef.current.close();
        setIsLiveActive(false);
    };
 
    // 🎯 FIXES THE 0.5s DISAPPEARANCE GHOST BUG
    useEffect(() => {
        if (isLiveActive && liveStreamObject && remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = liveStreamObject;
            console.log("🔒 Bound live video track back onto video frame grid successfully.");
        }
    }, [isLiveActive, liveStreamObject]);
 
  useEffect(() => {
        return () => {
            if (studentWsRef.current) studentWsRef.current.close();
            if (studentPcRef.current) studentPcRef.current.close();
        };
    }, []);
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
    if (loading) return <div className="d-flex justify-content-center align-items-center vh-100 bg-light"><Spinner animation="border" variant="primary" /></div>;
    if (error) return <Container className="py-5"><Alert variant="danger" className="border-0 shadow-sm rounded-3">{error}</Alert></Container>;
 
    return (
        <div className="bg-light min-vh-100 py-4">
            <Container fluid="lg">
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <Button onClick={() => navigate('/courses')} variant="link" className="p-0 text-dark text-decoration-none fw-semibold d-flex align-items-center gap-2 small">
                        <FaArrowLeft size={12} /> Back to Catalog
                    </Button>
                   
                    {/* ✅ HIGH VISIBILITY DYNAMIC TOGGLE FOR STUDENT TO ENTER THE LIVE CLASSROOM */}
                    {isEnrolled && (backendLiveStatus || isLiveActive) && (
                        <Button
                            variant={isLiveActive ? "danger" : "info"}
                            size="sm"
                            className="rounded-pill text-white fw-bold px-4 shadow-sm"
                            onClick={isLiveActive ? handleLeaveLiveClass : handleJoinLiveClass}
                        >
                            {isLiveActive ? "⏹ Disconnect Live Feed" : "🔴 Join Live Classroom"}
                        </Button>
                    )}
                </div>
 
                {isEnrolled && lessons.length > 0 && !isLiveActive && (
                    <Card className="border-0 shadow-sm rounded-3 p-3 bg-white mb-4">
                        <div className="d-flex justify-content-between align-items-center mb-2 small fw-semibold text-dark">
                            <span>Your Completion Tracker</span>
                            <span>{completedLessonIds.length} / {lessons.length} Modules Done ({completionPercent}%)</span>
                        </div>
                        <ProgressBar variant="success" now={completionPercent} style={{ height: '8px' }} className="rounded-pill" />
                    </Card>
                )}
 
                {isEnrolled && completionPercent === 100 && !isLiveActive && (
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
                        {/* 🖥️ LEFT COLUMN: PRINCIPAL VIDEO PLAYER INTERFACE DISPLAY */}
                        <Col lg={8}>
                            {activeLesson && (
                                <>
                                    <Card className="ratio ratio-16x9 bg-black mb-4 overflow-hidden rounded-4 border-0 shadow-sm position-relative">
                                        {isEnrolled ? (
                                            isLiveActive ? (
                                                /* ✅ NATIVE HTML5 WEBRTC LIVE STREAM CAPTURE ENGINE VIA PEER PIPES */
                                                <video
                                                    ref={remoteVideoRef}
                                                    autoPlay
                                                    playsInline
                                                    muted={true}
                                                    className="w-100 h-100 bg-dark"
                                                    style={{ objectFit: 'cover', zIndex: 50 }}
                                                />
                                            ) : (
                                                /* Standard Pre-Recorded Video Component playback mode */
                                                <>
                                                    <video
                                                        key={activeLesson.video_url}
                                                        controls
                                                        preload="metadata"
                                                        className="w-100 h-100"
                                                        onEnded={() => setHasWatchedVideo(true)}
                                                    >
                                                        <source src={activeLesson.video_url} type="video/mp4" />
                                                        Your browser does not support the video tag.
                                                    </video>
                                                    <Button
                                                        variant="dark"
                                                        size="sm"
                                                        className="position-absolute bottom-0 start-0 m-3 opacity-25"
                                                        onClick={() => setHasWatchedVideo(true)}
                                                        style={{ fontSize: '10px', zIndex: 10 }}
                                                    >
                                                        {hasWatchedVideo ? "✓ Video Finished" : "⚡ Simulate Finish"}
                                                    </Button>
                                                </>
                                            )
                                        ) : (
                                            /* Payment Lock Screen Overlay Layer */
                                            <div className="d-flex flex-column align-items-center justify-content-center text-white p-4" style={{ background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)' }}>
                                                <FaLock size={28} className="text-warning mb-2" />
                                                <h5 className="fw-bold mb-2">Content Locked</h5>
                                                <p className="text-white-50 small mb-3 text-center" style={{ maxWidth: '300px' }}>
                                                    Enroll in this course to unlock complete video lessons and notes.
                                                </p>
                                                <Button onClick={handlePurchase} disabled={checkoutLoading} variant="primary" size="sm" className="rounded-pill px-4 py-2 fw-semibold d-flex align-items-center gap-2 shadow-sm">
                                                    <FaCreditCard size={12} /> {checkoutLoading ? 'Processing...' : 'Unlock Full Access'}
                                                </Button>
                                            </div>
                                        )}
                                    </Card>
 
                                    {/* 📋 LESSON NOTES MATERIAL VIEW SECTION */}
                                    {!isLiveActive && (
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
                                    )}
                                </>
                            )}
                        </Col>
                        {/* 🎶 RIGHT COLUMN: PLAYLIST SELECTION DIRECTORY LINK */}
                        <Col lg={4}>
                            <Card className="shadow-sm rounded-3 overflow-hidden bg-white">
                                <Card.Header className="bg-white border-bottom fw-bold text-dark py-3">Modules ({lessons.length})</Card.Header>
                                <ListGroup variant="flush">
                                    {lessons.map((lesson, idx) => {
                                        const isActive = activeLesson?.id === lesson.id;
                                        const isCompleted = completedLessonIds.includes(lesson.id);
 
                                        return (
                                            <ListGroup.Item
                                                key={lesson.id}
                                                action={isEnrolled && !isLiveActive}
                                                onClick={() => isEnrolled && !isLiveActive && setActiveLesson(lesson)}
                                                className={`d-flex align-items-center justify-content-between py-3 border-0 ${isActive && !isLiveActive ? 'bg-primary bg-opacity-10 text-primary fw-semibold' : 'text-secondary bg-white'}`}
                                                style={{
                                                    borderLeft: isActive && !isLiveActive ? '4px solid #0d6efd' : '4px solid transparent',
                                                    opacity: isLiveActive ? 0.4 : 1,
                                                    cursor: isEnrolled && !isLiveActive ? 'pointer' : 'default'
                                                }}
                                                disabled={isLiveActive}
                                            >
                                                <div className="d-flex align-items-center gap-3 text-truncate small">
                                                    {isEnrolled && isCompleted ? (
                                                        <FaCheckCircle className="text-success flex-shrink-0" />
                                                    ) : (
                                                        <FaPlayCircle className={isActive && !isLiveActive ? 'text-primary flex-shrink-0' : 'text-muted opacity-50 flex-shrink-0'} size={16} />
                                                    )}
                                                    <span className={`text-truncate ${isEnrolled && isCompleted ? 'text-decoration-line-through text-muted opacity-50' : ''}`}>
                                                        {idx + 1}. {lesson.title}
                                                    </span>
                                                </div>
                                                {isEnrolled ? (
                                                    <FaChevronRight size={10} className={`ms-2 ${isActive && !isLiveActive ? 'text-primary' : 'text-muted opacity-40'}`} />
                                                ) : (
                                                    <FaLock size={12} className="text-muted flex-shrink-0" />
                                                )}
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
 
 