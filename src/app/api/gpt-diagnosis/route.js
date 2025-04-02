import { NextResponse } from 'next/server';
import axios from 'axios';

export async function POST(request) {
  console.log("🔄 Funkcja gpt-diagnosis została wywołana");
  
  try {
    // Parsowanie danych wejściowych z formularza
    const reqData = await request.json();
    const { age, sex, symptoms, physicalExam, additionalTests, medicalHistory } = reqData;
    
    console.log("📋 Dane pacjenta otrzymane:", { 
      age, 
      sex, 
      symptomsLength: symptoms?.length, 
      physicalExamProvided: !!physicalExam,
      additionalTestsProvided: !!additionalTests,
      medicalHistoryProvided: !!medicalHistory
    });

    // Sprawdzenie wymaganych pól
    if (!age || !sex || !symptoms) {
      console.log("❌ Błąd: Brakujące wymagane pola");
      return NextResponse.json({ 
        error: 'Brakujące wymagane pola: wiek, płeć lub objawy podmiotowe' 
      }, { status: 400 });
    }

    // Klucz API z zmiennych środowiskowych
    const apiKey = process.env.OPENAI_API_KEY;
    
    if (!apiKey) {
      console.log("❌ Błąd: Brak klucza API OpenAI w zmiennych środowiskowych");
      return NextResponse.json({ 
        error: 'Błąd konfiguracji API - brak klucza OpenAI' 
      }, { status: 500 });
    }
    
    console.log("🔑 Klucz API OpenAI znaleziony (pierwszych 5 znaków):", apiKey.substring(0, 5) + '...');

    // Przygotowanie systmowego i użytkownika promptu
    const systemPrompt = "Jesteś doświadczonym lekarzem medycznym z 20 letnim doświadczeniem w medycynie chorób wewnętrznych, który korzysta z najnowszych wytycznych medycznych.";
    
    // Przygotowanie promptu do GPT
    const userPrompt = `
      Twoim zadaniem jest postawienie precyzyjnej diagnozy na podstawie pełnych danych pacjenta, włączając: wiek, płeć, wyniki wywiadu lekarskiego, wyniki badań przeprowadzonych przez lekarza, wyniki badań laboratoryjnych oraz (jeśli dostępne) historię medyczną. Każda podana informacja ma kluczowe znaczenie i nie może być pominięta przy formułowaniu diagnozy.

Wymagania:
1. **Analiza wszystkich danych:** Uwzględnij wiek, płeć, objawy, wyniki badań przedmiotowych, wyniki badań laboratoryjnych oraz historię medyczną. Jeśli któryś z elementów nie został podany, przyjmij, że wynik jest prawidłowy i mieści się w normie.
2. **Bez sprzeczności z wynikami badań:** Jeśli konkretne wyniki (np. poziom leukocytów) są podane jako w normie, diagnoza nie może sugerować patologii związanej z odchyleniem tych wartości. Jeżeli model napotka brak danych, przyjmij, że wyniki są prawidłowe.
3. **Wykorzystanie najnowszej wiedzy medycznej:** Opieraj się na aktualnych wytycznych, artykułach oraz wiarygodnych źródłach dostępnych online.
4. **Uwzględnienie kontekstu demograficznego:** Dostosuj diagnozy do wieku oraz płci pacjenta.
5. **Zaproponowanie kilku możliwych diagnoz:** Podaj 3-5 najbardziej prawdopodobnych diagnoz, przypisując każdej szacunkowy procent prawdopodobieństwa trafności diagnozy na podstawie dostarczonych danych.
6. **Uzasadnienie każdej diagnozy:** Dla każdej zaproponowanej diagnozy podaj krótkie, zwięzłe uzasadnienie.
7. **Wskazanie organizacji medycznej:** Dla każdej diagnozy podaj nazwę polskiego towarzystwa medycznego, do którego skierowałbyś się po dodatkowe zalecenia.

Dane pacjenta:
- Wiek: ${age}
- Płeć: ${sex}
- Wyniki podmiotowe (wywiad lekarski): ${symptoms}
- Wyniki przedmiotowe (badania przeprowadzone przez lekarza): ${physicalExam || 'Brak danych'}
- Wyniki laboratoryjne: ${additionalTests || 'Brak danych'}
${medicalHistory ? `- Historia medyczna: ${medicalHistory}` : ''}

Odpowiedź musi być w formacie JSON, zawierając następujące sekcje, bez dodatkowych komentarzy lub modyfikacji nagłówków:
{
    "Diagnozy": [
        {
            "Nazwa": "Nazwa pierwszej diagnozy",
            "Prawdopodobieństwo": 85,
            "Uzasadnienie": "Krótkie, zwięzłe uzasadnienie wyboru tej diagnozy",
            "Towarzystwo_Medyczne": "Nazwa polskiego towarzystwa medycznego właściwego dla tej diagnozy"
        },
        {
            "Nazwa": "Nazwa drugiej diagnozy",
            "Prawdopodobieństwo": 65,
            "Uzasadnienie": "Krótkie, zwięzłe uzasadnienie wyboru tej diagnozy",
            "Towarzystwo_Medyczne": "Nazwa polskiego towarzystwa medycznego właściwego dla tej diagnozy"
        },
        {
            "Nazwa": "Nazwa trzeciej diagnozy",
            "Prawdopodobieństwo": 40,
            "Uzasadnienie": "Krótkie, zwięzłe uzasadnienie wyboru tej diagnozy",
            "Towarzystwo_Medyczne": "Nazwa polskiego towarzystwa medycznego właściwego dla tej diagnozy"
        }
    ]
}
      `;

    console.log("📤 Wysyłanie zapytania do OpenAI API...");
    
    // Konfiguracja zapytania do API OpenAI
    const openAIResponse = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: "gpt-4-turbo", // lub inny model, który preferujesz
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        temperature: 0.2, // Niska temperatura dla bardziej precyzyjnych odpowiedzi medycznych
        max_tokens: 1000
      },
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log("✅ Odpowiedź od OpenAI otrzymana, status:", openAIResponse.status);
    console.log("📊 Użycie tokenów:", {
      prompt_tokens: openAIResponse.data.usage?.prompt_tokens,
      completion_tokens: openAIResponse.data.usage?.completion_tokens,
      total_tokens: openAIResponse.data.usage?.total_tokens
    });

    // Parsowanie odpowiedzi od GPT
    const responseContent = openAIResponse.data.choices[0].message.content;
    console.log("📝 Surowa odpowiedź od GPT:", responseContent);
    
    // Próba parsowania JSON z odpowiedzi
    let parsedResponse;
    try {
      parsedResponse = JSON.parse(responseContent);
      console.log("✅ Pomyślnie sparsowano JSON z odpowiedzi");
    } catch (e) {
      console.error("❌ Błąd parsowania JSON z odpowiedzi GPT:", e);
      console.log("📝 Otrzymana odpowiedź (pierwsze 200 znaków):", responseContent.substring(0, 200));
      
      // Spróbujmy znaleźć JSON w odpowiedzi
      const jsonMatch = responseContent.match(/\{[\s\S]*\}/);
      
      if (jsonMatch) {
        console.log("🔄 Próba wyekstraktowania JSON z odpowiedzi...");
        try {
          parsedResponse = JSON.parse(jsonMatch[0]);
          console.log("✅ Udało się wyekstraktować i sparsować JSON");
        } catch (extractError) {
          console.error("❌ Nieudana ekstrakcja JSON:", extractError);
        }
      }
      
      // Jeśli nadal nie udało się sparsować JSON
      if (!parsedResponse) {
        console.log("❌ Zwracanie oryginalnej odpowiedzi jako tekst");
        return NextResponse.json({ 
          error: "Odpowiedź nie jest poprawnym JSON. Pokazuję tekst oryginalny.", 
          rawResponse: responseContent 
        }, { status: 207 });
      }
    }

    // Sprawdzenie czy JSON zawiera wymagane pola
    if (!parsedResponse.Diagnozy || !Array.isArray(parsedResponse.Diagnozy) || parsedResponse.Diagnozy.length === 0) {
      console.log("⚠️ Niekompletna odpowiedź JSON, brakujące pola:", {
        Diagnozy: Array.isArray(parsedResponse.Diagnozy) && parsedResponse.Diagnozy.length > 0
      });
      
      return NextResponse.json({ 
        warning: "Niekompletna odpowiedź, brakuje wymaganych pól", 
        data: parsedResponse 
      }, { status: 207 });
    }
    
    // Weryfikacja każdej diagnozy
    for (const diagnoza of parsedResponse.Diagnozy) {
      if (!diagnoza.Nazwa || typeof diagnoza.Prawdopodobieństwo !== 'number' || 
          !diagnoza.Uzasadnienie || !diagnoza.Towarzystwo_Medyczne) {
        console.log("⚠️ Niepełne dane dla diagnozy:", diagnoza);
        return NextResponse.json({ 
          warning: "Niepełne dane dla jednej z diagnoz", 
          data: parsedResponse 
        }, { status: 207 });
      }
    }
    
    console.log("✅ Wszystkie wymagane pola są obecne, zwracanie odpowiedzi");
    console.log("📋 Liczba diagnoz:", parsedResponse.Diagnozy.length);
    console.log("📋 Przykładowa diagnoza:", parsedResponse.Diagnozy[0].Nazwa);

    // Zwróć odpowiedź do klienta
    return NextResponse.json(parsedResponse, { status: 200 });

  } catch (error) {
    console.error("❌ Błąd podczas komunikacji z API:", error);
    
    let errorMessage = 'Wystąpił błąd podczas przetwarzania zapytania';
    let errorDetails = {};
    
    if (error.response) {
      // Błąd po stronie API OpenAI
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
      // Brak odpowiedzi od API
      console.error("❌ Brak odpowiedzi od serwera API");
      errorMessage = 'Brak odpowiedzi od serwera API';
    } else {
      // Inny błąd
      console.error("❌ Nieoczekiwany błąd:", error.message);
      errorDetails = { message: error.message };
    }
    
    return NextResponse.json({ 
      error: errorMessage,
      details: errorDetails
    }, { status: 500 });
  }
}
