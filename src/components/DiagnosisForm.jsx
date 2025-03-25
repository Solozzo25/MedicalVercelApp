'use client';

import { useState } from 'react';

export default function DiagnosisForm({ onFormSubmit, isLoading }) {
  const [formData, setFormData] = useState({
    age: '',
    sex: '',
    symptoms: '',
    physicalExam: '',
    additionalTests: '',
    medicalHistory: ''
  });

  const handleChange = (e) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onFormSubmit({
      age: formData.age,
      sex: formData.sex,
      symptoms: formData.symptoms,
      physicalExam: formData.physicalExam,
      additionalTests: formData.additionalTests,
      medicalHistory: formData.medicalHistory
    });
  };

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
        <label htmlFor="symptoms" className="form-label">Objawy podmiotowe</label>
        <textarea 
          id="symptoms" 
          name="symptoms" 
          className="form-textarea" 
          placeholder="Opisz objawy zgłaszane przez pacjenta. Np. ból głowy, gorączka, kaszel..."
          value={formData.symptoms}
          onChange={handleChange}
          required
        ></textarea>
      </div>

      <div className="form-group">
        <label htmlFor="physicalExam" className="form-label">Badanie przedmiotowe</label>
        <textarea 
          id="physicalExam" 
          name="physicalExam" 
          className="form-textarea" 
          placeholder="Wyniki badania przedmiotowego. Np. osłuchowo trzeszczenia u podstawy płuc, temp. 38,2°C..."
          value={formData.physicalExam}
          onChange={handleChange}
        ></textarea>
      </div>

      <div className="form-group">
        <label htmlFor="additionalTests" className="form-label">Wyniki badań</label>
        <textarea 
          id="additionalTests" 
          name="additionalTests" 
          className="form-textarea" 
          placeholder="Wyniki badań laboratoryjnych, obrazowych i innych. Np. CRP 24 mg/l, RTG klatki piersiowej..."
          value={formData.additionalTests}
          onChange={handleChange}
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
          disabled={isLoading}
        >
          <i className="fas fa-search-plus"></i> {isLoading ? 'Przetwarzanie...' : 'Przedstaw rekomendacje'}
        </button>
      </div>
    </form>
  );
}
