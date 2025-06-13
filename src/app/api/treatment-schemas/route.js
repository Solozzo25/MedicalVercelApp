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

    // System prompt dla nowej struktury z liniami leczenia

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
    
    // Wywołanie API OpenRouter
    const openRouterResponse = await axios.post(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        model: "openai/gpt-4o-mini-search-preview", // Model z dostępem do internetu dla wyszukiwania wytycznych
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        temperature: 0.2,
        max_tokens: 10000 // Zwiększone dla bardziej złożonej struktury
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
      // Wyczyść markdown jeśli istnieje
      let cleanedContent = responseContent;
      if (responseContent.includes('```')) {
        cleanedContent = responseContent
          .replace(/^```json\s*\n?/m, '')
          .replace(/\n?```\s*$/m, '')
          .trim();
      }
      parsedResponse = JSON.parse(cleanedContent);
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
    if (!parsedResponse.choroba || !parsedResponse.linie_leczenia || !parsedResponse.leczenie_niefarmakologiczne) {
      console.log("⚠️ Niekompletna struktura odpowiedzi");
      return NextResponse.json({ 
        error: "Niekompletna odpowiedź - brak wymaganych pól",
        data: parsedResponse
      }, { status: 207 });
    }

    // Walidacja linii leczenia
    if (!Array.isArray(parsedResponse.linie_leczenia) || parsedResponse.linie_leczenia.length === 0) {
      console.log("⚠️ Brak linii leczenia");
      return NextResponse.json({ 
        error: "Brak linii leczenia w odpowiedzi",
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