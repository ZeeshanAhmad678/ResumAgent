import { useEffect, useState } from 'react';
import styles from '../App.module.css';

export default function HistoryDrawer({ isOpen, onClose, onSelectPaper }) {
    const [history, setHistory] = useState([]);

    useEffect(() => {
        if (isOpen) {
            fetch('http://127.0.0.1:8000/history')
                .then(res => res.json())
                .then(data => setHistory(data))
                .catch(err => console.error("Failed to fetch history logs:", err));
        }
    }, [isOpen]);

    const handleClearHistory = async () => {
        // Safety check so users don't accidentally delete everything
        if (!window.confirm("Are you sure you want to permanently delete all paper summaries and chat history?")) return;

        try {
            const res = await fetch('http://127.0.0.1:8000/history', {
                method: 'DELETE'
            });

            if (res.ok) {
                setHistory([]); // Instantly clear the UI list
            } else {
                console.error("Failed to clear database");
            }
        } catch (err) {
            console.error("Server connection error:", err);
        }
    };

    return (
        <>
            <div
                className={`${styles.drawerOverlay} ${isOpen ? styles.drawerOverlayOpen : ''}`}
                onClick={onClose}
            />

            <div className={`${styles.historyDrawer} ${isOpen ? styles.historyDrawerOpen : ''}`}>

                {/* Updated Header with Clear Button */}
                <div className={styles.drawerHeader} style={{ flexDirection: 'column', alignItems: 'stretch', gap: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h3 style={{ margin: 0, color: '#00e5ff', fontSize: '18px' }}>📚 Library</h3>
                        <button onClick={onClose} className={styles.closeBtn}>✕</button>
                    </div>

                    {/* Only show the Clear button if there is history to clear */}
                    {history.length > 0 && (
                        <button
                            onClick={handleClearHistory}
                            style={{
                                background: 'rgba(239, 68, 68, 0.1)',
                                color: '#ef4444',
                                border: '1px solid rgba(239, 68, 68, 0.3)',
                                padding: '8px',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                fontSize: '13px',
                                fontWeight: 'bold',
                                transition: 'all 0.2s ease'
                            }}
                            onMouseEnter={(e) => e.target.style.background = 'rgba(239, 68, 68, 0.2)'}
                            onMouseLeave={(e) => e.target.style.background = 'rgba(239, 68, 68, 0.1)'}
                        >
                            🗑️ Clear All History
                        </button>
                    )}
                </div>

                <div className={styles.historyList}>
                    {history.length === 0 ? (
                        <p style={{ color: '#64748b', textAlign: 'center', marginTop: '20px', fontStyle: 'italic' }}>
                            No papers summarized yet.
                        </p>
                    ) : (
                        history.map((paper) => (
                            <div
                                key={paper.session_id}
                                className={styles.historyItem}
                                onClick={() => onSelectPaper(paper.session_id)}
                            >
                                <div className={styles.historyTitle}>
                                    {paper.filename}
                                </div>
                                <div className={styles.historyDate}>
                                    {new Date(paper.date).toLocaleString()}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </>
    );
}