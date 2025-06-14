'use client';

import { useState } from 'react';

export default function Results({ 
  diagnosisData, 
  treatmentData,
  characteristicsData,
  patientData, 
  errorMessage,
  selectedDiagnosis, 
  diagnosisConfirmed,
  selectedLineIndex,
  selectedSchemaPerLine,
  onLineSelection,
  onSchemaSelection,
  onDiagnosisReset,
  onDiagnosisSelect,  // DODAJ TEN PROP
  onDiagnosisConfirm, // DODAJ TEN PROP
  isLoading,  
  showTreatmentOnly = false // Nowy prop do kontrolowania wyświetlania
}) {

  // Funkcja do eksportu do PDF (placeholder)
  const handleExport = () => {
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

  // Jeśli nie ma danych diagnozy
  if (!diagnosisData && !errorMessage) {
    return (
      <div className="alert alert-warning">
        <i className="fas fa-info-circle"></i>
        <div>Uzupełnij dane pacjenta w zakładce "Dane pacjenta" i kliknij "Przedstaw rekomendacje", aby zobaczyć wyniki.</div>
      </div>
    );
  }

 // GŁÓWNA ZMIANA: Wyświetl tylko diagnozy, bez elementów leczenia
return (
  <div>
    {renderError()}
    
    {diagnosisData && (
      <div className="result-grid">
        {/* Karty diagnoz - TYLKO DIAGNOZY */}
        {diagnosisData.Diagnozy && diagnosisData.Diagnozy.map((diagnoza, index) => (
          <div 
            key={index} 
            className={`result-card diagnosis diagnosis-selectable ${selectedDiagnosis === diagnoza.Nazwa ? 'selected-diagnosis' : ''}`}
            onClick={() => onDiagnosisSelect && onDiagnosisSelect(diagnoza.Nazwa)}
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
            
            {/* Przycisk "Pobierz linie leczenia" - pojawia się tylko po wybraniu diagnozy */}
            {selectedDiagnosis === diagnoza.Nazwa && (
              <div className="result-footer">
                <button 
                  className="btn btn-primary btn-block"
                  onClick={(e) => {
                    e.stopPropagation(); // Żeby nie triggerować onClick karty
                    onDiagnosisConfirm && onDiagnosisConfirm();
                  }}
                  disabled={isLoading}
                >
                  <i className="fas fa-pills"></i> 
                  {isLoading ? 'Pobieranie linii leczenia...' : 'Pobierz linie leczenia'}
                </button>
              </div>
            )}
          </div>
        ))}

        {/* Przycisk eksportu - tylko dla diagnoz */}
        {diagnosisData && (
          <div style={{ textAlign: 'center', marginTop: '24px', gridColumn: '1/-1' }}>
            <button 
              className="btn btn-secondary" 
              onClick={handleExport}
              disabled
            >
              <i className="fas fa-file-pdf"></i> Eksportuj diagnozy
            </button>
            <p style={{ fontSize: '12px', color: 'var(--gray-500)', marginTop: '8px' }}>
              Funkcja eksportu do PDF jest tymczasowo niedostępna
            </p>
          </div>
        )}
      </div>
    )}
  </div>
);
}