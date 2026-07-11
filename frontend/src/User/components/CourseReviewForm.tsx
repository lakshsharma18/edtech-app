import { useState } from "react";
import { Card, Form, Button, Spinner } from "react-bootstrap";
import API from '../../api/client';
 
interface CourseReviewFormProps {
    courseId: number;
    onReviewSubmitted?: () => void; // Optional callback to reload parent stats (like average stars)
}
 
const CourseReviewForm = ({ courseId, onReviewSubmitted }: CourseReviewFormProps) => {
    // Component Interaction State Metrics
    const [rating, setRating] = useState<number>(0);
    const [hoveredRating, setHoveredRating] = useState<number>(0);
    const [reviewText, setReviewText] = useState<string>("");
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
 
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
       
        if (rating === 0) {
            alert("Please select a star rating value first.");
            return;
        }
 
        try {
            setIsSubmitting(true);
 
            // Matches your backend upsert endpoint schema payload exactly
            const payload = {
                rating: rating,
                review_text: reviewText.trim() || null
            };
 
            await API.post(`/api/v1/${courseId}/rate`, payload);
           
            alert("Thank you! Your feedback has been recorded successfully ✅");
           
            if (onReviewSubmitted) {
                onReviewSubmitted(); // Refresh parent view data streams
            }
        } catch (error) {
            alert("Failed to save review configuration parameters.");
        } finally {
            setIsSubmitting(false);
        }
    };
 
    return (
        <Card className="border-0 shadow-sm p-4" style={{ borderRadius: "16px", backgroundColor: "#ffffff" }}>
            <h5 className="fw-bold text-dark mb-1">Rate this Course</h5>
            <p className="text-muted small mb-4">Share your personal learning metrics to help other community students.</p>
 
            <Form onSubmit={handleSubmit}>
                {/* 1. INTERACTIVE HOVER STAR SYSTEM */}
                <Form.Group className="mb-4">
                    <Form.Label className="fw-semibold text-secondary small uppercase tracking-wider d-block mb-2">
                        Your Assessment Rating
                    </Form.Label>
                    <div className="d-flex align-items-center gap-1">
                        {[1, 2, 3, 4, 5].map((star) => {
                            // Star lights up if its value is below or equal to current hover location or selection state
                            const isLit = star <= (hoveredRating || rating);
                            return (
                                <span
                                    key={star}
                                    onClick={() => setRating(star)}
                                    onMouseEnter={() => setHoveredRating(star)}
                                    onMouseLeave={() => setHoveredRating(0)}
                                    style={{
                                        fontSize: "36px",
                                        cursor: "pointer",
                                        color: isLit ? "#ffc107" : "#e2e8f0",
                                        transition: "all 0.15s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
                                        transform: star <= hoveredRating ? "scale(1.2)" : "scale(1)",
                                        display: "inline-block",
                                        userSelect: "none"
                                    }}
                                    className="star-symbol"
                                >
                                    ★
                                </span>
                            );
                        })}
                        {rating > 0 && (
                            <span className="ms-3 bg-light text-dark fw-bold px-2 py-1 rounded-3 small border" style={{ fontSize: "13px" }}>
                                {rating} / 5 Stars
                            </span>
                        )}
                    </div>
                </Form.Group>
 
                {/* 2. OPTIONAL TEXT FEEDBACK TEXTAREA CHANNEL */}
                <Form.Group className="mb-4">
                    <Form.Label className="fw-semibold text-secondary small uppercase tracking-wider">
                        Written Experience Feedback (Optional)
                    </Form.Label>
                    <Form.Control
                        as="textarea"
                        rows={4}
                        placeholder="What parts did you find most useful? How can the instructor optimize this course roadmap content?"
                        value={reviewText}
                        onChange={(e) => setReviewText(e.target.value)}
                        maxLength={1000}
                        style={{
                            borderRadius: "12px",
                            borderColor: "#e2e8f0",
                            padding: "14px",
                            fontSize: "14.5px",
                            resize: "none",
                            boxShadow: "none",
                            transition: "border-color 0.2s"
                        }}
                        className="feedback-input"
                    />
                    <div className="text-end text-muted small mt-1.5" style={{ fontSize: "12px" }}>
                        {reviewText.length} / 1000 characters
                    </div>
                </Form.Group>
 
                {/* 3. SUBMISSION CALL TO ACTION TRIGGER ROW */}
                <div className="text-end">
                    <Button
                        type="submit"
                        disabled={rating === 0 || isSubmitting}
                        className="border-0 px-4 py-2.5 fw-bold shadow-sm"
                        style={{
                            borderRadius: "10px",
                            backgroundColor: "#4f46e5",
                            backgroundImage: "linear-gradient(to right, #4f46e5, #6366f1)",
                            fontSize: "14.5px",
                            letterSpacing: "0.3px"
                        }}
                    >
                        {isSubmitting ? (
                            <>
                                <Spinner animation="border" size="sm" className="me-2" />
                                Saving Review...
                            </>
                        ) : "Submit Course Evaluation"}
                    </Button>
                </div>
            </Form>
 
            {/* Embedded Structural Interaction CSS Styles */}
            <style>{`
                .feedback-input:focus {
                    border-color: #6366f1 !important;
                    background-color: #fec7d705;
                }
                .star-symbol:hover {
                    text-shadow: 0 0 8px rgba(255, 193, 7, 0.4);
                }
            `}</style>
        </Card>
    );
};
 
export default CourseReviewForm;
 
 