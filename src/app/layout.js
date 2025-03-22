import { Inter, Montserrat, Playfair_Display } from 'next/font/google';
import '../styles/globals.css';

// Konfiguracja fontów
const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const montserrat = Montserrat({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-montserrat'
});
const playfair = Playfair_Display({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-playfair'
});

export const metadata = {
  title: 'MedDiagnosis - Narzędzie diagnostyczne dla lekarzy',
  description: 'Aplikacja wspomagająca lekarzy w procesie diagnozy i rekomendacji leczenia.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="pl" className={`${inter.variable} ${montserrat.variable} ${playfair.variable}`}>
      <body>
        <header className="header">
          <div className="container">
            <div className="header-content">
              <div className="logo">
                <span className="logo-icon">⚕️</span>
                <span>MedDiagnosis</span>
              </div>
              <nav className="nav-links">
                <a href="#" className="nav-link active">Diagnostyka</a>
                <a href="#" className="nav-link">Historia</a>
                <a href="#" className="nav-link">Baza wiedzy</a>
                <a href="#" className="nav-link">Wsparcie</a>
              </nav>
            </div>
          </div>
        </header>

        <main className="container">
          {children}
        </main>

        <footer className="footer">
          <div className="container">
            <div className="footer-content">
              <div className="footer-logo">
                MedDiagnosis © 2025
              </div>
              <div className="footer-links">
                <a href="#" className="footer-link">Polityka prywatności</a>
                <a href="#" className="footer-link">Warunki użytkowania</a>
                <a href="#" className="footer-link">Kontakt</a>
              </div>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
