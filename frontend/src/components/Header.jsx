import styles from './Header.module.css'

export default function Header() {
    return (
        <header className={styles.header}>
            <div className={styles.scanLine} aria-hidden />

            <div className={styles.inner}>
                <div className={styles.brand}>
                    <div className={styles.logoMark}>
                        <svg viewBox="0 0 32 32" fill="none"
                            xmlns="http://www.w3.org/2000/svg" width="32" height="32">
                            <polygon
                                points="16,2 28,9 28,23 16,30 4,23 4,9"
                                stroke="var(--neon-cyan)" strokeWidth="1.5"
                                fill="none" opacity="0.8"
                            />
                            <line x1="10" y1="13" x2="22" y2="13"
                                stroke="var(--neon-cyan)" strokeWidth="1.5" strokeLinecap="round" />
                            <line x1="10" y1="16" x2="22" y2="16"
                                stroke="var(--neon-cyan)" strokeWidth="1.5"
                                strokeLinecap="round" opacity="0.5" />
                            <line x1="10" y1="19" x2="17" y2="19"
                                stroke="var(--neon-cyan)" strokeWidth="1.5"
                                strokeLinecap="round" opacity="0.3" />
                        </svg>
                    </div>

                    <div className={styles.titleGroup}>
                        <h1 className={styles.title}>
                            Resum<span className={styles.accent}>Agent</span>
                        </h1>
                        <p className={styles.tagline}>
                            Intelligent Research Paper Summarizer
                        </p>
                    </div>
                </div>

                <div className={styles.badges}>
                    <Badge label="GEMINI 2.5 FLASH" />
                    <Badge label="T=0.3" accent="violet" />
                    <Badge label="5-STEP PIPELINE" accent="emerald" />
                </div>
            </div>
        </header>
    )
}

function Badge({ label, accent = 'cyan' }) {
    return (
        <span className={`${styles.badge} ${styles[`badge_${accent}`]}`}>
            {label}
        </span>
    )
}