'use client';

import { useState } from 'react';

export default function TreatmentTab({
  // Props z diagnozy
  treatmentData,
  characteristicsData,
  selectedDiagnosis,
  diagnosisConfirmed,
  selectedLineIndex,
  selectedSchemaPerLine,
  onLineSelection,
  onSchemaSelection,
  onDiagnosisReset,
  // Props z bezpośredniej diagnozy
  directDiagnosis,
  directTreatmentData,
  directCharacteristicsData,
  directSelectedLineIndex,
  directSelectedSchemaPerLine,
  onDirectLineSelection,
  onDirectSchemaSelection,
  onDirectDiagnosisSubmit,
  errorMessage,
  isLoading
}) {
  const [directDiagnosisInput, setDirectDiagnosisInput] = useState('');
  
  // State dla rozwijanych sekcji ChPL
  const [expandedSections, setExpandedSections] = useState({});

  // Funkcja do przełączania rozwinięcia sekcji
  const toggleSection = (drugName, sectionName) => {
    const key = `${drugName}-${sectionName}`;
    setExpandedSections(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  // Obsługa formularza bezpośredniej diagnozy
  const handleDirectSubmit = (e) => {
    e.preventDefault();
    onDirectDiagnosisSubmit(directDiagnosisInput);
  };

  // Funkcja do znalezienia charakterystyki leku
  const findDrugCharacteristics = (drugName, isDirectMode = false) => {
    const characteristicsToSearch = isDirectMode ? directCharacteristicsData : characteristicsData;
    if (!characteristicsToSearch) return null;
    return characteristicsToSearch.find(char => 
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

  // Funkcja do renderowania charakterystyk leku
  const renderDrugCharacteristics = (drugName, isAlternative = false, isDirectMode = false) => {
    const characteristics = findDrugCharacteristics(drugName, isDirectMode);
    
    if (!characteristics) {
      return (
        <div className="drug-card-section">
          <div className="alert alert-warning">
            <i className="fas fa-info-circle"></i>
            <div>Brak szczegółowych danych o tym leku</div>
          </div>
        </div>
      );
    }

    if (characteristics.status === 'niedostępny') {
      return (
        <div className="drug-card-section">
          <div className="alert alert-error">
            <i className="fas fa-exclamation-triangle"></i>
            <div>
              <strong>Lek niedostępny</strong>
              <p>{characteristics.uwagi}</p>
            </div>
          </div>
        </div>
      );
    }

    if (characteristics.status === 'dostępny' && characteristics.chpl) {
      return (
        <>
          {/* Substancja czynna */}
          {characteristics.chpl.substancja_czynna && (
            <div className="drug-card-section">
              <h5 className="drug-section-title">
                <i className="fas fa-flask"></i> Substancja czynna
              </h5>
              <p className="drug-section-content">{characteristics.chpl.substancja_czynna}</p>
            </div>
          )}

          {/* Wskazania - rozwijane */}
          {characteristics.chpl.wskazania && characteristics.chpl.wskazania.length > 0 && (
            <div className="drug-card-section">
              <h5 
                className="drug-section-title collapsible-header"
                onClick={() => toggleSection(drugName, 'wskazania')}
              >
                <i className="fas fa-check-circle"></i> Wskazania
                <i className={`fas fa-chevron-${expandedSections[`${drugName}-wskazania`] ? 'up' : 'down'} collapse-icon`}></i>
              </h5>
              <div className={`collapsible-content ${expandedSections[`${drugName}-wskazania`] ? 'expanded' : ''}`}>
                <ul className="drug-section-list">
                  {characteristics.chpl.wskazania.map((indication, idx) => (
                    <li key={idx}>{indication}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Przeciwwskazania - rozwijane */}
          {characteristics.chpl.przeciwwskazania && characteristics.chpl.przeciwwskazania.length > 0 && (
            <div className="drug-card-section">
              <h5 
                className="drug-section-title collapsible-header"
                onClick={() => toggleSection(drugName, 'przeciwwskazania')}
              >
                <i className="fas fa-exclamation-triangle"></i> Przeciwwskazania
                <i className={`fas fa-chevron-${expandedSections[`${drugName}-przeciwwskazania`] ? 'up' : 'down'} collapse-icon`}></i>
              </h5>
              <div className={`collapsible-content ${expandedSections[`${drugName}-przeciwwskazania`] ? 'expanded' : ''}`}>
                <ul className="drug-section-list">
                  {characteristics.chpl.przeciwwskazania.map((contraindication, idx) => (
                    <li key={idx}>{contraindication}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Uwagi specjalne - rozwijane */}
          {characteristics.chpl.uwagi_specjalne && characteristics.chpl.uwagi_specjalne.length > 0 && (
            <div className="drug-card-section">
              <h5 
                className="drug-section-title collapsible-header"
                onClick={() => toggleSection(drugName, 'uwagi')}
              >
                <i className="fas fa-exclamation-circle"></i> Uwagi specjalne
                <i className={`fas fa-chevron-${expandedSections[`${drugName}-uwagi`] ? 'up' : 'down'} collapse-icon`}></i>
              </h5>
              <div className={`collapsible-content ${expandedSections[`${drugName}-uwagi`] ? 'expanded' : ''}`}>
                <ul className="drug-section-list">
                  {characteristics.chpl.uwagi_specjalne.map((warning, idx) => (
                    <li key={idx}>{warning}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Refundacja - zawsze rozwinięta */}
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
            </div>
          )}

          {/* Footer z linkami */}
          <div className="drug-card-footer">
            {characteristics.chpl.link && (
              <a href={characteristics.chpl.link} target="_blank" rel="noopener noreferrer" className="drug-link">
                <i className="fas fa-file-medical"></i> ChPL
              </a>
            )}
            {characteristics.refundacja && characteristics.refundacja.link && (
              <a href={characteristics.refundacja.link} target="_blank" rel="noopener noreferrer" className="drug-link">
                <i className="fas fa-info-circle"></i> Refundacja
              </a>
            )}
          </div>
        </>
      );
    }

    return null;
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

  // Funkcja renderowania schematów leczenia
  const renderTreatmentSchemas = (data, isDirectMode = false) => {
    if (!data || !data.linie_leczenia) return null;

    const currentLineIndex = isDirectMode ? directSelectedLineIndex : selectedLineIndex;
    const currentSchemaPerLine = isDirectMode ? directSelectedSchemaPerLine : selectedSchemaPerLine;
    const handleLineSelect = isDirectMode ? onDirectLineSelection : onLineSelection;
    const handleSchemaSelect = isDirectMode ? onDirectSchemaSelection : onSchemaSelection;

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
              onClick={() => handleLineSelect(idx)}
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
                  onClick={() => handleSchemaSelect(currentLineIndex, idx)}
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
                  
                  {/* Leki w układzie pionowym */}
                  <div className="drugs-vertical-container">
                    {getCurrentSchema().leki.map((lek, lekIdx) => (
                      <div key={`drug-row-${lekIdx}`} className="drug-row">
                        <h5 className="drug-row-title">
                          <i className="fas fa-prescription-bottle-alt"></i> Lek {lekIdx + 1}
                        </h5>
                        
                        <div className="drug-cards-grid">
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

                            {/* Charakterystyka leku głównego */}
                            {renderDrugCharacteristics(lek.nazwa, false, isDirectMode)}
                          </div>
                          
                          {/* Alternatywy */}
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

                                  {/* Pełne charakterystyki dla alternatywy */}
                                  {renderDrugCharacteristics(alt.nazwa, true, isDirectMode)}
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

  return (
    <div className="treatment-tab-container">
      {/* Formularz bezpośredniej diagnozy */}
      <div className="direct-diagnosis-section">
        <div className="alert alert-info">
          <i className="fas fa-lightbulb"></i>
          <div>
            <strong>Szybkie wyszukiwanie:</strong> Wprowadź nazwę diagnozy, aby uzyskać bezpośredni dostęp do schematów leczenia.
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

      {/* Wyświetlanie błędów */}
      {errorMessage && (
        <div className="alert alert-error">
          <i className="fas fa-exclamation-circle"></i>
          <div>{errorMessage}</div>
        </div>
      )}

      {/* Sekcja wyników z diagnozy */}
      {treatmentData && diagnosisConfirmed && (
        <div className="treatment-results-section">
          <div className="result-card info diagnosis-info-card">
            <div className="result-header">
              <div className="result-title">
                <i className="fas fa-check-circle"></i> Rekomendacje dla: {selectedDiagnosis}
              </div>
              <button 
                className="btn btn-secondary btn-sm"
                onClick={onDiagnosisReset}
                title="Wybierz inną diagnozę"
              >
                <i className="fas fa-exchange-alt"></i> Zmień diagnozę
              </button>
            </div>
            <div className="result-body">
              <div className="result-section">
                <p className="list-item-desc">
                  Schematy leczenia przygotowane na podstawie diagnozy z danych pacjenta.
                </p>
              </div>
            </div>
          </div>
          
          {renderTreatmentSchemas(treatmentData, false)}
        </div>
      )}

      {/* Sekcja wyników z bezpośredniej diagnozy */}
      {directTreatmentData && (
        <div className="treatment-results-section">
          <div className="result-card info" style={{ backgroundColor: 'var(--secondary)', color: 'var(--white)' }}>
            <div className="result-header">
              <div className="result-title" style={{ color: 'var(--white)' }}>
                <i className="fas fa-search"></i> Schematy dla: {directDiagnosis}
              </div>
            </div>
            <div className="result-body">
              <div className="result-section">
                <p className="list-item-desc" style={{ color: 'rgba(255, 255, 255, 0.9)' }}>
                  Schematy leczenia wyszukane bezpośrednio dla podanej diagnozy.
                </p>
              </div>
            </div>
          </div>
          
          {renderTreatmentSchemas(directTreatmentData, true)}
        </div>
      )}

      {/* Placeholder gdy brak danych */}
      {!treatmentData && !directTreatmentData && !isLoading && (
        <div className="treatment-placeholder">
          <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--gray-500)' }}>
            <i className="fas fa-pills" style={{ fontSize: '48px', marginBottom: '16px', color: 'var(--gray-300)' }}></i>
            <h3 style={{ marginBottom: '8px', color: 'var(--gray-600)' }}>Brak schematów leczenia</h3>
            <p>Wprowadź diagnozę powyżej lub wybierz diagnozę w zakładce "Diagnozy"</p>
          </div>
        </div>
      )}
    </div>
  );
}