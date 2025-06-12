'use client';

import { useState } from 'react';
import DiagnosisForm from './DiagnosisForm';
import Results from './Results';
import ProcessingModal from './ProcessingModal';

export default function TabContainer() {
  const [activeTab, setActiveTab] = useState('patient-data');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [loadingStep, setLoadingStep] = useState('');
  const [loadingMessage, setLoadingMessage] = useState('');
  const [loadingProgress, setLoadingProgress] = useState(0);
  
  // State dla danych
  const [patientData, setPatientData] = useState(null);
  const [diagnosisData, setDiagnosisData] = useState(null);
  const [treatmentData, setTreatmentData] = useState(null);
  const [characteristicsData, setCharacteristicsData] = useState(null);

  // Stan dla wyboru diagnozy
  const [selectedDiagnosis, setSelectedDiagnosis] = useState('');
  const [diagnosisConfirmed, setDiagnosisConfirmed] = useState(false);

  // State dla wyboru schematu leczenia (TYLKO TO!)
  const [selectedSchemaIndex, setSelectedSchemaIndex] = useState(0);

  // Obsługa przełączania zakładek
  const handleTabClick = (tabName) => {
    setActiveTab(tabName);
  };

  // Funkcja do ekstrakcji wszystkich nazw leków ze schematów leczenia
  const extractDrugNamesFromTreatment = (treatmentResult) => {
    const drugNames = new Set();
    
    if (treatmentResult.rekomendacje_leczenia) {
      treatmentResult.rekomendacje_leczenia.forEach(schemat => {
        schemat.leki.forEach(lek => {
          drugNames.add(lek.nazwa);
          if (lek.alternatywy) {
            lek.alternatywy.forEach(alt => drugNames.add(alt.nazwa));
          }
        });
      });
    }
    
    return Array.from(drugNames);
  };

  // Obsługa formularza
  const handleFormSubmit = async (formData) => {
    setIsLoading(true);
    setLoadingStep('diagnosis');
    setLoadingMessage('Analizujemy dane pacjenta');
    setLoadingProgress(25);
    setErrorMessage('');
    setPatientData(formData);
    setDiagnosisConfirmed(false);
    setSelectedDiagnosis('');
    // Reset state'u schematów
    setTreatmentData(null);
    setCharacteristicsData(null);
    setSelectedSchemaIndex(0);

    try {
      // Krok 1: Pobierz diagnozę od OpenAI
      setLoadingStep('processing');
      setLoadingMessage('Generowanie diagnozy');
      setLoadingProgress(50);
      
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
      
      setLoadingStep('complete');
      setLoadingMessage('Finalizacja wyników');
      setLoadingProgress(100);
      
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
    setLoadingStep('treatment');
    setLoadingMessage('Wyszukiwanie schematów leczenia');
    setLoadingProgress(20);
    setErrorMessage('');
    
    try {
      // Znajdź obiekt diagnozy na podstawie wybranej nazwy
      const selectedDiag = diagnosisData.Diagnozy ? 
        diagnosisData.Diagnozy.find(d => d.Nazwa === selectedDiagnosis) : null;
      
      // REQUEST 1: Pobierz schematy leczenia
      console.log("📋 REQUEST 1: Pobieranie schematów leczenia");
      const treatmentRequestData = {
        diagnosis: selectedDiagnosis,
        medicalSociety: selectedDiag?.Towarzystwo_Medyczne || '',
        patientAge: patientData.age,
        patientSex: patientData.sex
      };

      const treatmentResponse = await fetch('/api/treatment-schemas', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(treatmentRequestData)
      });

      if (!treatmentResponse.ok) {
        const errorData = await treatmentResponse.json();
        throw new Error(errorData.error || `Błąd serwera schematów: ${treatmentResponse.status}`);
      }

      const treatmentResult = await treatmentResponse.json();
      console.log("✅ Otrzymano schematy leczenia:", treatmentResult);
      
      // Zapisz dane schematów
      setTreatmentData(treatmentResult);
      
      // Wyciągnij nazwy wszystkich leków
      const drugNames = extractDrugNamesFromTreatment(treatmentResult);
      console.log("💊 Lista leków do sprawdzenia:", drugNames);
      
      if (drugNames.length > 0) {
        // REQUEST 2: Pobierz charakterystyki leków
        setLoadingStep('treatment');
        setLoadingMessage(`Pobieranie charakterystyk dla ${drugNames.length} leków`);
        setLoadingProgress(60);
        
        console.log("📋 REQUEST 2: Pobieranie charakterystyk leków");
        const characteristicsResponse = await fetch('/api/drug-characteristics', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ drugs: drugNames })
        });

        if (!characteristicsResponse.ok) {
          console.error("⚠️ Błąd pobierania charakterystyk, kontynuuję bez nich");
          // Nie przerywamy procesu - pokazujemy schematy bez charakterystyk
        } else {
          const characteristicsResult = await characteristicsResponse.json();
          console.log("✅ Otrzymano charakterystyki leków:", characteristicsResult);
          setCharacteristicsData(characteristicsResult.characteristics);
        }
      }

      setLoadingStep('complete');
      setLoadingMessage('Finalizacja wyników');
      setLoadingProgress(100);
      setDiagnosisConfirmed(true);
      
      // Reset wyboru schematu
      setSelectedSchemaIndex(0);
      
    } catch (error) {
      console.error('❌ Błąd podczas przetwarzania rekomendacji:', error);
      setErrorMessage(error.message || 'Wystąpił nieoczekiwany błąd podczas pobierania rekomendacji leczenia.');
    } finally {
      setIsLoading(false);
    }
  };

  // Obsługa wyboru schematu leczenia
  const handleSchemaSelection = (schemaIndex) => {
    console.log("Wybrano schemat leczenia o indeksie:", schemaIndex);
    setSelectedSchemaIndex(schemaIndex);
  };

  return (
    <>
      <ProcessingModal 
        isVisible={isLoading}
        step={loadingStep}
        message={loadingMessage}
        progress={loadingProgress}
      />
      
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
              <div className="alert alert-warning">
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
                    {/* ... reszta kodu karty diagnozy ... */}
                  </div>
                ))}
              </div>
              
              <div style={{ textAlign: 'center', marginTop: '20px' }}>
                <button 
                  className="btn btn-primary" 
                  onClick={handleDiagnosisConfirm}
                  disabled={!selectedDiagnosis || isLoading}
                >
                  <i className="fas fa-check-circle"></i> Potwierdź diagnozę i pobierz rekomendacje
                </button>
              </div>
            </div>
          )}
          
          <Results 
            diagnosisData={diagnosisData}
            treatmentData={treatmentData}
            characteristicsData={characteristicsData}
            patientData={patientData}
            errorMessage={errorMessage}
            selectedDiagnosis={selectedDiagnosis}
            diagnosisConfirmed={diagnosisConfirmed}
            selectedSchemaIndex={selectedSchemaIndex}
            onSchemaSelection={handleSchemaSelection}
          />
        </div>
      </div>
    </>
  );
}