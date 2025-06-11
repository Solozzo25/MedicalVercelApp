import { NextResponse } from 'next/server';
import axios from 'axios';

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

    // System prompt dla Request 1
    const systemPrompt = `Jesteś ekspertem medycznym specjalizującym się w wyszukiwaniu i analizie najnowszych wytycznych terapeutycznych oraz farmakoterapii. Twoim zadaniem jest tworzenie dokładnych, aktualnych i praktycznych rekomendacji leczenia na podstawie wiarygodnych źródeł medycznych.

Kieruj się następującymi zasadami:
1. Szukaj wyłącznie w wiarygodnych źródłach:
   - Oficjalne wytyczne towarzystw medycznych
   - Redakcje medyczne (np. Medycyna Praktyczna, Termedia)
   - Badania naukowe (np. PubMed)
2. Preferuj dokumenty nie starsze niż 3 lata.
3. Uwzględniaj 3-4 opublikowane schematy leczenia.
4. Stosuj nazwy handlowe leków (np. Omeprazol, nie grupy ogólne).
5. Dla każdego leku podaj:
   - Konkretne dawkowanie,
   - Minimum 2 alternatywy z opisem różnic.
6. Przedstaw przynajmniej 6 zaleceń niefarmakologicznych w formie bezosobowej.
7. Odpowiedź zawsze przedstaw w JSON w dokładnym formacie opisanym przez użytkownika.`;

    // User prompt dla Request 1
    const userPrompt = `Wyszukaj najnowsze wytyczne leczenia dla choroby: ${diagnosis}
${medicalSociety ? `Preferuj wytyczne z: ${medicalSociety}` : ''}

Dane pacjenta:
- Wiek: ${patientAge}
- Płeć: ${patientSex}

WAŻNE:
- Uwzględnij 3-4 schematy leczenia opisane w wiarygodnych źródłach medycznych.
- Leki podawaj **tylko jeśli są zarejestrowane i dostępne w Polsce**.
- Dla każdego leku podaj MINIMUM 2 alternatywy (jeśli istnieją), wraz z opisem różnic.
- Zalecenia niefarmakologiczne przedstaw w formie bezosobowej (np. "Zaleca się", "Należy unikać").

Format odpowiedzi - MUSI być dokładnie w tym formacie JSON:
{
  "choroba": "${diagnosis}",
  "rekomendacje_leczenia": [
    {
      "nazwa_schematu": "Nazwa schematu leczenia",
      "opis_schematu": "Szczegółowy opis kiedy stosować ten schemat",
      "leki": [
        {
          "nazwa": "Nazwa leku",
          "typ": "Typ/grupa leku",
          "dawkowanie": "Szczegółowe dawkowanie",
          "alternatywy": [
            {
              "nazwa": "Nazwa alternatywnego leku",
              "różnice": "Opis różnic w stosunku do leku głównego"
            },
            {
              "nazwa": "Nazwa drugiej alternatywy",
              "różnice": "Opis różnic"
            }
          ]
        }
      ],
      "źródło": "Pełna nazwa źródła z URL jeśli dostępny"
    }
  ],
  "leczenie_niefarmakologiczne": {
    "zalecenia": [
      "Pierwsze zalecenie niefarmakologiczne",
      "Drugie zalecenie niefarmakologiczne",
      "Trzecie zalecenie niefarmakologiczne",
      "Czwarte zalecenie niefarmakologiczne",
      "Piąte zalecenie niefarmakologiczne",
      "Szóste zalecenie niefarmakologiczne"
    ],
    "źródło": "Pełna nazwa źródła z URL jeśli dostępny"
  }
}`;

    console.log("📤 Wysyłanie zapytania do OpenRouter API (Request 1)...");
    
    // Wywołanie API OpenRouter
    const openRouterResponse = await axios.post(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        model: "openai/gpt-4o-mini-search-preview", // Używamy zwykłego modelu dla Request 1
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        temperature: 0.2,
        max_tokens: 3000
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
    
    console.log("✅ Odpowiedź od OpenRouter otrzymana, status:", openRouterResponse.status);

    // Parsowanie odpowiedzi
    const responseContent = openRouterResponse.data.choices[0].message.content;
    console.log("📝 Surowa odpowiedź:", responseContent.substring(0, 500) + "...");
    
    let parsedResponse;
    try {
      parsedResponse = JSON.parse(responseContent);
      console.log("✅ Pomyślnie sparsowano JSON");
    } catch (e) {
      console.error("❌ Błąd parsowania JSON:", e);
      
      // Próba wyekstraktowania JSON
      const jsonMatch = responseContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          parsedResponse = JSON.parse(jsonMatch[0]);
          console.log("✅ Udało się wyekstraktować JSON");
        } catch (extractError) {
          console.error("❌ Nieudana ekstrakcja JSON:", extractError);
          return NextResponse.json({ 
            error: "Nie udało się przetworzyć odpowiedzi. Spróbuj ponownie.",
            rawResponse: responseContent
          }, { status: 500 });
        }
      } else {
        return NextResponse.json({ 
          error: "Odpowiedź nie zawiera poprawnego JSON",
          rawResponse: responseContent
        }, { status: 500 });
      }
    }

    // Walidacja struktury odpowiedzi
    if (!parsedResponse.choroba || !parsedResponse.rekomendacje_leczenia || !parsedResponse.leczenie_niefarmakologiczne) {
      console.log("⚠️ Niekompletna struktura odpowiedzi");
      return NextResponse.json({ 
        error: "Niekompletna odpowiedź - brak wymaganych pól",
        data: parsedResponse
      }, { status: 207 });
    }

    console.log("✅ Struktura odpowiedzi poprawna");
    console.log("📊 Liczba schematów leczenia:", parsedResponse.rekomendacje_leczenia.length);
    
    // Logowanie wszystkich leków do ekstrakcji
    const allDrugs = [];
    parsedResponse.rekomendacje_leczenia.forEach(schemat => {
      schemat.leki.forEach(lek => {
        allDrugs.push(lek.nazwa);
        lek.alternatywy.forEach(alt => allDrugs.push(alt.nazwa));
      });
    });
    console.log("💊 Wszystkie leki do sprawdzenia:", allDrugs);

    return NextResponse.json(parsedResponse, { status: 200 });

  } catch (error) {
    console.error("❌ Błąd podczas komunikacji z API:", error);
    
    let errorMessage = 'Wystąpił błąd podczas przetwarzania zapytania';
    let errorDetails = {};
    
    if (error.response) {
      errorMessage = `Błąd API: ${error.response.status} - ${error.response.data.error?.message || JSON.stringify(error.response.data)}`;
      errorDetails = {
        status: error.response.status,
        message: error.response.data.error?.message,
        type: error.response.data.error?.type
      };
    } else if (error.request) {
      errorMessage = 'Brak odpowiedzi od serwera API';
    } else {
      errorDetails = { message: error.message };
    }
    
    return NextResponse.json({ 
      error: errorMessage,
      details: errorDetails
    }, { status: 500 });
  }
}
