'use client';

import { useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import Topbar from '../components/Topbar';
import TabContainer from '../components/TabContainer';

export default function Home() {
  useEffect(() => {
    // Skrypty aktywujące funkcjonalności po załadowaniu strony
    const handleTabClick = (event) => {
      const targetTabId = event.currentTarget.getAttribute('data-tab');
      
      // Usuwanie klasy 'active' ze wszystkich zakładek
      document.querySelectorAll('.tab').forEach(tab => {
        tab.classList.remove('active');
      });
      
      // Usuwanie klasy 'active' ze wszystkich zawartości zakładek
      document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
      });
      
      // Dodawanie klasy 'active' do klikniętej zakładki i jej zawartości
      event.currentTarget.classList.add('active');
      document.getElementById(targetTabId)?.classList.add('active');
    };

    // Dodawanie event listenerów do zakładek
    document.querySelectorAll('.tab').forEach(tab => {
      tab.addEventListener('click', handleTabClick);
    });

    // Czyszczenie event listenerów przy odmontowaniu komponentu
    return () => {
      document.querySelectorAll('.tab').forEach(tab => {
        tab.removeEventListener('click', handleTabClick);
      });
    };
  }, []); // Pusta tablica zależności - efekt uruchamiany tylko przy montowaniu komponentu

  return (
    <div style={{ display: 'flex' }}>
      <Sidebar />
      
      <main className="main-content">
        <Topbar />
        
        <div className="content-container">
          <TabContainer />
        </div>
      </main>
    </div>
  );
}
