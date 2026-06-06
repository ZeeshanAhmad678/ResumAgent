import styles from './ErrorBanner.module.css'

export default function ErrorBanner({ message, onReset }) {
    return (
        <div className={styles.banner}>
            <div className={styles.iconWrap}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none"
                    stroke="var(--status-error)" strokeWidth="2"
                    strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="7.86 2 16.14 2 22 7.86 22 16.14 16.14 22 7.86 22 2 16.14 2 7.86 7.86 2" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
            </div>

            <div className={styles.body}>
                <h3 className={styles.title}>Agent Error</h3>
                <p className={styles.message}>{message}</p>
            </div>

            <button className={styles.retryBtn} onClick={onReset}>
                ↺ Try Again
            </button>
        </div>
    )
}