import { useState, useEffect } from 'react';
import { Container, Table, Card, Button, Modal, Badge, Spinner, Alert, Row, Col } from 'react-bootstrap';
import { FaHistory, FaReceipt, FaFileDownload, FaTimes, FaCoins } from 'react-icons/fa';
import API from '../../api/client';

interface PaymentRecord {
  receipt_id: string;
  course_title: string;
  amount: number;
  date: string;
  status: string;
}

const PaymentHistory = () => {
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Modal Overlay States
  const [showReceipt, setShowReceipt] = useState<boolean>(false);
  const [selectedInvoice, setSelectedInvoice] = useState<PaymentRecord | null>(null);

  useEffect(() => {
    const fetchPaymentHistory = async () => {
      try {
        const response = await API.get<PaymentRecord[]>('/api/v1/my-payments-history');
        setPayments(Array.isArray(response.data) ? response.data : []);
      } catch (err: any) {
        setError(err.response?.data?.detail || "Failed to load transaction history statements.");
      } finally {
        setLoading(false);
      }
    };
    fetchPaymentHistory();
  }, []);

  const handleOpenReceipt = (invoice: PaymentRecord) => {
    setSelectedInvoice(invoice);
    setShowReceipt(true);
  };

  if (loading) {
    return (
      <div className="d-flex flex-column justify-content-center align-items-center py-5">
        <Spinner animation="border" variant="primary" className="mb-2" />
        <span className="text-muted small fw-medium">Loading payment statements...</span>
      </div>
    );
  }

  if (error) return <Alert variant="danger" className="border-0 shadow-sm rounded-3">{error}</Alert>;

  return (
    <Container className="py-4">
      {/* Dynamic Purchase Table Records Card */}
      <Card className="border-0 shadow-sm rounded-4 overflow-hidden bg-white">
        <Card.Header className="bg-light border-bottom py-3 d-flex align-items-center gap-2 text-dark fw-bold text-uppercase small">
          <FaHistory className="text-primary" /> Billing & Purchase Logs
        </Card.Header>

        {payments.length === 0 ? (
          <div className="text-center py-5 text-muted small">
            <FaCoins size={32} className="text-muted opacity-40 mb-2" />
            <div>No transaction logs mapped to your account profile yet.</div>
          </div>
        ) : (
          <div className="table-responsive">
            <Table hover className="align-middle mb-0 small text-secondary">
              <thead className="table-light text-uppercase font-monospace" style={{ fontSize: '11px' }}>
                <tr>
                  <th className="py-3 px-4">Purchase Date</th>
                  <th className="py-3 px-4">Course Title</th>
                  <th className="py-3 px-4">Amount Paid</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-center">Invoice</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((payment, index) => (
                  <tr key={index}>
                    <td className="py-3 px-4 text-muted">{payment.date}</td>
                    <td className="py-3 px-4 text-dark fw-semibold">{payment.course_title}</td>
                    <td className="py-3 px-4 text-success fw-bold">₹{payment.amount.toLocaleString('en-IN')}</td>
                    <td className="py-3 px-4">
                      <Badge bg="success" className="bg-opacity-10 text-success border border-success border-opacity-25 px-2.5 py-1.5 rounded-pill fw-medium">
                        {payment.status}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <Button 
                        variant="outline-primary" 
                        size="sm" 
                        className="rounded-pill px-3 btn-sm"
                        onClick={() => handleOpenReceipt(payment)}
                      >
                        <FaReceipt size={11} className="me-1" /> View Receipt
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
        )}
      </Card>

       
      {selectedInvoice && (
        <Modal show={showReceipt} onHide={() => setShowReceipt(false)} centered>
          {/* Print Media Rule injection to hide background page panels seamlessly */}
          <style dangerouslySetInnerHTML={{ __html: `
            @media print {
              body * { visibility: hidden; }
              .printable-area, .printable-area * { visibility: visible; }
              .printable-area { position: absolute; left: 0; top: 0; width: 100%; box-shadow: none !important; }
              .no-print { display: none !important; }
            }
          `}} />

          <Card className="border-0 p-4 printable-area rounded-4 bg-white">
            {/* Invoice Layout Header */}
            <div className="d-flex justify-content-between align-items-start mb-4">
              <div>
                <h3 className="fw-bold m-0 text-primary">EDTECH ACADEMY</h3>
                <span className="text-muted small">Enrollment Invoice Statement</span>
              </div>
              <Button variant="link" className="text-secondary p-0 no-print" onClick={() => setShowReceipt(false)}>
                <FaTimes size={18} />
              </Button>
            </div>

            <hr className="my-3 opacity-20" />

            {/* Audit Logs Meta Row */}
            <Row className="mb-4 g-2 small">
              <Col xs={6}>
                <div className="text-muted text-uppercase fw-bold font-monospace" style={{ fontSize: '10px' }}>Receipt ID</div>
                <div className="text-dark font-monospace text-truncate">{selectedInvoice.receipt_id}</div>
              </Col>
              <Col xs={6} className="text-end">
                <div className="text-muted text-uppercase fw-bold font-monospace" style={{ fontSize: '10px' }}>Date Settled</div>
                <div className="text-dark fw-medium">{selectedInvoice.date}</div>
              </Col>
            </Row>

            {/* Core Cart Item Layout Section */}
            <div className="border rounded-3 p-3 bg-light mb-4 small">
              <div className="d-flex justify-content-between border-bottom pb-2 mb-2 text-muted fw-bold text-uppercase font-monospace" style={{ fontSize: '10px' }}>
                <span>Item Description</span>
                <span>Total</span>
              </div>
              <div className="d-flex justify-content-between align-items-center">
                <span className="fw-semibold text-dark text-truncate pe-2">{selectedInvoice.course_title}</span>
                <span className="fw-bold text-dark flex-shrink-0">₹{selectedInvoice.amount.toLocaleString('en-IN')}</span>
              </div>
            </div>

            {/* Total Balance Sheet Block */}
            <div className="d-flex justify-content-between align-items-baseline mb-4 p-2 bg-success bg-opacity-10 rounded-3 border border-success border-opacity-10">
              <span className="fw-bold text-dark small text-uppercase">Total Captured Funds</span>
              <h4 className="fw-bold text-success m-0">₹{selectedInvoice.amount.toLocaleString('en-IN')}</h4>
            </div>

            <div className="text-muted small" style={{ fontSize: '11px' }}>
              • Transaction Status: <strong className="text-success">{selectedInvoice.status.toUpperCase()}</strong><br />
              • Curriculum Status: <strong>PERMANENT CLASSROOM ACCESS ACTIVE ✅</strong>
            </div>

            <hr className="my-4 opacity-25" />

            {/* Print Action Sheet Footer */}
            <div className="d-flex justify-content-end gap-2 no-print">
              <Button variant="outline-secondary" size="sm" className="rounded-pill px-3" onClick={() => setShowReceipt(false)}>Close</Button>
              <Button variant="primary" size="sm" className="rounded-pill px-4 text-white fw-bold d-flex align-items-center gap-1.5" onClick={() => window.print()}>
                <FaFileDownload size={12} /> Save PDF / Print
              </Button>
            </div>
          </Card>
        </Modal>
      )}
    </Container>
  );
};

export default PaymentHistory;
