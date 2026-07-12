import { useState, useEffect, useRef } from "react";
import { Container, Row, Col, Card, Button, Spinner, Alert, Badge, ListGroup, ProgressBar } from "react-bootstrap";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { FaPlayCircle, FaFilePdf, FaArrowLeft, FaChevronRight, FaLock, FaCreditCard, FaCheckCircle } from "react-icons/fa";
import API from "../../api/client";
import CourseReviewForm from "../components/CourseReviewForm";

interface Lesson {
    id: number;
    title: string;
    video_url: string;
    notes_url: string | null;
    course_id: number;
}

const WorkSpace = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    // ================= COURSE STATES =================
    const [lessons, setLessons] = useState<Lesson[]>([]);
    const [activeLesson, setActiveLesson] = useState<Lesson | null>(null);
    const [isEnrolled, setIsEnrolled] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // ================= PAYMENT =================
    const [checkoutLoading, setCheckoutLoading] = useState(false);

    // ================= PROGRESS =================
    const [completedLessonIds, setCompletedLessonIds] = useState<number[]>([]);
    const [completionPercent, setCompletionPercent] = useState(0);
    const [hasWatchedVideo, setHasWatchedVideo] = useState(false);
    const [hasViewedNotes, setHasViewedNotes] = useState(false);

    // ================= QUIZ =================
    const [quizPassed, setQuizPassed] = useState(false);
    const [certificateLoading, setCertificateLoading] = useState(false);

    // ================= LIVE WEBRTC =================
    const [backendLiveStatus, setBackendLiveStatus] = useState(false);
    const [isLiveActive, setIsLiveActive] = useState(false);
    const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
    const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
    const socketRef = useRef<WebSocket | null>(null);
    const [liveStream, setLiveStream] = useState<MediaStream | null>(null);

    // =====================================================
    // INITIAL COURSE DATA LOAD
    // =====================================================
    useEffect(() => {
        if (!id) return;

        const loadCourse = async () => {
            try {
                const courseId = Number(id);

                const [enrollRes, lessonsRes, progressRes, liveRes] = await Promise.all([
                    API.get("/api/v1/my-courses"),
                    API.get(`/api/v1/courses/${courseId}/lessons`),
                    API.get(`/api/v1/progress/${courseId}`).catch(() => ({ data: { progress: 0 } })),
                    API.get(`/api/v1/live/check-active-stream/${courseId}`).catch(() => ({ data: { live_active: false } }))
                ]);

                const ownedCourses = Array.isArray(enrollRes.data) ? enrollRes.data : [];
                const enrolledIds = ownedCourses.map((item: any) => Number(item.id ?? item.course_id ?? item));
                const enrolled = enrolledIds.includes(courseId);
                const lessonData = Array.isArray(lessonsRes.data) ? lessonsRes.data : [];

                setLessons(lessonData);
                setIsEnrolled(enrolled);

                if (enrolled) {
                    const progress = progressRes.data?.progress || 0;
                    setCompletionPercent(progress);
                    setBackendLiveStatus(liveRes.data?.live_active || false);

                    if (progress === 100) {
                        setCompletedLessonIds(lessonData.map((lesson: Lesson) => lesson.id));
                        try {
                            const quiz = await API.get(`/api/v1/quiz/attempts/${courseId}`);
                            setQuizPassed(quiz.data?.passed || false);
                        } catch {
                            setQuizPassed(false);
                        }
                    }

                    if (searchParams.get("joinLive") === "true" || liveRes.data?.live_active) {
                        setTimeout(() => {
                            joinLiveClass();
                        }, 500);
                    }
                }

                if (lessonData.length) {
                    setActiveLesson(lessonData[0]);
                }
            } catch (err: any) {
                setError(err.response?.data?.detail || "Unable to load course.");
            } finally {
                setLoading(false);
            }
        };

        loadCourse();
    }, [id, searchParams]);

    // =====================================================
    // RESET LESSON ACTION STATES
    // =====================================================
    useEffect(() => {
        if (!activeLesson) return;
        const completed = completedLessonIds.includes(activeLesson.id);
        setHasWatchedVideo(completed);
        setHasViewedNotes(activeLesson.notes_url ? completed : true);
    }, [activeLesson, completedLessonIds]);

    // =====================================================
    // MARK LESSON COMPLETE ONLY AFTER REAL VIDEO END
    // =====================================================
    useEffect(() => {
        if (!activeLesson || !isEnrolled || isLiveActive) return;
        if (completedLessonIds.includes(activeLesson.id)) return;
        if (hasWatchedVideo && hasViewedNotes) {
            const completeLesson = async () => {
                try {
                    await API.post("/api/v1/mark-complete", {
                        lesson_id: activeLesson.id,
                        watched: true,
                        notes_viewed: true
                    });

                    const updated = [...completedLessonIds, activeLesson.id];
                    setCompletedLessonIds(updated);
                    const percentage = lessons.length ? Math.round((updated.length / lessons.length) * 100) : 0;
                    setCompletionPercent(percentage);
                } catch (err) {
                    console.error("Progress update failed", err);
                }
            };
            completeLesson();
        }
    }, [hasWatchedVideo, hasViewedNotes, activeLesson, completedLessonIds, lessons.length, isEnrolled, isLiveActive]);

    // =====================================================
    // WEBRTC STUDENT JOIN LOGIC
    // =====================================================
    const joinLiveClass = async () => {
        if (!id) return;
        setIsLiveActive(true);

        const wsUrl = import.meta.env.VITE_WS_URL;
        const ws = new WebSocket(`${wsUrl}/api/v1/live/ws/${id}`);
        socketRef.current = ws;

        const pc = new RTCPeerConnection({
            iceServers: [{ urls: "stun:stun.l.google.com:19302" }]
        });
        peerConnectionRef.current = pc;

        pc.ontrack = (event) => {
            if (event.streams[0]) {
                setLiveStream(event.streams[0]);
            }
        };

        pc.onicecandidate = (event) => {
            if (event.candidate && socketRef.current?.readyState === WebSocket.OPEN) {
                socketRef.current.send(JSON.stringify({ ice: event.candidate }));
            }
        };

        ws.onopen = () => {
            console.log("Student joined live room");
            ws.send(JSON.stringify({ type: "USER_JOINED" }));
        };

        ws.onmessage = async (event) => {
            try {
                const data = JSON.parse(event.data);
                if (data.offer) {
                    await pc.setRemoteDescription(new RTCSessionDescription(data.offer));
                    const answer = await pc.createAnswer();
                    await pc.setLocalDescription(answer);
                    ws.send(JSON.stringify({ answer }));
                }
                if (data.ice) {
                    try {
                        await pc.addIceCandidate(new RTCIceCandidate(data.ice));
                    } catch {
                        console.log("ICE candidate ignored");
                    }
                }
            } catch (err) {
                console.error("WebRTC message error", err);
            }
        };

        ws.onerror = () => {
            console.log("WebRTC websocket failed");
        };
    };

    // =====================================================
    // LEAVE LIVE CLASS
    // =====================================================
    const leaveLiveClass = () => {
        if (remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = null;
        }
        if (socketRef.current) {
            socketRef.current.close();
            socketRef.current = null;
        }
        if (peerConnectionRef.current) {
            peerConnectionRef.current.close();
            peerConnectionRef.current = null;
        }
        setLiveStream(null);
        setIsLiveActive(false);
    };

    // Attach remote stream to video element
    useEffect(() => {
        if (remoteVideoRef.current && liveStream) {
            remoteVideoRef.current.srcObject = liveStream;
        }
    }, [liveStream]);

    // Cleanup when leaving page
    useEffect(() => {
        return () => {
            leaveLiveClass();
        };
    }, []);

    // =====================================================
    // STRIPE CHECKOUT
    // =====================================================
    const handlePurchase = async () => {
        if (!id) return;
        try {
            setCheckoutLoading(true);
            const res = await API.post(`/api/v1/create-checkout-session/${id}`);
            if (res.data?.url) {
                window.location.href = res.data.url;
            }
        } catch (err: any) {
            alert(err.response?.data?.detail || "Stripe initialization failed");
        } finally {
            setCheckoutLoading(false);
        }
    };

    // =====================================================
    // CERTIFICATE DOWNLOAD
    // =====================================================
    const handleCertificate = async () => {
        if (!id) return;
        try {
            setCertificateLoading(true);
            const response = await API.post(`/api/v1/certificate/${id}`, {}, { responseType: "blob" });
            const blob = new Blob([response.data], { type: "application/pdf" });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = `certificate-${id}.pdf`;
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
        } catch (err: any) {
            alert(err.response?.data?.detail || "Certificate generation failed");
        } finally {
            setCertificateLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="vh-100 d-flex justify-content-center align-items-center">
                <Spinner animation="border" />
            </div>
        );
    }

    if (error) {
        return (
            <Container className="py-5">
                <Alert variant="danger">{error}</Alert>
            </Container>
        );
    }

    return (
        <div className="bg-light min-vh-100 py-4">
            <Container fluid="lg">
                {/* HEADER */}
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <Button
                        variant="link"
                        className="p-0 text-dark text-decoration-none fw-semibold d-flex align-items-center gap-2"
                        onClick={() => navigate("/courses")}
                    >
                        <FaArrowLeft size={12} />
                        Back to Catalog
                    </Button>

                    {isEnrolled && (backendLiveStatus || isLiveActive) && (
                        <Button
                            variant={isLiveActive ? "danger" : "info"}
                            size="sm"
                            className="rounded-pill fw-bold px-4"
                            onClick={isLiveActive ? leaveLiveClass : joinLiveClass}
                        >
                            {isLiveActive ? "Disconnect Live" : "🔴 Join Live Class"}
                        </Button>
                    )}
                </div>

                {/* PROGRESS */}
                {isEnrolled && !isLiveActive && (
                    <Card className="border-0 shadow-sm p-3 mb-4">
                        <div className="d-flex justify-content-between small fw-bold mb-2">
                            <span>Course Progress</span>
                            <span>{completionPercent}%</span>
                        </div>
                        <ProgressBar now={completionPercent} variant="success" className="rounded-pill" style={{ height: "8px" }} />
                    </Card>
                )}

                {/* QUIZ + CERTIFICATE */}
                {isEnrolled && completionPercent === 100 && !isLiveActive && (
                    <Card className="border-0 shadow-sm p-3 mb-4">
                        <div className="d-flex justify-content-between align-items-center">
                            {quizPassed ? (
                                <Badge bg="success">Quiz Passed ✅</Badge>
                            ) : (
                                <Button size="sm" onClick={() => navigate(`/user/quiz/${id}`)}>
                                    Start Quiz
                                </Button>
                            )}
                            {quizPassed && (
                                <Button
                                    size="sm"
                                    variant="outline-success"
                                    disabled={certificateLoading}
                                    onClick={handleCertificate}
                                >
                                    {certificateLoading ? "Generating..." : "Download Certificate"}
                                </Button>
                            )}
                        </div>
                    </Card>
                )}

                <Row className="g-4">
                    {/* VIDEO AREA */}
                    <Col lg={8}>
                        {activeLesson && (
                            <>
                                <Card className="ratio ratio-16x9 bg-black overflow-hidden rounded-4 border-0 shadow-sm mb-4">
                                    {isEnrolled ? (
                                        isLiveActive ? (
                                            <video
                                                ref={remoteVideoRef}
                                                autoPlay
                                                playsInline
                                                className="w-100 h-100"
                                                style={{ objectFit: "cover" }}
                                            />
                                        ) : (
                                            <video
                                                key={activeLesson.video_url}
                                                controls
                                                preload="metadata"
                                                className="w-100 h-100"
                                                style={{ objectFit: "cover" }}
                                                onEnded={() => setHasWatchedVideo(true)}
                                            >
                                                <source src={activeLesson.video_url} type="video/mp4" />
                                                Browser does not support video.
                                            </video>
                                        )
                                    ) : (
                                        <div className="d-flex flex-column justify-content-center align-items-center text-white">
                                            <FaLock size={30} className="text-warning mb-3" />
                                            <h5>Content Locked</h5>
                                            <Button onClick={handlePurchase} disabled={checkoutLoading} className="rounded-pill mt-3">
                                                <FaCreditCard size={12} /> {checkoutLoading ? "Processing..." : "Unlock Course"}
                                            </Button>
                                        </div>
                                    )}
                                </Card>

                                {/* LESSON DETAILS */}
                                {!isLiveActive && (
                                    <Card className="p-3 mb-4">
                                        <h5 className="fw-bold">{activeLesson.title}</h5>
                                        {activeLesson.notes_url ? (
                                            <Button
                                                as="a"
                                                href={activeLesson.notes_url}
                                                target="_blank"
                                                size="sm"
                                                variant={hasViewedNotes ? "outline-secondary" : "outline-primary"}
                                                onClick={() => setHasViewedNotes(true)}
                                            >
                                                <FaFilePdf /> View Notes
                                            </Button>
                                        ) : (
                                            <small className="text-muted">No notes available</small>
                                        )}
                                    </Card>
                                )}

                                {isEnrolled && <CourseReviewForm courseId={Number(id)} onReviewSubmitted={() => {}} />}
                            </>
                        )}
                    </Col>

                    {/* LESSON LIST */}
                    <Col lg={4}>
                        <Card className="shadow-sm border-0">
                            <Card.Header className="fw-bold bg-white">Modules ({lessons.length})</Card.Header>
                            <ListGroup variant="flush">
                                {lessons.map((lesson, index) => {
                                    const completed = completedLessonIds.includes(lesson.id);
                                    return (
                                        <ListGroup.Item
                                            key={lesson.id}
                                            action={isEnrolled && !isLiveActive}
                                            onClick={() => {
                                                if (isEnrolled && !isLiveActive) {
                                                    setActiveLesson(lesson);
                                                }
                                            }}
                                            className="d-flex justify-content-between align-items-center"
                                        >
                                            <div className="d-flex align-items-center gap-2">
                                                {completed ? <FaCheckCircle className="text-success" /> : <FaPlayCircle className="text-muted" />}
                                                <span className="small">{index + 1}. {lesson.title}</span>
                                            </div>
                                            {isEnrolled ? <FaChevronRight size={12} /> : <FaLock size={12} />}
                                        </ListGroup.Item>
                                    );
                                })}
                            </ListGroup>
                        </Card>
                    </Col>
                </Row>
            </Container>
        </div>
    );
};

export default WorkSpace;