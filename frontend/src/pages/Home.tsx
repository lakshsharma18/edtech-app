
import { Container, Row, Col, Button, Card, Badge } from 'react-bootstrap';
import { motion } from 'framer-motion';
import { FaPlay, FaCode, FaChartBar, FaUserGraduate, FaChalkboardTeacher, FaRocket } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import '../styles/Home.css';
import image from '../assets/download.webp'
const Home = () => {
    const fadeIn = {
        hidden: { opacity: 0, y: 30 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
    };

    const staggerContainer = {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { staggerChildren: 0.2 } }
    };

    return (
        <div className="home-wrapper">
            {/* --- HERO SECTION --- */}
            <section className="hero-section text-center text-lg-start">
                <Container>
                    <Row className="align-items-center">
                        <Col lg={6}>
                            <motion.div initial="hidden" animate="visible" variants={fadeIn}>
                                <Badge bg="primary" className="mb-3 px-3 py-2 rounded-pill shadow-sm">
                                    <FaRocket className="me-2" /> Revolutionizing Education
                                </Badge>
                                <h1 className="display-3 fw-bold mb-4">
                                    Unlock Your Potential with <span className="text-gradient">ED-TECH</span>
                                </h1>
                                <p className="lead text-muted mb-5">
                                    Accessible, high-quality learning for students and professionals. 
                                    Master specialized domains with our expert-led video courses.
                                </p>
                                <div className="d-flex flex-column flex-sm-row gap-3">
                                    <Button as={Link as any} to="/courses" variant="primary" className="btn-hero btn-lg px-5 shadow">
                                        Explore Courses
                                    </Button>
                                    <Button variant="outline-dark" className="btn-hero-outline btn-lg px-5">
                                        <FaPlay className="me-2" size={14} /> Watch Demo
                                    </Button>
                                </div>
                            </motion.div>
                        </Col>
                        <Col lg={6} className="mt-5 mt-lg-0">
                            <motion.div 
                                initial={{ scale: 0.8, opacity: 0 }} 
                                animate={{ scale: 1, opacity: 1 }} 
                                transition={{ duration: 0.8 }}
                                className="hero-image-container"
                            >
                                <img src={image} alt="E-learning" className="img-fluid rounded-4 shadow-2xl" />
                        
                                
                            </motion.div>
                        </Col>
                    </Row>
                </Container>
            </section>

            {/* --- FEATURES SECTION --- */}
            <section className="features-section bg-light py-5">
                <Container>
                    <motion.div variants={staggerContainer} initial="hidden" whileInView="visible" viewport={{ once: true }}>
                        <h2 className="text-center fw-bold mb-5">Why Choose Our Platform?</h2>
                        <Row className="g-4">
                            {[
                                { icon: <FaCode />, title: "Tech Domains", desc: "Full Stack, AI, Data Science & more." },
                                { icon: <FaChalkboardTeacher />, title: "Expert Tutors", desc: "Learn from industry professionals." },
                                { icon: <FaChartBar />, title: "Skill Tracking", desc: "Monitor your growth with analytics." }
                            ].map((feature, idx) => (
                                <Col md={4} key={idx}>
                                    <motion.div variants={fadeIn}>
                                        <Card className="feature-card h-100 border-0 shadow-sm p-4 text-center">
                                            <div className="icon-box mx-auto mb-3">{feature.icon}</div>
                                            <h4>{feature.title}</h4>
                                            <p className="text-muted">{feature.desc}</p>
                                        </Card>
                                    </motion.div>
                                </Col>
                            ))}
                        </Row>
                    </motion.div>
                </Container>
            </section>

            {/* --- CTA SECTION --- */}
            <section className="cta-section py-5 text-white text-center">
                <Container>
                    <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} className="cta-box p-5 rounded-5 shadow-lg">
                        <h2 className="display-5 fw-bold mb-3">Ready to start your journey?</h2>
                        <p className="mb-4 opacity-75">Join thousands of others upgrading their careers today.</p>
                        <Button as={Link as any} to="/register" variant="light" className="btn-lg px-5 fw-bold text-primary rounded-pill">
                            Get Started for Free
                        </Button>
                    </motion.div>
                </Container>
            </section>
        </div>
    );
};

export default Home;
