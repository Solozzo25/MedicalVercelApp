'use client';

import { useEffect, useState } from 'react';

export default function ProcessingModal({ isVisible, step, message, progress = 0 }) {
  const [dots, setDots] = useState('');

  // Animate dots for loading effect
  useEffect(() => {
    if (!isVisible) return;
    
    const interval = setInterval(() => {
      setDots(prev => prev.length >= 3 ? '' : prev + '.');
    }, 500);

    return () => clearInterval(interval);
  }, [isVisible]);

  if (!isVisible) return null;

  const steps = [
    { id: 'diagnosis', label: 'Analiza danych pacjenta', icon: 'fa-user-md' },
    { id: 'processing', label: 'Generowanie diagnozy', icon: 'fa-brain' },
    { id: 'treatment', label: 'Przygotowanie rekomendacji', icon: 'fa-pills' },
    { id: 'complete', label: 'Finalizacja wyników', icon: 'fa-check-circle' }
  ];

  return (
    <div className="modal-overlay">
      <div className="modal-content processing-modal">
        <div className="modal-header">
          <div className="modal-title">
            <i className="fas fa-heartbeat"></i>
            Przetwarzanie danych medycznych
          </div>
        </div>
        
        <div className="modal-body">
          {/* Main loading animation */}
          <div className="loading-animation">
            <div className="medical-pulse">
              <div className="pulse-line"></div>
              <div className="pulse-line"></div>
              <div className="pulse-line"></div>
            </div>
          </div>

          {/* Current step */}
          <div className="current-step">
            <h3>{message || 'Analizuję dane pacjenta'}{dots}</h3>
            <p>Proszę czekać, trwa przetwarzanie informacji medycznych...</p>
          </div>

          {/* Progress bar */}
          <div className="progress-container">
            <div className="progress">
              <div 
                className="progress-bar processing" 
                style={{ width: `${progress}%` }}
              ></div>
            </div>
            <span className="progress-text">{progress}%</span>
          </div>

          {/* Processing steps */}
          <div className="processing-steps">
            {steps.map((stepItem, index) => (
              <div 
                key={stepItem.id} 
                className={`step-item ${step === stepItem.id ? 'active' : ''} ${
                  steps.findIndex(s => s.id === step) > index ? 'completed' : ''
                }`}
              >
                <div className="step-icon">
                  <i className={`fas ${stepItem.icon}`}></i>
                </div>
                <span className="step-label">{stepItem.label}</span>
              </div>
            ))}
          </div>

          {/* Security notice */}
          <div className="security-notice">
            <i className="fas fa-shield-alt"></i>
            <span>Dane pacjenta są przetwarzane bezpiecznie zgodnie z RODO</span>
          </div>
        </div>
      </div>
    </div>
  );
}
