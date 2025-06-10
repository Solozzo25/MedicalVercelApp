'use client';

import { useState, useEffect, useRef } from 'react';

export default function DiagnosisForm({ onFormSubmit }) {
  const [formData, setFormData] = useState({
    age: '',
    sex: '',
    symptoms: '',
    physicalExam: '',
    additionalTests: '',
    medicalHistory: ''
  });

  // State dla chipów
  const [symptomChips, setSymptomChips] = useState([]);
  const [physicalExamChips, setPhysicalExamChips] = useState([]);
  const [additionalTestsChips, setAdditionalTestsChips] = useState([]);
  
  // Ref do śledzenia nowo dodanych chipów
  const newChipsRef = useRef({
    symptoms: new Set(),
    physicalExam: new Set(),
    additionalTests: new Set()
  });

  const handleChange = (e) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  // Funkcja do dodawania chipa
  const handleChipAdd = (e, field) => {
    if (e.key === 'Enter' && e.target.value.trim()) {
      e.preventDefault();
      const value = e.target.value.trim();
      const newChipIndex = field === 'symptoms' ? symptomChips.length : 
                          field === 'physicalExam' ? physicalExamChips.length : 
                          additionalTestsChips.length;
      
      // Dodaj indeks nowego chipa do ref
      newChipsRef.current[field].add(newChipIndex);
      
      // Usuń klasę po animacji
      setTimeout(() => {
        newChipsRef.current[field].delete(newChipIndex);
      }, 200);
      
      switch(field) {
        case 'symptoms':
          setSymptomChips(prev => [...prev, value]);
          setFormData(prev => ({ ...prev, symptoms: '' }));
          break;
        case 'physicalExam':
          setPhysicalExamChips(prev => [...prev, value]);
          setFormData(prev => ({ ...prev, physicalExam: '' }));
          break;
        case 'additionalTests':
          setAdditionalTestsChips(prev => [...prev, value]);
          setFormData(prev => ({ ...prev, additionalTests: '' }));
          break;
      }
    }
  };

  // Funkcja do usuwania chipa
  const handleChipRemove = (index, field) => {
    switch(field) {
      case 'symptoms':
        setSymptomChips(prev => prev.filter((_, i) => i !== index));
        break;
      case 'physicalExam':
        setPhysicalExamChips(prev => prev.filter((_, i) => i !== index));
        break;
      case 'additionalTests':
        setAdditionalTestsChips(prev => prev.filter((_, i) => i !== index));
        break;
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Scalanie chipów z wartościami tekstowymi
    const mergedSymptoms = [
      ...symptomChips,
      formData.symptoms.trim()
    ].filter(Boolean).join(', ');

    const mergedPhysicalExam = [
      ...physicalExamChips,
      formData.physicalExam.trim()
    ].filter(Boolean).join(', ');

    const mergedAdditionalTests = [
      ...additionalTestsChips,
      formData.additionalTests.trim()
    ].filter(Boolean).join(', ');

    onFormSubmit({
      age: formData.age,
      sex: formData.sex,
      symptoms: mergedSymptoms,
      physicalExam: mergedPhysicalExam,
      additionalTests: mergedAdditionalTests,
      medicalHistory: formData.medicalHistory
    });
  };

  // Komponent dla renderowania chipów
  const ChipDisplay = ({ chips, field, placeholder }) => (
    <>
      {chips.length > 0 && (
        <div className="chip-container">
          {chips.map((chip, index) => (
            <div 
              key={`${field}-${index}-${chip}`} 
              className={`chip ${newChipsRef.current[field].has(index) ? 'chip-new' : ''}`}
            >
              <span>{chip}</span>
              <button
                type="button"
                className="chip-remove"
                onClick={() => handleChipRemove(index, field)}
                aria-label="Usuń"
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
          ))}
        </div>
      )}
    </>
  );

  return (
    <form id="diagnosis-form" onSubmit={handleSubmit}>
      <div className="form-grid">
        <div className="form-group">
          <label htmlFor="age" className="form-label">Wiek pacjenta</label>
          <input 
            type="number" 
            id="age" 
            name="age" 
            className="form-input" 
            placeholder="Np. 45"
            value={formData.age}
            onChange={handleChange}
            required 
          />
        </div>

        <div className="form-group">
          <label htmlFor="sex" className="form-label">Płeć pacjenta</label>
          <select 
            id="sex" 
            name="sex" 
            className="form-select" 
            value={formData.sex}
            onChange={handleChange}
            required
          >
            <option value="">Wybierz płeć</option>
            <option value="male">Mężczyzna</option>
            <option value="female">Kobieta</option>
            <option value="other">Inna</option>
          </select>
        </div>
      </div>

      <div className="form-group">
        <label htmlFor="symptoms" className="form-label">
          Objawy podmiotowe
          <span className="form-hint">Wciśnij Enter aby dodać objaw</span>
        </label>
        <ChipDisplay chips={symptomChips} field="symptoms" />
        <textarea 
          id="symptoms" 
          name="symptoms" 
          className="form-textarea form-textarea-small" 
          placeholder="Opisz objaw i wciśnij Enter. Np. ból głowy, gorączka, kaszel..."
          value={formData.symptoms}
          onChange={handleChange}
          onKeyDown={(e) => handleChipAdd(e, 'symptoms')}
          required={symptomChips.length === 0}
        ></textarea>
      </div>

      <div className="form-group">
        <label htmlFor="physicalExam" className="form-label">
          Badanie przedmiotowe
          <span className="form-hint">Wciśnij Enter aby dodać wynik badania</span>
        </label>
        <ChipDisplay chips={physicalExamChips} field="physicalExam" />
        <textarea 
          id="physicalExam" 
          name="physicalExam" 
          className="form-textarea form-textarea-small" 
          placeholder="Wynik badania i wciśnij Enter. Np. osłuchowo trzeszczenia u podstawy płuc..."
          value={formData.physicalExam}
          onChange={handleChange}
          onKeyDown={(e) => handleChipAdd(e, 'physicalExam')}
        ></textarea>
      </div>

      <div className="form-group">
        <label htmlFor="additionalTests" className="form-label">
          Wyniki badań
          <span className="form-hint">Wciśnij Enter aby dodać wynik badania</span>
        </label>
        <ChipDisplay chips={additionalTestsChips} field="additionalTests" />
        <textarea 
          id="additionalTests" 
          name="additionalTests" 
          className="form-textarea form-textarea-small" 
          placeholder="Wynik badania i wciśnij Enter. Np. CRP 24 mg/l, RTG klatki piersiowej..."
          value={formData.additionalTests}
          onChange={handleChange}
          onKeyDown={(e) => handleChipAdd(e, 'additionalTests')}
        ></textarea>
      </div>

      <div className="form-group">
        <label htmlFor="medicalHistory" className="form-label">Historia medyczna (opcjonalnie)</label>
        <textarea 
          id="medicalHistory" 
          name="medicalHistory" 
          className="form-textarea" 
          placeholder="Istotne informacje z historii medycznej pacjenta. Np. choroby przewlekłe, uczulenia..."
          value={formData.medicalHistory}
          onChange={handleChange}
        ></textarea>
      </div>

      <div className="form-group">
        <button 
          type="submit" 
          className="btn btn-primary btn-lg btn-block"
        >
          <i className="fas fa-search-plus"></i> Przedstaw rekomendacje
        </button>
      </div>
    </form>
  );
}