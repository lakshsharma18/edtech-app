from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from jose import jwt, JWTError

from app.core.database import get_db
from app.core.security import require_instructor, require_user, SECRET_KEY, ALGORITHM
from app.models.course import Course
from app.models.livesession import LiveSession
from app.models.enrollment import Enrollment
from app.services.livemanager import hub_manager

router = APIRouter()


# --- 👨‍🏫 INSTRUCTOR DASHBOARD ENDPOINTS ---

# 🗄️ ENDPOINT 1: TEACHER INITIATES THE LIVE SESSION TRACKS
@router.post("/start-class/{course_id}")
async def start_live_session(
    course_id: int, 
    db: Session = Depends(get_db), 
    current_instructor = Depends(require_instructor)
):
    # A. Check Verification Footprint: Does this instructor own/teach this specific course?
    course = db.query(Course).filter(Course.id == course_id, Course.created_by == current_instructor["user_id"]).first()
    if not course:
        raise HTTPException(status_code=403, detail="Access Denied: You are not registered as the instructor for this course.")

    # B. Idempotency Overwrite: Clear out any old lingering active flags for this course
    db.query(LiveSession).filter(LiveSession.course_id == course_id, LiveSession.is_active == True).update({"is_active": False})

    # C. Lock active true/false trace row into the persistent database table
    session_log = LiveSession(course_id=course_id, instructor_id=current_instructor["user_id"], is_active=True)
    db.add(session_log)
    db.commit()

    # D. TRIGGER TARGETED DISPATCHING ONLY TO ENROLLED STUDENT CONNECTIONS
    alert_payload = {
        "event_type": "LIVE_CLASS_STARTED",
        "course_id": course.id,
        "course_title": course.title,
        "instructor_name": current_instructor.get("first_name", "Your Instructor")
    }
    await hub_manager.notify_only_enrolled_students(db, course_id, alert_payload)

    return {"status": "success", "message": f"Live session activated and alerts sent to enrolled students for {course.title}."}


# 🗄️ ENDPOINT 2: TEACHER KILLS THE LIVE BROADCAST
@router.post("/end-class/{course_id}")
def end_live_session(course_id: int, db: Session = Depends(get_db), current_instructor = Depends(require_instructor)):
    db.query(LiveSession).filter(
        LiveSession.course_id == course_id, 
        LiveSession.instructor_id == current_instructor["user_id"],
        LiveSession.is_active == True
    ).update({"is_active": False})
    db.commit()
    
    return {"status": "success", "message": "Live streaming closed safely."}


# --- 🎓 STUDENT DASHBOARD PLAYER ENDPOINTS ---

# 🗄️ ENDPOINT 3: PASSIVE POLL CHECK ON PLAYER PAGE MOUNT
@router.get("/check-active-stream/{course_id}")
def check_active_stream(course_id: int, db: Session = Depends(get_db), current_student = Depends(require_user)):
    """Allows student browsers to passively verify if an active stream is live right now on page load."""
    enrolled = db.query(Enrollment).filter(Enrollment.user_id == current_student["user_id"], Enrollment.course_id == course_id).first()
    if not enrolled:
        raise HTTPException(status_code=403, detail="Access Denied: You are not enrolled in this curriculum section.")

    active_room = db.query(LiveSession).filter(LiveSession.course_id == course_id, LiveSession.is_active == True).first()
    return {"live_active": active_room is not None}


# --- 🌐 PLATFORM NETWORK WEBSOCKET TUNNELS ---

# 🌐 SOCKET 1: TARGETED ALERTS LINE LAYER (Online browsers establish this background connection)
@router.websocket("/notifications/subscribe")
async def global_notifications_pipeline(websocket: WebSocket, token: str = Query(...)):
    """
    Subscribes the active browser window tab into our notification dictionary mapping network.
    Reads token out of query string securely because WebSockets do not pass standard Headers on connect.
    """
    try:
        # Decrypt token parameters natively to read who is connecting
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = int(payload.get("user_id"))
    except JWTError:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    await hub_manager.register_user_session(websocket, user_id)
    try:
        while True:
            await websocket.receive_text() # Keeps link open and active
    except WebSocketDisconnect:
        hub_manager.unregister_user_session(websocket)


# 🌐 SOCKET 2: JOIN SESSION SWITCHBOARD (WebRTC Peer Handshake Router)
@router.websocket("/live/ws/{course_id}")
async def course_media_signaling(websocket: WebSocket, course_id: str):
    """
    The active Join Session execution route.
    Teacher and Student lines meet here to swap WebRTC video connection codes.
    """
    await hub_manager.join_signaling_room(websocket, course_id)
    try:
        while True:
            # Exchanges peer communication blocks (SDP Offers / Answers / Candidates)
            client_packet = await websocket.receive_text()
            await hub_manager.relay_webrtc_tracks(client_packet, course_id, sender_ws=websocket)
    except WebSocketDisconnect:
        hub_manager.leave_signaling_room(websocket, course_id)
