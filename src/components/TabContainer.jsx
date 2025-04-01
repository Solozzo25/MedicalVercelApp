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

  // Obsługa przełączania zakładek
  const handleTabClick = (tabName) => {
    setActiveTab(tabName);
  };

  // Obsługa formularza
  const handleFormSubmit = async (formData) => {
    setIsLoading(true);
    setErrorMessage('');
    setPatientData(formData);

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

      // Krok 2: Przygotuj dane dla API rekomendacji leczenia
      console.log("Krok 2: Przygotowanie danych dla API rekomendacji leczenia");
      const treatmentRequestData = {
        diagnosis: diagnosisResult.Diagnoza_Główna,
        medicalSociety: diagnosisResult.Towarzystwo_Medyczne
      };

      // Krok 3: Pobierz rekomendacje leczenia od Perplexity API
      console.log("Krok 3: Wysyłanie danych do API rekomendacji leczenia");
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

      // Przełącz na zakładkę wyników
      setActiveTab('results');
    } catch (error) {
      console.error('❌ Błąd podczas przetwarzania:', error);
      setErrorMessage(error.message || 'Wystąpił nieoczekiwany błąd podczas przetwarzania zapytania.');
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
        <Results 
          diagnosisData={diagnosisData}
          treatmentData={treatmentData}
          patientData={patientData}
          isLoading={isLoading}
          errorMessage={errorMessage}
        />
      </div>
    </div>
  );
}
