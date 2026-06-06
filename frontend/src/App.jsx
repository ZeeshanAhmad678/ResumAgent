import { useState, useCallback } from 'react';
import Header from './components/Header.jsx';
import UploadPanel from './components/UploadPanel.jsx';
import LoadingState from './components/LoadingState.jsx';
import SummaryDisplay from './components/SummaryDisplay.jsx';
import ErrorBanner from './components/ErrorBanner.jsx';
import HistoryDrawer from './components/HistoryDrawer.jsx';
import styles from './App.module.css';

const VIEW = { IDLE: 'idle', LOADING: 'loading', RESULT: 'result', ERROR: 'error' };

export default function App() {
  const [view, setView] = useState(VIEW.IDLE);
  const [summaryData, setSummaryData] = useState(null);
  const [metadata, setMetadata] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  // Drawer State
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const runAgent = useCallback(async ({ mode, file }) => {
    setView(VIEW.LOADING);
    try {
      if (mode !== 'pdf') throw new Error("Only PDF supported in this view.");

      const form = new FormData();
      form.append('file', file);
      const response = await fetch('http://127.0.0.1:8000/summarize/pdf', { method: 'POST', body: form });

      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const payload = await response.json();
      setSummaryData(payload.summary);
      setMetadata({ source: payload.source, sessionId: payload.session_id });
      setView(VIEW.RESULT);

    } catch (err) {
      setErrorMsg(err.message);
      setView(VIEW.ERROR);
    }
  }, []);

  const loadHistoricalPaper = async (sessionId) => {
    setView(VIEW.LOADING);
    setIsDrawerOpen(false);

    try {
      const res = await fetch(`http://127.0.0.1:8000/history/${sessionId}`);
      if (!res.ok) throw new Error("Could not load paper history.");

      const data = await res.json();
      setSummaryData(data.summary);

      // CRITICAL FIX: We are now passing the chat_history down to the component!
      setMetadata({
        source: data.source,
        sessionId: sessionId,
        chatHistory: data.chat_history
      });

      setView(VIEW.RESULT);

    } catch (err) {
      setErrorMsg(err.message);
      setView(VIEW.ERROR);
    }
  };

  const resetToUpload = () => {
    setView(VIEW.IDLE);
  };

  return (
    <div className={styles.appLayout} style={{ display: 'flex', flexDirection: 'column', height: '100vh', position: 'relative' }}>

      {/* Floating Menu Button */}
      <button
        className={styles.menuToggleBtn}
        onClick={() => setIsDrawerOpen(true)}
      >
        ☰ <span style={{ marginLeft: '8px' }}>History Logs</span>
      </button>

      {/* The Sliding Drawer Component */}
      <HistoryDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        onSelectPaper={loadHistoricalPaper}
      />

      {/* Centered Main Workspace */}
      <main className={styles.mainWorkspace} style={{ flex: 1, overflowY: 'auto', padding: '80px 20px 40px' }}>

        {/* THIS is the container that stops the stretching! */}
        <div style={{ maxWidth: '900px', margin: '0 auto', width: '100%' }}>

          <div style={{ marginBottom: '40px' }}>
            <Header />
          </div>

          {view === VIEW.IDLE && (
            <UploadPanel onSubmit={runAgent} />
          )}

          {view === VIEW.LOADING && (
            <LoadingState />
          )}

          {view === VIEW.ERROR && (
            <ErrorBanner message={errorMsg} onReset={resetToUpload} />
          )}

          {view === VIEW.RESULT && summaryData && (
            <SummaryDisplay data={summaryData} metadata={metadata} onReset={resetToUpload} />
          )}

        </div>
      </main>

    </div>
  );
}