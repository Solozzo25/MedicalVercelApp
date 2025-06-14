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
  selectedLineIndex,
  selectedSchemaPerLine,
  onLineSelection,
  onSchemaSelection,
  onDiagnosisReset
}) {

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

  // Funkcja do renderowania pełnych charakterystyk leku z rozwijanymi sekcjami
  const renderDrugCharacteristics = (drugName, isAlternative = false) => {
    const characteristics = findDrugCharacteristics(drugName);
    
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

  // Pobierz aktualnie wybrany schemat
  const getCurrentSchema = () => {
    if (!treatmentData || !treatmentData.linie_leczenia) return null;
    const currentLine = treatmentData.linie_leczenia[selectedLineIndex];
    if (!currentLine) return null;
    const schemaIndex = selectedSchemaPerLine[selectedLineIndex] || 0;
    return currentLine.schematy_farmakologiczne[schemaIndex];
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

         {/* NOWA SEKCJA: Informacja o wybranej diagnozie z przyciskiem powrotu */}
         {selectedDiagnosis && diagnosisConfirmed && (
           <div className="result-card info diagnosis-info-card" style={{ gridColumn: '1/-1' }}>
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
                   Poniżej znajdują się linie leczenia oraz schematy farmakologiczne przygotowane na podstawie najnowszych wytycznych medycznych.
                   Możesz wrócić do wyboru innej diagnozy używając przycisku "Zmień diagnozę".
                 </p>
               </div>
             </div>
           </div>
         )}

         {/* Linie leczenia i schematy farmakologiczne */}
         {treatmentData && diagnosisConfirmed && treatmentData.linie_leczenia && (
           <div className="result-card treatment treatment-schemas" style={{ gridColumn: '1/-1' }}>
             <div className="result-header">
               <div className="result-title">
                 <i className="fas fa-notes-medical"></i> Schematy leczenia
               </div>
             </div>
             <div className="result-body">
               {/* Tabs dla linii leczenia */}
               <div className="treatment-tabs">
                 {treatmentData.linie_leczenia.map((linia, idx) => (
                   <button
                     key={idx}
                     className={`treatment-tab ${selectedLineIndex === idx ? 'active' : ''}`}
                     onClick={() => onLineSelection(idx)}
                   >
                     <div className="treatment-tab-name">
                       {linia.numer_linii}. {linia.nazwa_linii}
                     </div>
                   </button>
                 ))}
               </div>

               {/* Wybrana linia leczenia */}
               {treatmentData.linie_leczenia[selectedLineIndex] && (
                 <div className="selected-treatment-line">
                   <div className="line-header">
                     <h3>{treatmentData.linie_leczenia[selectedLineIndex].nazwa_linii}</h3>
                     <p className="line-description">
                       {treatmentData.linie_leczenia[selectedLineIndex].opis_linii}
                     </p>
                   </div>
                   
                   {/* Subtabs dla schematów farmakologicznych */}
                   <div className="schema-tabs">
                     {treatmentData.linie_leczenia[selectedLineIndex].schematy_farmakologiczne.map((schemat, idx) => (
                       <button
                         key={idx}
                         className={`schema-tab ${(selectedSchemaPerLine[selectedLineIndex] || 0) === idx ? 'active' : ''}`}
                         onClick={() => onSchemaSelection(selectedLineIndex, idx)}
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
                       
                       {/* Sekcja farmakologii - nowy układ pionowy */}
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
                                   {renderDrugCharacteristics(lek.nazwa, false)}
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
                                         {renderDrugCharacteristics(alt.nazwa, true)}
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
           <div style={{ textAlign: 'center', marginTop: '24px', gridColumn: '1/-1' }}>
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
     )}
   </div>
 );
}