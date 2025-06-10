'use client';

import { useState } from 'react';
import { jsPDF } from 'jspdf';

export default function Results({ 
 diagnosisData, 
 treatmentData, 
 patientData, 
 errorMessage,
 selectedDiagnosis, 
 diagnosisConfirmed,
 selectedDrugIndex,        // NOWE
 onDrugSelection          // NOWE
}) {
 // Funkcja do ekstrakcji linków URL z tekstu
 const extractUrl = (text) => {
   const urlRegex = /(https?:\/\/[^\s]+)/g;
   const matches = text?.match(urlRegex);
   return matches ? matches[0] : null;
 };

 // Funkcja do eksportu do PDF
 const handleExport = () => {
   // Export PDF functionality is temporarily disabled
   alert('Funkcja eksportu do PDF jest tymczasowo niedostępna.');
 };

 // NOWE FUNKCJE POMOCNICZE dla refundacji
 const getRefundationStatusText = (status) => {
   switch(status) {
     case 'refundowany': return 'Refundowany';
     case 'częściowo_refundowany': return 'Częściowo refundowany';
     case 'nierefundowany': return 'Nierefundowany';
     default: return 'Brak danych';
   }
 };

 const getRefundationBadgeClass = (status) => {
   switch(status) {
     case 'refundowany': return 'badge-refunded';
     case 'częściowo_refundowany': return 'badge-partially-refunded';
     case 'nierefundowany': return 'badge-not-refunded';
     default: return 'badge-secondary';
   }
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

 // Jeśli mamy diagnozę, ale nie wybrano jeszcze której diagnozy użyć dla rekomendacji
 if (diagnosisData && !diagnosisConfirmed && !treatmentData) {
   return null; // TabContainer wyświetli sekcję wyboru diagnozy
 }

 // Jeśli nie ma danych diagnozy, zwróć komunikat
 if (!diagnosisData && !errorMessage) {
   return (
     <div className="alert alert-warning">
       <i className="fas fa-info-circle"></i>
       <div>Uzupełnij dane pacjenta w zakładce "Dane pacjenta" i kliknij "Przedstaw rekomendacje", aby zobaczyć wyniki.</div>
     </div>
   );
 }

 // Funkcja do renderowania źródła z obsługą linków
 const renderSource = (sourceText) => {
   if (!sourceText) return null;
   
   const url = extractUrl(sourceText);
   
   return (
     <div className="source-info">
       <i className="fas fa-book-medical"></i> Źródło:&nbsp;
       {url ? (
         <a href={url} 
            target="_blank" 
            rel="noopener noreferrer"
            className="source-link">
           {sourceText}
         </a>
       ) : (
         <span>{sourceText}</span>
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

 // NOWY KOMPONENT: Sekcja refundacji NFZ
 const RefundationSection = ({ refundation }) => {
   if (!refundation) return null;

   return (
     <div className="refundation-section">
       <h4 className="result-section-title">
         <i className="fas fa-credit-card"></i> Refundacja NFZ
       </h4>
       
       {/* Status badge */}
       <div className="refundation-status">
         <span className={`badge ${getRefundationBadgeClass(refundation.Status)}`}>
           <i className="fas fa-shield-alt"></i>
           {getRefundationStatusText(refundation.Status)}
         </span>
         
         {refundation.Poziom_Odpłatności && (
           <span className="copayment-info">
             Odpłatność: {refundation.Poziom_Odpłatności}
           </span>
         )}

         {refundation.Kategoria_Dostępności && (
           <span className="availability-category">
             Kategoria: {refundation.Kategoria_Dostępności}
           </span>
         )}
       </div>

       {/* Szczegóły refundacji */}
       {refundation.Warunki_Refundacji && (
         <div className="refundation-conditions">
           <strong>Warunki refundacji:</strong> {refundation.Warunki_Refundacji}
         </div>
       )}

       {refundation.Wskazania_Refundowane && refundation.Wskazania_Refundowane.length > 0 && (
         <div className="refundation-indications">
           <strong>Wskazania refundowane:</strong>
           <ul>
             {refundation.Wskazania_Refundowane.map((indication, idx) => (
               <li key={idx}>{indication}</li>
             ))}
           </ul>
         </div>
       )}

       {refundation.Ograniczenia_Wiekowe && (
         <div className="refundation-age-limits">
           <strong>Ograniczenia wiekowe:</strong> {refundation.Ograniczenia_Wiekowe}
         </div>
       )}

       {/* Alternatywy jeśli nierefundowany */}
       {refundation.Alternatywy_Refundowane && refundation.Alternatywy_Refundowane.length > 0 && (
         <div className="refundation-alternatives">
           <strong>Alternatywy refundowane:</strong>
           <ul>
             {refundation.Alternatywy_Refundowane.map((alt, idx) => (
               <li key={idx}>{alt}</li>
             ))}
           </ul>
         </div>
       )}

       {refundation.Źródło && renderSource(refundation.Źródło)}
     </div>
   );
 };

 // NOWY KOMPONENT: Panel szczegółów wybranego leku
 const DrugDetailsPanel = ({ drug }) => {
   if (!drug) return (
     <div className="drug-details-empty">
       <p>Wybierz lek z kart powyżej, aby zobaczyć szczegóły.</p>
     </div>
   );

   return (
     <div className="drug-details-panel">
       {/* Podstawowe informacje */}
       <div className="drug-basic-info">
         <h3 className="drug-name">{drug.Nazwa}</h3>
         {drug.Typ && (
           <span className="drug-type-badge">
             {drug.Typ}
           </span>
         )}
         {drug.Dawkowanie && (
           <div className="drug-dosage">
             <strong>Dawkowanie:</strong> {drug.Dawkowanie}
           </div>
         )}
       </div>

       {/* Wskazania */}
       {drug.Wskazania && drug.Wskazania.length > 0 && (
         <div className="result-section">
           <h4 className="result-section-title">
             <i className="fas fa-check-circle"></i> Wskazania
           </h4>
           <ul className="treatment-list drug">
             {drug.Wskazania.map((indication, idx) => (
               <li key={idx}>{indication}</li>
             ))}
           </ul>
         </div>
       )}

       {/* Przeciwwskazania */}
       {drug.Przeciwwskazania && drug.Przeciwwskazania.length > 0 && (
         <div className="result-section">
           <h4 className="result-section-title">
             <i className="fas fa-exclamation-triangle"></i> Przeciwwskazania
           </h4>
           <ul className="treatment-list drug contraindications">
             {drug.Przeciwwskazania.map((contraindication, idx) => (
               <li key={idx}>{contraindication}</li>
             ))}
           </ul>
         </div>
       )}

       {/* Interakcje */}
       {drug.Interakcje && drug.Interakcje.length > 0 && (
         <div className="result-section">
           <h4 className="result-section-title">
             <i className="fas fa-exchange-alt"></i> Interakcje
           </h4>
           <ul className="treatment-list drug interactions">
             {drug.Interakcje.map((interaction, idx) => (
               <li key={idx}>{interaction}</li>
             ))}
           </ul>
         </div>
       )}

       {/* Uwagi specjalne */}
       {drug.Uwagi_Specjalne && drug.Uwagi_Specjalne.length > 0 && (
         <div className="result-section">
           <h4 className="result-section-title">
             <i className="fas fa-info-circle"></i> Uwagi specjalne
           </h4>
           <ul className="treatment-list drug special-notes">
             {drug.Uwagi_Specjalne.map((note, idx) => (
               <li key={idx}>{note}</li>
             ))}
           </ul>
         </div>
       )}

       {/* Refundacja NFZ */}
       <RefundationSection refundation={drug.Refundacja_NFZ} />

       {/* Źródło charakterystyki */}
       {drug.Źródło && (
         <div className="result-section">
           {renderSource(drug.Źródło)}
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

         {/* Informacja o wybranej diagnozie dla rekomendacji */}
         {selectedDiagnosis && diagnosisConfirmed && (
           <div className="result-card info" style={{ gridColumn: '1/-1' }}>
             <div className="result-header">
               <div className="result-title">
                 <i className="fas fa-info-circle"></i> Informacja o rekomendacjach
               </div>
             </div>
             <div className="result-body">
               <div className="result-section">
                 <p className="list-item-desc">
                   Poniższe rekomendacje leczenia zostały przygotowane dla diagnozy: <strong>{selectedDiagnosis}</strong>
                 </p>
               </div>
             </div>
           </div>
         )}

         {/* NOWA SEKCJA: Połączona sekcja leków i charakterystyk */}
         {treatmentData && diagnosisConfirmed && (
           <div className="result-card medications" style={{ gridColumn: '1/-1' }}>
             <div className="result-header">
               <div className="result-title">
                 <i className="fas fa-pills"></i> Leki i ich charakterystyki
               </div>
             </div>
             <div className="result-body">
               
               {/* 1. Lista leków z dawkowaniem */}
               {treatmentData.Farmakoterapia && treatmentData.Farmakoterapia.length > 0 && (
                 <div className="medications-summary">
                   <h4 className="summary-title">
                     <i className="fas fa-list"></i> Zalecane leki:
                   </h4>
                   <ul className="treatment-list">
                     {treatmentData.Farmakoterapia.map((med, idx) => (
                       <li key={idx}>{med}</li>
                     ))}
                   </ul>
                   {treatmentData.Źródło_Farmakoterapii && renderSource(treatmentData.Źródło_Farmakoterapii)}
                 </div>
               )}

               {/* 2. Karty do wyboru leku */}
               {treatmentData.Charakterystyki_Leków && treatmentData.Charakterystyki_Leków.length > 0 && (
                 <>
                   <div className="drug-selection-header">
                     <h4 className="summary-title">
                       <i className="fas fa-capsules"></i> Szczegóły leków:
                     </h4>
                     <p className="selection-hint">Kliknij na kartę leku, aby zobaczyć szczegółową charakterystykę</p>
                   </div>

                   <div className="drug-tabs-container">
                     {treatmentData.Charakterystyki_Leków.map((drug, idx) => (
                       <div 
                         key={idx}
                         className={`drug-tab ${selectedDrugIndex === idx ? 'active' : ''}`}
                         onClick={() => onDrugSelection(idx)}
                       >
                         <div className="drug-tab-name">{drug.Nazwa}</div>
                         {drug.Typ && <div className="drug-tab-type">{drug.Typ}</div>}
                         {drug.Refundacja_NFZ && (
                           <div className={`drug-tab-refund ${drug.Refundacja_NFZ.Status}`}>
                             {getRefundationStatusText(drug.Refundacja_NFZ.Status)}
                           </div>
                         )}
                       </div>
                     ))}
                   </div>

                   {/* 3. Szczegóły wybranego leku */}
                   <DrugDetailsPanel drug={treatmentData.Charakterystyki_Leków[selectedDrugIndex]} />
                 </>
               )}
             </div>
           </div>
         )}

         {/* Zalecenia niefarmakologiczne - osobna sekcja */}
         {treatmentData && diagnosisConfirmed && treatmentData.Zalecenia_Niefarmakologiczne && treatmentData.Zalecenia_Niefarmakologiczne.length > 0 && (
           <div className="result-card treatment" style={{ gridColumn: '1/-1' }}>
             <div className="result-header">
               <div className="result-title">
                 <i className="fas fa-heartbeat"></i> Zalecenia niefarmakologiczne
               </div>
             </div>
             <div className="result-body">
               <ul className="treatment-list">
                 {treatmentData.Zalecenia_Niefarmakologiczne.map((item, index) => (
                   <li key={index}>{item}</li>
                 ))}
               </ul>
               {treatmentData.Źródło_Zaleceń_Niefarmakologicznych && renderSource(treatmentData.Źródło_Zaleceń_Niefarmakologicznych)}
             </div>
           </div>
         )}
       </div>
     )}

     {/* Przycisk eksportu - tymczasowo wyłączony */}
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
 );
}