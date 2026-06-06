import React, { useState, useRef, useEffect } from 'react';
import styles from '../App.module.css';

export default function SummaryDisplay({ data, metadata, onReset }) {
  // Initialize with history if it exists, otherwise empty array
  const [messages, setMessages] = useState(metadata?.chatHistory || []);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const chatEndRef = useRef(null);
  const containerRef = useRef(null);

  // CRITICAL FIX: Update the chat box immediately if the user clicks a DIFFERENT paper in the sidebar
  useEffect(() => {
    setMessages(metadata?.chatHistory || []);
  }, [metadata?.sessionId]);

  // Auto-scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);


  const handleAskQuestion = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userQ = input;
    setMessages(prev => [...prev, { role: 'user', text: userQ }]);
    setInput('');
    setIsTyping(true);

    try {
      const res = await fetch('http://127.0.0.1:8000/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: metadata.sessionId, question: userQ })
      });

      const payload = await res.json();
      setMessages(prev => [...prev, { role: 'agent', text: payload.answer }]);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'agent', text: "Connection error. Ensure backend is running." }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div ref={containerRef} style={{ maxWidth: '1000px', margin: '0 auto', color: '#f8fafc', paddingBottom: '40px' }}>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <h2>Results: <span style={{ color: '#00e5ff', fontWeight: 'normal' }}>{metadata.source}</span></h2>
        <button onClick={onReset} style={{ background: 'transparent', color: '#94a3b8', border: '1px solid #334155', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer' }}>
          Start Over
        </button>
      </div>

      {/* Grid of 5 Separate Findings Blocks */}
      <div className={styles.findingsGrid}>
        {Object.entries(data).map(([key, value]) => (
          <div key={key} className={styles.findingCard}>
            <h4 className={styles.findingHeader}>{key}</h4>
            <p style={{ margin: 0, lineHeight: '1.7', color: '#cbd5e1' }}>{value}</p>
          </div>
        ))}
      </div>

      {/* Interactive Chat Block */}
      <div className={styles.findingCard} style={{ display: 'flex', flexDirection: 'column', height: '450px' }}>
        <h3 style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '16px', margin: '0 0 16px 0' }}>
          💬 Chat with the Paper
        </h3>

        <div style={{ flex: 1, overflowY: 'auto', paddingRight: '12px', marginBottom: '16px', display: 'flex', flexDirection: 'column' }}>
          {messages.length === 0 && (
            <p style={{ color: '#64748b', fontStyle: 'italic', textAlign: 'center', margin: 'auto' }}>
              Ask a specific question about the methodology, datasets, or findings...
            </p>
          )}

          {messages.map((msg, i) => (
            <div key={i} style={{
              background: msg.role === 'user' ? '#1e293b' : 'rgba(0, 229, 255, 0.05)',
              border: msg.role === 'agent' ? '1px solid rgba(0, 229, 255, 0.2)' : '1px solid transparent',
              padding: '16px',
              borderRadius: '12px',
              marginBottom: '12px',
              marginLeft: msg.role === 'user' ? 'auto' : '0',
              marginRight: msg.role === 'agent' ? 'auto' : '0',
              maxWidth: '85%',
              whiteSpace: 'pre-wrap',
              lineHeight: '1.6'
            }}>
              <strong style={{ color: msg.role === 'user' ? '#94a3b8' : '#00e5ff', display: 'block', marginBottom: '8px', fontSize: '14px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                {msg.role === 'user' ? 'You' : 'ResumAgent'}
              </strong>
              {msg.text}
            </div>
          ))}

          {isTyping && (
            <div style={{ color: '#00e5ff', fontStyle: 'italic', padding: '16px', animation: 'pulse 1.5s infinite' }}>
              Agent is analyzing...
            </div>
          )}

          {/* Auto-scroll anchor */}
          <div ref={chatEndRef} />
        </div>

        <form onSubmit={handleAskQuestion} style={{ display: 'flex', gap: '12px', marginTop: 'auto' }}>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask anything about this document..."
            style={{ flex: 1, padding: '16px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: '#0f172a', color: '#fff', outline: 'none' }}
          />
          <button type="submit" disabled={isTyping} style={{ background: '#00e5ff', color: '#000', padding: '0 32px', borderRadius: '8px', border: 'none', fontWeight: 'bold', cursor: 'pointer', transition: 'transform 0.1s' }}>
            Send
          </button>
        </form>
      </div>

    </div>
  );
}