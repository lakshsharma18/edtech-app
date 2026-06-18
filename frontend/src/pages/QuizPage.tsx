import { useEffect, useState } from "react";
import { Container, Card, Button, Spinner } from "react-bootstrap";
import { useParams, useNavigate } from "react-router-dom";
import API from '../api/client';
 
interface Option {
    id: number;
    text: string;
}
 
interface Question {
    question_id: number;
    question: string;
    options: Option[];
}
 
const QuizPage = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
 
    const [questions, setQuestions] = useState<Question[]>([]);
    const [quizDbId, setQuizDbId] = useState<number | null>(null); // ✅ Added state to hold the real backend quiz ID
    const [answers, setAnswers] = useState<Record<number, number>>({});
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
 
    // ✅ load quiz
    useEffect(() => {
        (async () => {
            try {
                // ✅ Matches your backend path: /quiz/{course_id}
                const res = await API.get(`/api/v1/quiz/${Number(id)}`);
                setQuestions(res.data.questions);
                setQuizDbId(res.data.quiz_id); // ✅ Capture and store the real quiz database primary key
            } catch (err) {
                alert("Failed to load quiz");
            } finally {
                setLoading(false);
            }
        })();
    }, [id]);
 
    // ✅ select answer
    const handleSelect = (qId: number, optionId: number) => {
        setAnswers(prev => ({
            ...prev,
            [qId]: optionId
        }));
    };
 
    // ✅ submit quiz
    const handleSubmit = async () => {
        if (!quizDbId) {
            alert("Quiz context error. Try reloading.");
            return;
        }
 
        if (Object.keys(answers).length < questions.length) {
            alert("Please answer all questions before submitting.");
            return;
        }
 
        try {
            setSubmitting(true);
 
            const payload = {
                quiz_id: quizDbId, // ✅ Sending the real quiz database ID, NOT the course_id
                answers: Object.entries(answers).map(([qId, optId]) => ({
                    question_id: Number(qId),
                    option_id: optId
                }))
            };
 
            // ✅ Matches your backend path: /quiz/submit
            const res = await API.post("/api/v1/quiz/submit", payload);
 
            alert(`Score: ${res.data.percentage}%`);
 
            if (res.data.passed) {
                navigate(`/user/dashboard`); // go back
            }
 
        } catch {
            alert("Submission failed");
        } finally {
            setSubmitting(false);
        }
    };
 
    if (loading) {
        return (
            <div className="vh-100 d-flex align-items-center justify-content-center">
                <Spinner />
            </div>
        );
    }
 
    return (
        <Container className="py-4">
            <h4 className="mb-4">Quiz</h4>
 
            {questions.map((q, index) => (
                <Card key={q.question_id} className="mb-3 p-3">
                    <h6>{index + 1}. {q.question}</h6>
 
                    {q.options.map(opt => (
                        <div key={opt.id} className="mt-2">
                            <label style={{ cursor: "pointer" }}>
                                <input
                                    type="radio"
                                    name={`q-${q.question_id}`}
                                    value={opt.id}
                                    checked={answers[q.question_id] === opt.id}
                                    onChange={() => handleSelect(q.question_id, opt.id)}
                                />{" "}
                                {opt.text}
                            </label>
                        </div>
                    ))}
                </Card>
            ))}
 
            <div className="text-end">
                <Button onClick={handleSubmit} disabled={submitting}>
                    {submitting ? "Submitting..." : "Submit Quiz"}
                </Button>
            </div>
        </Container>
    );
};
 
export default QuizPage;
 
 