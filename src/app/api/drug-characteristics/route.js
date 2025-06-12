import { NextResponse } from 'next/server';
import axios from 'axios';

// Funkcja do pobrania charakterystyki pojedynczego leku
async function fetchSingleDrugCharacteristics(drugName, apiKey) {
  console.log(`🔍 Pobieranie charakterystyki dla: ${drugName}`);
  
  const systemPrompt = `Jesteś ekspertem od wyszukiwania i przetwarzania danych o lekach z oficjalnych źródeł.

Dla podanej substancji czynnej lub nazwy handlowej leku:

1. Sprawdź, czy jakikolwiek produkt leczniczy z tą substancją czynną jest obecnie zarejestrowany i dostępny w Polsce:
   - Jeśli TAK → przejdź dalej.
   - Jeśli NIE → zwróć informację w uproszczonej formie JSON.

2. Jeśli lek jest dostępny, pobierz dane z dwóch serwisów:

A. Rejestr Produktów Leczniczych – https://rejestrymedyczne.ezdrowie.gov.pl
Znajdź bezpośredni otwarty link do pliku PDF z charakterystyką produktu leczniczego (ChPL) w Polsce
Preferuj dokumenty z portalu rejestrymedyczne.ezdrowie.gov.pl lub urpl.gov.pl. Pomiń linki, które przekierowują na stronę główną. Podaj tylko link do działającego PDF.
   - substancję czynną
   - wskazania do stosowania
   - przeciwwskazania
   - specjalne ostrzeżenia i środki ostrożności (uwagi specjalne)
   - link do dokumentu

B. Refundacja – https://lekinfo24.pl
   - czy lek jest refundowany
   - poziom odpłatności
   - grupy pacjentów, którym przysługuje refundacja
   - dwa przykładowe preparaty handlowe
   - link do otwartej strony z danymi (pomijaj przekierowania i niedziałające linki).

WAŻNE:
- Nie twórz ani nie generuj linków samodzielnie – podawaj tylko **prawdziwe, otwarte linki**, szczególnie **do plików PDF**.
- Jeśli to możliwe, preferuj wyszukiwanie dokumentów typu PDF dostępnych publicznie (np. poprzez Google cache, publiczne repozytoria lub linki kończące się na .pdf).
- Jeśli nie możesz znaleźć działającego linku do dokumentu, nie podawaj go wcale.`;

  const userPrompt = `Sprawdź charakterystykę i refundację dla leku: ${drugName}

Zwróć dane w jednym z dwóch formatów JSON:

Jeśli lek jest dostępny:
{
  "lek": "${drugName}",
  "status": "dostępny",
  "chpl": {
    "substancja_czynna": "nazwa substancji czynnej",
    "wskazania": ["wskazanie 1", "wskazanie 2"],
    "przeciwwskazania": ["przeciwwskazanie 1", "przeciwwskazanie 2"],
    "uwagi_specjalne": ["uwaga 1", "uwaga 2"],
    "link": "https://rejestrymedyczne.ezdrowie.gov.pl/..."
  },
  "refundacja": {
    "refundowany": true,
    "odplatnosc": "30%",
    "grupy_pacjentow": ["grupa 1", "grupa 2"],
    "przykladowy_preparat": ["NAZWA_HANDLOWA1", "NAZWA_HANDLOWA2"],
    "link": "https://lekinfo24.pl/..."
  }
}

Jeśli lek jest niedostępny:
{
  "lek": "${drugName}",
  "status": "niedostępny",
  "uwagi": "Krótki powód niedostępności"
}`;

  try {
    const response = await axios.post(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        model: "perplexity/sonar-pro", // Model z dostępem do internetu
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        temperature: 0.1, // Bardzo niska temperatura dla precyzyjnych danych
        max_tokens: 1500
      },
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'http://localhost:3000',
          'X-Title': 'MedDiagnosis App'
        }
      }
    );

    const responseContent = response.data.choices[0].message.content;
    console.log(`✅ Otrzymano odpowiedź dla ${drugName}`);
    
    // Parsowanie odpowiedzi
    let parsedResponse;
    try {
      // Wyczyść markdown jeśli istnieje
		let cleanedContent = responseContent;
		if (responseContent.includes('```')) {
		  cleanedContent = responseContent
			.replace(/^```json\s*\n?/m, '')
			.replace(/\n?```\s*$/m, '')
			.trim();
		}
parsedResponse = JSON.parse(cleanedContent);
    } catch (e) {
      // Próba wyekstraktowania JSON
      const jsonMatch = responseContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsedResponse = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("Nie udało się sparsować odpowiedzi");
      }
    }

    return parsedResponse;

  } catch (error) {
    console.error(`❌ Błąd dla leku ${drugName}:`, error.message);
    
    // Zwróć błąd jako niedostępny lek
    return {
      lek: drugName,
      status: "błąd",
      uwagi: `Błąd pobierania danych: ${error.message}`
    };
  }
}

export async function POST(request) {
  console.log("🔄 Funkcja drug-characteristics została wywołana");
  
  try {
    // Parsowanie danych wejściowych
    const { drugs } = await request.json();
    
    console.log("📋 Lista leków do sprawdzenia:", drugs);
    
    if (!drugs || !Array.isArray(drugs) || drugs.length === 0) {
      return NextResponse.json({ 
        error: 'Brak listy leków do sprawdzenia' 
      }, { status: 400 });
    }

    // Klucz API
    const apiKey = process.env.OPENROUTER_API_KEY;
    
    if (!apiKey) {
      console.log("❌ Błąd: Brak klucza API OpenRouter");
      return NextResponse.json({ 
        error: 'Błąd konfiguracji API' 
      }, { status: 500 });
    }

    console.log(`🔄 Rozpoczynam pobieranie charakterystyk dla ${drugs.length} leków...`);
    
    // Pobierz charakterystyki dla wszystkich leków równolegle
    const characteristicsPromises = drugs.map(drug => 
      fetchSingleDrugCharacteristics(drug, apiKey)
    );
    
    // Czekaj na wszystkie odpowiedzi
    const characteristics = await Promise.all(characteristicsPromises);
    
    console.log("✅ Pobrano wszystkie charakterystyki");
    
    // Podsumowanie
    const summary = {
      total: characteristics.length,
      dostępne: characteristics.filter(c => c.status === "dostępny").length,
      niedostępne: characteristics.filter(c => c.status === "niedostępny").length,
      błędy: characteristics.filter(c => c.status === "błąd").length
    };
    
    console.log("📊 Podsumowanie:", summary);
    
    return NextResponse.json({
      characteristics,
      summary
    }, { status: 200 });

  } catch (error) {
    console.error("❌ Błąd główny:", error);
    
    return NextResponse.json({ 
      error: 'Wystąpił błąd podczas pobierania charakterystyk',
      details: error.message
    }, { status: 500 });
  }
}
