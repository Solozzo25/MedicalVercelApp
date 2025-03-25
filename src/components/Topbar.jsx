'use client';

import UserProfile from './UserProfile';

export default function Topbar() {
  return (
    <div className="topbar">
      <div className="page-title">
        <h1>Asystent diagnozy</h1>
        <p>Otrzymaj propozycję diagnozy i rekomendacje leczenia na podstawie danych klinicznych</p>
      </div>
      
      <div className="user-actions">
        <button className="action-btn" title="Pomoc">
          <i className="fas fa-question-circle"></i>
        </button>
        <button className="action-btn" title="Ustawienia">
          <i className="fas fa-cog"></i>
        </button>
        <UserProfile />
      </div>
    </div>
  );
}
