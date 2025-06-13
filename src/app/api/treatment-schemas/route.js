import { NextResponse } from 'next/server';

// Konfiguracja Vercel
export const maxDuration = 60; // 60 sekund
export const dynamic = 'force-dynamic';

// Funkcja do czyszczenia i walidacji JSON - pozostaje bez zmian
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
        .replace(/\n/g, '\\n')
        .replace(/\r/g, '\\r')
        .replace(/\t/g, '\\t')
        .replace(/,(\s*[}\]])/g, '$1');
      
      try {
        return JSON.parse(fixedContent);
      } catch (fixedParseError) {
        // Krok 5: Spróbuj ekstrakcji JSON
        const jsonMatch = cleanedContent.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const extractedJson = jsonMatch[0];
          const fixedExtracted = extractedJson
            .replace(/\n/g, '\\n')
            .replace(/\r/g, '\\r')
            .replace(/\t/g, '\\t')
            .replace(/,(\s*[}\]])/g, '$1');
          
          return JSON.parse(fixedExtracted);
        }
        
        throw new Error(`Nie udało się naprawić JSON: ${fixedParseError.message}`);
      }
    }
  } catch (error) {
    console.error("❌ Błąd podczas czyszczenia JSON:", error);
    throw error;
  }
}

// Funkcja do walidacji struktury odpowiedzi - pozostaje bez zmian
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

    // Klucz API OpenAI z zmiennych środowiskowych
    const apiKey = process.env.OPENAI_API_KEY;
    
    if (!apiKey) {
      console.log("❌ Błąd: Brak klucza API OpenAI w zmiennych środowiskowych");
      return NextResponse.json({ 
        error: 'Błąd konfiguracji API - brak klucza OpenAI' 
      }, { status: 500 });
    }

    // Uproszczony prompt - web search będzie automatyczny
    const userPrompt = `Wyszukaj najnowsze wytyczne leczenia dla choroby: ${diagnosis}
Preferuj wytyczne z: ${medicalSociety}

Dane pacjenta: wiek ${patientAge}, płeć ${patientSex}

WYMAGANIA:
- Znajdź oficjalne wytyczne medyczne z wiarygodnych źródeł (towarzystwa medyczne, Medycyna Praktyczna, PubMed)
- Minimum 3 linie leczenia, każda z nazwą i opisem wskazań
- Dla każdej linii minimum 3 schematy farmakologiczne z wiarygodnych źródeł
- Leki TYLKO zarejestrowane i dostępne w Polsce
- Dla każdego leku minimum 2 alternatywy (jeśli istnieją) z opisem różnic
- Konkretne dawkowanie dla wszystkich leków
- Minimum 6 zaleceń niefarmakologicznych w formie bezosobowej
- WAŻNE: Podawaj pełne, otwieralne URL-e do źródeł medycznych
- Jeśli brak wystarczających danych, zaznacz w uwagach

Format odpowiedzi - DOKŁADNIE ten JSON:
{
  "choroba": "${diagnosis}",
  "linie_leczenia": [
    {
      "numer_linii": "1",
      "nazwa_linii": "Nazwa pierwszej linii leczenia",
      "opis_linii": "Opis wskazań do pierwszej linii leczenia",
      "schematy_farmakologiczne": [
        {
          "schemat_farmakologiczny": "Nazwa schematu farmakologicznego",
          "opis_schematu_farmakologicznego": "Szczegółowy opis schematu i wskazań",
          "leki": [
            {
              "nazwa": "Nazwa leku",
              "typ": "Typ/grupa leku",
              "dawkowanie": "Szczegółowe dawkowanie z częstotliwością",
              "alternatywy": [
                {
                  "nazwa": "Nazwa alternatywnego leku",
                  "różnice": "Opis różnic w działaniu, dawkowaniu lub wskazaniach"
                },
                {
                  "nazwa": "Nazwa drugiej alternatywy",
                  "różnice": "Opis różnic w działaniu, dawkowaniu lub wskazaniach"
                }
              ]
            }
          ],
          "źródło": "Pełna nazwa źródła z działającym URL-em"
        }
      ]
    }
  ],
  "leczenie_niefarmakologiczne": {
    "zalecenia": [
      "Zaleca się pierwsze zalecenie",
      "Zaleca się drugie zalecenie",
      "Należy unikać trzeciego",
      "Wskazana jest czwarta aktywność",
      "Pomocne jest piąte działanie",
      "Konieczne jest szóste postępowanie"
    ],
    "źródło": "Pełna nazwa źródła z działającym URL-em"
  },
  "uwagi": "Ewentualne uwagi o braku danych lub ograniczeniach"
}`;

    console.log("📤 Wysyłanie zapytania do OpenAI Responses API...");
    
    // Wywołanie OpenAI Responses API z web_search tool
    const openAIResponse = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: "gpt-4o",
        input: userPrompt,
        tools: [{ 
		  "type": "web_search_preview",
		  "search_context_size": "high",  // Maksymalna głębokość dla medycyny
		  "user_location": {
			"type": "approximate",
			"country": "PL",
			"city": "Warsaw",
			"region": "Mazowieckie", 
			"timezone": "Europe/Warsaw"
		  }
		}],
        temperature: 0.2,
        max_completion_tokens: 8000
      })
    });
    
    console.log("✅ Odpowiedź od OpenAI otrzymana, status:", openAIResponse.status);

    // Sprawdzenie czy odpowiedź jest OK
    if (!openAIResponse.ok) {
      const errorText = await openAIResponse.text();
      console.error("❌ Błąd OpenAI API:", openAIResponse.status, errorText);
      return NextResponse.json({ 
        error: `Błąd OpenAI API: ${openAIResponse.status} - ${errorText}` 
      }, { status: 500 });
    }

    // Parsowanie odpowiedzi JSON
    const responseData = await openAIResponse.json();
    
    console.log("🔍 DIAGNOSTYKA ODPOWIEDZI:");
    console.log("📊 Status:", responseData.status);
    console.log("📊 Output type:", typeof responseData.output);
    console.log("📊 Output length:", responseData.output?.length || 0);
    
    // Wyciągnij content z output (Responses API ma inną strukturę)
    let responseContent;
    if (responseData.output && Array.isArray(responseData.output)) {
      // Znajdź message w output
      const messageOutput = responseData.output.find(item => item.type === 'message' || item.content);
      if (messageOutput && messageOutput.content) {
        if (Array.isArray(messageOutput.content)) {
          // Znajdź text content
          const textContent = messageOutput.content.find(item => item.type === 'text');
          responseContent = textContent?.text || '';
        } else if (typeof messageOutput.content === 'string') {
          responseContent = messageOutput.content;
        }
      }
    }
    
    if (!responseContent) {
      console.error("❌ Nie można wyekstraktować treści z odpowiedzi");
      console.log("📋 Cała odpowiedź:", JSON.stringify(responseData, null, 2));
      return NextResponse.json({ 
        error: "Nie można wyekstraktować treści z odpowiedzi OpenAI",
        rawResponse: responseData
      }, { status: 500 });
    }

    console.log("📏 Długość treści:", responseContent.length);
    console.log("📝 Pierwsze 200 znaków:", responseContent.substring(0, 200));
    console.log("📝 Ostatnie 200 znaków:", responseContent.slice(-200));

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
          if (schemat.źródło) {
            console.log(`     - Źródło: ${schemat.źródło}`);
          }
        });
      }
    });
    
    // Logowanie źródeł
    console.log("🔗 Źródła z web search:");
    if (parsedResponse.leczenie_niefarmakologiczne?.źródło) {
      console.log(`   - Niefarmakologiczne: ${parsedResponse.leczenie_niefarmakologiczne.źródło}`);
    }

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
      errorMessage = 'Błąd połączenia z OpenAI API';
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