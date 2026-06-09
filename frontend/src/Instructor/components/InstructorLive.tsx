import React, { useState, useEffect, useRef } from 'react';
import { Container, Card, Button, Spinner, Alert, Badge } from 'react-bootstrap';
import { useParams, useNavigate } from 'react-router-dom';
import { FaVideo, FaVideoSlash, FaArrowLeft, FaSignal } from 'react-icons/fa';
import API from '../../api/client';

const InstructorLive = () => {
  const { course_id } = useParams<{ course_id: string }>();
  const navigate = useNavigate();
  
  const [courseTitle, setCourseTitle] = useState<string>('');
  const [isStreaming, setIsStreaming] = useState<boolean>(false);
  const [authLoading, setAuthLoading] = useState<boolean>(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isButtonDisabled, setIsButtonDisabled] = useState<boolean>(false);

  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const socketRef = useRef<WebSocket | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);

  const cleanupStream = (isExiting: boolean = false) => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
      localStreamRef.current = null;
    }
    if (localVideoRef.current) localVideoRef.current.srcObject = null;
    if (socketRef.current) socketRef.current.close();
    if (peerConnectionRef.current) peerConnectionRef.current.close();

    if (isStreaming || isExiting) {
      API.post(`/api/v1/live/end-class/${course_id}`).catch((err) =>
        console.error("Failed to notify database ledger of stream closure:", err)
      );
    }
    setIsStreaming(false);
    setIsButtonDisabled(false);
  };

  useEffect(() => {
    const checkCourseAccess = async () => {
      try {
        const res = await API.get(`/api/v1/courses/${course_id}`);
        setCourseTitle(res.data.title);
        setAuthLoading(false);
      } catch (err: any) {
        setAuthError(err.response?.data?.detail || "Authorization Failed: Access restricted.");
        setAuthLoading(false);
      }
    };
    checkCourseAccess();
    return () => cleanupStream(true);
  }, [course_id]);

  // 🤝 DYNAMIC CONNECTION GENERATOR (Runs the millisecond a student joins)
  const createPeerConnection = (stream: MediaStream) => {
    const pc = new RTCPeerConnection({ iceServers: [] });
    peerConnectionRef.current = pc;

    stream.getTracks().forEach(track => pc.addTrack(track, stream));

    pc.onicecandidate = (event) => {
      if (event.candidate && socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
        socketRef.current.send(JSON.stringify({ 'ice': event.candidate }));
      }
    };
    return pc;
  };

  const startLiveBroadcast = async () => {
    setIsButtonDisabled(true);
    try {
      // 1. Ask for local webcam/mic permissions
      const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      localStreamRef.current = mediaStream;
      
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = mediaStream;
      }

      // 2. Fire up database states and open signaling pipelines
      socketRef.current = new WebSocket(`ws://127.0.0.1:8000/api/v1/live/ws/${course_id}`);
      await API.post(`/api/v1/live/start-class/${course_id}`);

      socketRef.current.onopen = () => {
        setIsStreaming(true);
        setIsButtonDisabled(false);
      };

      // 3. LISTEN FOR ARRIVING STUDENTS RESPONSIVELY
           // 📥 8. Listen for response Answer configuration tokens returned from arriving students
      socketRef.current.onmessage = async (event) => {
        const data = JSON.parse(event.data);

        // A. Student announced they joined -> Let's build a fresh connection Offer for them!
        if (data.type === "USER_JOINED") {
          const pc = createPeerConnection(mediaStream);
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          socketRef.current?.send(JSON.stringify({ 'offer': offer }));
        } 
        // B. ✅ FIXED THE INVALIDSTATEERROR CRASH ON INSTRUCTOR WINDOW:
        // Only allow setting the remote description if the instructor's engine is actively in an offer state.
        // If it's already connected (stable), ignore duplicate incoming student re-render answers!
        else if (data.answer && peerConnectionRef.current) {
          if (peerConnectionRef.current.signalingState === "have-local-offer") {
            try {
              await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(data.answer));
              console.log("🤝 WebRTC connection fully established and stabilized!");
            } catch (err) {
              console.error("Failed to apply student remote answer:", err);
            }
          } else {
            console.log(`ℹ️ Ignored duplicate student answer packet. Instructor engine state: ${peerConnectionRef.current.signalingState}`);
          }
        } 
        // C. Sync up network tracks safely
        else if (data.ice && peerConnectionRef.current) {
          if (peerConnectionRef.current.remoteDescription) {
            await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(data.ice)).catch(() => {});
          }
        }
      };

    } catch (err) {
      console.error("Hardware stream pipeline initialization failed:", err);
      alert("Hardware error: Ensure camera and microphone permissions are granted.");
      cleanupStream(true);
    }
  };

  const handleExitStudio = () => {
    cleanupStream(true);
    navigate(`/instructor/manage-course/${course_id}`);
  };

  if (authLoading) return <div style={{ background: '#0f172a', minHeight: '100vh' }} className="d-flex justify-content-center align-items-center text-white"><Spinner animation="border" variant="info" /></div>;
  if (authError) return <Container className="py-5"><Alert variant="danger">{authError}</Alert></Container>;

  return (
    <div style={{ background: '#0f172a', minHeight: '100vh' }} className="py-5 text-white">
      <Container style={{ maxWidth: '680px' }}>
        <div className="mb-4">
          <Button variant="link" className="text-info text-decoration-none p-0 fw-bold d-flex align-items-center gap-1.5" onClick={handleExitStudio}>
            <FaArrowLeft size={12} /> Exit Broadcast Studio
          </Button>
        </div>

        <Card className="border-0 p-4 p-md-5 text-center shadow-lg" style={{ background: 'rgba(30, 41, 59, 0.55)', backdropFilter: 'blur(16px)', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="d-flex justify-content-center mb-3">
            <Badge bg={isStreaming ? "danger" : "secondary"} className="px-3 py-2 rounded-pill text-uppercase tracking-wider small d-flex align-items-center gap-1.5 animate-pulse">
              {isStreaming ? "🔴 TRANSMITTING LIVE FEED" : "🎛️ STUDIO STANDBY ACTIVE"}
            </Badge>
          </div>

          <h2 className="fw-extrabold text-white mb-1 tracking-tight">{courseTitle}</h2>
          <p className="text-white-50 small mb-4 mx-auto" style={{ maxWidth: '440px' }}>
            Activating this camera feed commits a live database state row modification and dispatches instant popup alerts strictly to your enrolled student workspace panels.
          </p>
          
          <div className="ratio ratio-16x9 bg-black rounded-4 overflow-hidden mb-4 border border-secondary border-opacity-30 shadow-inner position-relative">
            <video ref={localVideoRef} autoPlay playsInline muted className="w-100 h-100" style={{ objectFit: 'cover' }} />
          </div>

          <div className="d-flex justify-content-center gap-3">
            {!isStreaming ? (
              <Button type="button" variant="info" disabled={isButtonDisabled} className="px-5 text-white fw-bold py-2.5 rounded-3 shadow-sm text-uppercase small tracking-wider" onClick={startLiveBroadcast}>
                {isButtonDisabled ? <><Spinner animation="border" size="sm" className="me-2" />Broadcasting...</> : "Activate Live Broadcast"}
              </Button>
            ) : (
              <Button type="button" variant="danger" className="px-5 fw-bold py-2.5 rounded-3 shadow-sm text-uppercase small tracking-wider" onClick={handleExitStudio}>
                <FaVideoSlash className="me-2" size={13} /> Kill Live Room Session
              </Button>
            )}
          </div>
        </Card>
      </Container>
    </div>
  );
};

export default InstructorLive;
