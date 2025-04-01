'use client';

import { useState } from 'react';
import DiagnosisForm from './DiagnosisForm';
import Results from './Results';

export default function TabContainer() {
  const [activeTab, setActiveTab] = useState('patient-data');
  const [isLoading, setIsLoading] = useState(false);
  const [isTreatmentLoading, setIsTreatmentLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  
  // State dla danych
  const [patientData, setPatientData] = useState(null);
  const [diagnosisData, setDiagnosisData] = useState(null);
  const [treatmentData, setTreatmentData] = useState(null);

  // Obsługa przełączania zakładek
  const handleTabClick = (tabName) => {
    setActiveTab(tabName);
  };

  // Obsługa formularza - teraz tylko pobiera diagnozy
  const handleFormSubmit = async (formData) => {
    setIsLoading(true);
    setErrorMessage('');
    setPatientData(formData);
    setTreatmentData(null); // Reset danych leczenia

    try {
      // Pobierz diagnozę od OpenAI
      console.log("Wysyłanie danych do API diagnozy");
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
      console.error('❌ Błąd podczas przetwarzania diagnozy:', error);
      setErrorMessage(error.message || 'Wystąpił nieoczekiwany błąd podczas przetwarzania zapytania o diagnozę.');
    } finally {
      setIsLoading(false);
    }
  };

  // Nowa funkcja do pobierania rekomendacji leczenia na podstawie wybranej diagnozy
  const handleRequestTreatment = async (selectedDiagnosis) => {
    if (!selectedDiagnosis) {
      setErrorMessage('Najpierw wybierz diagnozę, aby uzyskać rekomendacje leczenia.');
      return;
    }

    setIsTreatmentLoading(true);
    setErrorMessage('');

    try {
      // Przygotuj dane dla API rekomendacji leczenia
      console.log("Przygotowanie danych dla API rekomendacji leczenia");
      const treatmentRequestData = {
        diagnosis: selectedDiagnosis.nazwa,
        medicalSociety: selectedDiagnosis.towarzystwo_medyczne
      };

      // Pobierz rekomendacje leczenia od Perplexity API
      console.log("Wysyłanie danych do API rekomendacji leczenia");
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
    } catch (error) {
      console.error('❌ Błąd podczas pobierania rekomendacji leczenia:', error);
      setErrorMessage(error.message || 'Wystąpił nieoczekiwany błąd podczas pobierania rekomendacji leczenia.');
    } finally {
      setIsTreatmentLoading(false);
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
          isTreatmentLoading={isTreatmentLoading}
          errorMessage={errorMessage}
          onRequestTreatment={handleRequestTreatment}
        />
      </div>
    </div>
  );
}
