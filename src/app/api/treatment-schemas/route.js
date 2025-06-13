import { NextResponse } from 'next/server';

// Konfiguracja Vercel
export const maxDuration = 40; // 60 sekund
export const dynamic = 'force-dynamic';

// Funkcja do czyszczenia i walidacji JSON
function cleanAndParseJSON(rawResponse) {
  try {
    // Krok 1: Usuń markdown wrapping jeśli istnieje
    let cleanedContent = rawResponse.trim();
    if (cleanedContent.includes('```')) {
      cleanedContent = cleanedContent
        .replace(/^```json\s*\n?/m, '')
        .replace(/\n?```\s*$/m, '')
        .trim();
    }
    
    // Krok 2: Spróbuj bezpośredniego parsowania
    try {
      return JSON.parse(cleanedContent);
    } catch (directParseError) {
      console.log("❌ Bezpośrednie parsowanie nieudane, próbuję naprawić JSON...");
      
      // Krok 3: Napraw typowe problemy z JSON
      let fixedContent = cleanedContent
        // Napraw znaki nowej linii i tabulatory
        .replace(/\n/g, '\\n')
        .replace(/\r/g, '\\r')
        .replace(/\t/g, '\\t')
        // Usuń potencjalne dodatkowe przecinki
        .replace(/,(\s*[}\]])/g, '$1');
      
      // Krok 4: Spróbuj ponownie po naprawie
      try {
        return JSON.parse(fixedContent);
      } catch (fixedParseError) {
        // Krok 5: Jeśli nadal nie działa, spróbuj ekstrakcji JSON
        const jsonMatch = cleanedContent.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const extractedJson = jsonMatch[0];
          // Powtórz proces naprawy dla wyekstraktowanego JSON
          const fixedExtracted = extractedJson
            .replace(/\n/g, '\\n')
            .replace(/\r/g, '\\r')
            .replace(/\t/g, '\\t')
            .replace(/,(\s*[}\]])/g, '$1');
          
          return JSON.parse(fixedExtracted);
        }
        
        // Jeśli wszystko zawiedzie, rzuć błąd
        throw new Error(`Nie udało się naprawić JSON: ${fixedParseError.message}`);
      }
    }
  } catch (error) {
    console.error("❌ Błąd podczas czyszczenia JSON:", error);
    throw error;
  }
}

// Funkcja do walidacji struktury odpowiedzi
function validateTreatmentResponse(parsedResponse) {
  const errors = [];
  
  if (!parsedResponse.choroba) {
    errors.push("Brak pola 'choroba'");
  }
  
  if (!parsedResponse.linie_leczenia || !Array.isArray(parsedResponse.linie_leczenia)) {
    errors.push("Brak lub niepoprawne pole 'linie_leczenia'");
  } else if (parsedResponse.linie_leczenia.length === 0) {
    errors.push("Puste pole 'linie_leczenia'");
  }
  
  if (!parsedResponse.leczenie_niefarmakologiczne) {
    errors.push("Brak pola 'leczenie_niefarmakologiczne'");
  }
  
  // Walidacja każdej linii leczenia
  if (parsedResponse.linie_leczenia) {
    parsedResponse.linie_leczenia.forEach((linia, index) => {
      if (!linia.nazwa_linii) {
        errors.push(`Linia ${index + 1}: Brak nazwy linii`);
      }
      if (!linia.schematy_farmakologiczne || !Array.isArray(linia.schematy_farmakologiczne)) {
        errors.push(`Linia ${index + 1}: Brak schematów farmakologicznych`);
      }
    });
  }
  
  return errors;
}

