from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends, HTTPException, status, Query, BackgroundTasks
from sqlalchemy.orm import Session
from jose import jwt, JWTError

from app.core.database import get_db
from app.core.security import require_instructor, get_current_user, SECRET_KEY, ALGORITHM
from app.models.course import Course
from app.models.livesession import LiveSession
from app.models.enrollment import Enrollment
from app.services.livemanager import hub_manager

router = APIRouter()


# --- INSTRUCTOR DASHBOARD ENDPOINTS ---

# 🗄️ ENDPOINT 1: TEACHER INITIATES THE LIVE SESSION TRACKS
@router.post("/live/start-class/{course_id}") #  Alias fallback route resolves frontend 404 logs
async def start_live_session(
    course_id: int, 
    background_tasks: BackgroundTasks,  #  Handles multi-user packet distribution in parallel background threads
    db: Session = Depends(get_db), 
    current_instructor = Depends(require_instructor)
):
    # A. Access Check: Verify this explicit instructor account created/owns this course ID row
    course = db.query(Course).filter(Course.id == course_id, Course.created_by == current_instructor["user_id"]).first()
    if not course:
        raise HTTPException(status_code=403, detail="Access Denied: You are not registered as the instructor for this course.")

    # B. Idempotency Overwrite: Clear out any old lingering active flags for this course
    db.query(LiveSession).filter(LiveSession.course_id == course_id, LiveSession.is_active == True).update({"is_active": False})

    # C. Lock active true/false trace row into your persistent live_sessions database table
    session_log = LiveSession(course_id=course_id, instructor_id=current_instructor["user_id"], is_active=True)
    db.add(session_log)
    db.commit()

    # D. PREPARE THE REAL-TIME SIGNAL PAYLOAD
    alert_payload = {
        "event_type": "LIVE_CLASS_STARTED",
        "course_id": course.id,
        "course_title": course.title,
        "instructor_name": current_instructor.get("first_name", "Your Instructor")
    }
    
    # THE ASYNC RESOLUTION: Offloads the targeted alert loop to BackgroundTasks
    # This prevents the teacher's thread from blocking or dropping the student's active socket pipeline!
    background_tasks.add_task(hub_manager.notify_only_enrolled_students, db, course_id, alert_payload)

    return {"status": "success", "message": f"Live session activated and notifications queued for {course.title}."}


# 🗄️ ENDPOINT 2: TEACHER KILLS THE LIVE BROADCAST
@router.post("/live/end-class/{course_id}")  #  Alias fallback handles clean instructor exit routes safely
def end_live_session(course_id: int, db: Session = Depends(get_db), current_instructor = Depends(require_instructor)):
    db.query(LiveSession).filter(
        LiveSession.course_id == course_id, 
        LiveSession.instructor_id == current_instructor["user_id"],
        LiveSession.is_active == True
    ).update({"is_active": False})
    db.commit()
    
    return {"status": "success", "message": "Live streaming closed safely."}


# --- 🎓 DYNAMIC SYSTEM STATUS POLL GATES ---

# 🗄️ ENDPOINT 3: PASSIVE STREAM STATUS CHECK (Whitelisted Role Gateway)
@router.get("/live/check-active-stream/{course_id}") #  Resolves duplicate UI lifecycle lookup mappings
def check_active_stream(
    course_id: int, 
    db: Session = Depends(get_db), 
    current_user = Depends(get_current_user)  #  Decodes ANY valid logged-in account token safely
):
    """
    Passively verifies if an active stream is live right now on page load.
    Enforces strict role checks: Only permits 'user' or 'instructor' roles, blocking all others.
    """
    user_role = str(current_user.get("role", "")).lower()
    
    # 🔒 ROLE ACQUIREMENT GATEKEEPER CHECK: Instantly rejects unprivileged account types (like Admins)
    if user_role not in ["user", "instructor"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access Denied: Unprivileged account role cannot query active live status."
        )

    # 🔒 STUDENT ROSTER ISOLATION FENCE: If they are a standard student, verify enrollment logs
    if user_role == "user":
        enrolled = db.query(Enrollment).filter(
            Enrollment.user_id == current_user["user_id"], 
            Enrollment.course_id == course_id
        ).first()
        if not enrolled:
            raise HTTPException(status_code=403, detail="Access Denied: You are not enrolled in this curriculum section.")

    # 👨‍🏫 DATA RETRIEVAL: Instructors bypass Step 2 and jump straight down here to find room states
    active_room = db.query(LiveSession).filter(
        LiveSession.course_id == course_id, 
        LiveSession.is_active == True
    ).first()
    
    return {"live_active": active_room is not None}


# --- PLATFORM NETWORK WEBSOCKET TUNNELS ---

#  SOCKET 1: TARGETED BACKGROUND NOTIFICATION LINE (All online student browser tabs rest here)
@router.websocket("/notifications/subscribe")
async def global_notifications_pipeline(websocket: WebSocket, token: str = Query(...)):
    """
    Subscribes the active student browser tab into our live connection memory dictionary.
    Reads token out of query parameters securely to authenticate WebSocket connections.
    """
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = int(payload.get("user_id"))
    except (JWTError, ValueError, TypeError):
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    # Accept the handshake pipeline frame natively inside the registry session manager
    await hub_manager.register_user_session(websocket, user_id)
    try:
        while True:
            await websocket.receive_text()  # Keeps the communication socket link open and active
    except WebSocketDisconnect:
        hub_manager.unregister_user_session(websocket)


# 🌐 SOCKET 2: JOIN SESSION SWITCHBOARD (WebRTC Peer Handshake Signal Router)
@router.websocket("/live/ws/{course_id}")
async def course_media_signaling(websocket: WebSocket, course_id: str):
    """
    The active Join Session execution route.
    Teacher and Student lines meet here to swap WebRTC connection setup codes (Offers/Answers).
    """
    await hub_manager.join_signaling_room(websocket, course_id)
    try:
        while True:
            client_packet = await websocket.receive_text()
            await hub_manager.relay_webrtc_tracks(client_packet, course_id, sender_ws=websocket)
    except WebSocketDisconnect:
        hub_manager.leave_signaling_room(websocket, course_id)
