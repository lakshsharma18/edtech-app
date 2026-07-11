import { useEffect, useState } from "react";
import { Card, ListGroup, Spinner, Alert } from "react-bootstrap";
import API from '../../api/client';
interface Review {
    id: number;
    rating: number;
    review_text: string | null;
    created_at: string;
    user_name: string;
}
 
interface CourseReviewsListProps {
    courseId: number;
}
 
const CourseReviewsList = ({ courseId }: CourseReviewsListProps) => {
    const [reviews, setReviews] = useState<Review[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
 
    useEffect(() => {
        const fetchReviews = async () => {
            try {
                const res = await API.get<Review[]>(`/api/v1/${courseId}/reviews`);
                setReviews(res.data);
            } catch (err) {
                setError("Could not load reviews feed.");
            } finally {
                setLoading(false);
            }
        };
        fetchReviews();
    }, [courseId]);
 
    if (loading) return <div className="text-center py-4"><Spinner animation="border" variant="primary" size="sm" /></div>;
    if (error) return <Alert variant="danger" className="border-0 py-2 small">{error}</Alert>;
    if (reviews.length === 0) return <p className="text-muted small italic px-1">No reviews have been written for this course yet.</p>;
 
    return (
        <Card className="border-0 shadow-sm rounded-4 overflow-hidden mt-4 bg-white">
            <Card.Header className="bg-white border-bottom py-3 px-4">
                <h6 className="fw-bold mb-0 text-dark">Student Feedback ({reviews.length})</h6>
            </Card.Header>
            <ListGroup variant="flush">
                {reviews.map((rev) => (
                    <ListGroup.Item key={rev.id} className="p-4 border-bottom">
                        <div className="d-flex justify-content-between align-items-center mb-2">
                            <div>
                                <span className="fw-bold text-dark d-block small mb-0.5">{rev.user_name}</span>
                                <span style={{ color: "#ffc107", fontSize: "0.9rem" }}>
                                    {"★".repeat(rev.rating)}
                                    {"☆".repeat(5 - rev.rating)}
                                </span>
                            </div>
                            <span className="text-muted font-monospace" style={{ fontSize: "11px" }}>
                                {rev.created_at}
                            </span>
                        </div>
                        {rev.review_text ? (
                            <p className="text-secondary small mb-0 mt-2 lh-base style-italic">
                                "{rev.review_text}"
                            </p>
                        ) : (
                            <p className="text-muted small mb-0 mt-2 style-italic" style={{ fontSize: "13px" }}>
                                Left a rating without written feedback.
                            </p>
                        )}
                    </ListGroup.Item>
                ))}
            </ListGroup>
        </Card>
    );
};
 
export default CourseReviewsList;
 
 