import React from 'react';
import { Container, Row, Col, Button, Card } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { FaPlus, FaBook, FaUsers, FaCoins } from 'react-icons/fa';
import { motion } from 'framer-motion';

const AdminHome = () => {
  const cardStyle: React.CSSProperties = {
    background: 'rgba(30, 41, 59, 0.7)',
    backdropFilter: 'blur(10px)',
    border: '1px solid rgba(255, 255, 255, 0.05)',
    borderRadius: '16px',
    color: '#ffffff',
  };

  const statCards = [
    { title: 'Total Courses', value: '12', icon: <FaBook size={24} color="#0dcaf0" /> },
    { title: 'Active Students', value: '1,240', icon: <FaUsers size={24} color="#20c997" /> },
    { title: 'Gross Revenue', value: '$14,250', icon: <FaCoins size={24} color="#ffc107" /> },
  ];

  return (
    <Container className="py-5">
      {/* Header Panel */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-5 gap-3">
        <div>
          <h1 className="fw-bold text-white mb-1">Admin Dashboard</h1>
          <p style={{ color: '#94a3b8' }}>Monitor operational metrics and platform architecture.</p>
        </div>
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Button
            as={Link as any}
            to="/admin/create-course"
            variant="info"
            style={{ fontWeight: 700, borderRadius: '12px', padding: '12px 24px' }}
            className="d-flex align-items-center gap-2 shadow"
          >
            <FaPlus /> Create New Course
          </Button>
        </motion.div>
      </div>

      {/* Metrics Row */}
      <Row className="g-4 mb-5">
        {statCards.map((stat, idx) => (
          <Col md={4} key={idx}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
            >
              <Card style={cardStyle} className="p-4 shadow-sm">
                <Card.Body className="d-flex align-items-center justify-content-between p-0">
                  <div>
                    <span style={{ color: '#94a3b8', fontSize: '0.85rem', fontWeight: 600, textTransform: 'uppercase' }}>{stat.title}</span>
                    <h2 className="fw-bold m-0 mt-1" style={{ fontSize: '2rem' }}>{stat.value}</h2>
                  </div>
                  <div style={{ background: 'rgba(255,255,255,0.05)', padding: '12px', borderRadius: '12px' }}>
                    {stat.icon}
                  </div>
                </Card.Body>
              </Card>
            </motion.div>
          </Col>
        ))}
      </Row>
    </Container>
  );
};

export default AdminHome;
