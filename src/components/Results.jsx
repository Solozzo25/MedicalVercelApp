'use client';

import { useState } from 'react';
import { jsPDF } from 'jspdf';

export default function Results({ 
  diagnosisData, 
  treatmentData, 
  patientData, 
  isLoading, 
  errorMessage,
  selectedDiagnosis, 
  diagnosisConfirmed 
}) {
  // Funkcja do ekstrakcji linków URL z tekstu
  const extractUrl = (text) => {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const matches = text?.match(urlRegex);
    return matches ? matches[0] : null;
  };

  // Funkcja do eksportu do PDF
  const handleExport = () => {
    // Export PDF functionality is temporarily disabled
    alert('Funkcja eksportu do PDF jest tymczasowo niedostępna.');
  };

  // Renderowanie błędów
  const renderError = () => {
    if (!errorMessage) return null;
    
    return (
      <div className="alert alert-error">
        <i className="fas fa-exclamation-circle"></i>
        <div>{errorMessage}</div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="loading" style={{ display: 'block' }}>
        <div className="loading-spinner">
          <div></div>
          <div></div>
        </div>
        <p className="loading-text">{loadingMessage || 'Przetwarzamy Twoje zapytanie...'}</p>
      </div>
    );
  }

  // Jeśli mamy diagnozę, ale nie wybrano jeszcze której diagnozy użyć dla rekomendacji
  // Pominięcie wyświetlania wyników, ponieważ sekcja wyboru diagnozy jest już w TabContainer
  if (diagnosisData && !diagnosisConfirmed && !treatmentData) {
    return null; // TabContainer wyświetli sekcję wyboru diagnozy
  }

  // Jeśli nie ma danych diagnozy, zwróć komunikat
  if (!diagnosisData && !isLoading && !errorMessage) {
    return (
      <div className="alert alert-warning">
        <i className="fas fa-info-circle"></i>
        <div>Uzupełnij dane pacjenta w zakładce "Dane pacjenta" i kliknij "Przedstaw rekomendacje", aby zobaczyć wyniki.</div>
      </div>
    );
  }

  // Funkcja do renderowania źródła z obsługą linków
  const renderSource = (sourceText) => {
    if (!sourceText) return null;
    
    const url = extractUrl(sourceText);
    
    return (
      <div className="source-info">
        <i className="fas fa-book-medical"></i> Źródło:&nbsp;
        {url ? (
          <a href={url} 
             target="_blank" 
             rel="noopener noreferrer"
             className="source-link">
            {sourceText}
          </a>
        ) : (
          <span>{sourceText}</span>
        )}
      </div>
    );
  };

  // Funkcja określająca kolor na podstawie prawdopodobieństwa
  const getProbabilityColor = (probability) => {
    if (probability >= 70) return 'var(--success)';
    if (probability >= 40) return 'var(--warning)';
    return 'var(--error)';
  };

  // Funkcja określająca klasę badge na podstawie prawdopodobieństwa
  const getProbabilityBadgeClass = (probability, isSelected) => {
    if (isSelected) return 'badge-primary';
    if (probability >= 70) return 'badge-success';
    if (probability >= 40) return 'badge-warning';
    return 'badge-danger';
  };

  return (
    <div>
      {renderError()}
      
      {diagnosisData && (
        <div className="result-grid">
          {/* Karty diagnoz */}
          {diagnosisData.Diagnozy && diagnosisData.Diagnozy.map((diagnoza, index) => (
            <div 
              key={index} 
              className={`result-card diagnosis ${selectedDiagnosis === diagnoza.Nazwa ? 'selected-diagnosis' : ''}`}
            >
              <div className="result-header">
                <div className="result-title">
                  <i className="fas fa-search-plus"></i> Diagnoza {index + 1}
                </div>
                <span className={`badge ${getProbabilityBadgeClass(diagnoza.Prawdopodobieństwo, selectedDiagnosis === diagnoza.Nazwa)}`}>
                  <i className={`fas ${selectedDiagnosis === diagnoza.Nazwa ? 'fa-check-double' : 'fa-percentage'}`}></i> 
                  {selectedDiagnosis === diagnoza.Nazwa ? 'Wybrana do rekomendacji' : `${diagnoza.Prawdopodobieństwo}%`}
                </span>
              </div>
              <div className="result-body">
                <div className="result-section">
                  <h3 className="list-item-title">{diagnoza.Nazwa}</h3>
                  <div className="progress" style={{ height: '10px', margin: '10px 0' }}>
                    <div 
                      className="progress-bar" 
                      role="progressbar" 
                      style={{ 
                        width: `${diagnoza.Prawdopodobieństwo}%`,
                        backgroundColor: getProbabilityColor(diagnoza.Prawdopodobieństwo)
                      }}
                      aria-valuenow={diagnoza.Prawdopodobieństwo} 
                      aria-valuemin="0" 
                      aria-valuemax="100"
                    ></div>
                  </div>
                  <p className="list-item-desc">
                    <strong>Uzasadnienie:</strong> {diagnoza.Uzasadnienie}
                  </p>
                  <p className="list-item-desc">
                    <strong>Badania potwierdzające/wykluczające:</strong> {diagnoza["Badania potwierdzające/wykluczające"]}
                  </p>
                  <p className="list-item-desc">
                    <strong>Towarzystwo medyczne:</strong> {diagnoza.Towarzystwo_Medyczne}
                  </p>
                </div>
              </div>
            </div>
          ))}

          {/* Informacja o wybranej diagnozie dla rekomendacji */}
          {selectedDiagnosis && diagnosisConfirmed && (
            <div className="result-card info" style={{ gridColumn: '1/-1' }}>
              <div className="result-header">
                <div className="result-title">
                  <i className="fas fa-info-circle"></i> Informacja o rekomendacjach
                </div>
              </div>
              <div className="result-body">
                <div className="result-section">
                  <p className="list-item-desc">
                    Poniższe rekomendacje leczenia zostały przygotowane dla diagnozy: <strong>{selectedDiagnosis}</strong>
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Karty rekomendacji leczenia - wyświetlane tylko jeśli są dostępne */}
          {treatmentData && diagnosisConfirmed && (
            <>
              {/* Karta farmakoterapii */}
              <div className="result-card treatment" style={{ gridColumn: '1/-1' }}>
                <div className="result-header">
                  <div className="result-title">
                    <i className="fas fa-pills"></i> Farmakoterapia
                  </div>
                </div>
                <div className="result-body">
                  <ul className="treatment-list">
                    {treatmentData.Farmakoterapia && treatmentData.Farmakoterapia.length > 0 
                      ? treatmentData.Farmakoterapia.map((item, index) => (
                          <li key={index}>{item}</li>
                        ))
                      : <li>Brak danych o farmakoterapii</li>
                    }
                  </ul>
                  {treatmentData.Źródło_Farmakoterapii && renderSource(treatmentData.Źródło_Farmakoterapii)}
                </div>
              </div>

              {/* Karta zaleceń niefarmakologicznych */}
              <div className="result-card treatment" style={{ gridColumn: '1/-1' }}>
                <div className="result-header">
                  <div className="result-title">
                    <i className="fas fa-heartbeat"></i> Zalecenia niefarmakologiczne
                  </div>
                </div>
                <div className="result-body">
                  <ul className="treatment-list">
                    {treatmentData.Zalecenia_Niefarmakologiczne && treatmentData.Zalecenia_Niefarmakologiczne.length > 0 
                      ? treatmentData.Zalecenia_Niefarmakologiczne.map((item, index) => (
                          <li key={index}>{item}</li>
                        ))
                      : <li>Brak danych o zaleceniach niefarmakologicznych</li>
                    }
                  </ul>
                  {treatmentData.Źródło_Zaleceń_Niefarmakologicznych && renderSource(treatmentData.Źródło_Zaleceń_Niefarmakologicznych)}
                </div>
              </div>

              {/* Karta charakterystyki leku */}
              {treatmentData.Charakterystyka_Leku && treatmentData.Charakterystyka_Leku.Nazwa && (
                <div className="result-card drug" style={{ gridColumn: '1/-1' }}>
                  <div className="result-header">
                    <div className="result-title">
                      <i className="fas fa-capsules"></i> Charakterystyka leku: {treatmentData.Charakterystyka_Leku.Nazwa}
                    </div>
                  </div>
                  <div className="result-body">
                    <div className="result-section">
                      <h4 className="result-section-title">Wskazania</h4>
                      <ul className="treatment-list drug">
                        {treatmentData.Charakterystyka_Leku.Wskazania && treatmentData.Charakterystyka_Leku.Wskazania.length > 0 
                          ? treatmentData.Charakterystyka_Leku.Wskazania.map((item, index) => (
                              <li key={index}>{item}</li>
                            ))
                          : <li>Brak danych o wskazaniach</li>
                        }
                      </ul>
                    </div>
                    
                    <div className="result-section">
                      <h4 className="result-section-title">Przeciwwskazania</h4>
                      <ul className="treatment-list drug">
                        {treatmentData.Charakterystyka_Leku.Przeciwwskazania && treatmentData.Charakterystyka_Leku.Przeciwwskazania.length > 0 
                          ? treatmentData.Charakterystyka_Leku.Przeciwwskazania.map((item, index) => (
                              <li key={index}>{item}</li>
                            ))
                          : <li>Brak danych o przeciwwskazaniach</li>
                        }
                      </ul>
                    </div>
                    
                    <div className="result-section">
                      <h4 className="result-section-title">Interakcje</h4>
                      <ul className="treatment-list drug">
                        {treatmentData.Charakterystyka_Leku.Interakcje && treatmentData.Charakterystyka_Leku.Interakcje.length > 0 
                          ? treatmentData.Charakterystyka_Leku.Interakcje.map((item, index) => (
                              <li key={index}>{item}</li>
                            ))
                          : <li>Brak danych o interakcjach</li>
                        }
                      </ul>
                    </div>
                    
                    {treatmentData.Charakterystyka_Leku.Źródło && (
                      <div className="result-section">
                        {renderSource(treatmentData.Charakterystyka_Leku.Źródło)}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Przycisk eksportu - tymczasowo wyłączony */}
      {diagnosisData && (
        <div style={{ textAlign: 'center', marginTop: '24px' }}>
          <button 
            className="btn btn-secondary" 
            onClick={handleExport}
            disabled
          >
            <i className="fas fa-file-pdf"></i> Eksportuj raport
          </button>
          <p style={{ fontSize: '12px', color: 'var(--gray-500)', marginTop: '8px' }}>
            Funkcja eksportu do PDF jest tymczasowo niedostępna
          </p>
        </div>
      )}
    </div>
  );
}
