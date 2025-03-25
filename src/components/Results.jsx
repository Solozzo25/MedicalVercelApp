'use client';

import { useState } from 'react';
import { jsPDF } from 'jspdf';

export default function Results({ 
  diagnosisData, 
  treatmentData, 
  patientData, 
  isLoading, 
  errorMessage 
}) {
  // Funkcja do ekstrakcji linków URL z tekstu
  const extractUrl = (text) => {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const matches = text?.match(urlRegex);
    return matches ? matches[0] : null;
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
      
      // Diagnoza główna
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Diagnoza główna:', 20, 55);
      
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.text(diagnosisData.Diagnoza_Główna || 'Brak danych', 25, 62);
      
      // Uzasadnienie diagnozy - dzielenie długiego tekstu na wiele linii
      const uzasadnienieLines = doc.splitTextToSize(
        `Uzasadnienie: ${diagnosisData.Uzasadnienie_Diagnozy || 'Brak danych'}`, 
        170
      );
      doc.text(uzasadnienieLines, 25, 69);
      
      // Pozycja Y dla następnej sekcji - dynamiczna w zależności od długości uzasadnienia
      let yPos = 69 + (uzasadnienieLines.length * 7);
      
      // Diagnoza różnicowa
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Diagnoza różnicowa:', 20, yPos);
      
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.text(diagnosisData.Diagnoza_Różnicowa || 'Brak danych', 25, yPos + 7);
      
      // Uzasadnienie diagnozy różnicowej
      const uzasadnienieRoznicoweLines = doc.splitTextToSize(
        `Uzasadnienie: ${diagnosisData.Uzasadnienie_Różnicowe || 'Brak danych'}`, 
        170
      );
      doc.text(uzasadnienieRoznicoweLines, 25, yPos + 14);
      
      yPos += 14 + (uzasadnienieRoznicoweLines.length * 7);

      // Towarzystwo medyczne
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Rekomendowane wytyczne:', 20, yPos);
      
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.text(diagnosisData.Towarzystwo_Medyczne || 'Brak danych', 25, yPos + 7);
      
      // Dodaj rekomendacje leczenia, jeśli są dostępne
      if (treatmentData) {
        doc.addPage();
        
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.text('Rekomendacje Leczenia', 20, 20);
        
        // Farmakoterapia
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('Farmakoterapia:', 20, 35);
        
        doc.setFontSize(12);
        doc.setFont('helvetica', 'normal');
        let currentY = 42;
        
        if (treatmentData.Farmakoterapia && treatmentData.Farmakoterapia.length > 0) {
          treatmentData.Farmakoterapia.forEach(item => {
            doc.text(`• ${item}`, 25, currentY);
            currentY += 7;
          });
          
          // Dodaj źródło farmakoterapii
          if (treatmentData.Źródło_Farmakoterapii) {
            currentY += 3;
            doc.setFont('helvetica', 'italic');
            const zrodloLines = doc.splitTextToSize(`Źródło: ${treatmentData.Źródło_Farmakoterapii}`, 160);
            doc.text(zrodloLines, 25, currentY);
            
            // Dodaj URL jako link, jeśli istnieje
            const url = extractUrl(treatmentData.Źródło_Farmakoterapii);
            if (url) {
              const linkWidth = doc.getStringUnitWidth(url) * doc.internal.getFontSize() / doc.internal.scaleFactor;
              doc.link(25, currentY - 5, linkWidth, 10, { url });
            }
            
            currentY += (zrodloLines.length * 6) + 3;
          }
        } else {
          doc.text(`• Brak danych o farmakoterapii`, 25, currentY);
          currentY += 7;
        }
        
        // Zalecenia niefarmakologiczne
        currentY += 5;
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('Zalecenia niefarmakologiczne:', 20, currentY);
        currentY += 7;
        
        doc.setFontSize(12);
        doc.setFont('helvetica', 'normal');
        
        if (treatmentData.Zalecenia_Niefarmakologiczne && treatmentData.Zalecenia_Niefarmakologiczne.length > 0) {
          treatmentData.Zalecenia_Niefarmakologiczne.forEach(item => {
            doc.text(`• ${item}`, 25, currentY);
            currentY += 7;
          });
          
          // Dodaj źródło zaleceń niefarmakologicznych
          if (treatmentData.Źródło_Zaleceń_Niefarmakologicznych) {
            currentY += 3;
            doc.setFont('helvetica', 'italic');
            const zrodloLines = doc.splitTextToSize(`Źródło: ${treatmentData.Źródło_Zaleceń_Niefarmakologicznych}`, 160);
            doc.text(zrodloLines, 25, currentY);
            
            // Dodaj URL jako link, jeśli istnieje
            const url = extractUrl(treatmentData.Źródło_Zaleceń_Niefarmakologicznych);
            if (url) {
              const linkWidth = doc.getStringUnitWidth(url) * doc.internal.getFontSize() / doc.internal.scaleFactor;
              doc.link(25, currentY - 5, linkWidth, 10, { url });
            }
            
            currentY += (zrodloLines.length * 6) + 3;
          }
        } else {
          doc.text(`• Brak danych o zaleceniach niefarmakologicznych`, 25, currentY);
          currentY += 7;
        }
        
        // Charakterystyka leku
        if (treatmentData.Charakterystyka_Leku && treatmentData.Charakterystyka_Leku.Nazwa) {
          // Sprawdzenie czy jest miejsce na kolejnej stronie
          if (currentY > 240) {
            doc.addPage();
            currentY = 20;
          } else {
            currentY += 10;
          }
          
          doc.setFontSize(14);
          doc.setFont('helvetica', 'bold');
          doc.text(`Charakterystyka leku: ${treatmentData.Charakterystyka_Leku.Nazwa}`, 20, currentY);
          currentY += 10;
          
          // Wskazania
          doc.setFontSize(12);
          doc.setFont('helvetica', 'bold');
          doc.text('Wskazania:', 25, currentY);
          currentY += 7;
          
          if (treatmentData.Charakterystyka_Leku.Wskazania && treatmentData.Charakterystyka_Leku.Wskazania.length > 0) {
            treatmentData.Charakterystyka_Leku.Wskazania.forEach(item => {
              doc.setFont('helvetica', 'normal');
              doc.text(`• ${item}`, 30, currentY);
              currentY += 7;
            });
          } else {
            doc.setFont('helvetica', 'normal');
            doc.text(`• Brak danych o wskazaniach`, 30, currentY);
            currentY += 7;
          }
          
          // Przeciwwskazania
          if (currentY > 240) {
            doc.addPage();
            currentY = 20;
          } else {
            currentY += 5;
          }
          
          doc.setFont('helvetica', 'bold');
          doc.text('Przeciwwskazania:', 25, currentY);
          currentY += 7;
          
          if (treatmentData.Charakterystyka_Leku.Przeciwwskazania && treatmentData.Charakterystyka_Leku.Przeciwwskazania.length > 0) {
            treatmentData.Charakterystyka_Leku.Przeciwwskazania.forEach(item => {
              doc.setFont('helvetica', 'normal');
              doc.text(`• ${item}`, 30, currentY);
              currentY += 7;
            });
          } else {
            doc.setFont('helvetica', 'normal');
            doc.text(`• Brak danych o przeciwwskazaniach`, 30, currentY);
            currentY += 7;
          }
          
          // Interakcje
          if (currentY > 240) {
            doc.addPage();
            currentY = 20;
          } else {
            currentY += 5;
          }
          
          doc.setFont('helvetica', 'bold');
          doc.text('Interakcje:', 25, currentY);
          currentY += 7;
          
          if (treatmentData.Charakterystyka_Leku.Interakcje && treatmentData.Charakterystyka_Leku.Interakcje.length > 0) {
            treatmentData.Charakterystyka_Leku.Interakcje.forEach(item => {
              doc.setFont('helvetica', 'normal');
              doc.text(`• ${item}`, 30, currentY);
              currentY += 7;
            });
          } else {
            doc.setFont('helvetica', 'normal');
            doc.text(`• Brak danych o interakcjach`, 30, currentY);
            currentY += 7;
          }
          
          // Źródło charakterystyki leku
          if (treatmentData.Charakterystyka_Leku.Źródło) {
            currentY += 3;
            doc.setFont('helvetica', 'italic');
            const zrodloLines = doc.splitTextToSize(`Źródło: ${treatmentData.Charakterystyka_Leku.Źródło}`, 155);
            doc.text(zrodloLines, 25, currentY);
            
            // Dodaj URL jako link, jeśli istnieje
            const url = extractUrl(treatmentData.Charakterystyka_Leku.Źródło);
            if (url) {
              const linkWidth = doc.getStringUnitWidth(url) * doc.internal.getFontSize() / doc.internal.scaleFactor;
              doc.link(25, currentY - 5, linkWidth, 10, { url });
            }
            
            currentY += (zrodloLines.length * 6) + 3;
          }
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

  return (
    <div>
      {renderError()}
      
      {diagnosisData && (
        <div className="result-grid">
          {/* Karta diagnozy głównej */}
          <div className="result-card diagnosis">
            <div className="result-header">
              <div className="result-title">
                <i className="fas fa-search-plus"></i> Diagnoza główna
              </div>
              <span className="badge badge-success">
                <i className="fas fa-check-circle"></i> Główna diagnoza
              </span>
            </div>
            <div className="result-body">
              <div className="result-section">
                <h3 className="list-item-title">{diagnosisData.Diagnoza_Główna}</h3>
                <p className="list-item-desc">
                  <strong>Uzasadnienie:</strong> {diagnosisData.Uzasadnienie_Diagnozy}
                </p>
              </div>
            </div>
          </div>

          {/* Karta diagnozy różnicowej */}
          <div className="result-card differential">
            <div className="result-header">
              <div className="result-title">
                <i className="fas fa-sitemap"></i> Diagnostyka różnicowa
              </div>
              <span className="badge badge-warning">
                <i className="fas fa-exclamation-triangle"></i> Diagnoza różnicowa
              </span>
            </div>
            <div className="result-body">
              <div className="result-section">
                <h3 className="list-item-title">{diagnosisData.Diagnoza_Różnicowa}</h3>
                <p className="list-item-desc">
                  <strong>Uzasadnienie:</strong> {diagnosisData.Uzasadnienie_Różnicowe}
                </p>
              </div>
            </div>
          </div>

          {/* Karta towarzystwa medycznego */}
          <div className="result-card treatment" style={{ gridColumn: '1/-1' }}>
            <div className="result-header">
              <div className="result-title">
                <i className="fas fa-book-medical"></i> Rekomendowane wytyczne
              </div>
            </div>
            <div className="result-body">
              <div className="result-section">
                <h3 className="list-item-title">Towarzystwo medyczne</h3>
                <p className="list-item-desc">
                  {diagnosisData.Towarzystwo_Medyczne}
                </p>
              </div>
            </div>
          </div>

          {/* Karty rekomendacji leczenia - wyświetlane tylko jeśli są dostępne */}
          {treatmentData && (
            <>
              {/* Karta farmakoterapii */}
              <div className="result-card treatment" style={{ gridColumn: '1/-1' }}>
                <div className="result-header">
                  <div className="result-title">
                    <i className="fas fa-pills"></i> Farmakoterapia
                  </div>
                </div>
                <div className="result-body">
                  <ul className="treatment-list">
                    {treatmentData.Farmakoterapia && treatmentData.Farmakoterapia.length > 0 
                      ? treatmentData.Farmakoterapia.map((item, index) => (
                          <li key={index}>{item}</li>
                        ))
                      : <li>Brak danych o farmakoterapii</li>
                    }
                  </ul>
                  {treatmentData.Źródło_Farmakoterapii && renderSource(treatmentData.Źródło_Farmakoterapii)}
                </div>
              </div>

              {/* Karta zaleceń niefarmakologicznych */}
              <div className="result-card treatment" style={{ gridColumn: '1/-1' }}>
                <div className="result-header">
                  <div className="result-title">
                    <i className="fas fa-heartbeat"></i> Zalecenia niefarmakologiczne
                  </div>
                </div>
                <div className="result-body">
                  <ul className="treatment-list">
                    {treatmentData.Zalecenia_Niefarmakologiczne && treatmentData.Zalecenia_Niefarmakologiczne.length > 0 
                      ? treatmentData.Zalecenia_Niefarmakologiczne.map((item, index) => (
                          <li key={index}>{item}</li>
                        ))
                      : <li>Brak danych o zaleceniach niefarmakologicznych</li>
                    }
                  </ul>
                  {treatmentData.Źródło_Zaleceń_Niefarmakologicznych && renderSource(treatmentData.Źródło_Zaleceń_Niefarmakologicznych)}
                </div>
              </div>

              {/* Karta charakterystyki leku */}
              {treatmentData.Charakterystyka_Leku && treatmentData.Charakterystyka_Leku.Nazwa && (
                <div className="result-card drug" style={{ gridColumn: '1/-1' }}>
                  <div className="result-header">
                    <div className="result-title">
                      <i className="fas fa-capsules"></i> Charakterystyka leku: {treatmentData.Charakterystyka_Leku.Nazwa}
                    </div>
                  </div>
                  <div className="result-body">
                    <div className="result-section">
                      <h4 className="result-section-title">Wskazania</h4>
                      <ul className="treatment-list drug">
                        {treatmentData.Charakterystyka_Leku.Wskazania && treatmentData.Charakterystyka_Leku.Wskazania.length > 0 
                          ? treatmentData.Charakterystyka_Leku.Wskazania.map((item, index) => (
                              <li key={index}>{item}</li>
                            ))
                          : <li>Brak danych o wskazaniach</li>
                        }
                      </ul>
                    </div>
                    
                    <div className="result-section">
                      <h4 className="result-section-title">Przeciwwskazania</h4>
                      <ul className="treatment-list drug">
                        {treatmentData.Charakterystyka_Leku.Przeciwwskazania && treatmentData.Charakterystyka_Leku.Przeciwwskazania.length > 0 
                          ? treatmentData.Charakterystyka_Leku.Przeciwwskazania.map((item, index) => (
                              <li key={index}>{item}</li>
                            ))
                          : <li>Brak danych o przeciwwskazaniach</li>
                        }
                      </ul>
                    </div>
                    
                    <div className="result-section">
                      <h4 className="result-section-title">Interakcje</h4>
                      <ul className="treatment-list drug">
                        {treatmentData.Charakterystyka_Leku.Interakcje && treatmentData.Charakterystyka_Leku.Interakcje.length > 0 
                          ? treatmentData.Charakterystyka_Leku.Interakcje.map((item, index) => (
                              <li key={index}>{item}</li>
                            ))
                          : <li>Brak danych o interakcjach</li>
                        }
                      </ul>
                    </div>
                    
                    {treatmentData.Charakterystyka_Leku.Źródło && (
                      <div className="result-section">
                        {renderSource(treatmentData.Charakterystyka_Leku.Źródło)}
                      </div>
                    )}
                  </div>
                </div>
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
