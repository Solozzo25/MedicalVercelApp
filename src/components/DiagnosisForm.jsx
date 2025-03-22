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
          <label htmlFor="age" className="form-label">Wiek</label>
          <input 
            type="number" 
            id="age" 
            name="age" 
            className="form-input" 
            value={formData.age}
            onChange={handleChange}
            required 
          />
        </div>

        <div className="form-group">
          <label htmlFor="sex" className="form-label">Płeć</label>
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
          placeholder="Opisz objawy zgłaszane przez pacjenta..."
          value={formData.symptoms}
          onChange={handleChange}
          required
        ></textarea>
      </div>

      <div className="form-group">
        <label htmlFor="physicalExam" className="form-label">Badanie przedmiotowe (opcjonalnie)</label>
        <textarea 
          id="physicalExam" 
          name="physicalExam" 
          className="form-textarea" 
          placeholder="Wprowadź wyniki badania przedmiotowego..."
          value={formData.physicalExam}
          onChange={handleChange}
        ></textarea>
      </div>

      <div className="form-group">
        <label htmlFor="additionalTests" className="form-label">Wyniki badań (opcjonalnie)</label>
        <textarea 
          id="additionalTests" 
          name="additionalTests" 
          className="form-textarea" 
          placeholder="Wprowadź wyniki badań laboratoryjnych, obrazowych i innych..."
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
          placeholder="Wprowadź istotne informacje z historii medycznej pacjenta..."
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
          {isLoading ? 'Przetwarzanie...' : 'Przedstaw rekomendacje'}
        </button>
      </div>
    </form>
  );
}
