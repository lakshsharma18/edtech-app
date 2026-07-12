import { useState, useEffect, useRef } from 'react';
import { Container, Card, Button, Spinner, Alert, Badge } from 'react-bootstrap';
import { useParams, useNavigate } from 'react-router-dom';
import { FaVideoSlash, FaArrowLeft } from 'react-icons/fa';
import API from '../../api/client';

const InstructorLive = () => {
    const { course_id } = useParams<{ course_id: string }>();
    const navigate = useNavigate();

    const [courseTitle, setCourseTitle] = useState("");
    const [isStreaming, setIsStreaming] = useState(false);
    const [authLoading, setAuthLoading] = useState(true);
    const [authError, setAuthError] = useState<string | null>(null);
    const [isButtonDisabled, setIsButtonDisabled] = useState(false);

    const localVideoRef = useRef<HTMLVideoElement | null>(null);
    const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
    const socketRef = useRef<WebSocket | null>(null);
    const localStreamRef = useRef<MediaStream | null>(null);

    const WS_URL = import.meta.env.VITE_WS_URL;

    const iceServers = {
        iceServers: [{ urls: "stun:stun.l.google.com:19302" }]
    };

    const cleanupStream = async () => {
        if (localStreamRef.current) {
            localStreamRef.current.getTracks().forEach(track => track.stop());
            localStreamRef.current = null;
        }

        if (localVideoRef.current) {
            localVideoRef.current.srcObject = null;
        }

        if (socketRef.current) {
            socketRef.current.close();
            socketRef.current = null;
        }

        if (peerConnectionRef.current) {
            peerConnectionRef.current.close();
            peerConnectionRef.current = null;
        }

        if (course_id) {
            try {
                await API.post(`/api/v1/live/end-class/${course_id}`);
            } catch (err) {
                console.log("Failed closing live session", err);
            }
        }

        setIsStreaming(false);
        setIsButtonDisabled(false);
    };

    useEffect(() => {
        const loadCourse = async () => {
            try {
                const res = await API.get(`/api/v1/courses/${course_id}`);
                setCourseTitle(res.data.title);
            } catch (err: any) {
                setAuthError(err.response?.data?.detail || "Authorization Failed");
            } finally {
                setAuthLoading(false);
            }
        };

        loadCourse();

        return () => {
            cleanupStream();
        };
    }, [course_id]);

    const createPeerConnection = (stream: MediaStream) => {
        const pc = new RTCPeerConnection(iceServers);
        peerConnectionRef.current = pc;

        stream.getTracks().forEach(track => pc.addTrack(track, stream));

        pc.onicecandidate = (event) => {
            if (event.candidate && socketRef.current?.readyState === WebSocket.OPEN) {
                socketRef.current.send(JSON.stringify({ ice: event.candidate }));
            }
        };

        return pc;
    };

    const startLiveBroadcast = async () => {
        if (!course_id) return;

        setIsButtonDisabled(true);

        try {
            // 1. Create DB live session first
            await API.post(`/api/v1/live/start-class/${course_id}`);

            // 2. Camera permission
            const stream = await navigator.mediaDevices.getUserMedia({
                video: true,
                audio: true
            });

            localStreamRef.current = stream;

            if (localVideoRef.current) {
                localVideoRef.current.srcObject = stream;
            }

            // 3. Render websocket
            socketRef.current = new WebSocket(`${WS_URL}/api/v1/live/ws/${course_id}`);

            socketRef.current.onopen = () => {
                console.log("Instructor websocket connected");
                setIsStreaming(true);
                setIsButtonDisabled(false);
            };

            socketRef.current.onmessage = async (event) => {
                const data = JSON.parse(event.data);

                if (data.type === "USER_JOINED") {
                    const pc = createPeerConnection(stream);
                    const offer = await pc.createOffer();
                    await pc.setLocalDescription(offer);
                    socketRef.current?.send(JSON.stringify({ offer }));
                }

                if (data.answer && peerConnectionRef.current) {
                    await peerConnectionRef.current.setRemoteDescription(
                        new RTCSessionDescription(data.answer)
                    );
                }

                if (data.ice && peerConnectionRef.current) {
                    try {
                        await peerConnectionRef.current.addIceCandidate(
                            new RTCIceCandidate(data.ice)
                        );
                    } catch (err) {
                        console.log("ICE error", err);
                    }
                }
            };
        } catch (err) {
            console.error("Live start failed", err);
            alert("Camera or microphone permission failed");
            cleanupStream();
        }
    };

    const handleExitStudio = () => {
        cleanupStream();
        navigate(`/instructor/manage-course/${course_id}`);
    };

    if (authLoading) {
        return (
            <div className="d-flex justify-content-center align-items-center vh-100">
                <Spinner animation="border" />
            </div>
        );
    }

    if (authError) {
        return (
            <Container className="py-5">
                <Alert variant="danger">{authError}</Alert>
            </Container>
        );
    }

    return (
        <div style={{ background: "#0f172a", minHeight: "100vh" }} className="py-5 text-white">
            <Container>
                <Button variant="link" className="text-info" onClick={handleExitStudio}>
                    <FaArrowLeft /> Exit Broadcast
                </Button>

                <Card className="p-5 text-center mt-4">
                    <Badge bg={isStreaming ? "danger" : "secondary"}>
                        {isStreaming ? "LIVE" : "STANDBY"}
                    </Badge>

                    <h2>{courseTitle}</h2>

                    <div className="ratio ratio-16x9 bg-black">
                        <video
                            ref={localVideoRef}
                            autoPlay
                            playsInline
                            muted
                            className="w-100 h-100"
                        />
                    </div>

                    {!isStreaming ? (
                        <Button onClick={startLiveBroadcast} disabled={isButtonDisabled}>
                            Start Broadcast
                        </Button>
                    ) : (
                        <Button variant="danger" onClick={handleExitStudio}>
                            <FaVideoSlash /> Stop Live
                        </Button>
                    )}
                </Card>
            </Container>
        </div>
    );
};

export default InstructorLive;