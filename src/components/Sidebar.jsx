'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function Sidebar() {
  const [sidebarActive, setSidebarActive] = useState(false);

  const toggleSidebar = () => {
    setSidebarActive(!sidebarActive);
  };

  return (
    <aside className={`sidebar ${sidebarActive ? 'active' : ''}`}>
      <div className="sidebar-brand">
        <div className="logo-icon">
          <i className="fas fa-heartbeat"></i>
        </div>
        <span className="logo-text">MedDiagnosis</span>
      </div>
      
      <ul className="sidebar-menu">
        <li>
          <Link href="#" className="active">
            <i className="fas fa-stethoscope"></i>
            <span>Rekomendacje leczenia</span>
          </Link>
        </li>
        <li>
          <Link href="#">
            <i className="fas fa-history"></i>
            <span>Historia</span>
          </Link>
        </li>
        <li>
          <Link href="#">
            <i className="fas fa-question-circle"></i>
            <span>Pomoc</span>
          </Link>
        </li>
      </ul>
      
      <div className="sidebar-footer">
        MedDiagnosis © 2025
      </div>
    </aside>
  );
}