export async function POST(request) {
  console.log("🔄 Funkcja treatment-schemas została wywołana");
  
  try {
    // Parsowanie danych wejściowych
    const reqData = await request.json();
    const { diagnosis, medicalSociety, patientAge, patientSex } = reqData;
    
    console.log("📋 Otrzymane dane:", { 
      diagnosis, 
      medicalSociety, 
      patientAge, 
      patientSex 
    });

    // Sprawdzenie wymaganych pól
    if (!diagnosis) {
      console.log("❌ Błąd: Brakująca diagnoza");
      return NextResponse.json({ 
        error: 'Brakujące pole: diagnoza' 
      }, { status: 400 });
    }

    if (!patientAge || !patientSex) {
      console.log("❌ Błąd: Brakujące dane pacjenta");
      return NextResponse.json({ 
        error: 'Brakujące pola: wiek lub płeć pacjenta' 
      }, { status: 400 });
    }

    // Klucz API z zmiennych środowiskowych
    const apiKey = process.env.OPENROUTER_API_KEY;
    
    if (!apiKey) {
      console.log("❌ Błąd: Brak klucza API OpenRouter w zmiennych środowiskowych");
      return NextResponse.json({ 
        error: 'Błąd konfiguracji API - brak klucza OpenRouter' 
      }, { status: 500 });
    }

    // System prompt - ORYGINALNY z minimalnymi dodatkami technicznymi
    const systemPrompt = `Jesteś ekspertem medycznym specjalizującym się w wyszukiwaniu i analizie najnowszych wytycznych terapeutycznych oraz farmakoterapii. Twoim zadaniem jest tworzenie dokładnych, aktualnych i praktycznych rekomendacji leczenia na podstawie wiarygodnych źródeł medycznych dostępnych w internecie.

Kieruj się następującymi zasadami:
1. Szukaj wyłącznie w wiarygodnych źródłach:
   - Oficjalne wytyczne towarzystw medycznych
   - Redakcje medyczne (np. Medycyna Praktyczna, Termedia)
   - Badania naukowe (np. PubMed)
2. Preferuj dokumenty nie starsze niż 3 lata. Jeśli nie ma aktualnych danych, jasno to zaznacz.
3. Uwzględniaj minimum trzy linie leczenia. Dla każdej linii podaj nazwę i opis (np. wskazania do jej zastosowania). Jeśli nie możesz znaleźć trzech linii, podaj tyle, ile jest dostępnych, i zaznacz to w uwagach.
4. Dla każdej linii leczenia przedstaw minimum trzy schematy farmakologiczne. Jeśli nie ma trzech schematów, podaj dostępne i zaznacz brak w uwagach.
5. Stosuj nazwy handlowe leków (np. Omeprazol, nie grupy ogólne).
6. Dla każdego leku podaj:
   - Konkretne dawkowanie,
   - Minimum 2 alternatywy z opisem różnic (jeśli istnieją). Jeśli nie ma alternatyw, zaznacz to.
7. Przedstaw przynajmniej 6 zaleceń niefarmakologicznych w formie bezosobowej (np. "Zaleca się").
8. Podawaj pełne URL-e do źródeł, które są publicznie dostępne i możliwe do otwarcia przez użytkownika.
9. Bazuj odpowiedzi wyłącznie na znalezionych źródłach. Nie dodawaj własnych interpretacji ani nie wymyślaj informacji.
10. Jeśli nie możesz znaleźć wystarczającej ilości informacji, jasno to zaznacz w uwagach.
11. Odpowiedź zawsze przedstaw w JSON w dokładnym formacie opisanym przez użytkownika.

UWAGA TECHNICZNA: W JSON-ie unikaj znaków nowej linii w stringach - zastąp je spacjami. Upewnij się, że wszystkie cudzysłowy wewnątrz stringów są prawidłowo escapowane.`;

    const userPrompt = `Wyszukaj najnowsze wytyczne leczenia dla choroby: ${diagnosis}
${medicalSociety ? `Preferuj wytyczne z: ${medicalSociety}` : ''}

WAŻNE:
- Uwzględnij minimum trzy linie leczenia, każda z nazwą i opisem (np. wskazania do jej zastosowania).
- Dla każdej linii leczenia podaj minimum trzy schematy farmakologiczne opisane w wiarygodnych źródłach medycznych.
- Leki podawaj **tylko jeśli są zarejestrowane i dostępne w Polsce**.
- Dla każdego leku podaj MINIMUM 2 alternatywy (jeśli istnieją), wraz z opisem różnic.
- Zalecenia niefarmakologiczne przedstaw w formie bezosobowej (np. "Zaleca się", "Należy unikać").
- Podawaj pełne URL-e do źródeł, które są publicznie dostępne i możliwe do otwarcia.
- Jeśli nie możesz znaleźć wymaganej ilości informacji, jasno to zaznacz w uwagach.

Format odpowiedzi - MUSI być dokładnie w tym formacie JSON:
{
  "choroba": "${diagnosis}",
  "linie_leczenia": [
    {
      "numer_linii": "numer linii",
      "nazwa_linii": "Nazwa pierwszej linii leczenia",
      "opis_linii": "Opis pierwszej linii leczenia",
      "schematy_farmakologiczne": [
        {
          "schemat_farmakologiczny": "Nazwa schematu farmakologicznego",
          "opis_schematu_farmakologicznego": "Szczegółowy opis schematu",
          "leki": [
            {
              "nazwa": "Nazwa leku",
              "typ": "Typ/grupa leku",
              "dawkowanie": "Szczegółowe dawkowanie",
              "alternatywy": [
                {
                  "nazwa": "Nazwa alternatywnego leku",
                  "różnice": "Opis różnic"
                },
                {
                  "nazwa": "Nazwa drugiej alternatywy",
                  "różnice": "Opis różnic"
                }
              ]
            }
          ],
          "źródło": "Pełna nazwa źródła z pełnym URL-em"
        }
      ]
    }
  ],
  "leczenie_niefarmakologiczne": {
    "zalecenia": [
      "Zaleca się ..."
    ],
    "źródło": "Pełna nazwa źródła z pełnym URL-em"
  },
  "uwagi": "Uwagi, np. brak danych"
}`;

    console.log("📤 Wysyłanie zapytania do OpenRouter API...");
    
    // Wywołanie API OpenRouter z fetch
    const openRouterResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'http://localhost:3000',
        'X-Title': 'MedDiagnosis App'
      },
      body: JSON.stringify({
        model: "openai/gpt-4o-mini-search-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        temperature: 0.2,
        max_tokens: 6000, // Zmniejszone
        stream: false
        
      }),
      signal: AbortSignal.timeout(45000) // 45s timeout
    });
    
    console.log("✅ Odpowiedź od OpenRouter otrzymana, status:", openRouterResponse.status);

    // Sprawdzenie czy odpowiedź jest OK
    if (!openRouterResponse.ok) {
      const errorText = await openRouterResponse.text();
      console.error("❌ Błąd OpenRouter API:", openRouterResponse.status, errorText);
      return NextResponse.json({ 
        error: `Błąd OpenRouter API: ${openRouterResponse.status} - ${errorText}` 
      }, { status: 500 });
    }

    // Parsowanie odpowiedzi JSON
    const responseData = await openRouterResponse.json();
    
    // Bezpośrednio po otrzymaniu odpowiedzi, przed parsowaniem
    const responseContent = responseData.choices[0].message.content;

    console.log("🔍 DIAGNOSTYKA ODPOWIEDZI:");
    console.log("📏 Długość odpowiedzi:", responseContent.length);
    console.log("🎯 Pozycja 8233:", responseContent.charAt(8233));
    console.log("📍 Kontekst wokół 8233:", responseContent.slice(8223, 8243));
    console.log("✅ Czy kończy się '}':", responseContent.trim().endsWith('}'));
    console.log("✅ Czy zaczyna się '{':", responseContent.trim().startsWith('{'));
    console.log("📝 Pierwsze 200 znaków:", responseContent.substring(0, 200));
    console.log("📝 Ostatnie 200 znaków:", responseContent.slice(-200));

    // Sprawdź czy to JSON w ogóle
    try {
      const testParse = JSON.parse(responseContent);
      console.log("✅ JSON jest poprawny!");
    } catch (error) {
      console.log("❌ JSON niepoprawny:", error.message);
      console.log("❌ Pozycja błędu:", error.message.match(/position (\d+)/)?.[1]);
    }

    // Parsowanie odpowiedzi z ulepszoną obsługą błędów
    let parsedResponse;
    try {
      parsedResponse = cleanAndParseJSON(responseContent);
      console.log("✅ Pomyślnie sparsowano JSON");
    } catch (parseError) {
      console.error("❌ Błąd parsowania JSON po wszystkich próbach naprawy:", parseError);
      
      return NextResponse.json({ 
        error: "Nie udało się przetworzyć odpowiedzi AI. Spróbuj ponownie z prostszą diagnozą.",
        details: parseError.message,
        rawResponse: responseContent.substring(0, 1000) // Pierwsze 1000 znaków do debugowania
      }, { status: 500 });
    }

    // Walidacja struktury odpowiedzi
    const validationErrors = validateTreatmentResponse(parsedResponse);
    if (validationErrors.length > 0) {
      console.log("⚠️ Błędy walidacji:", validationErrors);
      return NextResponse.json({ 
        error: "Niekompletna odpowiedź AI",
        validationErrors,
        data: parsedResponse
      }, { status: 207 });
    }

    console.log("✅ Struktura odpowiedzi poprawna");
    console.log("📊 Liczba linii leczenia:", parsedResponse.linie_leczenia.length);
    
    // Logowanie statystyk
    parsedResponse.linie_leczenia.forEach((linia, index) => {
      console.log(`📊 Linia ${index + 1}: ${linia.nazwa_linii}`);
      console.log(`   - Liczba schematów: ${linia.schematy_farmakologiczne?.length || 0}`);
      
      if (linia.schematy_farmakologiczne) {
        linia.schematy_farmakologiczne.forEach((schemat, schematIndex) => {
          console.log(`   - Schemat ${schematIndex + 1}: ${schemat.schemat_farmakologiczny}`);
          console.log(`     - Liczba leków: ${schemat.leki?.length || 0}`);
        });
      }
    });
    
    // Logowanie wszystkich leków do ekstrakcji
    const allDrugs = [];
    parsedResponse.linie_leczenia.forEach(linia => {
      if (linia.schematy_farmakologiczne) {
        linia.schematy_farmakologiczne.forEach(schemat => {
          if (schemat.leki) {
            schemat.leki.forEach(lek => {
              allDrugs.push(lek.nazwa);
              if (lek.alternatywy) {
                lek.alternatywy.forEach(alt => allDrugs.push(alt.nazwa));
              }
            });
          }
        });
      }
    });
    
    console.log("💊 Wszystkie leki do sprawdzenia:", allDrugs);
    console.log("💊 Łączna liczba leków:", allDrugs.length);

    // Sprawdzenie uwag
    if (parsedResponse.uwagi) {
      console.log("📝 Uwagi:", parsedResponse.uwagi);
    }

    return NextResponse.json(parsedResponse, { status: 200 });

  } catch (error) {
    console.error("❌ Błąd podczas komunikacji z API:", error);
    
    let errorMessage = 'Wystąpił błąd podczas przetwarzania zapytania';
    let errorDetails = {};
    
    if (error.name === 'TimeoutError') {
      errorMessage = 'Przekroczono limit czasu oczekiwania na odpowiedź z API';
      errorDetails = { timeout: true };
    } else if (error.cause && error.cause.code === 'FETCH_ERROR') {
      errorMessage = 'Błąd połączenia z OpenRouter API';
      errorDetails = { networkError: true };
    } else {
      errorDetails = { message: error.message };
    }
    
    return NextResponse.json({ 
      error: errorMessage,
      details: errorDetails
    }, { status: 500 });
  }
}