import { NextResponse } from 'next/server';

// Konfiguracja Vercel
export const maxDuration = 60; // 60 sekund
export const dynamic = 'force-dynamic';

// Funkcja do pobierania charakterystyki pojedynczego leku
async function fetchSingleDrugCharacteristics(drugName, apiKey) {
  console.log(`🔍 Pobieranie pełnej charakterystyki dla: ${drugName}`);
  
  const systemPrompt = `Jesteś ekspertem od wyszukiwania charakterystyk produktów leczniczych z oficjalnych źródeł polskich`;

  const userPrompt = `Wyszukaj pełną charakterystykę produktu leczniczego dla: ${drugName}

WYMAGANIA:
1. Znajdź oficjalną charakterystykę produktu leczniczego (ChPL) z rejestrymedyczne.ezdrowie.gov.pl lub urpl.gov.pl
2. Wyszukaj substancję czynną, wskazania, przeciwwskazania i uwagi specjalne
3. Znajdź bezpośredni link do pliku PDF z charakterystyką (końcówka .pdf)

STRUKTURA ODPOWIEDZI:
{
  "lek": "${drugName}",
  "status": "dostępny",
  "substancja_czynna": "nazwa substancji czynnej",
  "wskazania": [
    "Wskazanie 1 - szczegółowy opis",
    "Wskazanie 2 - szczegółowy opis",
    "Wskazanie 3 - szczegółowy opis"
  ],
  "przeciwwskazania": [
    "Przeciwwskazanie 1 - szczegółowy opis", 
    "Przeciwwskazanie 2 - szczegółowy opis",
    "Przeciwwskazanie 3 - szczegółowy opis"
  ],
  "uwagi_specjalne": [
    "Uwaga specjalna 1 - środki ostrożności",
    "Uwaga specjalna 2 - ostrzeżenia", 
    "Uwaga specjalna 3 - interakcje"
  ],
  "pdf_link": "https://rejestrymedyczne.ezdrowie.gov.pl/api/rpl/medicinal-products/12345/leaflet"
}

JEŚLI BRAK DANYCH:
{
  "lek": "${drugName}",
  "status": "niedostępny",
  "uwagi": "Powód niedostępności - np. brak rejestracji, wycofany z obrotu"
}

WAŻNE:
- Podawaj tylko prawdziwe, otwieralne linki do plików PDF
- Nie twórz fikcyjnych URL-i
- Preferuj dokumenty z portali rządowych (.gov.pl)
- Jeśli nie znajdziesz PDF, ustaw pdf_link jako null`;

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'http://localhost:3000',
        'X-Title': 'MedDiagnosis App'
      },
      body: JSON.stringify({
        model: "perplexity/sonar-pro",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        temperature: 0.1,
        max_tokens: 3000
      })
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} - ${response.statusText}`);
    }

    const responseData = await response.json();
    const responseContent = responseData.choices[0].message.content;
    
    console.log(`📄 Surowa odpowiedź dla ${drugName}:`, responseContent.substring(0, 200));
    
    // Parsowanie JSON z obsługą markdown
    let cleanedContent = responseContent;
    if (responseContent.includes('```')) {
      cleanedContent = responseContent
        .replace(/^```json\s*\n?/m, '')
        .replace(/\n?```\s*$/m, '')
        .trim();
    }
    
    const parsedResponse = JSON.parse(cleanedContent);
    
    // Walidacja odpowiedzi
    if (!parsedResponse.lek) {
      throw new Error('Brak nazwy leku w odpowiedzi');
    }
    
    return parsedResponse;

  } catch (error) {
    console.error(`❌ Błąd charakterystyki dla ${drugName}:`, error.message);
    
    return {
      lek: drugName,
      status: "błąd",
      uwagi: `Błąd pobierania charakterystyki: ${error.message}`,
      error: true,
      message: error.message
    };
  }
}

export async function POST(request) {
  console.log("🔄 Funkcja single-drug-characteristics została wywołana");
  
  try {
    const { drugName } = await request.json();
    
    console.log("💊 Lek do sprawdzenia:", drugName);
    
    if (!drugName || typeof drugName !== 'string' || !drugName.trim()) {
      return NextResponse.json({ 
        error: 'Brak nazwy leku lub niepoprawny format' 
      }, { status: 400 });
    }

    const apiKey = process.env.OPENROUTER_API_KEY;
    
    if (!apiKey) {
      console.log("❌ Błąd: Brak klucza API OpenRouter");
      return NextResponse.json({ 
        error: 'Błąd konfiguracji API' 
      }, { status: 500 });
    }

    console.log(`🔄 Rozpoczynam pobieranie charakterystyki dla: ${drugName.trim()}`);
    
    // Pobierz charakterystykę dla pojedynczego leku
    const characteristics = await fetchSingleDrugCharacteristics(drugName.trim(), apiKey);
    
    console.log("✅ Pobrano charakterystykę leku");
    
    // Sprawdź czy to błąd
    if (characteristics.error) {
      return NextResponse.json(characteristics, { status: 207 }); // 207 = Partial success
    }
    
    // Sprawdź czy lek jest dostępny
    if (characteristics.status !== 'dostępny') {
      console.log(`⚠️ Lek ${drugName} nie jest dostępny:`, characteristics.uwagi);
    }
    
    // Logowanie podsumowania
    if (characteristics.status === 'dostępny') {
      console.log(`📊 Podsumowanie dla ${drugName}:`, {
        substancja: characteristics.substancja_czynna,
        wskazania: characteristics.wskazania?.length || 0,
        przeciwwskazania: characteristics.przeciwwskazania?.length || 0,
        uwagi_specjalne: characteristics.uwagi_specjalne?.length || 0,
        pdf: !!characteristics.pdf_link
      });
    }
    
    return NextResponse.json(characteristics, { status: 200 });

  } catch (error) {
    console.error("❌ Błąd główny:", error);
    
    return NextResponse.json({ 
      error: 'Wystąpił błąd podczas pobierania charakterystyki',
      details: error.message,
      message: 'Spróbuj ponownie lub skontaktuj się z administratorem'
    }, { status: 500 });
  }
}