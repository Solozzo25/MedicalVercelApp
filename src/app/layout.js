import { Inter, Manrope } from 'next/font/google';
import '../styles/globals.css';

// Konfiguracja fontów
const inter = Inter({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-inter'
});

const manrope = Manrope({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-manrope'
});

export const metadata = {
  title: 'MedDiagnosis - Wsparcie diagnostyczne',
  description: 'Aplikacja wspomagająca lekarzy w procesie diagnozy i rekomendacji leczenia.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="pl" className={`${inter.variable} ${manrope.variable}`}>
      <head>
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />
      </head>
      <body>
        {children}
      </body>
    </html>
  );
}
