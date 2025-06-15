'use client';

import { useState } from 'react';

export default function TreatmentTab({
  // NOWE PROPS dla systemu wielu diagnoz
  treatmentDiagnoses,
  activeTreatmentIndex,
  onTreatmentTabChange,
  onLineSelection,
  onSchemaSelection,
  onDirectDiagnosisSubmit,
  errorMessage,
  isLoading
}) {
  const [directDiagnosisInput, setDirectDiagnosisInput] = useState('');
  
  // NOWY STATE dla zakładki "Wyszukaj ręcznie"
  const [isManualSearchActive, setIsManualSearchActive] = useState(false);
  
  // State dla rozwijanych sekcji (usunięte ChPL, zostaje tylko refundacja)
  const [expandedSections, setExpandedSections] = useState({});

  // Obsługa formularza bezpośredniej diagnozy
  const handleDirectSubmit = (e) => {
    e.preventDefault();
    if (directDiagnosisInput.trim()) {
      onDirectDiagnosisSubmit(directDiagnosisInput);
      setDirectDiagnosisInput('');
      setIsManualSearchActive(false); // Powrót do normalnych zakładek po wyszukaniu
    }
  };

  // Funkcja do znalezienia charakterystyki leku
  const findDrugCharacteristics = (drugName, diagnosisIndex = activeTreatmentIndex) => {
    const currentDiagnosis = treatmentDiagnoses[diagnosisIndex];
    if (!currentDiagnosis || !currentDiagnosis.characteristicsData) return null;
    return currentDiagnosis.characteristicsData.find(char => 
      char.lek.toLowerCase() === drugName.toLowerCase()
    );
  };

  // Funkcje pomocnicze dla refundacji
  const getRefundationStatusText = (status) => {
    const statusMap = {
      'true': 'Refundowany',
      'false': 'Nierefundowany',
      'refundowany': 'Refundowany',
      'częściowo_refundowany': 'Częściowo refundowany',
      'nierefundowany': 'Nierefundowany'
    };
    return statusMap[String(status).toLowerCase()] || 'Brak danych';
  };

  const getRefundationBadgeClass = (status) => {
    const statusStr = String(status).toLowerCase();
    if (statusStr === 'true' || statusStr === 'refundowany') return 'badge-success';
    if (statusStr === 'częściowo_refundowany') return 'badge-warning';
    if (statusStr === 'false' || statusStr === 'nierefundowany') return 'badge-danger';
    return 'badge-secondary';
  };

  // UPROSZCZONA funkcja renderowania charakterystyk - TYLKO REFUNDACJA
  const renderDrugInfo = (drugName, isAlternative = false, diagnosisIndex = activeTreatmentIndex) => {
    const characteristics = findDrugCharacteristics(drugName, diagnosisIndex);
    
    if (!characteristics || characteristics.status !== 'dostępny') {
      return (
        <div className="drug-card-section">
          <button className="btn btn-secondary btn-sm" disabled>
            <i className="fas fa-file-medical"></i> Pobierz charakterystykę
          </button>
          <p className="drug-section-content" style={{fontSize: '12px', color: 'var(--gray-500)', marginTop: '8px'}}>
            Brak danych o leku
          </p>
        </div>
      );
    }

    return (
      <>
        {/* Przycisk do pobrania charakterystyki - PLACEHOLDER */}
        <div className="drug-card-section">
          <button className="btn btn-secondary btn-sm" disabled>
            <i className="fas fa-file-medical"></i> Pobierz charakterystykę
          </button>
          <p className="drug-section-content" style={{fontSize: '12px', color: 'var(--gray-500)', marginTop: '8px'}}>
            Funkcja dostępna wkrótce
          </p>
        </div>

        {/* TYLKO Refundacja - bez ChPL */}
        {characteristics.refundacja && (
          <div className="drug-card-section refundation-section">
            <h5 className="drug-section-title">
              <i className="fas fa-credit-card"></i> Refundacja NFZ
            </h5>
            
            <div className="refundation-status">
              <span className={`badge ${getRefundationBadgeClass(characteristics.refundacja.refundowany)}`}>
                <i className="fas fa-shield-alt"></i>
                {getRefundationStatusText(characteristics.refundacja.refundowany)}
              </span>
              
              {characteristics.refundacja.odplatnosc && (
                <span className="copayment-badge">
                  Odpłatność: {characteristics.refundacja.odplatnosc}
                </span>
              )}
            </div>

            {/* Grupy pacjentów */}
            {characteristics.refundacja.grupy_pacjentow && characteristics.refundacja.grupy_pacjentow.length > 0 && (
              <div className="refundation-groups">
                <strong>Refundacja dla:</strong>
                <ul className="drug-section-list">
                  {characteristics.refundacja.grupy_pacjentow.map((group, idx) => (
                    <li key={idx}>{group}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Przykładowe preparaty */}
            {characteristics.refundacja.przykladowy_preparat && characteristics.refundacja.przykladowy_preparat.length > 0 && (
              <div className="refundation-groups">
                <strong>Przykładowe preparaty:</strong>
                <p className="drug-section-content">
                  {characteristics.refundacja.przykladowy_preparat.join(', ')}
                </p>
              </div>
            )}

            {/* Link do refundacji */}
            {characteristics.refundacja.link && (
              <div className="drug-card-footer">
                <a href={characteristics.refundacja.link} target="_blank" rel="noopener noreferrer" className="drug-link">
                  <i className="fas fa-info-circle"></i> Sprawdź refundację
                </a>
              </div>
            )}
          </div>
        )}
      </>
    );
  };

  // Funkcja renderowania źródła z obsługą linków
  const renderSource = (sourceText) => {
    if (!sourceText) return null;
    
    const urlRegex = /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/g;
    const matches = sourceText.match(urlRegex);
    const url = matches && matches.find(url => {
      try {
        new URL(url);
        return true;
      } catch {
        return false;
      }
    });
    
    return (
      <div className="source-info">
        <i className="fas fa-book-medical"></i> Źródło:&nbsp;
        {url ? (
          <>
            <a href={url} 
               target="_blank" 
               rel="noopener noreferrer"
               className="source-link">
              {sourceText.replace(url, '').trim() || 'Przejdź do źródła'}
            </a>
            <button 
              className="copy-url-btn"
              onClick={() => navigator.clipboard.writeText(url)}
              title="Skopiuj URL"
            >
              <i className="fas fa-copy"></i>
            </button>
          </>
        ) : (
          <span className="source-text">{sourceText}</span>
        )}
      </div>
    );
  };

  // Funkcja renderowania schematów leczenia dla konkretnej diagnozy
  const renderTreatmentSchemas = (diagnosis, diagnosisIndex) => {
    if (!diagnosis || !diagnosis.treatmentData || !diagnosis.treatmentData.linie_leczenia) return null;

    const data = diagnosis.treatmentData;
    const currentLineIndex = diagnosis.selectedLineIndex || 0;
    const currentSchemaPerLine = diagnosis.selectedSchemaPerLine || {};

    const getCurrentSchema = () => {
      const currentLine = data.linie_leczenia[currentLineIndex];
      if (!currentLine) return null;
      const schemaIndex = currentSchemaPerLine[currentLineIndex] || 0;
      return currentLine.schematy_farmakologiczne[schemaIndex];
    };

    return (
      <div className="treatment-schemas-section">
        {/* Tabs dla linii leczenia */}
        <div className="treatment-tabs">
          {data.linie_leczenia.map((linia, idx) => (
            <button
              key={idx}
              className={`treatment-tab ${currentLineIndex === idx ? 'active' : ''}`}
              onClick={() => onLineSelection(idx)}
            >
              <div className="treatment-tab-name">
                {linia.numer_linii}. {linia.nazwa_linii}
              </div>
            </button>
          ))}
        </div>

        {/* Wybrana linia leczenia */}
        {data.linie_leczenia[currentLineIndex] && (
          <div className="selected-treatment-line">
            <div className="line-header">
              <h3>{data.linie_leczenia[currentLineIndex].nazwa_linii}</h3>
              <p className="line-description">
                {data.linie_leczenia[currentLineIndex].opis_linii}
              </p>
            </div>
            
            {/* Subtabs dla schematów farmakologicznych */}
            <div className="schema-tabs">
              {data.linie_leczenia[currentLineIndex].schematy_farmakologiczne.map((schemat, idx) => (
                <button
                  key={idx}
                  className={`schema-tab ${(currentSchemaPerLine[currentLineIndex] || 0) === idx ? 'active' : ''}`}
                  onClick={() => onSchemaSelection(currentLineIndex, idx)}
                >
                  {schemat.schemat_farmakologiczny}
                </button>
              ))}
            </div>

            {/* Wybrany schemat farmakologiczny */}
            {getCurrentSchema() && (
              <div className="selected-schema">
                <div className="schema-info">
                  <h4>{getCurrentSchema().schemat_farmakologiczny}</h4>
                  <p className="schema-description">
                    {getCurrentSchema().opis_schematu_farmakologicznego}
                  </p>
                </div>
                
                {/* Sekcja farmakologii */}
                <div className="pharmacology-section">
                  <h4 className="section-title">
                    <i className="fas fa-pills"></i> Farmakologia
                  </h4>
                  
                  {/* ZMIANA: Leki w układzie poziomym - każdy lek główny z alternatywami w rzędzie */}
                  <div className="drugs-horizontal-container">
                    {getCurrentSchema().leki.map((lek, lekIdx) => (
                      <div key={`drug-row-${lekIdx}`} className="drug-row-horizontal">
                        <h5 className="drug-row-title">
                          <i className="fas fa-prescription-bottle-alt"></i> Lek {lekIdx + 1}
                        </h5>
                        
                        <div className="drug-cards-horizontal">
                          {/* Lek główny */}
                          <div className="drug-card drug-card-main">
                            <div className="drug-card-header">
                              <div className="drug-card-title">
                                <h4>{lek.nazwa}</h4>
                              </div>
                              {lek.typ && (
                                <span className="drug-type-badge">{lek.typ}</span>
                              )}
                            </div>

                            {/* Dawkowanie */}
                            <div className="drug-card-section">
                              <h5 className="drug-section-title">
                                <i className="fas fa-pills"></i> Dawkowanie
                              </h5>
                              <p className="drug-section-content">{lek.dawkowanie}</p>
                            </div>

                            {/* Informacje o leku głównym - TYLKO REFUNDACJA */}
                            {renderDrugInfo(lek.nazwa, false, diagnosisIndex)}
                          </div>
                          
                          {/* Alternatywy - w tym samym rzędzie */}
                          {lek.alternatywy && lek.alternatywy.length > 0 && (
                            <>
                              {lek.alternatywy.map((alt, altIdx) => (
                                <div key={`alt-${lekIdx}-${altIdx}`} className="drug-card drug-card-alternative">
                                  <div className="drug-card-header">
                                    <div className="drug-card-title">
                                      <h4>{alt.nazwa}</h4>
                                      <span className="alternative-badge">
                                        <i className="fas fa-exchange-alt"></i> Alternatywa
                                      </span>
                                    </div>
                                    {lek.typ && (
                                      <span className="drug-type-badge">{lek.typ}</span>
                                    )}
                                  </div>

                                  {/* Różnice */}
                                  <div className="drug-card-section">
                                    <h5 className="drug-section-title">
                                      <i className="fas fa-exchange-alt"></i> Różnice
                                    </h5>
                                    <p className="drug-section-content">{alt.różnice}</p>
                                  </div>

                                  {/* Informacje o alternatywie - TYLKO REFUNDACJA */}
                                  {renderDrugInfo(alt.nazwa, true, diagnosisIndex)}
                                </div>
                              ))}
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Źródło schematu */}
                {getCurrentSchema().źródło && renderSource(getCurrentSchema().źródło)}
              </div>
            )}
          </div>
        )}

        {/* Zalecenia niefarmakologiczne */}
        {data.leczenie_niefarmakologiczne && (
          <div className="result-card treatment non-pharmacological" style={{ marginTop: '32px' }}>
            <div className="result-header">
              <div className="result-title">
                <i className="fas fa-heartbeat"></i> Zalecenia niefarmakologiczne
              </div>
            </div>
            <div className="result-body">
              <ul className="treatment-list">
                {data.leczenie_niefarmakologiczne.zalecenia.map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
              {data.leczenie_niefarmakologiczne.źródło && 
                renderSource(data.leczenie_niefarmakologiczne.źródło)}
            </div>
          </div>
        )}
      </div>
    );
  };

  // GŁÓWNY RENDER
  return (
    <div className="treatment-tab-container">
      {/* Wyświetlanie błędów */}
      {errorMessage && (
        <div className="alert alert-error">
          <i className="fas fa-exclamation-circle"></i>
          <div>{errorMessage}</div>
        </div>
      )}

      {/* PRZYPADEK 1: Brak diagnoz - tylko formularz */}
      {treatmentDiagnoses.length === 0 && (
        <div className="no-diagnoses-section">
          <div className="alert alert-info">
            <i className="fas fa-lightbulb"></i>
            <div>
              <strong>Wyszukaj linie leczenia ręcznie:</strong> Wprowadź nazwę diagnozy, aby uzyskać bezpośredni dostęp do schematów leczenia.
            </div>
          </div>
          
          <form onSubmit={handleDirectSubmit} className="direct-diagnosis-form">
            <div className="form-group" style={{ display: 'flex', gap: '16px', alignItems: 'end', marginBottom: '0' }}>
              <div style={{ flex: 1 }}>
                <label htmlFor="directDiagnosis" className="form-label">Nazwa diagnozy</label>
                <input
                  type="text"
                  id="directDiagnosis"
                  className="form-input"
                  placeholder="Np. Zapalenie płuc, Cukrzyca typu 2..."
                  value={directDiagnosisInput}
                  onChange={(e) => setDirectDiagnosisInput(e.target.value)}
                  disabled={isLoading}
                />
              </div>
              <button 
                type="submit" 
                className="btn btn-primary"
                disabled={isLoading || !directDiagnosisInput.trim()}
              >
                <i className="fas fa-search"></i> Wyszukaj schematy
              </button>
            </div>
          </form>
        </div>
      )}

      {/* PRZYPADEK 2: Mamy diagnozy - podzakładki + wyniki */}
      {treatmentDiagnoses.length > 0 && (
        <div className="diagnoses-sections">
          {/* NOWE: Podzakładki diagnoz (POZIOM 2) + zakładka "Wyszukaj ręcznie" */}
          <div className="diagnosis-subtabs">
            {treatmentDiagnoses.map((diagnosis, index) => (
              <button
                key={index}
                className={`diagnosis-subtab ${!isManualSearchActive && activeTreatmentIndex === index ? 'active' : ''}`}
                onClick={() => {
                  setIsManualSearchActive(false);
                  onTreatmentTabChange(index);
                }}
              >
                <i className="fas fa-stethoscope"></i>
                {diagnosis.name}
              </button>
            ))}
            
            {/* NOWA ZAKŁADKA: Wyszukaj ręcznie */}
            <button
              className={`diagnosis-subtab manual-search-tab ${isManualSearchActive ? 'active' : ''}`}
              onClick={() => setIsManualSearchActive(true)}
            >
              <i className="fas fa-search-plus"></i>
              Wyszukaj ręcznie
            </button>
          </div>

          {/* NOWE: Zawartość zakładki "Wyszukaj ręcznie" */}
          {isManualSearchActive && (
            <div className="manual-search-content">
              <div className="manual-search-header">
                <h2>
                  <i className="fas fa-search-plus"></i> 
                  Wyszukaj linie leczenia ręcznie
                </h2>
                <p>Wprowadź nazwę diagnozy, aby uzyskać dodatkowe schematy leczenia.</p>
              </div>

              <form onSubmit={handleDirectSubmit} className="direct-diagnosis-form">
                <div className="form-group" style={{ display: 'flex', gap: '16px', alignItems: 'end', marginBottom: '0' }}>
                  <div style={{ flex: 1 }}>
                    <label htmlFor="manualDiagnosis" className="form-label">Nazwa diagnozy</label>
                    <input
                      type="text"
                      id="manualDiagnosis"
                      className="form-input"
                      placeholder="Np. Zapalenie płuc, Cukrzyca typu 2..."
                      value={directDiagnosisInput}
                      onChange={(e) => setDirectDiagnosisInput(e.target.value)}
                      disabled={isLoading}
                    />
                  </div>
                  <button 
                    type="submit" 
                    className="btn btn-primary"
                    disabled={isLoading || !directDiagnosisInput.trim()}
                  >
                    <i className="fas fa-search"></i> 
                    {isLoading ? 'Wyszukiwanie...' : 'Wyszukaj schematy'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Wyniki dla aktywnej diagnozy - tylko gdy nie jest aktywna zakładka "Wyszukaj ręcznie" */}
          {!isManualSearchActive && treatmentDiagnoses[activeTreatmentIndex] && (
            <div className="active-diagnosis-results">
              <div className="diagnosis-header">
                <h2>
                  <i className="fas fa-check-circle"></i> 
                  Rekomendacje dla: {treatmentDiagnoses[activeTreatmentIndex].name}
                </h2>
                <p>Schematy leczenia przygotowane na podstawie najnowszych wytycznych medycznych.</p>
              </div>

              {/* Schematy leczenia dla aktywnej diagnozy */}
              {renderTreatmentSchemas(treatmentDiagnoses[activeTreatmentIndex], activeTreatmentIndex)}
            </div>
          )}
        </div>
      )}
    </div>
  );
}