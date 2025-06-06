'use client';

import { useState } from 'react';
import DiagnosisForm from './DiagnosisForm';
import Results from './Results';

export default function TabContainer() {
  const [activeTab, setActiveTab] = useState('patient-data');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  
  // State dla danych
  const [patientData, setPatientData] = useState(null);
  const [diagnosisData, setDiagnosisData] = useState(null);
  const [treatmentData, setTreatmentData] = useState(null);

  // Stan dla wyboru diagnozy
  const [selectedDiagnosis, setSelectedDiagnosis] = useState('');
  const [selectedDiagnosisObj, setSelectedDiagnosisObj] = useState(null);
  const [diagnosisConfirmed, setDiagnosisConfirmed] = useState(false);

  // Obsługa przełączania zakładek
  const handleTabClick = (tabName) => {
    setActiveTab(tabName);
  };

  // Obsługa formularza
  const handleFormSubmit = async (formData) => {
    setIsLoading(true);
    setErrorMessage('');
    setPatientData(formData);
    setDiagnosisConfirmed(false); // Resetuj stan potwierdzenia przy nowym zapytaniu
    setSelectedDiagnosis(''); // Resetuj wybór diagnozy
    setSelectedDiagnosisObj(null);

    try {
      // Krok 1: Pobierz diagnozę od OpenAI
      console.log("Krok 1: Wysyłanie danych do API diagnozy");
      const diagnosisResponse = await fetch('/api/gpt-diagnosis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      });

      if (!diagnosisResponse.ok) {
        const errorData = await diagnosisResponse.json();
        throw new Error(errorData.error || `Błąd serwera diagnozy: ${diagnosisResponse.status}`);
      }

      const diagnosisResult = await diagnosisResponse.json();
      console.log("Otrzymano odpowiedź z API diagnozy:", diagnosisResult);
      
      // Zapisz dane diagnozy
      setDiagnosisData(diagnosisResult);
      
      // Przełącz na zakładkę wyników
      setActiveTab('results');
      
    } catch (error) {
      console.error('❌ Błąd podczas przetwarzania:', error);
      setErrorMessage(error.message || 'Wystąpił nieoczekiwany błąd podczas przetwarzania zapytania.');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Funkcja do obsługi potwierdzenia diagnozy
  const handleDiagnosisConfirm = async () => {
    if (!selectedDiagnosis) {
      setErrorMessage('Proszę wybrać diagnozę przed kontynuacją.');
      return;
    }
    
    setIsLoading(true);
    setErrorMessage('');
    
    try {
      // Znajdź obiekt diagnozy na podstawie wybranej nazwy
      const selectedDiag = diagnosisData.Diagnozy ? 
        diagnosisData.Diagnozy.find(d => d.Nazwa === selectedDiagnosis) : null;
      
      // Przygotuj dane dla API rekomendacji leczenia
      console.log("Wysyłanie danych do API rekomendacji leczenia");
      const treatmentRequestData = {
        diagnosis: selectedDiagnosis,
        medicalSociety: selectedDiag?.Towarzystwo_Medyczne || ''
      };

      // Pobierz rekomendacje leczenia od Perplexity API
      const treatmentResponse = await fetch('/api/perplexity-treatment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(treatmentRequestData)
      });

      if (!treatmentResponse.ok) {
        const errorData = await treatmentResponse.json();
        throw new Error(errorData.error || `Błąd serwera rekomendacji: ${treatmentResponse.status}`);
      }

      const treatmentResult = await treatmentResponse.json();
      console.log("Otrzymano odpowiedź z API rekomendacji:", treatmentResult);

      // Zapisz dane rekomendacji
      setTreatmentData(treatmentResult);
      setDiagnosisConfirmed(true);
      
    } catch (error) {
      console.error('❌ Błąd podczas przetwarzania rekomendacji:', error);
      setErrorMessage(error.message || 'Wystąpił nieoczekiwany błąd podczas pobierania rekomendacji leczenia.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="card">
      <div className="card-header">
        <div className="card-title">
          <i className="fas fa-user-md"></i> Diagnoza i leczenie
        </div>
        <div className="card-actions">
          <button className="action-btn" title="Odśwież" onClick={() => window.location.reload()}>
            <i className="fas fa-sync-alt"></i>
          </button>
        </div>
      </div>

      <div className="tabs">
        <div 
          className={`tab ${activeTab === 'patient-data' ? 'active' : ''}`} 
          onClick={() => handleTabClick('patient-data')}
        >
          Dane pacjenta
        </div>
        <div 
          className={`tab ${activeTab === 'results' ? 'active' : ''}`} 
          onClick={() => handleTabClick('results')}
        >
          Wyniki diagnozy
        </div>
      </div>

      <div className={`tab-content ${activeTab === 'patient-data' ? 'active' : ''}`} id="patient-data">
        <DiagnosisForm onFormSubmit={handleFormSubmit} isLoading={isLoading} />
      </div>

      <div className={`tab-content ${activeTab === 'results' ? 'active' : ''}`} id="results">
      
{/* Potwierdzenie diagnozy - wyświetlane jako karuzela kart */}
{diagnosisData && !diagnosisConfirmed && (
  <div className="diagnosis-confirmation">
    <div className="alert alert-info">
      <i className="fas fa-info-circle"></i>
      <div>Wybierz diagnozę, dla której chcesz otrzymać rekomendacje leczenia:</div>
    </div>
    
    <div className="result-grid">
      {diagnosisData.Diagnozy && diagnosisData.Diagnozy.map((diagnoza, index) => (
        <div 
          key={index} 
          className={`result-card diagnosis ${selectedDiagnosis === diagnoza.Nazwa ? 'selected-diagnosis' : ''}`}
          onClick={() => setSelectedDiagnosis(diagnoza.Nazwa)}
          style={{ cursor: 'pointer' }}
        >
          <div className="result-header">
            <div className="result-title">
              <i className="fas fa-search-plus"></i> Diagnoza {index + 1}
            </div>
            {selectedDiagnosis === diagnoza.Nazwa ? (
              <span className="badge badge-primary">
                <i className="fas fa-check-double"></i> Wybrana do rekomendacji
              </span>
            ) : (
              <span className={`badge ${diagnoza.Prawdopodobieństwo >= 70 ? 'badge-success' : 
                                     diagnoza.Prawdopodobieństwo >= 40 ? 'badge-warning' : 'badge-danger'}`}>
                <i className="fas fa-percentage"></i> {diagnoza.Prawdopodobieństwo}%
              </span>
            )}
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
                    backgroundColor: diagnoza.Prawdopodobieństwo >= 70 ? 'var(--success)' : 
                                    diagnoza.Prawdopodobieństwo >= 40 ? 'var(--warning)' : 'var(--error)'
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
    </div>
    
    <div style={{ textAlign: 'center', marginTop: '20px' }}>
      <button 
        className="btn btn-primary" 
        onClick={handleDiagnosisConfirm}
        disabled={!selectedDiagnosis || isLoading}
      >
        {isLoading ? (
          <>
            <i className="fas fa-spinner fa-spin"></i> Przetwarzanie...
          </>
        ) : (
          <>
            <i className="fas fa-check-circle"></i> Potwierdź diagnozę i pobierz rekomendacje
          </>
        )}
      </button>
    </div>
  </div>
)}
        
        <Results 
          diagnosisData={diagnosisData}
          treatmentData={treatmentData}
          patientData={patientData}
          isLoading={isLoading}
          errorMessage={errorMessage}
          selectedDiagnosis={selectedDiagnosis}
          diagnosisConfirmed={diagnosisConfirmed}
        />
      </div>
    </div>
  );
}
