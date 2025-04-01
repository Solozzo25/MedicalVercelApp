'use client';

import { useState } from 'react';
import { jsPDF } from 'jspdf';

export default function Results({ 
  diagnosisData, 
  treatmentData, 
  patientData, 
  isLoading, 
  isTreatmentLoading,
  errorMessage,
  onRequestTreatment // New prop for requesting treatment
}) {
  // State for tracking the selected diagnosis
  const [selectedDiagnosis, setSelectedDiagnosis] = useState(null);

  // Funkcja do ekstrakcji linków URL z tekstu
  const extractUrl = (text) => {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const matches = text?.match(urlRegex);
    return matches ? matches[0] : null;
  };

  // Handler for diagnosis selection
  const handleSelectDiagnosis = (diagnosis) => {
    setSelectedDiagnosis(diagnosis);
  };

  // Handler for requesting treatment with selected diagnosis
  const handleRequestTreatment = () => {
    if (selectedDiagnosis) {
      onRequestTreatment(selectedDiagnosis);
    }
  };

  // Funkcja do eksportu do PDF
  const handleExport = () => {
    if (!diagnosisData) {
      alert('Brak danych do eksportu. Najpierw uzyskaj diagnozę.');
      return;
    }
    
    try {
      const doc = new jsPDF();
      
      // Tytuł dokumentu
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('Raport Diagnostyczny MedDiagnosis', 20, 20);
      
      // Dane pacjenta
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.text(`Wiek pacjenta: ${patientData?.age || 'Nie podano'}`, 20, 35);
      doc.text(`Płeć pacjenta: ${patientData?.sex || 'Nie podano'}`, 20, 42);
      
      // Diagnozy
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Możliwe diagnozy:', 20, 55);
      
      let yPos = 60;
      
      // Iteracja przez wszystkie diagnozy
      if (diagnosisData.diagnozy && diagnosisData.diagnozy.length > 0) {
        diagnosisData.diagnozy.forEach((diagnoza, index) => {
          doc.setFontSize(12);
          doc.setFont('helvetica', 'bold');
          const diagnozaText = `${index + 1}. ${diagnoza.nazwa} (Prawdopodobieństwo: ${diagnoza.prawdopodobienstwo}%)`;
          doc.text(diagnozaText, 25, yPos);
          yPos += 8;
          
          // Uzasadnienie
          doc.setFont('helvetica', 'normal');
          const uzasadnienieLines = doc.splitTextToSize(`Uzasadnienie: ${diagnoza.uzasadnienie}`, 160);
          doc.text(uzasadnienieLines, 30, yPos);
          yPos += uzasadnienieLines.length * 7;
          
          // Badania potwierdzające
          doc.setFont('helvetica', 'italic');
          doc.text('Badania potwierdzające:', 30, yPos);
          yPos += 7;
          
          if (diagnoza.badania_potwierdzające && diagnoza.badania_potwierdzające.length > 0) {
            diagnoza.badania_potwierdzające.forEach(badanie => {
              doc.text(`- ${badanie}`, 35, yPos);
              yPos += 7;
            });
          } else {
            doc.text('- Brak wskazanych badań', 35, yPos);
            yPos += 7;
          }
          
          // Towarzystwo medyczne
          doc.setFont('helvetica', 'normal');
          doc.text(`Towarzystwo medyczne: ${diagnoza.towarzystwo_medyczne}`, 30, yPos);
          yPos += 12; // Zwiększone odstępy między diagnozami
        });
      }
      
      // Dodaj rekomendacje leczenia, jeśli są dostępne
      if (treatmentData) {
        doc.addPage();
        
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.text('Rekomendacje Leczenia', 20, 20);
        
        // Wybrana diagnoza
        doc.setFontSize(14);
        doc.text(`Dla diagnozy: ${selectedDiagnosis.nazwa}`, 20, 30);
        
        // Rekomendacje ogólne
        if (treatmentData.Rekomendacje_Ogólne) {
          yPos = 45;
          // Nagłówek rekomendacji ogólnych
          doc.setFontSize(14);
          doc.setFont('helvetica', 'bold');
          doc.text('Rekomendacje oparte na wiedzy medycznej:', 20, yPos);
          yPos += 10;
          
          // Farmakoterapia ogólna
          doc.setFontSize(12);
          doc.setFont('helvetica', 'bold');
          doc.text('Farmakoterapia:', 25, yPos);
          yPos += 7;
          
          doc.setFontSize(11);
          doc.setFont('helvetica', 'normal');
          if (treatmentData.Rekomendacje_Ogólne.Farmakoterapia && treatmentData.Rekomendacje_Ogólne.Farmakoterapia.length > 0) {
            treatmentData.Rekomendacje_Ogólne.Farmakoterapia.forEach(item => {
              const lines = doc.splitTextToSize(item, 160);
              doc.text(lines, 30, yPos);
              yPos += lines.length * 6;
            });
          } else {
            doc.text('Brak danych o farmakoterapii', 30, yPos);
            yPos += 7;
          }
          
          // Zalecenia niefarmakologiczne ogólne
          yPos += 5;
          doc.setFontSize(12);
          doc.setFont('helvetica', 'bold');
          doc.text('Zalecenia niefarmakologiczne:', 25, yPos);
          yPos += 7;
          
          doc.setFontSize(11);
          doc.setFont('helvetica', 'normal');
          if (treatmentData.Rekomendacje_Ogólne.Zalecenia_Niefarmakologiczne && treatmentData.Rekomendacje_Ogólne.Zalecenia_Niefarmakologiczne.length > 0) {
            treatmentData.Rekomendacje_Ogólne.Zalecenia_Niefarmakologiczne.forEach(item => {
              const lines = doc.splitTextToSize(item, 160);
              doc.text(lines, 30, yPos);
              yPos += lines.length * 6;
            });
          } else {
            doc.text('Brak danych o zaleceniach niefarmakologicznych', 30, yPos);
            yPos += 7;
          }
        }
        
        // Rekomendacje oficjalne
        if (treatmentData.Rekomendacje_Oficjalne) {
          // Sprawdzenie czy trzeba dodać nową stronę
          if (yPos > 230) {
            doc.addPage();
            yPos = 20;
          } else {
            yPos += 15;
          }
          
          // Nagłówek rekomendacji oficjalnych
          doc.setFontSize(14);
          doc.setFont('helvetica', 'bold');
          doc.text('Rekomendacje oficjalne:', 20, yPos);
          yPos += 10;
          
          // Farmakoterapia oficjalna
          doc.setFontSize(12);
          doc.setFont('helvetica', 'bold');
          doc.text('Farmakoterapia:', 25, yPos);
          yPos += 7;
          
          doc.setFontSize(11);
          doc.setFont('helvetica', 'normal');
          if (treatmentData.Rekomendacje_Oficjalne.Farmakoterapia && treatmentData.Rekomendacje_Oficjalne.Farmakoterapia.length > 0) {
            treatmentData.Rekomendacje_Oficjalne.Farmakoterapia.forEach(item => {
              const lines = doc.splitTextToSize(item, 160);
              doc.text(lines, 30, yPos);
              yPos += lines.length * 6;
            });
          } else {
            doc.text('Brak danych o farmakoterapii', 30, yPos);
            yPos += 7;
          }
          
          // Źródło farmakoterapii oficjalnej
          if (treatmentData.Rekomendacje_Oficjalne.Źródło_Farmakoterapii) {
            yPos += 3;
            doc.setFont('helvetica', 'italic');
            const zrodloLines = doc.splitTextToSize(`Źródło: ${treatmentData.Rekomendacje_Oficjalne.Źródło_Farmakoterapii}`, 155);
            doc.text(zrodloLines, 30, yPos);
            yPos += zrodloLines.length * 6 + 3;
          }
          
          // Zalecenia niefarmakologiczne oficjalne
          yPos += 5;
          doc.setFontSize(12);
          doc.setFont('helvetica', 'bold');
          doc.text('Zalecenia niefarmakologiczne:', 25, yPos);
          yPos += 7;
          
          doc.setFontSize(11);
          doc.setFont('helvetica', 'normal');
          if (treatmentData.Rekomendacje_Oficjalne.Zalecenia_Niefarmakologiczne && treatmentData.Rekomendacje_Oficjalne.Zalecenia_Niefarmakologiczne.length > 0) {
            treatmentData.Rekomendacje_Oficjalne.Zalecenia_Niefarmakologiczne.forEach(item => {
              const lines = doc.splitTextToSize(item, 160);
              doc.text(lines, 30, yPos);
              yPos += lines.length * 6;
            });
          } else {
            doc.text('Brak danych o zaleceniach niefarmakologicznych', 30, yPos);
            yPos += 7;
          }
          
          // Źródło zaleceń niefarmakologicznych oficjalnych
          if (treatmentData.Rekomendacje_Oficjalne.Źródło_Zaleceń_Niefarmakologicznych) {
            yPos += 3;
            doc.setFont('helvetica', 'italic');
            const zrodloLines = doc.splitTextToSize(`Źródło: ${treatmentData.Rekomendacje_Oficjalne.Źródło_Zaleceń_Niefarmakologicznych}`, 155);
            doc.text(zrodloLines, 30, yPos);
            yPos += zrodloLines.length * 6 + 3;
          }
        }
        
        // Charakterystyka leków
        if (treatmentData.Charakterystyka_Leków && treatmentData.Charakterystyka_Leków.length > 0) {
          treatmentData.Charakterystyka_Leków.forEach((lek, index) => {
            // Dodaj nową stronę dla każdego leku
            doc.addPage();
            yPos = 20;
            
            // Nagłówek charakterystyki leku
            doc.setFontSize(14);
            doc.setFont('helvetica', 'bold');
            doc.text(`Charakterystyka leku ${index + 1}/${treatmentData.Charakterystyka_Leków.length}: ${lek.Nazwa}`, 20, yPos);
            yPos += 10;
            
            // Wskazania
            doc.setFontSize(12);
            doc.setFont('helvetica', 'bold');
            doc.text('Wskazania:', 25, yPos);
            yPos += 7;
            
            doc.setFontSize(11);
            doc.setFont('helvetica', 'normal');
            if (lek.Wskazania && lek.Wskazania.length > 0) {
              lek.Wskazania.forEach(wskazanie => {
                const lines = doc.splitTextToSize(wskazanie, 160);
                doc.text(lines, 30, yPos);
                yPos += lines.length * 6;
              });
            } else {
              doc.text('Brak danych o wskazaniach', 30, yPos);
              yPos += 7;
            }
            
            // Przeciwwskazania
            yPos += 5;
            doc.setFontSize(12);
            doc.setFont('helvetica', 'bold');
            doc.text('Przeciwwskazania:', 25, yPos);
            yPos += 7;
            
            doc.setFontSize(11);
            doc.setFont('helvetica', 'normal');
            if (lek.Przeciwwskazania && lek.Przeciwwskazania.length > 0) {
              lek.Przeciwwskazania.forEach(przeciwwskazanie => {
                const lines = doc.splitTextToSize(przeciwwskazanie, 160);
                doc.text(lines, 30, yPos);
                yPos += lines.length * 6;
              });
            } else {
              doc.text('Brak danych o przeciwwskazaniach', 30, yPos);
              yPos += 7;
            }
            
            // Interakcje
            yPos += 5;
            doc.setFontSize(12);
            doc.setFont('helvetica', 'bold');
            doc.text('Interakcje:', 25, yPos);
            yPos += 7;
            
            doc.setFontSize(11);
            doc.setFont('helvetica', 'normal');
            if (lek.Interakcje && lek.Interakcje.length > 0) {
              lek.Interakcje.forEach(interakcja => {
                const lines = doc.splitTextToSize(interakcja, 160);
                doc.text(lines, 30, yPos);
                yPos += lines.length * 6;
              });
            } else {
              doc.text('Brak danych o interakcjach', 30, yPos);
              yPos += 7;
            }
            
            // Źródło charakterystyki leku
            if (lek.Źródło) {
              yPos += 5;
              doc.setFont('helvetica', 'italic');
              const zrodloLines = doc.splitTextToSize(`Źródło: ${lek.Źródło}`, 155);
              doc.text(zrodloLines, 25, yPos);
              yPos += zrodloLines.length * 6;
            }
          });
        }
      }
      
      // Zapisz PDF
      doc.save('MedDiagnosis-Raport.pdf');
    } catch (error) {
      console.error('Błąd podczas generowania PDF:', error);
      alert('Wystąpił błąd podczas generowania PDF. Spróbuj ponownie później.');
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

  if (isLoading) {
    return (
      <div className="loading" style={{ display: 'block' }}>
        <div className="loading-spinner">
          <div></div>
          <div></div>
        </div>
        <p className="loading-text">Analizujemy dane i przygotowujemy wyniki diagnozy...</p>
      </div>
    );
  }

  // Jeśli trwa ładowanie rekomendacji leczenia
  if (isTreatmentLoading) {
    return (
      <div className="loading" style={{ display: 'block' }}>
        <div className="loading-spinner">
          <div></div>
          <div></div>
        </div>
        <p className="loading-text">Pobieranie rekomendacji leczenia dla wybranej diagnozy...</p>
      </div>
    );
  }

  // Jeśli nie ma danych diagnozy, zwróć komunikat
  if (!diagnosisData && !isLoading && !errorMessage) {
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

  // Funkcja do renderowania paska postępu dla prawdopodobieństwa diagnozy
  const renderProbabilityBar = (probability) => {
    const barColor = probability > 70 
      ? 'var(--success)' 
      : probability > 40 
        ? 'var(--warning)' 
        : 'var(--error)';
    
    return (
      <div className="probability-bar-container">
        <div 
          className="probability-bar" 
          style={{ 
            width: `${probability}%`,
            backgroundColor: barColor
          }}
        ></div>
        <span className="probability-value">{probability}%</span>
      </div>
    );
  };

  return (
    <div>
      {renderError()}
      
      {diagnosisData && (
        <div className="result-grid">
          {/* Lista możliwych diagnoz */}
          {diagnosisData.diagnozy && diagnosisData.diagnozy.map((diagnoza, index) => (
            <div 
              key={index} 
              className={`result-card diagnosis ${selectedDiagnosis?.nazwa === diagnoza.nazwa ? 'selected' : ''}`}
              onClick={() => handleSelectDiagnosis(diagnoza)}
            >
              <div className="result-header">
                <div className="result-title">
                  <i className="fas fa-search-plus"></i> {diagnoza.nazwa}
                </div>
                <span className={`badge ${
                  diagnoza.prawdopodobienstwo > 70 
                    ? 'badge-success' 
                    : diagnoza.prawdopodobienstwo > 40 
                      ? 'badge-warning' 
                      : 'badge-danger'
                }`}>
                  <i className="fas fa-percentage"></i> {diagnoza.prawdopodobienstwo}%
                </span>
              </div>
              <div className="result-body">
                <div className="result-section">
                  {renderProbabilityBar(diagnoza.prawdopodobienstwo)}
                  <p className="list-item-desc">
                    <strong>Uzasadnienie:</strong> {diagnoza.uzasadnienie}
                  </p>
                </div>
                
                <div className="result-section">
                  <h4 className="result-section-title">Badania potwierdzające</h4>
                  <ul className="treatment-list">
                    {diagnoza.badania_potwierdzające && diagnoza.badania_potwierdzające.map((badanie, badanieIndex) => (
                      <li key={badanieIndex}>{badanie}</li>
                    ))}
                  </ul>
                </div>
                
                <div className="result-section">
                  <h4 className="result-section-title">Towarzystwo medyczne</h4>
                  <p>{diagnoza.towarzystwo_medyczne}</p>
                </div>
                
                {selectedDiagnosis?.nazwa === diagnoza.nazwa && (
                  <div className="diagnosis-selected-indicator">
                    <i className="fas fa-check-circle"></i> Wybrano
                  </div>
                )}
              </div>
            </div>
          ))}
          
          {/* Przycisk do pobrania rekomendacji leczenia */}
          {diagnosisData && !treatmentData && selectedDiagnosis && (
            <div className="treatment-actions">
              <button 
                className="btn btn-primary btn-lg btn-block" 
                onClick={handleRequestTreatment}
                disabled={isTreatmentLoading}
              >
                <i className="fas fa-pills"></i> Pobierz rekomendację leczenia
              </button>
            </div>
          )}

          {/* Karty rekomendacji leczenia - wyświetlane tylko jeśli są dostępne */}
          {treatmentData && (
            <>
              {/* Rekomendacje ogólne */}
              {treatmentData.Rekomendacje_Ogólne && (
                <div className="result-card treatment" style={{ gridColumn: '1/-1' }}>
                  <div className="result-header">
                    <div className="result-title">
                      <i className="fas fa-book-medical"></i> Rekomendacje ogólne
                    </div>
                  </div>
                  <div className="result-body">
                    <div className="result-section">
                      <h4 className="result-section-title">Farmakoterapia</h4>
                      <ul className="treatment-list">
                        {treatmentData.Rekomendacje_Ogólne.Farmakoterapia && 
                         treatmentData.Rekomendacje_Ogólne.Farmakoterapia.length > 0 
                          ? treatmentData.Rekomendacje_Ogólne.Farmakoterapia.map((item, index) => (
                              <li key={index}>{item}</li>
                            ))
                          : <li>Brak danych o farmakoterapii</li>
                        }
                      </ul>
                    </div>
                    
                    <div className="result-section">
                      <h4 className="result-section-title">Zalecenia niefarmakologiczne</h4>
                      <ul className="treatment-list">
                        {treatmentData.Rekomendacje_Ogólne.Zalecenia_Niefarmakologiczne && 
                         treatmentData.Rekomendacje_Ogólne.Zalecenia_Niefarmakologiczne.length > 0 
                          ? treatmentData.Rekomendacje_Ogólne.Zalecenia_Niefarmakologiczne.map((item, index) => (
                              <li key={index}>{item}</li>
                            ))
                          : <li>Brak danych o zaleceniach niefarmakologicznych</li>
                        }
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {/* Rekomendacje oficjalne */}
              {treatmentData.Rekomendacje_Oficjalne && (
                <div className="result-card treatment" style={{ gridColumn: '1/-1' }}>
                  <div className="result-header">
                    <div className="result-title">
                      <i className="fas fa-certificate"></i> Rekomendacje oficjalne
                    </div>
                  </div>
                  <div className="result-body">
                    <div className="result-section">
                      <h4 className="result-section-title">Farmakoterapia</h4>
                      <ul className="treatment-list">
                        {treatmentData.Rekomendacje_Oficjalne.Farmakoterapia && 
                         treatmentData.Rekomendacje_Oficjalne.Farmakoterapia.length > 0 
                          ? treatmentData.Rekomendacje_Oficjalne.Farmakoterapia.map((item, index) => (
                              <li key={index}>{item}</li>
                            ))
                          : <li>Brak danych o farmakoterapii</li>
                        }
                      </ul>
                      {treatmentData.Rekomendacje_Oficjalne.Źródło_Farmakoterapii && 
                       renderSource(treatmentData.Rekomendacje_Oficjalne.Źródło_Farmakoterapii)}
                    </div>
                    
                    <div className="result-section">
                      <h4 className="result-section-title">Zalecenia niefarmakologiczne</h4>
                      <ul className="treatment-list">
                        {treatmentData.Rekomendacje_Oficjalne.Zalecenia_Niefarmakologiczne && 
                         treatmentData.Rekomendacje_Oficjalne.Zalecenia_Niefarmakologiczne.length > 0 
                          ? treatmentData.Rekomendacje_Oficjalne.Zalecenia_Niefarmakologiczne.map((item, index) => (
                              <li key={index}>{item}</li>
                            ))
                          : <li>Brak danych o zaleceniach niefarmakologicznych</li>
                        }
                      </ul>
                      {treatmentData.Rekomendacje_Oficjalne.Źródło_Zaleceń_Niefarmakologicznych && 
                       renderSource(treatmentData.Rekomendacje_Oficjalne.Źródło_Zaleceń_Niefarmakologicznych)}
                    </div>
                  </div>
                </div>
              )}

              {/* Karuzela leków */}
              {treatmentData.Charakterystyka_Leków && treatmentData.Charakterystyka_Leków.length > 0 && (
                <DrugCarousel drugs={treatmentData.Charakterystyka_Leków} renderSource={renderSource} />
              )}
            </>
          )}
        </div>
      )}

      {/* Przycisk eksportu */}
      {diagnosisData && (
        <div style={{ textAlign: 'center', marginTop: '24px' }}>
          <button 
            className="btn btn-secondary" 
            onClick={handleExport}
          >
            <i className="fas fa-file-pdf"></i> Eksportuj raport
          </button>
        </div>
      )}
    </div>
  );
}

// Komponent karuzeli leków
function DrugCarousel({ drugs, renderSource }) {
  const [currentDrugIndex, setCurrentDrugIndex] = useState(0);
  const drugsCount = drugs.length;
  
  const nextDrug = () => {
    setCurrentDrugIndex((prev) => (prev + 1) % drugsCount);
  };
  
  const prevDrug = () => {
    setCurrentDrugIndex((prev) => (prev - 1 + drugsCount) % drugsCount);
  };
  
  const currentDrug = drugs[currentDrugIndex];
  
  return (
    <div className="result-card drug" style={{ gridColumn: '1/-1' }}>
      <div className="result-header">
        <div className="result-title">
          <i className="fas fa-capsules"></i> Charakterystyka leku: {currentDrug.Nazwa}
        </div>
        <div className="navigation-controls">
          <span className="navigation-indicator">Lek {currentDrugIndex + 1} z {drugsCount}</span>
          <div className="navigation-buttons">
            <button 
              className="action-btn" 
              onClick={prevDrug} 
              disabled={drugsCount <= 1}
              title="Poprzedni lek"
            >
              <i className="fas fa-chevron-left"></i>
            </button>
            <button 
              className="action-btn" 
              onClick={nextDrug}
              disabled={drugsCount <= 1}
              title="Następny lek"
            >
              <i className="fas fa-chevron-right"></i>
            </button>
          </div>
        </div>
      </div>
      <div className="result-body">
        <div className="result-section">
          <h4 className="result-section-title">Wskazania</h4>
          <ul className="treatment-list drug">
            {currentDrug.Wskazania && currentDrug.Wskazania.length > 0 
              ? currentDrug.Wskazania.map((item, index) => (
                  <li key={index}>{item}</li>
                ))
              : <li>Brak danych o wskazaniach</li>
            }
          </ul>
        </div>
        
        <div className="result-section">
          <h4 className="result-section-title">Przeciwwskazania</h4>
          <ul className="treatment-list drug">
            {currentDrug.Przeciwwskazania && currentDrug.Przeciwwskazania.length > 0 
              ? currentDrug.Przeciwwskazania.map((item, index) => (
                  <li key={index}>{item}</li>
                ))
              : <li>Brak danych o przeciwwskazaniach</li>
            }
          </ul>
        </div>
        
        <div className="result-section">
          <h4 className="result-section-title">Interakcje</h4>
          <ul className="treatment-list drug">
            {currentDrug.Interakcje && currentDrug.Interakcje.length > 0 
              ? currentDrug.Interakcje.map((item, index) => (
                  <li key={index}>{item}</li>
                ))
              : <li>Brak danych o interakcjach</li>
            }
          </ul>
        </div>
        
        {currentDrug.Źródło && (
          <div className="result-section">
            {renderSource(currentDrug.Źródło)}
          </div>
        )}
      </div>
    </div>
  );
}
