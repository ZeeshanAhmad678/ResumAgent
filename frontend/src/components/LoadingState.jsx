import React, { useState, useEffect } from 'react';
import styles from '../App.module.css';

const PIPELINE_STEPS = [
  { title: "Validating Input", desc: "Checking file integrity & token limits" },
  { title: "Extracting Text", desc: "PyPDF2 parsing pages and concatenating" },
  { title: "Preprocessing", desc: "Removing headers, footers, references" },
  { title: "LLM Inference", desc: "Gemini 2.5 Flash synthesising structure" },
  { title: "Formatting Output", desc: "Deserialising JSON into React components" }
];

export default function LoadingState() {
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    // This simulates the pipeline progress. 
    // It advances the active step every 1.5 seconds.
    const interval = setInterval(() => {
      setCurrentStep((prev) => {
        if (prev < PIPELINE_STEPS.length - 1) {
          return prev + 1;
        }
        clearInterval(interval);
        return prev;
      });
    }, 1500);

    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{ maxWidth: '700px', margin: '0 auto', padding: '40px 20px', color: '#f8fafc' }}>

      {/* Top Main Spinner */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '40px' }}>
        <div className={styles.spinner} style={{ borderColor: 'rgba(0, 229, 255, 0.2)', borderTopColor: '#00e5ff', width: '60px', height: '60px', borderWidth: '3px' }}></div>
        <h2 style={{ fontSize: '28px', marginTop: '24px', marginBottom: '8px' }}>Agent Running...</h2>
        <p style={{ color: '#64748b', fontSize: '16px' }}>Processing your research paper through the 5-step pipeline</p>
      </div>

      {/* The 5-Step Pipeline List */}
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {PIPELINE_STEPS.map((step, index) => {

          // Determine the state of the current card
          const isActive = index === currentStep;
          const isComplete = index < currentStep;
          const isPending = index > currentStep;

          // Assign CSS classes based on state
          let cardClass = styles.stepPending;
          let iconClass = styles.iconPending;

          if (isActive) {
            cardClass = styles.stepActive;
            iconClass = styles.iconActive;
          } else if (isComplete) {
            cardClass = styles.stepComplete;
            iconClass = styles.iconComplete;
          }

          return (
            <div
              key={index}
              className={`${styles.stepCard} ${cardClass}`}
              style={{ animationDelay: `${index * 0.1}s` }} // Stagger the initial fade-in
            >

              {/* Dynamic Icon Box */}
              <div className={`${styles.iconBox} ${iconClass}`}>
                {isComplete && "✓"}
                {isActive && <div className={styles.spinnerSmall}></div>}
                {isPending && "·"}
              </div>

              {/* Text Content */}
              <div>
                <h4 style={{ margin: 0, fontSize: '16px', fontWeight: isActive ? '600' : '500', color: isActive ? '#fff' : (isComplete ? '#e2e8f0' : '#94a3b8') }}>
                  {step.title}
                </h4>
                <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: isActive ? '#94a3b8' : '#475569', fontFamily: 'monospace' }}>
                  {step.desc}
                </p>
              </div>

            </div>
          );
        })}
      </div>

      {/* Footer target info */}
      <div style={{ textAlign: 'center', marginTop: '32px', color: '#64748b', fontSize: '13px', fontFamily: 'monospace' }}>
        <span style={{ color: '#00e5ff', marginRight: '8px' }}>▍</span>
        Reduction target: 30 min → 60 sec
      </div>

    </div>
  );
}