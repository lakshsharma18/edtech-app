import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaRobot, FaPaperPlane, FaTimes, FaMinus } from 'react-icons/fa';
import API from '../api/client'; // Using your existing API instance
import { Button } from 'react-bootstrap';
interface Message {
    text: string;
    sender: 'user' | 'ai';
}

const Chatbot = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [input, setInput] = useState('');
    const [messages, setMessages] = useState<Message[]>([
        { text: "Hi! I'm your Ed-Tech assistant. How can I help you today?", sender: 'ai' }
    ]);
    const [isTyping, setIsTyping] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to latest message
    useEffect(() => {
        scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim()) return;

        const userMsg = input;
        setInput('');
        setMessages(prev => [...prev, { text: userMsg, sender: 'user' }]);
        setIsTyping(true);

        try {
            // ✅ Hits your FastAPI endpoint: /api/v1/ai/chat
            const response = await API.post('/api/v1/chat', { question: userMsg });
            setMessages(prev => [...prev, { text: response.data.answer, sender: 'ai' }]);
        } catch (error) {
            setMessages(prev => [...prev, { text: "Sorry, I'm having trouble connecting right now.", sender: 'ai' }]);
        } finally {
            setIsTyping(false);
        }
    };

    return (
        <div style={{ position: 'fixed', bottom: '30px', right: '30px', zIndex: 1000 }}>
            {/* --- Floating Bubble --- */}
            <motion.div
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setIsOpen(!isOpen)}
                style={{
                    width: '60px', height: '60px', borderRadius: '50%',
                    background: 'linear-gradient(135deg, #0dcaf0, #0d6efd)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer', boxShadow: '0 4px 15px rgba(0,0,0,0.3)', color: 'white'
                }}
            >
                {isOpen ? <FaMinus size={24} /> : <FaRobot size={30} />}
            </motion.div>

            {/* --- Chat Window --- */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 50, scale: 0.8 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 50, scale: 0.8 }}
                        style={{
                            position: 'absolute', bottom: '80px', right: '0',
                            width: '350px', height: '450px', background: '#ffffff',
                            borderRadius: '20px', boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
                            display: 'flex', flexDirection: 'column', overflow: 'hidden'
                        }}
                    >
                        {/* Header */}
                        <div style={{ background: '#0d6efd', padding: '15px', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span className="fw-bold"><FaRobot className="me-2" /> Platform Support</span>
                            <FaTimes style={{ cursor: 'pointer' }} onClick={() => setIsOpen(false)} />
                        </div>

                        {/* Messages Area */}
                        <div style={{ flex: 1, padding: '15px', overflowY: 'auto', background: '#f8f9fa' }}>
                            {messages.map((msg, i) => (
                                <div key={i} style={{ display: 'flex', justifyContent: msg.sender === 'user' ? 'flex-end' : 'flex-start', marginBottom: '10px' }}>
                                    <div style={{
                                        maxWidth: '80%', padding: '10px 15px', borderRadius: '15px',
                                        background: msg.sender === 'user' ? '#0d6efd' : '#e9ecef',
                                        color: msg.sender === 'user' ? 'white' : '#212529',
                                        fontSize: '0.9rem'
                                    }}>
                                        {msg.text}
                                    </div>
                                </div>
                            ))}
                            {isTyping && <div className="text-muted small ps-2">AI is typing...</div>}
                            <div ref={scrollRef} />
                        </div>

                        {/* Input Area */}
                        <form onSubmit={handleSendMessage} style={{ padding: '10px', borderTop: '1px solid #dee2e6', display: 'flex', gap: '10px' }}>
                            <input
                                type="text"
                                className="form-control form-control-sm border-0 shadow-none"
                                placeholder="Ask about the platform..."
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                            />
                            <Button type="submit" variant="primary" size="sm" className="rounded-circle">
                                <FaPaperPlane />
                            </Button>
                        </form>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default Chatbot;
