'use client';

import { useState } from 'react';
import { jsPDF } from 'jspdf';

export default function Results({ 
  diagnosisData, 
  treatmentData,
  characteristicsData,
  patientData, 
  errorMessage,
  selectedDiagnosis, 
  diagnosisConfirmed,
  selectedSchemaIndex,
  onSchemaSelection
}) {

  // Funkcja do ekstrakcji linków URL z tekstu
  const extractUrl = (text) => {
    if (!text) return null;
    
    const urlRegex = /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/g;
    const matches = text.match(urlRegex);
    
    if (!matches) return null;
    
    const validUrl = matches.find(url => {
      try {
        new URL(url);
        return true;
      } catch {
        return false;
      }
    });
    
    return validUrl || null;
  };

  // Funkcja walidacji URL
  const isValidUrl = (url) => {
    try {
      const urlObj = new URL(url);
      return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
    } catch {
      return false;
    }
  };

  // Funkcja do eksportu do PDF
  const handleExport = () => {
    alert('Funkcja eksportu do PDF jest tymczasowo niedostępna.');
  };

  // Funkcja do znalezienia charakterystyki leku
  const findDrugCharacteristics = (drugName) => {
    if (!characteristicsData) return null;
    return characteristicsData.find(char => 
      char.lek.toLowerCase() === drugName.toLowerCase()
    );
  };

  // Funkcja do pobierania aktualnie wybranego leku
  const getCurrentDrug = () => {
    if (!treatmentData || !treatmentData.rekomendacje_leczenia) return null;
    
    const currentSchema = treatmentData.rekomendacje_leczenia[selectedSchemaIndex];
    if (!currentSchema || !currentSchema.leki) return null;
    
    // Budujemy listę wszystkich leków (główne + alternatywy)
    const allDrugs = [];
    currentSchema.leki.forEach(lek => {
      allDrugs.push({ ...lek, isMain: true });
      if (lek.alternatywy) {
        lek.alternatywy.forEach(alt => {
          allDrugs.push({ 
            nazwa: alt.nazwa,
            typ: lek.typ, // Dziedzicz typ z głównego leku
            dawkowanie: alt.różnice, // Różnice jako opis
            isAlternative: true,
            mainDrug: lek.nazwa
          });
        });
      }
    });
    
    return allDrugs[selectedDrugIndex];
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

  // Jeśli nie ma danych diagnozy
  if (!diagnosisData && !errorMessage) {
    return (
      <div className="alert alert-warning">
        <i className="fas fa-info-circle"></i>
        <div>Uzupełnij dane pacjenta w zakładce "Dane pacjenta" i kliknij "Przedstaw rekomendacje", aby zobaczyć wyniki.</div>
      </div>
    );
  }

  // Jeśli mamy diagnozę, ale nie wybrano jeszcze diagnozy dla rekomendacji
  if (diagnosisData && !diagnosisConfirmed && !treatmentData) {
    return null; // TabContainer wyświetli sekcję wyboru diagnozy
  }

  // Funkcja do renderowania źródła z obsługą linków
  const renderSource = (sourceText) => {
    if (!sourceText) return null;
    
    const url = extractUrl(sourceText);
    const isUrlValid = url && isValidUrl(url);
    
    return (
      <div className="source-info">
        <i className="fas fa-book-medical"></i> Źródło:&nbsp;
        {isUrlValid ? (
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

  // Komponent dla niedostępnego leku
  const UnavailableDrugView = ({ drug, characteristics }) => (
    <div className="drug-unavailable-panel">
      <div className="unavailable-header">
        <i className="fas fa-exclamation-triangle"></i>
        <h3>Lek niedostępny</h3>
      </div>
      <div className="unavailable-content">
        <p><strong>Nazwa leku:</strong> {drug.nazwa}</p>
        {characteristics && characteristics.uwagi && (
          <p><strong>Powód:</strong> {characteristics.uwagi}</p>
        )}
        {drug.alternatywy && drug.alternatywy.length > 0 && (
          <div className="alternatives-section">
            <h4>Dostępne alternatywy:</h4>
            <ul>
              {drug.alternatywy.map((alt, idx) => (
                <li key={idx}>
                  <strong>{alt.nazwa}</strong>
                  {alt.różnice && <span> - {alt.różnice}</span>}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );

  // Panel szczegółów wybranego leku
  const DrugDetailsPanel = ({ drug }) => {
    if (!drug) return (
      <div className="drug-details-empty">
        <p>Wybierz lek z listy powyżej, aby zobaczyć szczegóły.</p>
      </div>
    );

    const characteristics = findDrugCharacteristics(drug.nazwa);
    
    // Jeśli lek niedostępny
    if (characteristics && characteristics.status === 'niedostępny') {
      return <UnavailableDrugView drug={drug} characteristics={characteristics} />;
    }

    return (
      <div className="drug-details-panel">
        {/* Podstawowe informacje */}
        <div className="drug-basic-info">
          <h3 className="drug-name">
            {drug.nazwa}
            {drug.isAlternative && (
              <span className="alternative-badge">
                Alternatywa dla {drug.mainDrug}
              </span>
            )}
          </h3>
          {drug.typ && (
            <span className="drug-type-badge">{drug.typ}</span>
          )}
          {drug.dawkowanie && (
            <div className="drug-dosage">
              <strong>{drug.isAlternative ? 'Różnice:' : 'Dawkowanie:'}</strong> {drug.dawkowanie}
            </div>
          )}
        </div>

        {/* Charakterystyka z ChPL jeśli dostępna */}
        {characteristics && characteristics.status === 'dostępny' && characteristics.chpl && (
          <>
            {/* Substancja czynna */}
            {characteristics.chpl.substancja_czynna && (
              <div className="result-section">
                <h4 className="result-section-title">
                  <i className="fas fa-flask"></i> Substancja czynna
                </h4>
                <p>{characteristics.chpl.substancja_czynna}</p>
              </div>
            )}

            {/* Wskazania */}
            {characteristics.chpl.wskazania && characteristics.chpl.wskazania.length > 0 && (
              <div className="result-section">
                <h4 className="result-section-title">
                  <i className="fas fa-check-circle"></i> Wskazania
                </h4>
                <ul className="treatment-list drug">
                  {characteristics.chpl.wskazania.map((indication, idx) => (
                    <li key={idx}>{indication}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Przeciwwskazania */}
            {characteristics.chpl.przeciwwskazania && characteristics.chpl.przeciwwskazania.length > 0 && (
              <div className="result-section">
                <h4 className="result-section-title">
                  <i className="fas fa-exclamation-triangle"></i> Przeciwwskazania
                </h4>
                <ul className="treatment-list drug contraindications">
                  {characteristics.chpl.przeciwwskazania.map((contraindication, idx) => (
                    <li key={idx}>{contraindication}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Uwagi specjalne */}
            {characteristics.chpl.uwagi_specjalne && characteristics.chpl.uwagi_specjalne.length > 0 && (
              <div className="result-section">
                <h4 className="result-section-title">
                  <i className="fas fa-info-circle"></i> Uwagi specjalne
                </h4>
                <ul className="treatment-list drug special-notes">
                  {characteristics.chpl.uwagi_specjalne.map((note, idx) => (
                    <li key={idx}>{note}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Link do ChPL */}
            {characteristics.chpl.link && renderSource(`Charakterystyka Produktu Leczniczego ${characteristics.chpl.link}`)}
          </>
        )}

        {/* Refundacja NFZ */}
        {characteristics && characteristics.status === 'dostępny' && characteristics.refundacja && (
          <div className="refundation-section">
            <h4 className="result-section-title">
              <i className="fas fa-credit-card"></i> Refundacja NFZ
            </h4>
            
            <div className="refundation-status">
              <span className={`badge ${getRefundationBadgeClass(characteristics.refundacja.refundowany)}`}>
                <i className="fas fa-shield-alt"></i>
                {getRefundationStatusText(characteristics.refundacja.refundowany)}
              </span>
              
              {characteristics.refundacja.odplatnosc && (
                <span className="copayment-info">
                  Odpłatność: {characteristics.refundacja.odplatnosc}
                </span>
              )}
            </div>

            {/* Grupy pacjentów */}
            {characteristics.refundacja.grupy_pacjentow && characteristics.refundacja.grupy_pacjentow.length > 0 && (
              <div className="refundation-groups">
                <strong>Grupy pacjentów objęte refundacją:</strong>
                <ul>
                  {characteristics.refundacja.grupy_pacjentow.map((group, idx) => (
                    <li key={idx}>{group}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Przykładowe preparaty */}
            {characteristics.refundacja.przykladowy_preparat && characteristics.refundacja.przykladowy_preparat.length > 0 && (
              <div className="refundation-examples">
                <strong>Przykładowe preparaty handlowe:</strong>
                <ul>
                  {characteristics.refundacja.przykladowy_preparat.map((prep, idx) => (
                    <li key={idx}>{prep}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Link do refundacji */}
            {characteristics.refundacja.link && renderSource(`Informacje o refundacji ${characteristics.refundacja.link}`)}
          </div>
        )}

        {/* Jeśli brak charakterystyk */}
        {!characteristics && (
          <div className="alert alert-warning">
            <i className="fas fa-info-circle"></i>
            <div>Brak szczegółowych danych o tym leku. Charakterystyka może być niedostępna lub wystąpił błąd podczas pobierania danych.</div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div>
      {renderError()}
      
      {diagnosisData && (
        <div className="result-grid">
          {/* Karty diagnoz */}
          {diagnosisData.Diagnozy && diagnosisData.Diagnozy.map((diagnoza, index) => (
            <div 
              key={index} 
              className={`result-card diagnosis ${selectedDiagnosis === diagnoza.Nazwa ? 'selected-diagnosis' : ''}`}
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
            </div>
          ))}

          {/* Informacja o wybranej diagnozie */}
          {selectedDiagnosis && diagnosisConfirmed && (
            <div className="result-card info" style={{ gridColumn: '1/-1' }}>
              <div className="result-header">
                <div className="result-title">
                  <i className="fas fa-info-circle"></i> Rekomendacje dla: {selectedDiagnosis}
                </div>
              </div>
              <div className="result-body">
                <div className="result-section">
                  <p className="list-item-desc">
                    Poniżej znajdują się schematy leczenia oraz zalecenia niefarmakologiczne przygotowane na podstawie najnowszych wytycznych medycznych.
                  </p>
                </div>
              </div>
            </div>
          )}


{/* Schematy leczenia */}
{treatmentData && diagnosisConfirmed && treatmentData.rekomendacje_leczenia && (
  <div className="result-card treatment treatment-schemas" style={{ gridColumn: '1/-1' }}>
    <div className="result-header">
      <div className="result-title">
        <i className="fas fa-notes-medical"></i> Schematy leczenia
      </div>
    </div>
    <div className="result-body">
      {/* Tabs dla schematów */}
      <div className="treatment-tabs">
        {treatmentData.rekomendacje_leczenia.map((schema, idx) => (
          <button
            key={idx}
            className={`treatment-tab ${selectedSchemaIndex === idx ? 'active' : ''}`}
            onClick={() => onSchemaSelection(idx)}
          >
            <div className="treatment-tab-name">{schema.nazwa_schematu}</div>
          </button>
        ))}
      </div>

      {/* Wybrany schemat */}
      {treatmentData.rekomendacje_leczenia[selectedSchemaIndex] && (
        <div className="selected-treatment-schema">
          <div className="schema-header">
            <h3>{treatmentData.rekomendacje_leczenia[selectedSchemaIndex].nazwa_schematu}</h3>
            <p className="schema-description">
              {treatmentData.rekomendacje_leczenia[selectedSchemaIndex].opis_schematu}
            </p>
          </div>
          
          {/* Sekcja farmakologii */}
          <div className="pharmacology-section">
            <h4 className="section-title">
              <i className="fas fa-pills"></i> Farmakologia
            </h4>
            
            {/* Kontener z przewijaniem poziomym */}
            <div className="drugs-container">
              <div className="drugs-scroll-area">
                {treatmentData.rekomendacje_leczenia[selectedSchemaIndex].leki.map((lek, lekIdx) => (
                  <div key={`drug-group-${lekIdx}`} className="drug-group">
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

                      {/* Charakterystyka */}
                      {(() => {
                        const characteristics = findDrugCharacteristics(lek.nazwa);
                        if (!characteristics) return (
                          <div className="drug-card-section">
                            <div className="alert alert-warning">
                              <i className="fas fa-info-circle"></i>
                              <div>Brak szczegółowych danych o tym leku</div>
                            </div>
                          </div>
                        );

                        if (characteristics.status === 'niedostępny') return (
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

                        if (characteristics.status === 'dostępny' && characteristics.chpl) return (
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

                            {/* Wskazania */}
                            {characteristics.chpl.wskazania && characteristics.chpl.wskazania.length > 0 && (
                              <div className="drug-card-section">
                                <h5 className="drug-section-title">
                                  <i className="fas fa-check-circle"></i> Wskazania
                                </h5>
                                <ul className="drug-section-list">
                                  {characteristics.chpl.wskazania.slice(0, 3).map((indication, idx) => (
                                    <li key={idx}>{indication}</li>
                                  ))}
                                  {characteristics.chpl.wskazania.length > 3 && (
                                    <li className="more-items">...i {characteristics.chpl.wskazania.length - 3} więcej</li>
                                  )}
                                </ul>
                              </div>
                            )}

                            {/* Przeciwwskazania */}
                            {characteristics.chpl.przeciwwskazania && characteristics.chpl.przeciwwskazania.length > 0 && (
                              <div className="drug-card-section">
                                <h5 className="drug-section-title">
                                  <i className="fas fa-exclamation-triangle"></i> Przeciwwskazania
                                </h5>
                                <ul className="drug-section-list">
                                  {characteristics.chpl.przeciwwskazania.slice(0, 2).map((contraindication, idx) => (
                                    <li key={idx}>{contraindication}</li>
                                  ))}
                                  {characteristics.chpl.przeciwwskazania.length > 2 && (
                                    <li className="more-items">...i {characteristics.chpl.przeciwwskazania.length - 2} więcej</li>
                                  )}
                                </ul>
                              </div>
                            )}

                            {/* Refundacja */}
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
                      })()}
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

                            <div className="drug-card-section">
                              <h5 className="drug-section-title">
                                <i className="fas fa-pills"></i> Różnice
                              </h5>
                              <p className="drug-section-content">{alt.różnice}</p>
                            </div>

                            {/* Tu też można dodać charakterystyki dla alternatyw */}
                          </div>
                        ))}
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Źródło schematu */}
          {treatmentData.rekomendacje_leczenia[selectedSchemaIndex].źródło && 
            renderSource(treatmentData.rekomendacje_leczenia[selectedSchemaIndex].źródło)}
        </div>
      )}
    </div>
  </div>
)}

{/* Zalecenia niefarmakologiczne */}
{treatmentData && diagnosisConfirmed && treatmentData.leczenie_niefarmakologiczne && (
  <div className="result-card treatment non-pharmacological" style={{ gridColumn: '1/-1' }}>
    <div className="result-header">
      <div className="result-title">
        <i className="fas fa-heartbeat"></i> Zalecenia niefarmakologiczne
      </div>
    </div>
    <div className="result-body">
      <ul className="treatment-list">
        {treatmentData.leczenie_niefarmakologiczne.zalecenia.map((item, index) => (
          <li key={index}>{item}</li>
        ))}
      </ul>
      {treatmentData.leczenie_niefarmakologiczne.źródło && 
        renderSource(treatmentData.leczenie_niefarmakologiczne.źródło)}
    </div>
  </div>
)}

{/* Przycisk eksportu */}
{diagnosisData && (
  <div style={{ textAlign: 'center', marginTop: '24px' }}>
    <button 
      className="btn btn-secondary" 
      onClick={handleExport}
      disabled
    >
      <i className="fas fa-file-pdf"></i> Eksportuj raport
    </button>
    <p style={{ fontSize: '12px', color: 'var(--gray-500)', marginTop: '8px' }}>
      Funkcja eksportu do PDF jest tymczasowo niedostępna
    </p>
  </div>
)}
</div>
</div>
);
}