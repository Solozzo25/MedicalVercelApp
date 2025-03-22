'use client';

import { useState } from 'react';

export default function Results({ 
  diagnosisData, 
  treatmentData, 
  patientData, 
  isLoading, 
  errorMessage 
}) {
  // Funkcja do eksportu do PDF
  const handleExport = () => {
    if (!diagnosisData || !treatmentData || !patientData) {
      alert('Brak danych do eksportu. Najpierw uzyskaj diagnozę i rekomendacje leczenia.');
      return;
    }
    
    alert('Funkcja eksportu do PDF będzie zaimplementowana w przyszłości.');
  };

  // Renderowanie błędów
  const renderError = () => {
    if (!errorMessage) return null;
    
    return (
      <div className="error-message" style={{
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        color: 'var(--error)',
        padding: '1rem',
        borderRadius: '0.5rem',
        marginBottom: '1rem',
        fontWeight: '500',
        textAlign: 'center'
      }}>
        {errorMessage}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="loading" style={{ display: 'block' }}>
        <div className="spinner"></div>
        <p>Analizujemy dane i przygotowujemy wyniki...</p>
      </div>
    );
  }

  return (
    <div className="result-section">
      {renderError()}
      
      {diagnosisData && (
        <>
          <div className="result-card diagnosis">
            <h3 className="result-card-title">
              <i>🔍</i> Diagnoza główna
            </h3>
            <div className="result-item">
              <h4 className="result-item-title">
                {diagnosisData.Diagnoza_Główna} <span className="confidence high">Główna diagnoza</span>
              </h4>
              <p className="result-item-description">
                <strong>Uzasadnienie:</strong> {diagnosisData.Uzasadnienie_Diagnozy}
              </p>
            </div>
          </div>

          <div className="result-card differential">
            <h3 className="result-card-title">
              <i>🧩</i> Diagnostyka różnicowa
            </h3>
            <div className="result-item">
              <h4 className="result-item-title">
                {diagnosisData.Diagnoza_Różnicowa} <span className="confidence medium">Diagnoza różnicowa</span>
              </h4>
              <p className="result-item-description">
                <strong>Uzasadnienie:</strong> {diagnosisData.Uzasadnienie_Różnicowe}
              </p>
            </div>
            
            <div className="result-item" style={{ marginTop: '20px', borderTop: '1px dashed var(--tertiary-color)', paddingTop: '15px' }}>
              <h4 className="result-item-title">Rekomendowane wytyczne</h4>
              <p className="result-item-description">
                <strong>{diagnosisData.Towarzystwo_Medyczne}</strong>
              </p>
            </div>
          </div>
        </>
      )}

      {treatmentData && (
        <>
          <div className="result-card treatment">
            <h3 className="result-card-title">
              <i>💊</i> Leczenie
            </h3>
            <div className="result-item">
              <h4 className="result-item-title">Farmakoterapia</h4>
              <ul>
                {Array.isArray(treatmentData.Farmakoterapia) 
                  ? treatmentData.Farmakoterapia.map((item, index) => <li key={index}>{item}</li>)
                  : <li>{treatmentData.Farmakoterapia}</li>
                }
              </ul>
            </div>
            <div className="result-item">
              <h4 className="result-item-title">Zalecenia niefarmakologiczne</h4>
              <ul>
                {Array.isArray(treatmentData.Zalecenia_Niefarmakologiczne) 
                  ? treatmentData.Zalecenia_Niefarmakologiczne.map((item, index) => <li key={index}>{item}</li>)
                  : <li>{treatmentData.Zalecenia_Niefarmakologiczne}</li>
                }
              </ul>
            </div>
          </div>

          <div className="result-card">
            <h3 className="result-card-title">
              <i>📋</i> Charakterystyka leku
            </h3>
            <div className="result-item">
              <h4 className="result-item-title">{treatmentData.Charakterystyka_Leku.Nazwa}</h4>
              <ul>
                <li><strong>Wskazania:</strong> {' '}
                  {Array.isArray(treatmentData.Charakterystyka_Leku.Wskazania) 
                    ? treatmentData.Charakterystyka_Leku.Wskazania.join(', ')
                    : treatmentData.Charakterystyka_Leku.Wskazania
                  }
                </li>
                <li><strong>Przeciwwskazania:</strong> {' '}
                  {Array.isArray(treatmentData.Charakterystyka_Leku.Przeciwwskazania) 
                    ? treatmentData.Charakterystyka_Leku.Przeciwwskazania.join(', ')
                    : treatmentData.Charakterystyka_Leku.Przeciwwskazania
                  }
                </li>
                <li><strong>Interakcje:</strong> {' '}
                  {Array.isArray(treatmentData.Charakterystyka_Leku.Interakcje) 
                    ? treatmentData.Charakterystyka_Leku.Interakcje.join(', ')
                    : treatmentData.Charakterystyka_Leku.Interakcje
                  }
                </li>
              </ul>
            </div>
          </div>
        </>
      )}

      <div className="form-group">
        <button 
          type="button" 
          className="btn btn-secondary btn-lg btn-block"
          onClick={handleExport}
        >
          Eksportuj raport
        </button>
      </div>
    </div>
  );
}
