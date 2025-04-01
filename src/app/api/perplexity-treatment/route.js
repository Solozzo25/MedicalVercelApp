import { NextResponse } from 'next/server';
import axios from 'axios';

export async function POST(request) {
  console.log("🔄 Funkcja perplexity-treatment została wywołana");
  
  try {
    // Parsowanie danych wejściowych
    const reqData = await request.json();
    const { diagnosis, medicalSociety } = reqData;
    
    console.log("📋 Otrzymane dane:", { diagnosis, medicalSociety });

    // Sprawdzenie wymaganych pól
    if (!diagnosis) {
      console.log("❌ Błąd: Brakująca diagnoza");
      return NextResponse.json({ 
        error: 'Brakujące pole: diagnoza' 
      }, { status: 400 });
    }

    if (!medicalSociety) {
      console.log("⚠️ Ostrzeżenie: Brak towarzystwa medycznego");
      // Kontynuujemy przetwarzanie, ale logujemy ostrzeżenie
    }

    // Klucz API z zmiennych środowiskowych
    const apiKey = process.env.PERPLEXITY_API_KEY;
    
    if (!apiKey) {
      console.log("❌ Błąd: Brak klucza API Perplexity w zmiennych środowiskowych");
      return NextResponse.json({ 
        error: 'Błąd konfiguracji API - brak klucza Perplexity' 
      }, { status: 500 });
    }
    
    console.log("🔑 Klucz API Perplexity znaleziony (pierwszych 5 znaków):", apiKey.substring(0, 5) + '...');

    // Przygotowanie promptu dla Perplexity API z nowymi wymaganiami
    const prompt = `
      Jesteś doświadczonym lekarzem medycznym z 20 letnim doświadczeniem. 
      Na podstawie podanej diagnozy (${diagnosis}) i rekomendacji towarzystwa medycznego (${medicalSociety || "polskiego towarzystwa medycznego właściwego dla tej choroby"}), 
      przygotuj szczegółowe rekomendacje leczenia.
      
      BARDZO WAŻNE: Twoja odpowiedź powinna być dwuczęściowa:
      1. Część pierwsza - rekomendacje oparte na ogólnej wiedzy medycznej i doświadczeniu klinicznym dla tej diagnozy, bez konieczności podawania źródeł.
      2. Część druga - rekomendacje oparte na oficjalnych wytycznych ${medicalSociety || "odpowiedniego polskiego towarzystwa medycznego"} lub danych od redakcji Medycyny Praktycznej oraz książek medycznych dostępnych w internecie. Wszystkie zalecenia muszą być poparte źródłami.
      
      W każdej części uwzględnij:
      1. Farmakoterapię (leki, dawkowanie, czas stosowania)
      2. Zalecenia niefarmakologiczne (dieta, rehabilitacja, styl życia itp.)
      
      Dodatkowo, przedstaw charakterystykę 2-4 kluczowych leków stosowanych w leczeniu tej diagnozy (zamiast tylko jednego), w tym: nazwa, wskazania, przeciwwskazania, interakcje.
      
      Dla charakterystyki leków odwołuj się WYŁĄCZNIE do oficjalnych źródeł takich jak URPL (Urząd Rejestracji Produktów Leczniczych), Ministerstwo Zdrowia, ChPL (Charakterystyka Produktu Leczniczego) lub innych oficjalnych polskich źródeł rządowych.
      
      Format odpowiedzi powinien być w JSON i zawierać następujące sekcje:
      {
        "Rekomendacje_Ogólne": {
          "Farmakoterapia": [
            "Zalecenie 1",
            "Zalecenie 2"
          ],
          "Zalecenia_Niefarmakologiczne": [
            "Zalecenie 1",
            "Zalecenie 2"
          ]
        },
        "Rekomendacje_Oficjalne": {
          "Farmakoterapia": [
            "Zalecenie 1",
            "Zalecenie 2"
          ],
          "Źródło_Farmakoterapii": "Pełny opis źródła z URL (np. wytyczne towarzystwa)",
          "Zalecenia_Niefarmakologiczne": [
            "Zalecenie 1",
            "Zalecenie 2"
          ],
          "Źródło_Zaleceń_Niefarmakologicznych": "Pełny opis źródła z URL (np. wytyczne towarzystwa)"
        },
        "Charakterystyka_Leków": [
          {
            "Nazwa": "Nazwa leku 1",
            "Wskazania": ["Wskazanie 1", "Wskazanie 2"],
            "Przeciwwskazania": ["Przeciwwskazanie 1", "Przeciwwskazanie 2"],
            "Interakcje": ["Interakcja 1", "Interakcja 2"],
            "Źródło": "Pełny opis źródła z URL (np. ChPL, URPL)"
          }
        ]
      }
      
      Kompletność źródeł w części oficjalnych rekomendacji i wiarygodność wszystkich rekomendacji są kluczowe. Podaj pełne URL do źródeł w części oficjalnej.
    `;

    console.log("📤 Wysyłanie zapytania do Perplexity API...");
    
    // Konfiguracja zapytania do API Perplexity
    const perplexityResponse = await axios.post(
      'https://api.perplexity.ai/chat/completions',
      {
        model: "llama-3-sonar-small-32k-online", // model z dostępem do internetu
        messages: [
          { role: "system", content: "Jesteś doświadczonym lekarzem, który udziela rekomendacji leczenia w oparciu o najnowsze wytyczne medyczne. Zawsze podajesz źródła swoich rekomendacji." },
          { role: "user", content: prompt }
        ],
        temperature: 0.1, // niska temperatura dla bardziej precyzyjnych, faktycznych odpowiedzi
        max_tokens: 2000,
        search_enable: true // włączenie wyszukiwania w internecie
      },
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log("✅ Odpowiedź od Perplexity otrzymana, status:", perplexityResponse.status);

    // Parsowanie odpowiedzi od Perplexity
    const responseContent = perplexityResponse.data.choices[0].message.content;
    console.log("📝 Surowa odpowiedź od Perplexity:", responseContent);
    
    // Próba parsowania JSON z odpowiedzi
    let parsedResponse;
    try {
      parsedResponse = JSON.parse(responseContent);
      console.log("✅ Pomyślnie sparsowano JSON z odpowiedzi Perplexity");
    } catch (e) {
      console.error("❌ Błąd parsowania JSON z odpowiedzi Perplexity:", e);
      
      // Spróbujmy znaleźć JSON w odpowiedzi
      const jsonMatch = responseContent.match(/\{[\s\S]*\}/);
      
      if (jsonMatch) {
        try {
          parsedResponse = JSON.parse(jsonMatch[0]);
          console.log("✅ Udało się wyekstraktować i sparsować JSON");
        } catch (extractError) {
          console.error("❌ Nieudana ekstrakcja JSON:", extractError);
          
          // Zwracamy błąd z oryginalną odpowiedzią jako tekst
          return NextResponse.json({ 
            error: "Nie udało się przetworzyć odpowiedzi z API Perplexity. Spróbuj ponownie za chwilę.",
            rawResponse: responseContent
          }, { status: 500 });
        }
      } else {
        // Zwracamy błąd z oryginalną odpowiedzią jako tekst
        return NextResponse.json({ 
          error: "Odpowiedź API nie zawiera poprawnego formatu JSON. Spróbuj ponownie za chwilę.",
          rawResponse: responseContent
        }, { status: 500 });
      }
    }

    // Sprawdzenie i czyszczenie odpowiedzi
    const cleanedResponse = {
      Rekomendacje_Ogólne: {
        Farmakoterapia: Array.isArray(parsedResponse.Rekomendacje_Ogólne?.Farmakoterapia) 
          ? parsedResponse.Rekomendacje_Ogólne.Farmakoterapia 
          : parsedResponse.Rekomendacje_Ogólne?.Farmakoterapia 
            ? [parsedResponse.Rekomendacje_Ogólne.Farmakoterapia] 
            : [],
            
        Zalecenia_Niefarmakologiczne: Array.isArray(parsedResponse.Rekomendacje_Ogólne?.Zalecenia_Niefarmakologiczne) 
          ? parsedResponse.Rekomendacje_Ogólne.Zalecenia_Niefarmakologiczne 
          : parsedResponse.Rekomendacje_Ogólne?.Zalecenia_Niefarmakologiczne 
            ? [parsedResponse.Rekomendacje_Ogólne.Zalecenia_Niefarmakologiczne] 
            : []
      },
      
      Rekomendacje_Oficjalne: {
        Farmakoterapia: Array.isArray(parsedResponse.Rekomendacje_Oficjalne?.Farmakoterapia) 
          ? parsedResponse.Rekomendacje_Oficjalne.Farmakoterapia 
          : parsedResponse.Rekomendacje_Oficjalne?.Farmakoterapia 
            ? [parsedResponse.Rekomendacje_Oficjalne.Farmakoterapia] 
            : [],
            
        Źródło_Farmakoterapii: parsedResponse.Rekomendacje_Oficjalne?.Źródło_Farmakoterapii || "",
        
        Zalecenia_Niefarmakologiczne: Array.isArray(parsedResponse.Rekomendacje_Oficjalne?.Zalecenia_Niefarmakologiczne) 
          ? parsedResponse.Rekomendacje_Oficjalne.Zalecenia_Niefarmakologiczne 
          : parsedResponse.Rekomendacje_Oficjalne?.Zalecenia_Niefarmakologiczne 
            ? [parsedResponse.Rekomendacje_Oficjalne.Zalecenia_Niefarmakologiczne] 
            : [],
            
        Źródło_Zaleceń_Niefarmakologicznych: parsedResponse.Rekomendacje_Oficjalne?.Źródło_Zaleceń_Niefarmakologicznych || ""
      },
      
      Charakterystyka_Leków: Array.isArray(parsedResponse.Charakterystyka_Leków) 
        ? parsedResponse.Charakterystyka_Leków.map(lek => ({
            Nazwa: lek.Nazwa || "Brak danych",
            
            Wskazania: Array.isArray(lek.Wskazania) 
              ? lek.Wskazania 
              : lek.Wskazania 
                ? [lek.Wskazania] 
                : [],
                
            Przeciwwskazania: Array.isArray(lek.Przeciwwskazania) 
              ? lek.Przeciwwskazania 
              : lek.Przeciwwskazania 
                ? [lek.Przeciwwskazania] 
                : [],
                
            Interakcje: Array.isArray(lek.Interakcje) 
              ? lek.Interakcje 
              : lek.Interakcje 
                ? [lek.Interakcje] 
                : [],
                
            Źródło: lek.Źródło || ""
          }))
        : parsedResponse.Charakterystyka_Leków
          ? [parsedResponse.Charakterystyka_Leków]
          : []
    };
    
    console.log("✅ Odpowiedź została oczyszczona i ustrukturyzowana");

    // Zweryfikuj czy mamy przynajmniej podstawowe dane
    if (!cleanedResponse.Rekomendacje_Ogólne.Farmakoterapia.length && 
        !cleanedResponse.Rekomendacje_Ogólne.Zalecenia_Niefarmakologiczne.length &&
        !cleanedResponse.Rekomendacje_Oficjalne.Farmakoterapia.length && 
        !cleanedResponse.Rekomendacje_Oficjalne.Zalecenia_Niefarmakologiczne.length) {
      console.log("⚠️ Ostrzeżenie: Brak zaleceń w odpowiedzi API");
      return NextResponse.json({ 
        warning: "Otrzymano niekompletną odpowiedź z API. Brak zaleceń terapeutycznych.",
        data: cleanedResponse
      }, { status: 207 });
    }
    
    console.log("✅ Zwracanie odpowiedzi");
    return NextResponse.json(cleanedResponse, { status: 200 });

  } catch (error) {
    console.error("❌ Błąd podczas komunikacji z API:", error);
    
    let errorMessage = 'Wystąpił błąd podczas przetwarzania zapytania';
    let errorDetails = {};
    
    if (error.response) {
      console.error("❌ Odpowiedź z błędem od API:", {
        status: error.response.status,
        data: error.response.data
      });
      
      errorMessage = `Błąd API: ${error.response.status} - ${error.response.data.error?.message || JSON.stringify(error.response.data)}`;
      errorDetails = {
        status: error.response.status,
        message: error.response.data.error?.message,
        type: error.response.data.error?.type
      };
    } else if (error.request) {
      console.error("❌ Brak odpowiedzi od serwera API");
      errorMessage = 'Brak odpowiedzi od serwera API';
    } else {
      console.error("❌ Nieoczekiwany błąd:", error.message);
      errorDetails = { message: error.message };
    }
    
    return NextResponse.json({ 
      error: errorMessage,
      details: errorDetails
    }, { status: 500 });
  }
}Interakcje": ["Interakcja 1", "Interakcja 2"],
            "Źródło": "Pełny opis źródła z URL (np. ChPL, URPL)"
          },
          {
            "Nazwa": "Nazwa leku 2",
            "Wskazania": ["Wskazanie 1", "Wskazanie 2"],
            "Przeciwwskazania": ["Przeciwwskazanie 1", "Przeciwwskazanie 2"],
            "
