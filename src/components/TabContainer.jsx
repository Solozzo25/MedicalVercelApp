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

  // Nowy stan dla wyboru diagnozy
  const [selectedDiagnosis, setSelectedDiagnosis] = useState('');
  const [diagnosisConfirmed, setDiagnosisConfirmed] = useState(false);

  // Obsługa przełączania zakładek
  const handleTabClick = (tabName) => {
    setActiveTab(tabName);
  };

  // Obsługa formularza - teraz tylko pobiera diagnozę
  const handleFormSubmit = async (formData) => {
    setIsLoading(true);
    setErrorMessage('');
    setPatientData(formData);
    setDiagnosisConfirmed(false); // Resetuj stan potwierdzenia przy nowym zapytaniu
    setSelectedDiagnosis(''); // Resetuj wybór diagnozy

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
  
  // Nowa funkcja do obsługi potwierdzenia diagnozy
  const handleDiagnosisConfirm = async () => {
    if (!selectedDiagnosis) {
      setErrorMessage('Proszę wybrać diagnozę przed kontynuacją.');
      return;
    }
    
    setIsLoading(true);
    setErrorMessage('');
    
    try {
      // Przygotuj dane dla API rekomendacji leczenia
      console.log("Wysyłanie danych do API rekomendacji leczenia");
      const treatmentRequestData = {
        diagnosis: selectedDiagnosis,
        medicalSociety: diagnosisData.Towarzystwo_Medyczne
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
        {/* Potwierdzenie diagnozy - wyświetlane tylko jeśli mamy diagnozę, ale nie mamy jeszcze rekomendacji */}
        {diagnosisData && !diagnosisConfirmed && (
          <div className="diagnosis-confirmation">
            <div className="alert alert-warning">
              <i className="fas fa-info-circle"></i>
              <div>Proszę wybrać diagnozę, dla której chcesz otrzymać rekomendacje leczenia:</div>
            </div>
            
            <div className="form-group" style={{ marginTop: '16px' }}>
              <div className="diagnosis-options">
                <div className="form-check">
                  <input 
                    type="radio" 
                    id="main-diagnosis" 
                    name="diagnosis-type" 
                    className="form-check-input" 
                    checked={selectedDiagnosis === diagnosisData.Diagnoza_Główna}
                    onChange={() => setSelectedDiagnosis(diagnosisData.Diagnoza_Główna)}
                  />
                  <label htmlFor="main-diagnosis" className="form-check-label">
                    <strong>Diagnoza główna:</strong> {diagnosisData.Diagnoza_Główna}
                  </label>
                </div>
                
                <div className="form-check" style={{ marginTop: '8px' }}>
                  <input 
                    type="radio" 
                    id="differential-diagnosis" 
                    name="diagnosis-type" 
                    className="form-check-input"
                    checked={selectedDiagnosis === diagnosisData.Diagnoza_Różnicowa}
                    onChange={() => setSelectedDiagnosis(diagnosisData.Diagnoza_Różnicowa)}
                  />
                  <label htmlFor="differential-diagnosis" className="form-check-label">
                    <strong>Diagnoza różnicowa:</strong> {diagnosisData.Diagnoza_Różnicowa}
                  </label>
                </div>
              </div>
              
              <button 
                className="btn btn-primary" 
                style={{ marginTop: '16px' }}
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
