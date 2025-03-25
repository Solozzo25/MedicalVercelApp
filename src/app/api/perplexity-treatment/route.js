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

    // Przygotowanie promptu dla Perplexity API
    const prompt = `
      Jesteś doświadczonym lekarzem medycznym z 20 letnim doświadczeniem. 
      Na podstawie podanej diagnozy (${diagnosis}) i rekomendacji towarzystwa medycznego (${medicalSociety || "polskiego towarzystwa medycznego właściwego dla tej choroby"}), 
      przygotuj szczegółowe rekomendacje leczenia.
      
      BARDZO WAŻNE: Musisz opierać swoją odpowiedź wyłącznie na oficjalnych wytycznych ${medicalSociety || "odpowiedniego polskiego towarzystwa medycznego"} lub innych uznanych polskich towarzystw medycznych czy instytucji opieki zdrowotnej. Nie twórz żadnych rekomendacji bez poparcia źródłami.
      
      Uwzględnij:
      1. Farmakoterapię (leki, dawkowanie, czas stosowania)
      2. Zalecenia niefarmakologiczne (dieta, rehabilitacja, styl życia itp.)
      3. Charakterystykę kluczowego leku (nazwa, wskazania, przeciwwskazania, interakcje)
      
      Dla charakterystyki leku odwołuj się WYŁĄCZNIE do oficjalnych źródeł takich jak URPL (Urząd Rejestracji Produktów Leczniczych), Ministerstwo Zdrowia, ChPL (Charakterystyka Produktu Leczniczego) lub innych oficjalnych polskich źródeł rządowych.
      
      Format odpowiedzi powinien być w JSON i zawierać następujące sekcje:
      {
        "Farmakoterapia": [
          "Zalecenie 1",
          "Zalecenie 2"
        ],
        "Źródło_Farmakoterapii": "Pełny opis źródła z URL (np. wytyczne towarzystwa)",
        "Zalecenia_Niefarmakologiczne": [
          "Zalecenie 1",
          "Zalecenie 2"
        ],
        "Źródło_Zaleceń_Niefarmakologicznych": "Pełny opis źródła z URL (np. wytyczne towarzystwa)",
        "Charakterystyka_Leku": {
          "Nazwa": "Nazwa kluczowego leku",
          "Wskazania": ["Wskazanie 1", "Wskazanie 2"],
          "Przeciwwskazania": ["Przeciwwskazanie 1", "Przeciwwskazanie 2"],
          "Interakcje": ["Interakcja 1", "Interakcja 2"],
          "Źródło": "Pełny opis źródła z URL (np. ChPL, URPL)"
        }
      }
      
      Kompletność źródeł i wiarygodność rekomendacji są kluczowe. Koniecznie podaj pełne URL do źródeł.
    `;

    console.log("📤 Wysyłanie zapytania do Perplexity API...");
    
    // Konfiguracja zapytania do API Perplexity
    const perplexityResponse = await axios.post(
      'https://api.perplexity.ai/chat/completions',
      {
        model: "sonar-pro", // model z dostępem do internetu
        messages: [
          { role: "system", content: "Jesteś doświadczonym lekarzem, który udziela rekomendacji leczenia w oparciu o najnowsze wytyczne medyczne. Zawsze podajesz źródła swoich rekomendacji." },
          { role: "user", content: prompt }
        ],
        temperature: 0.1, // niska temperatura dla bardziej precyzyjnych, faktycznych odpowiedzi
        max_tokens: 1500,
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
      Farmakoterapia: Array.isArray(parsedResponse.Farmakoterapia) 
        ? parsedResponse.Farmakoterapia 
        : parsedResponse.Farmakoterapia 
          ? [parsedResponse.Farmakoterapia] 
          : [],
          
      Źródło_Farmakoterapii: parsedResponse.Źródło_Farmakoterapii || "",
      
      Zalecenia_Niefarmakologiczne: Array.isArray(parsedResponse.Zalecenia_Niefarmakologiczne) 
        ? parsedResponse.Zalecenia_Niefarmakologiczne 
        : parsedResponse.Zalecenia_Niefarmakologiczne 
          ? [parsedResponse.Zalecenia_Niefarmakologiczne] 
          : [],
          
      Źródło_Zaleceń_Niefarmakologicznych: parsedResponse.Źródło_Zaleceń_Niefarmakologicznych || "",
      
      Charakterystyka_Leku: {
        Nazwa: parsedResponse.Charakterystyka_Leku?.Nazwa || "Brak danych",
        
        Wskazania: Array.isArray(parsedResponse.Charakterystyka_Leku?.Wskazania) 
          ? parsedResponse.Charakterystyka_Leku.Wskazania 
          : parsedResponse.Charakterystyka_Leku?.Wskazania 
            ? [parsedResponse.Charakterystyka_Leku.Wskazania] 
            : [],
            
        Przeciwwskazania: Array.isArray(parsedResponse.Charakterystyka_Leku?.Przeciwwskazania) 
          ? parsedResponse.Charakterystyka_Leku.Przeciwwskazania 
          : parsedResponse.Charakterystyka_Leku?.Przeciwwskazania 
            ? [parsedResponse.Charakterystyka_Leku.Przeciwwskazania] 
            : [],
            
        Interakcje: Array.isArray(parsedResponse.Charakterystyka_Leku?.Interakcje) 
          ? parsedResponse.Charakterystyka_Leku.Interakcje 
          : parsedResponse.Charakterystyka_Leku?.Interakcje 
            ? [parsedResponse.Charakterystyka_Leku.Interakcje] 
            : [],
            
        Źródło: parsedResponse.Charakterystyka_Leku?.Źródło || ""
      }
    };
    
    console.log("✅ Odpowiedź została oczyszczona i ustrukturyzowana");

    // Zweryfikuj czy mamy przynajmniej podstawowe dane
    if (cleanedResponse.Farmakoterapia.length === 0 && cleanedResponse.Zalecenia_Niefarmakologiczne.length === 0) {
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
}
