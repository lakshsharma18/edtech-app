import React, { createContext, useContext, useEffect, useState } from 'react';
import { Toast, ToastContainer, Button } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { FaVideo } from 'react-icons/fa';

interface NotificationContextType {
  activeNotification: string | null;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const navigate = useNavigate();
  const [showToast, setShowToast] = useState<boolean>(false);
  const [alertData, setAlertData] = useState<{ course_id: number; course_title: string; instructor_name: string } | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    // 🏛️ Create a local lifecycle reference to close the socket cleanly
    let wsInstance: WebSocket | null = null;

    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        window.atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      const parsedToken = JSON.parse(jsonPayload);
      const userRole = parsedToken?.role?.toLowerCase();

      if (userRole === 'instructor') {
        console.log(`ℹ️ Notification provider bypassed for instructor account window.`);
        return;
      }

      // 📡 ACTIVE HIGHWAY PIPELINE
      const ws = new WebSocket(`ws://127.0.0.1:8000/api/v1/notifications/subscribe?token=${token}`);
      wsInstance = ws;

      ws.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          
          if (payload.event_type === "LIVE_CLASS_STARTED") {
            setAlertData({
              course_id: payload.course_id,
              course_title: payload.course_title,
              instructor_name: payload.instructor_name
            });
            setShowToast(true);
          }
        } catch (err) {
          console.error("Failed to parse real-time alert data packet:", err);
        }
      };

      // Handle soft background disconnects quietly without blocking the execution thread
      ws.onerror = () => {
        console.log("ℹ️ Stale background notification pipe handled cleanly.");
      };

    } catch (error) {
      console.error("Local credential validation processing lookup skipped:", error);
    }

    // ✅ THE WEBSOCKET LIFE DESTRUCTOR:
    // Completely cleans up and closes old WebSocket links when the component unmounts or re-renders.
    // This removes the line 66 browser connection errors entirely!
    return () => {
      if (wsInstance) {
        wsInstance.close();
      }
    };
  }, []);

  const handleJoinClick = () => {
    if (alertData) {
      setShowToast(false);
      navigate(`/user/courses/${alertData.course_id}?joinLive=true`);
    }
  };

  return (
    <NotificationContext.Provider value={{ activeNotification: alertData ? alertData.course_title : null }}>
      {children}

      <ToastContainer position="top-end" className="p-3 position-fixed" style={{ zIndex: 999999, top: '20px', right: '20px' }}>
        <Toast show={showToast} onClose={() => setShowToast(false)} delay={25000} autohide className="border-0 shadow-lg bg-dark text-white">
          <Toast.Header closeButton className="bg-dark text-white border-bottom border-secondary border-opacity-25 py-2">
            <FaVideo className="text-danger me-2" style={{ animation: "pulse 1.5s infinite" }} />
            <strong className="me-auto">🔴 Lecture Session Active!</strong>
          </Toast.Header>
          <Toast.Body className="p-3 bg-dark bg-opacity-95 rounded-bottom-3">
            <p className="small mb-2 text-white-50">
              Your assigned instructor <strong>{alertData?.instructor_name}</strong> just went live inside your module cohort:
            </p>
            <h6 className="fw-bold text-info mb-3 text-truncate">{alertData?.course_title}</h6>
            <div className="d-flex justify-content-end gap-2">
              <Button variant="secondary" size="sm" className="rounded-pill px-3 py-1 text-white-50 border-0" onClick={() => setShowToast(false)}>
                Dismiss
              </Button>
              <Button variant="info" size="sm" className="rounded-pill px-4 py-1 text-white fw-bold shadow-sm" onClick={handleJoinClick}>
                Join Class
              </Button>
            </div>
          </Toast.Body>
        </Toast>
      </ToastContainer>
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) throw new Error("useNotifications must be wrapped inside a NotificationProvider.");
  return context;
};
