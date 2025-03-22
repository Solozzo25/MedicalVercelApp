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
      // Pobierz diagnozę
      const diagnosisResponse = await fetch('/api/gpt-diagnosis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      });

      const diagnosisResult = await diagnosisResponse.json();

      if (!diagnosisResponse.ok) {
        throw new Error(diagnosisResult.error || `Błąd serwera: ${diagnosisResponse.status}`);
      }

      // Zapisz dane diagnozy
      setDiagnosisData(diagnosisResult);

      // Przygotuj dane dla API rekomendacji leczenia
      const treatmentRequestData = {
        diagnosis: diagnosisResult.Diagnoza_Główna,
        medicalSociety: diagnosisResult.Towarzystwo_Medyczne
      };

      // Pobierz rekomendacje leczenia
      const treatmentResponse = await fetch('/api/perplexity-treatment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(treatmentRequestData)
      });

      const treatmentResult = await treatmentResponse.json();

      if (!treatmentResponse.ok) {
        throw new Error(treatmentResult.error || `Błąd serwera: ${treatmentResponse.status}`);
      }

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
        <h2 className="card-title">Diagnoza pacjenta</h2>
        <p className="card-subtitle">Wprowadź dane pacjenta, aby otrzymać propozycję diagnozy, diagnostykę różnicową oraz rekomendacje leczenia.</p>
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
          Wyniki
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
