from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from datetime import datetime
import os

from app.core.database import get_db
from app.core.security import require_user

from app.models.certificate import Certificate
from app.models.quiz import Attempt
from app.models.quiz import Quiz
from app.models.course import Course
from app.models.lessons import Lesson
from app.models.lessonprogress import LessonProgress

# 💡 Use Standard A4 dimensions and Landscape orientation helpers
from reportlab.lib.pagesizes import A4, landscape
from reportlab.lib import colors
from reportlab.pdfgen import canvas

router = APIRouter()


@router.post("/certificate/{course_id}")
def generate_certificate(
    course_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(require_user)
):
    """
    Generates a premium, high-fidelity A4 Landscape certificate matching the design 
    specification from the reference layout, streaming a direct binary FileResponse.
    """
    user_id = current_user["user_id"]

    # 1. Verify Course Context Existence
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    # 2. Check Progress with Strict Integer Comparison
    total_lessons = db.query(Lesson).filter(Lesson.course_id == course_id).count()
    completed_lessons = db.query(LessonProgress).join(Lesson).filter(
        LessonProgress.user_id == user_id,
        Lesson.course_id == course_id,
        LessonProgress.completed == True
    ).count()

    if total_lessons > 0 and completed_lessons < total_lessons:
        raise HTTPException(status_code=400, detail="Complete all course lessons first")

    # 3. Check Quiz Attempt History Status
    quiz = db.query(Quiz).filter(Quiz.course_id == course_id).first()
    if not quiz:
        raise HTTPException(status_code=400, detail="Quiz context not found for this course")

    attempt = db.query(Attempt).filter(
        Attempt.user_id == user_id,
        Attempt.quiz_id == quiz.id,
        Attempt.is_passed == True
    ).first()

    if not attempt:
        raise HTTPException(status_code=400, detail="You must pass the quiz first")

    # 4. Handle Directory and Cache Paths
    os.makedirs("certificates", exist_ok=True)
    file_name = f"cert_{user_id}_{course_id}.pdf"
    file_path = f"certificates/{file_name}"

    existing = db.query(Certificate).filter(
        Certificate.user_id == user_id,
        Certificate.course_id == course_id
    ).first()

    if existing and os.path.exists(existing.file_path):
        return FileResponse(path=existing.file_path, filename=file_name, media_type="application/pdf")

    # 5. Build High-Fidelity A4 Landscape Canvas
    # A4 Dimensions: 595.27 x 841.89 points. Landscape swaps them: width=841.89, height=595.27
    width, height = landscape(A4)
    c = canvas.Canvas(file_path, pagesize=landscape(A4))

    # --- VISUAL LAYER 1: Deep Navy/Dark Slate Base Background ---
    c.setFillColor(colors.HexColor("#0f172a")) # Dark background
    c.rect(0, 0, width, height, fill=1, stroke=0)

    # --- VISUAL LAYER 2: Gold Side Banners (Simulated Gradient Geometry) ---
    # Left Golden Ribbon Accents
    p_left = c.beginPath()
    p_left.moveTo(0, 0)
    p_left.lineTo(90, 0)
    p_left.lineTo(50, height / 2)
    p_left.lineTo(90, height)
    p_left.lineTo(0, height)
    p_left.close()
    c.setFillColor(colors.HexColor("#d4af37")) # Metallic Gold Base
    c.drawPath(p_left, fill=1, stroke=0)

    p_left_inner = c.beginPath()
    p_left_inner.moveTo(0, 40)
    p_left_inner.lineTo(70, 40)
    p_left_inner.lineTo(35, height / 2)
    p_left_inner.lineTo(70, height - 40)
    p_left_inner.lineTo(0, height - 40)
    p_left_inner.close()
    c.setFillColor(colors.HexColor("#f3e5ab")) # Light Pale Gold Accent Highlights
    c.drawPath(p_left_inner, fill=1, stroke=0)

    # Right Golden Ribbon Accents
    p_right = c.beginPath()
    p_right.moveTo(width, 0)
    p_right.lineTo(width - 90, 0)
    p_right.lineTo(width - 50, height / 2)
    p_right.lineTo(width - 90, height)
    p_right.lineTo(width, height)
    p_right.close()
    c.setFillColor(colors.HexColor("#c5a028")) # Secondary Gold Shader
    c.drawPath(p_right, fill=1, stroke=0)

    # --- VISUAL LAYER 3: White Central Document Canvas Frame ---
    frame_offset_x = 80
    frame_offset_y = 45
    frame_w = width - (frame_offset_x * 2)
    frame_h = height - (frame_offset_y * 2)

    # White Body Card Plate Background
    c.setFillColor(colors.white)
    c.rect(frame_offset_x, frame_offset_y, frame_w, frame_h, fill=1, stroke=0)

    # Inset Thin Metallic Framing Line Rule
    c.setStrokeColor(colors.HexColor("#d4af37"))
    c.setLineWidth(2)
    c.rect(frame_offset_x + 8, frame_offset_y + 8, frame_w - 16, frame_h - 16, fill=0, stroke=1)

    # --- VISUAL LAYER 4: Header Typography & Banner Ribbon Node ---
    center_x = width / 2

    # Main "Certificate" Title Header
    c.setFont("Helvetica-Bold", 42)
    c.setFillColor(colors.HexColor("#d4af37"))
    c.drawCentredString(center_x, height - 125, "Certificate")

    # Dark Indigo Ribbon Label Backdrop Shape: "Of Completion"
    ribbon_w = 210
    ribbon_h = 28
    ribbon_y = height - 165
    c.setFillColor(colors.HexColor("#0f172a"))
    c.rect(center_x - (ribbon_w / 2), ribbon_y, ribbon_w, ribbon_h, fill=1, stroke=0)

    # Ribbon Text Accent Layer
    c.setFont("Helvetica", 12)
    c.setFillColor(colors.white)
    c.drawCentredString(center_x, ribbon_y + 8, "OF COMPLETION")

    # --- VISUAL LAYER 5: Core Certification Metadata Text Block ---
    c.setFont("Helvetica", 14)
    c.setFillColor(colors.HexColor("#1e293b"))
    c.drawCentredString(center_x, height - 215, "This is to certify that")

    # Student Display Focus Field Label (Emphasized Name Typography)
    user_name = f"{current_user.get('first_name', 'Student')} {current_user.get('last_name', '')}".strip()
    c.setFont("Times-BoldItalic", 28) # Stylized italic look mimicking script fonts safely
    c.setFillColor(colors.HexColor("#0f172a"))
    c.drawCentredString(center_x, height - 260, user_name)

    # Dotted Base Rule line Underneath Name
    c.setStrokeColor(colors.HexColor("#cbd5e1"))
    c.setLineWidth(1)
    c.setStrokeDelimiters = [1, 2] # Setup Dotted Line Array Context
    c.line(center_x - 160, height - 270, center_x + 160, height - 270)
    c.setStrokeDelimiters = [] # Reset to solid defaults

    # Transitional Block Description text
    c.setFont("Helvetica", 13)
    c.setFillColor(colors.HexColor("#475569"))
    c.drawCentredString(center_x, height - 315, "has successfully fulfilled all required milestones and instructions for the course")

    # Target Course Title Text Block (Highlight Indigo Display Typography)
    c.setFont("Helvetica-Bold", 18)
    c.setFillColor(colors.HexColor("#0d6efd"))
    c.drawCentredString(center_x, height - 350, f"\"{course.title}\"")

    # --- VISUAL LAYER 6: Footer Layout Metadata & Authority Blocks ---
    footer_y = frame_offset_y + 60

    # Left Side Block: Timestamp Chronology Data Node
    c.setFont("Helvetica-Bold", 11)
    c.setFillColor(colors.HexColor("#1e293b"))
    issue_date = datetime.now().strftime('%B %d, %Y')
    c.drawString(frame_offset_x + 50, footer_y + 15, issue_date)
    c.setStrokeColor(colors.HexColor("#cbd5e1"))
    c.setLineWidth(1)
    c.line(frame_offset_x + 50, footer_y + 8, frame_offset_x + 180, footer_y + 8)
    c.setFont("Helvetica", 9)
    c.setFillColor(colors.HexColor("#64748b"))
    c.drawString(frame_offset_x + 50, footer_y - 5, "Date of Issuance")

    # Center Block: Platform Organization Emblem Anchor
    c.setFont("Times-BoldItalic", 14)
    c.setFillColor(colors.HexColor("#0f172a"))
    c.drawCentredString(center_x, footer_y + 12, "E-Learning Academy")
    c.setFont("Helvetica", 9)
    c.setFillColor(colors.HexColor("#64748b"))
    c.drawCentredString(center_x, footer_y - 5, "Certified Training Provider")

    # Right Side Block: Dynamic Electronic Security Verification Signoff
    c.setFont("Courier-Oblique", 10)
    c.setFillColor(colors.HexColor("#475569"))
    c.drawRightString(width - frame_offset_x - 50, footer_y + 15, f"SECURE-ID: #CERT{user_id}X{course_id}")
    c.line(width - frame_offset_x - 180, footer_y + 8, width - frame_offset_x - 50, footer_y + 8)
    c.setFont("Helvetica", 9)
    c.setFillColor(colors.HexColor("#64748b"))
    c.drawRightString(width - frame_offset_x - 50, footer_y - 5, "Official Verification Identifier")

    # Finalize and Save Document Memory Context Stream
    c.save()

    # 6. Synchronize File Mapping Parameters to DB Layer
    if not existing:
        cert = Certificate(user_id=user_id, course_id=course_id, file_path=file_path)
        db.add(cert)
        db.commit()

    return FileResponse(path=file_path, filename=file_name, media_type="application/pdf")
