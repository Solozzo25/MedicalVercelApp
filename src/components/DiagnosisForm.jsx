'use client';

import { useState, useEffect, useRef } from 'react';

export default function DiagnosisForm({ onFormSubmit, isLoading }) {
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
  
  // State dla edycji chipów
  const [editingChip, setEditingChip] = useState({
    field: null,
    index: null,
    value: '',
    originalValue: ''
  });
  
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
      
      switch(field) {
        case 'symptoms':
          const newSymptomIndex = symptomChips.length;
          newChipsRef.current[field].add(newSymptomIndex);
          setSymptomChips(prev => [...prev, value]);
          setFormData(prev => ({ ...prev, symptoms: '' }));
          setTimeout(() => newChipsRef.current[field].delete(newSymptomIndex), 200);
          break;
        case 'physicalExam':
          const newPhysicalIndex = physicalExamChips.length;
          newChipsRef.current[field].add(newPhysicalIndex);
          setPhysicalExamChips(prev => [...prev, value]);
          setFormData(prev => ({ ...prev, physicalExam: '' }));
          setTimeout(() => newChipsRef.current[field].delete(newPhysicalIndex), 200);
          break;
        case 'additionalTests':
          const newTestsIndex = additionalTestsChips.length;
          newChipsRef.current[field].add(newTestsIndex);
          setAdditionalTestsChips(prev => [...prev, value]);
          setFormData(prev => ({ ...prev, additionalTests: '' }));
          setTimeout(() => newChipsRef.current[field].delete(newTestsIndex), 200);
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
    // Anuluj edycję jeśli usuwamy edytowany chip
    if (editingChip.field === field && editingChip.index === index) {
      setEditingChip({ field: null, index: null, value: '', originalValue: '' });
    }
  };

  // NOWA FUNKCJA: Rozpoczynanie edycji chipa
  const handleChipEdit = (index, field, currentValue) => {
    setEditingChip({
      field,
      index,
      value: currentValue,
      originalValue: currentValue
    });
  };

  // NOWA FUNKCJA: Zapisywanie edycji chipa
  const handleChipSave = () => {
    if (editingChip.value.trim()) {
      const { field, index, value } = editingChip;
      
      switch(field) {
        case 'symptoms':
          setSymptomChips(prev => prev.map((chip, i) => i === index ? value.trim() : chip));
          break;
        case 'physicalExam':
          setPhysicalExamChips(prev => prev.map((chip, i) => i === index ? value.trim() : chip));
          break;
        case 'additionalTests':
          setAdditionalTestsChips(prev => prev.map((chip, i) => i === index ? value.trim() : chip));
          break;
      }
    }
    setEditingChip({ field: null, index: null, value: '', originalValue: '' });
  };

  // NOWA FUNKCJA: Anulowanie edycji
  const handleChipCancel = () => {
    setEditingChip({ field: null, index: null, value: '', originalValue: '' });
  };

  // NOWA FUNKCJA: Obsługa klawiszy w trybie edycji
  const handleEditKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleChipSave();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      handleChipCancel();
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

  // NOWA FUNKCJA: Komponent dla renderowania chipów z edycją
  const ChipDisplay = ({ chips, field }) => (
    <>
      {chips.length > 0 && (
        <div className="chip-container-compact">
          {chips.map((chip, index) => (
            <div 
              key={`${field}-${index}-${chip}`} 
              className={`chip-compact ${newChipsRef.current[field].has(index) ? 'chip-new' : ''}`}
            >
              {editingChip.field === field && editingChip.index === index ? (
                <input
                  type="text"
                  value={editingChip.value}
                  onChange={(e) => setEditingChip(prev => ({ ...prev, value: e.target.value }))}
                  onKeyDown={handleEditKeyDown}
                  onBlur={handleChipSave}
                  className="chip-edit-input"
                  autoFocus
                  placeholder="Edytuj..."
                />
              ) : (
                <>
                  <span onDoubleClick={() => handleChipEdit(index, field, chip)}>
                    {chip}
                  </span>
                  <button
                    type="button"
                    className="chip-remove"
                    onClick={() => handleChipRemove(index, field)}
                    aria-label="Usuń"
                  >
                    <i className="fas fa-times"></i>
                  </button>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </>
  );

  return (
    <div className="diagnosis-form-container">
      <form onSubmit={handleSubmit}>
        {/* Górna sekcja - Wiek i Płeć */}
        <div className="form-top-row">
          <div className="form-group-compact">
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

          <div className="form-group-compact">
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

        {/* Środkowa sekcja - Objawy */}
        <div className="form-main-grid">
          <div className="form-group-compact">
            <label htmlFor="symptoms" className="form-label">
              Objawy podmiotowe
              <span className="form-hint">Podwójne kliknięcie = edycja</span>
            </label>
            <ChipDisplay chips={symptomChips} field="symptoms" />
            <textarea 
              id="symptoms" 
              name="symptoms" 
              className="form-textarea-compact" 
              placeholder="Opisz objaw i wciśnij Enter..."
              value={formData.symptoms}
              onChange={handleChange}
              onKeyDown={(e) => handleChipAdd(e, 'symptoms')}
              required={symptomChips.length === 0}
            ></textarea>
          </div>

          <div className="form-group-compact">
            <label htmlFor="physicalExam" className="form-label">
              Badanie przedmiotowe
              <span className="form-hint">Podwójne kliknięcie = edycja</span>
            </label>
            <ChipDisplay chips={physicalExamChips} field="physicalExam" />
            <textarea 
              id="physicalExam" 
              name="physicalExam" 
              className="form-textarea-compact" 
              placeholder="Wynik badania i wciśnij Enter..."
              value={formData.physicalExam}
              onChange={handleChange}
              onKeyDown={(e) => handleChipAdd(e, 'physicalExam')}
            ></textarea>
          </div>
        </div>

        {/* Dolna sekcja - Wyniki i Historia */}
        <div className="form-bottom-grid">
          <div className="form-group-compact">
            <label htmlFor="additionalTests" className="form-label">
              Wyniki badań
              <span className="form-hint">Podwójne kliknięcie = edycja</span>
            </label>
            <ChipDisplay chips={additionalTestsChips} field="additionalTests" />
            <textarea 
              id="additionalTests" 
              name="additionalTests" 
              className="form-textarea-compact" 
              placeholder="Wynik badania i wciśnij Enter..."
              value={formData.additionalTests}
              onChange={handleChange}
              onKeyDown={(e) => handleChipAdd(e, 'additionalTests')}
            ></textarea>
          </div>

          <div className="form-group-compact">
            <label htmlFor="medicalHistory" className="form-label">Historia medyczna</label>
            <textarea 
              id="medicalHistory" 
              name="medicalHistory" 
              className="form-textarea-compact" 
              placeholder="Istotne informacje z historii medycznej..."
              value={formData.medicalHistory}
              onChange={handleChange}
            ></textarea>
          </div>
        </div>

        {/* Przycisk submit */}
        <div className="form-submit-section">
          <button 
            type="submit" 
            className="btn btn-primary btn-lg btn-block"
            disabled={isLoading}
          >
            <i className="fas fa-search-plus"></i> 
            {isLoading ? 'Przetwarzanie...' : 'Przedstaw rekomendacje'}
          </button>
        </div>
      </form>
    </div>
  );
}