'use client';

import { useState } from 'react';
import DiagnosisForm from './DiagnosisForm';
import Results from './Results';
import TreatmentTab from './TreatmentTab';
import ProcessingModal from './ProcessingModal';

export default function TabContainer() {
  const [activeTab, setActiveTab] = useState('patient-data');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [loadingStep, setLoadingStep] = useState('');
  const [loadingMessage, setLoadingMessage] = useState('');
  const [loadingProgress, setLoadingProgress] = useState(0);
  
  // State dla danych z diagnozy
  const [patientData, setPatientData] = useState(null);
  const [diagnosisData, setDiagnosisData] = useState(null);
  const [treatmentData, setTreatmentData] = useState(null);
  const [characteristicsData, setCharacteristicsData] = useState(null);

  // Stan dla wyboru diagnozy
  const [selectedDiagnosis, setSelectedDiagnosis] = useState('');
  const [diagnosisConfirmed, setDiagnosisConfirmed] = useState(false);

  // State dla wyboru linii leczenia i schematów
  const [selectedLineIndex, setSelectedLineIndex] = useState(0);
  const [selectedSchemaPerLine, setSelectedSchemaPerLine] = useState({});

  // NOWE STATE dla bezpośredniej diagnozy
  const [directDiagnosis, setDirectDiagnosis] = useState('');
  const [directTreatmentData, setDirectTreatmentData] = useState(null);
  const [directCharacteristicsData, setDirectCharacteristicsData] = useState(null);
  const [directSelectedLineIndex, setDirectSelectedLineIndex] = useState(0);
  const [directSelectedSchemaPerLine, setDirectSelectedSchemaPerLine] = useState({});

  // NOWE STATE dla tablicy diagnoz
  const [treatmentDiagnoses, setTreatmentDiagnoses] = useState([]); // Tablica diagnoz z liniami leczenia
  const [activeTreatmentIndex, setActiveTreatmentIndex] = useState(0); // Indeks aktywnej diagnozy

  // Obsługa przełączania zakładek
  const handleTabClick = (tabName) => {
    setActiveTab(tabName);
    setErrorMessage(''); // Czyść błędy przy zmianie zakładki
  };

  // Funkcja do ekstrakcji wszystkich nazw leków ze schematów leczenia
  const extractDrugNamesFromTreatment = (treatmentResult) => {
    const drugNames = new Set();
    
    if (treatmentResult.linie_leczenia) {
      treatmentResult.linie_leczenia.forEach(linia => {
        linia.schematy_farmakologiczne.forEach(schemat => {
          schemat.leki.forEach(lek => {
            drugNames.add(lek.nazwa);
            if (lek.alternatywy) {
              lek.alternatywy.forEach(alt => drugNames.add(alt.nazwa));
            }
          });
        });
      });
    }
    
    return Array.from(drugNames);
  };

  // Obsługa formularza - NIEZMIENIONA
  const handleFormSubmit = async (formData) => {
    setIsLoading(true);
    setLoadingStep('diagnosis');
    setLoadingMessage('Analizujemy dane pacjenta');
    setLoadingProgress(25);
    setErrorMessage('');
    setPatientData(formData);
    setDiagnosisConfirmed(false);
    setSelectedDiagnosis('');
    setTreatmentData(null);
    setCharacteristicsData(null);
    setSelectedLineIndex(0);
    setSelectedSchemaPerLine({});

    try {
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
      
      setDiagnosisData(diagnosisResult);
      
      // AUTO-PRZEŁĄCZANIE: Przełącz na zakładkę wyników
      setActiveTab('results');
      
    } catch (error) {
      console.error('❌ Błąd podczas przetwarzania:', error);
      setErrorMessage(error.message || 'Wystąpił nieoczekiwany błąd podczas przetwarzania zapytania.');
    } finally {
      setIsLoading(false);
    }
  };

  // Obsługa wyboru diagnozy
  const handleDiagnosisSelect = (diagnosisName) => {
    setSelectedDiagnosis(diagnosisName);
    console.log("Wybrano diagnozę:", diagnosisName);
  };
  
  // ZMODYFIKOWANA FUNKCJA: Dodawanie diagnozy do tablicy zamiast nadpisywania
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
      const selectedDiag = diagnosisData.Diagnozy ? 
        diagnosisData.Diagnozy.find(d => d.Nazwa === selectedDiagnosis) : null;
      
      console.log("📋 REQUEST 1: Pobieranie schematów leczenia");
      const treatmentRequestData = {
        diagnosis: selectedDiagnosis,
        medicalSociety: selectedDiag?.Towarzystwo_Medyczne || '',
        patientAge: patientData?.age || 'nie podano',
        patientSex: patientData?.sex || 'nie określono'
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
      
      const drugNames = extractDrugNamesFromTreatment(treatmentResult);
      console.log("💊 Lista leków do sprawdzenia:", drugNames);
      
      let characteristicsResult = null;
      if (drugNames.length > 0) {
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

        if (characteristicsResponse.ok) {
          const characteristicsData = await characteristicsResponse.json();
          console.log("✅ Otrzymano charakterystyki leków:", characteristicsData);
          characteristicsResult = characteristicsData.characteristics;
        }
      }

      // NOWA LOGIKA: Dodaj diagnozę do tablicy zamiast nadpisywać
      const newDiagnosis = {
        name: selectedDiagnosis,
        treatmentData: treatmentResult,
        characteristicsData: characteristicsResult,
        selectedLineIndex: 0,
        selectedSchemaPerLine: {}
      };

      // Inicjalizacja schematów
      const initialSchemaSelection = {};
      if (treatmentResult.linie_leczenia) {
        treatmentResult.linie_leczenia.forEach((_, lineIndex) => {
          initialSchemaSelection[lineIndex] = 0;
        });
      }
      newDiagnosis.selectedSchemaPerLine = initialSchemaSelection;

      // Dodaj nową diagnozę do tablicy
      setTreatmentDiagnoses(prev => [...prev, newDiagnosis]);
      setActiveTreatmentIndex(treatmentDiagnoses.length); // Ustaw nową jako aktywną

      setLoadingStep('complete');
      setLoadingMessage('Finalizacja wyników');
      setLoadingProgress(100);
      setDiagnosisConfirmed(true);
      
      // AUTO-PRZEŁĄCZANIE: Przełącz na zakładkę linii leczenia
      setActiveTab('treatment-lines');
      
    } catch (error) {
      console.error('❌ Błąd podczas przetwarzania rekomendacji:', error);
      setErrorMessage(error.message || 'Wystąpił nieoczekiwany błąd podczas pobierania rekomendacji leczenia.');
    } finally {
      setIsLoading(false);
    }
  };

  // Reset wyboru diagnozy i powrót do wyboru
  const handleDiagnosisReset = () => {
    setDiagnosisConfirmed(false);
    setSelectedDiagnosis('');
    setTreatmentData(null);
    setCharacteristicsData(null);
    setSelectedLineIndex(0);
    setSelectedSchemaPerLine({});
    setErrorMessage('');
    // Przełącz z powrotem na wyniki
    setActiveTab('results');
    console.log("Reset wyboru diagnozy");
  };

  // NOWA FUNKCJA: Obsługa bezpośredniej diagnozy
  const handleDirectDiagnosisSubmit = async (diagnosis) => {
    if (!diagnosis.trim()) {
      setErrorMessage('Proszę wprowadzić nazwę diagnozy.');
      return;
    }

    setIsLoading(true);
    setLoadingStep('treatment');
    setLoadingMessage('Wyszukiwanie schematów leczenia');
    setLoadingProgress(20);
    setErrorMessage('');
    setDirectDiagnosis(diagnosis);

    try {
      console.log("📋 Bezpośrednia diagnoza: Pobieranie schematów leczenia");
      const treatmentRequestData = {
        diagnosis: diagnosis.trim(),
        medicalSociety: '', // Brak danych
        patientAge: 'nie podano', // Domyślne wartości
        patientSex: 'nie określono'
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
      console.log("✅ Otrzymano schematy leczenia dla bezpośredniej diagnozy:", treatmentResult);
      
      const drugNames = extractDrugNamesFromTreatment(treatmentResult);
      console.log("💊 Lista leków do sprawdzenia (bezpośrednie):", drugNames);
      
      let characteristicsResult = null;
      if (drugNames.length > 0) {
        setLoadingStep('treatment');
        setLoadingMessage(`Pobieranie charakterystyk dla ${drugNames.length} leków`);
        setLoadingProgress(60);
        
        const characteristicsResponse = await fetch('/api/drug-characteristics', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ drugs: drugNames })
        });

        if (characteristicsResponse.ok) {
          const characteristicsData = await characteristicsResponse.json();
          console.log("✅ Otrzymano charakterystyki leków (bezpośrednie):", characteristicsResult);
          characteristicsResult = characteristicsResult.characteristics;
        }
      }

      // NOWA LOGIKA: Dodaj bezpośrednią diagnozę do tablicy
      const newDiagnosis = {
        name: diagnosis.trim(),
        treatmentData: treatmentResult,
        characteristicsData: characteristicsResult,
        selectedLineIndex: 0,
        selectedSchemaPerLine: {}
      };

      // Inicjalizacja schematów
      const initialSchemaSelection = {};
      if (treatmentResult.linie_leczenia) {
        treatmentResult.linie_leczenia.forEach((_, lineIndex) => {
          initialSchemaSelection[lineIndex] = 0;
        });
      }
      newDiagnosis.selectedSchemaPerLine = initialSchemaSelection;

      // Dodaj nową diagnozę do tablicy
      setTreatmentDiagnoses(prev => [...prev, newDiagnosis]);
      setActiveTreatmentIndex(treatmentDiagnoses.length); // Ustaw nową jako aktywną

      setLoadingStep('complete');
      setLoadingMessage('Finalizacja wyników');
      setLoadingProgress(100);
      
    } catch (error) {
      console.error('❌ Błąd podczas przetwarzania bezpośredniej diagnozy:', error);
      setErrorMessage(error.message || 'Wystąpił nieoczekiwany błąd podczas pobierania schematów leczenia.');
    } finally {
      setIsLoading(false);
    }
  };

  // Obsługa wyboru linii leczenia - dla aktywnej diagnozy
  const handleLineSelection = (lineIndex) => {
    console.log("Wybrano linię leczenia o indeksie:", lineIndex);
    if (treatmentDiagnoses[activeTreatmentIndex]) {
      setTreatmentDiagnoses(prev => {
        const updated = [...prev];
        updated[activeTreatmentIndex].selectedLineIndex = lineIndex;
        return updated;
      });
    }
  };

  const handleSchemaSelection = (lineIndex, schemaIndex) => {
    console.log(`Wybrano schemat ${schemaIndex} dla linii ${lineIndex}`);
    if (treatmentDiagnoses[activeTreatmentIndex]) {
      setTreatmentDiagnoses(prev => {
        const updated = [...prev];
        updated[activeTreatmentIndex].selectedSchemaPerLine = {
          ...updated[activeTreatmentIndex].selectedSchemaPerLine,
          [lineIndex]: schemaIndex
        };
        return updated;
      });
    }
  };

  // Obsługa przełączania między diagnozami w "Linie leczenia"
  const handleTreatmentTabChange = (diagnosisIndex) => {
    setActiveTreatmentIndex(diagnosisIndex);
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

        {/* GŁÓWNE ZAKŁADKI - 3 zamiast 2 */}
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
            Diagnozy
          </div>
          <div 
            className={`tab ${activeTab === 'treatment-lines' ? 'active' : ''}`} 
            onClick={() => handleTabClick('treatment-lines')}
          >
            Linie leczenia
          </div>
        </div>

        {/* Zakładka 1: Dane pacjenta */}
        <div className={`tab-content ${activeTab === 'patient-data' ? 'active' : ''}`} id="patient-data">
          <DiagnosisForm onFormSubmit={handleFormSubmit} isLoading={isLoading} />
        </div>

        {/* Zakładka 2: Diagnozy */}
        <div className={`tab-content ${activeTab === 'results' ? 'active' : ''}`} id="results">
          <Results 
            diagnosisData={diagnosisData}
            treatmentData={null}
            characteristicsData={null}
            patientData={patientData}
            errorMessage={errorMessage}
            selectedDiagnosis={selectedDiagnosis}
            diagnosisConfirmed={false}
            selectedLineIndex={selectedLineIndex}
            selectedSchemaPerLine={selectedSchemaPerLine}
            onLineSelection={handleLineSelection}
            onSchemaSelection={handleSchemaSelection}
            onDiagnosisReset={handleDiagnosisReset}
            onDiagnosisSelect={handleDiagnosisSelect}
            onDiagnosisConfirm={handleDiagnosisConfirm}
            isLoading={isLoading}
            showTreatmentOnly={false}
          />
        </div>

        {/* Zakładka 3: Linie leczenia */}
        <div className={`tab-content ${activeTab === 'treatment-lines' ? 'active' : ''}`} id="treatment-lines">
          <TreatmentTab
            // NOWE PROPS dla systemu wielu diagnoz
            treatmentDiagnoses={treatmentDiagnoses}
            activeTreatmentIndex={activeTreatmentIndex}
            onTreatmentTabChange={handleTreatmentTabChange}
            onLineSelection={handleLineSelection}
            onSchemaSelection={handleSchemaSelection}
            onDirectDiagnosisSubmit={handleDirectDiagnosisSubmit}
            errorMessage={errorMessage}
            isLoading={isLoading}
          />
        </div>
      </div>
    </>
  );
}