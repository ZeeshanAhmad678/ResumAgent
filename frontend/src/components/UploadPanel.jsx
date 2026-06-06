import { useState, useRef, useCallback } from 'react'
import styles from './UploadPanel.module.css'

const MAX_TEXT_LENGTH = 120_000 // ~30k tokens

export default function UploadPanel({ onSubmit }) {
  const [mode, setMode]         = useState('pdf')     // 'pdf' | 'text'
  const [file, setFile]         = useState(null)
  const [textInput, setTextInput] = useState('')
  const [dragOver, setDragOver] = useState(false)
  const [validationErr, setValidationErr] = useState('')
  const fileInputRef = useRef(null)

  // ── Drag-and-drop handlers ──────────────────────
  const handleDrop = useCallback((e) => {
    e.preventDefault()
    setDragOver(false)
    const dropped = e.dataTransfer.files[0]
    if (dropped) validateAndSetFile(dropped)
  }, [])

  const handleDragOver = (e) => { e.preventDefault(); setDragOver(true) }
  const handleDragLeave = () => setDragOver(false)

  const validateAndSetFile = (f) => {
    setValidationErr('')
    if (!f.name.toLowerCase().endsWith('.pdf')) {
      setValidationErr('Only .pdf files are accepted.')
      return
    }
    if (f.size > 20 * 1024 * 1024) {
      setValidationErr('File exceeds 20 MB limit.')
      return
    }
    setFile(f)
  }

  // ── Submit ──────────────────────────────────────
  const handleSubmit = () => {
    setValidationErr('')

    if (mode === 'pdf') {
      if (!file) { setValidationErr('Please select a PDF file.'); return }
      onSubmit({ mode: 'pdf', file })
    } else {
      const trimmed = textInput.trim()
      if (!trimmed) { setValidationErr('Paste some paper text first.'); return }
      if (trimmed.length > MAX_TEXT_LENGTH) {
        setValidationErr(`Text exceeds the ~30,000-token limit (${trimmed.length.toLocaleString()} chars).`)
        return
      }
      onSubmit({ mode: 'text', text: trimmed })
    }
  }

  const charPercent = Math.min((textInput.length / MAX_TEXT_LENGTH) * 100, 100)
  const charColor = charPercent > 90 ? 'var(--status-error)'
                  : charPercent > 70 ? 'var(--status-warn)'
                  : 'var(--neon-cyan)'

  return (
    <div className={styles.panel}>
      {/* ── Mode Tabs ──────────────────────────────── */}
      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${mode === 'pdf' ? styles.tabActive : ''}`}
          onClick={() => { setMode('pdf'); setValidationErr('') }}
        >
          <PdfIcon /> PDF Upload
        </button>
        <button
          className={`${styles.tab} ${mode === 'text' ? styles.tabActive : ''}`}
          onClick={() => { setMode('text'); setValidationErr('') }}
        >
          <TextIcon /> Plain Text
        </button>
      </div>

      {/* ── Input area ─────────────────────────────── */}
      <div className={styles.inputArea}>
        {mode === 'pdf' ? (
          <>
            {/* Drop zone */}
            <div
              className={`${styles.dropZone} ${dragOver ? styles.dropZoneActive : ''} ${file ? styles.dropZoneHasFile : ''}`}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => fileInputRef.current?.click()}
              role="button"
              tabIndex={0}
              onKeyDown={e => e.key === 'Enter' && fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf"
                hidden
                onChange={e => e.target.files[0] && validateAndSetFile(e.target.files[0])}
              />

              {file ? (
                <div className={styles.fileInfo}>
                  <span className={styles.fileIcon}>📄</span>
                  <div>
                    <p className={styles.fileName}>{file.name}</p>
                    <p className={styles.fileMeta}>{(file.size / 1024).toFixed(1)} KB · Ready to analyse</p>
                  </div>
                  <button className={styles.clearFile} onClick={e => { e.stopPropagation(); setFile(null) }}>
                    ✕
                  </button>
                </div>
              ) : (
                <div className={styles.dropPrompt}>
                  <div className={styles.dropIcon}>
                    <UploadIcon />
                  </div>
                  <p className={styles.dropTitle}>Drop your PDF here</p>
                  <p className={styles.dropSub}>or click to browse · max 20 MB</p>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className={styles.textWrapper}>
            <textarea
              className={styles.textarea}
              placeholder="Paste the full text of the research paper here…&#10;&#10;Abstract, Introduction, Methods, Results, Discussion — the more complete, the better the analysis."
              value={textInput}
              onChange={e => { setTextInput(e.target.value); setValidationErr('') }}
              spellCheck={false}
            />
            <div className={styles.charCounter}>
              <div className={styles.charBar}>
                <div
                  className={styles.charBarFill}
                  style={{ width: `${charPercent}%`, background: charColor }}
                />
              </div>
              <span style={{ color: charColor }}>
                {textInput.length.toLocaleString()} / {MAX_TEXT_LENGTH.toLocaleString()} chars
              </span>
            </div>
          </div>
        )}
      </div>

      {/* ── Validation error ───────────────────────── */}
      {validationErr && (
        <div className={styles.error}>
          <span>⚠</span> {validationErr}
        </div>
      )}

      {/* ── Submit button ──────────────────────────── */}
      <button className={styles.submitBtn} onClick={handleSubmit}>
        <span className={styles.submitBtnGlow} />
        <AgentIcon />
        Run&nbsp;ResumAgent
        <span className={styles.submitArrow}>→</span>
      </button>

      {/* ── Pipeline steps hint ──────────────────── */}
      <div className={styles.pipelineHint}>
        {STEPS.map((s, i) => (
          <div key={i} className={styles.pipelineStep}>
            <span className={styles.pipelineNum}>{i + 1}</span>
            <span className={styles.pipelineLabel}>{s}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

const STEPS = ['Validate', 'Extract', 'Preprocess', 'Infer', 'Format']

// ── Small icon components ────────────────────────
function PdfIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
      <polyline points="14 2 14 8 20 8"/>
    </svg>
  )
}

function TextIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="17" y1="10" x2="3" y2="10"/><line x1="21" y1="6" x2="3" y2="6"/>
      <line x1="21" y1="14" x2="3" y2="14"/><line x1="17" y1="18" x2="3" y2="18"/>
    </svg>
  )
}

function UploadIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="16 16 12 12 8 16"/>
      <line x1="12" y1="12" x2="12" y2="21"/>
      <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/>
    </svg>
  )
}

function AgentIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3"/>
      <path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83"/>
    </svg>
  )
}
