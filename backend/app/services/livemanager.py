import json
from fastapi import WebSocket
from typing import Dict, List, Set, Any
from sqlalchemy.orm import Session
from app.models.enrollment import Enrollment

class EnrolledLiveNotificationAndSignalingManager:
    def __init__(self):
        # 🔔 Global Online Directory tracking dictionary: { WebSocketConnection: user_id_integer }
        self.active_connections: Dict[WebSocket, int] = {}
        
        # 📡 WebRTC Signaling Rooms: Maps course_id to active peer wires -> { "course_id": [WebSockets] }
        self.signaling_rooms: Dict[str, List[WebSocket]] = {}

    # --- 1️⃣ TARGETED NOTIFICATION HIGHWAY ---
    async def register_user_session(self, websocket: WebSocket, user_id: int):
        """Accepts a connection on page boot and saves exactly who is holding this line."""
        await websocket.accept()
        self.active_connections[websocket] = user_id

    def unregister_user_session(self, websocket: WebSocket):
        """Safely removes socket tracking when a user signs out or closes their browser."""
        if websocket in self.active_connections:
            del self.active_connections[websocket]

    async def notify_only_enrolled_students(self, db: Session, course_id: int, alert_payload: dict):
        
        # Fetch clean python set list of all student IDs authorized/enrolled in this module
        enrolled_student_tuples = db.query(Enrollment.user_id).filter(Enrollment.course_id == course_id).all()
        enrolled_student_ids = {u[0] for u in enrolled_student_tuples}

        message_string = json.dumps(alert_payload)

        # Loop through every active connection line on the website
        for socket, user_id in list(self.active_connections.items()):
            # 🔒 GATEKEEPER CHECK: Only deliver if this specific online user ID is inside the enrollment set
            if user_id in enrolled_student_ids:
                try:
                    await socket.send_text(message_string)
                except Exception:
                    # Automatically remove dead connection tracks safely
                    if socket in self.active_connections:
                        del self.active_connections[socket]

    # --- 2️⃣ WEBRTC MEDIA SIGNALLING SWITCHBOARD ---
    async def join_signaling_room(self, websocket: WebSocket, course_id: str):
        await websocket.accept()
        if course_id not in self.signaling_rooms:
            self.signaling_rooms[course_id] = []
        self.signaling_rooms[course_id].append(websocket)

    def leave_signaling_room(self, websocket: WebSocket, course_id: str):
        if course_id in self.signaling_rooms:
            self.signaling_rooms[course_id].remove(websocket)
            if not self.signaling_rooms[course_id]:
                del self.signaling_rooms[course_id]

    async def relay_webrtc_tracks(self, message: str, course_id: str, sender_ws: WebSocket):
        if course_id in self.signaling_rooms:
            for client in self.signaling_rooms[course_id]:
                if client != sender_ws:
                    await client.send_text(message)

# Global Instance Broker
hub_manager = EnrolledLiveNotificationAndSignalingManager()
