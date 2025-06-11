import { NextResponse } from 'next/server';
import axios from 'axios';

export async function POST(request) {
 console.log("🔄 Funkcja perplexity-treatment została wywołana");
 
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

   if (!medicalSociety) {
     console.log("⚠️ Ostrzeżenie: Brak towarzystwa medycznego");
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
  const systemPrompt = `Jesteś doświadczonym lekarzem z 20-letnim doświadczeniem i specjalistą ds. weryfikacji medycznej. Twoim zadaniem jest:
- Wyszukiwać i krytycznie oceniać oficjalne źródła medyczne (preferuj polskie wytyczne towarzystw medycznych, URPL, Ministerstwo Zdrowia, NFZ, Medycyna Praktyczna, Termedia; w razie potrzeby uwzględniaj międzynarodowe z adaptacją polską).
- Sprawdzać aktualność informacji (preferuj dane nie starsze niż 2–3 lata) i weryfikować, czy URL prowadzi do konkretnego dokumentu. Jeśli model nie ma realnego dostępu do sieci, w odpowiedzi zaznacz ograniczenie i wskaż, by użytkownik sam zweryfikował linki.
- Podawać pełne, działające URL lub samą nazwę źródła, gdy URL nieweryfikowalny. Nigdy nie twórz domniemanych lub niepewnych linków.
- Dokumentować każde zalecenie konkretnym źródłem.
- Priorytetem jest bezpieczeństwo pacjenta i opieranie się na dowodach naukowych.
`;

   
   const userPrompt = `

Na podstawie poniższych danych: diagnoza (${diagnosis}), rekomendacje towarzystwa medycznego (${medicalSociety || "polskiego towarzystwa medycznego właściwego dla tej choroby"}), wiek pacjenta: ${patientAge}, płeć: ${patientSex}, wygeneruj szczegółowe rekomendacje leczenia. 
Użyj jedynie oficjalnych wytycznych polskich towarzystw medycznych lub dostępnych w internecie dokumentów (np. Medycyna Praktyczna) i oficjalnych źródeł URPL/Ministerstwo Zdrowia/NFZ. Jeśli model nie ma wbudowanego dostępu do internetu, zaznacz to i podpowiedz, jak użytkownik może zweryfikować URL-e i informacje. 

Zasady:
- Dla każdego leku: pełna charakterystyka (nazwa, kategoria farmakologiczna, dawkowanie, wskazania, przeciwwskazania, interakcje, uwagi specjalne).
- Sprawdź status refundacji NFZ (Status, Kategoria_Dostępności, Poziom_Odpłatności, Warunki_Refundacji, Wskazania_Refundowane, Ograniczenia_Wiekowe, Alternatywy_Refundowane). Jeśli brak danych, ustaw Status na "brak_danych".
- Podawaj pełne, działające URL (https://...) prowadzące do konkretnego dokumentu/artykułu/PDF: wytycznych, ChPL, URPL, obwieszczeń NFZ/Ministra Zdrowia. Jeśli nie da się zweryfikować linku, podaj tylko nazwę źródła.
- Preferuj źródła nie starsze niż 2–3 lata.
- Jeśli w danej sekcji brak informacji, wpisz odpowiednio [] lub "Brak danych" zgodnie z wymaganiami.
- Dokumentuj każde zalecenie konkretnym źródłem.

Format wyjścia MUSI być ŚCISLE w JSON, bez dodatkowego tekstu przed/po:
{
 "Farmakoterapia": [
   "Nazwa leku 1: szczegółowe dawkowanie i sposób stosowania",
   "Nazwa leku 2: szczegółowe dawkowanie i sposób stosowania",
   "Nazwa leku 3: szczegółowe dawkowanie i sposób stosowania"
 ],
 "Źródło_Farmakoterapii": "Pełny opis źródła z KOMPLETNYM URL (https://...) lub sama nazwa źródła jeśli URL niedostępny",
 "Zalecenia_Niefarmakologiczne": [
   "Zalecenie 1",
   "Zalecenie 2",
   "Zalecenie 3"
 ],
 "Źródło_Zaleceń_Niefarmakologicznych": "Pełny opis źródła z KOMPLETNYM URL (https://...) lub sama nazwa źródła jeśli URL niedostępny",
 "Charakterystyki_Leków": [
   {
     "Nazwa": "Dokładna nazwa pierwszego leku",
     "Typ": "Kategoria farmakologiczna (np. Antybiotyk, NLPZ, Inhibitor pompy protonowej)",
     "Dawkowanie": "Bardzo szczegółowe dawkowanie z czasem stosowania",
     "Wskazania": [
       "Konkretne wskazanie 1",
       "Konkretne wskazanie 2",
       "Konkretne wskazanie 3"
     ],
     "Przeciwwskazania": [
       "Przeciwwskazanie 1",
       "Przeciwwskazanie 2",
       "Przeciwwskazanie 3"
     ],
     "Interakcje": [
       "Interakcja z lekiem/substancją 1",
       "Interakcja z lekiem/substancją 2",
       "Interakcja z lekiem/substancją 3"
     ],
     "Uwagi_Specjalne": [
       "Ważna uwaga 1 (np. podawać z jedzeniem)",
       "Ważna uwaga 2 (np. monitorować funkcje nerek)"
     ],
     "Refundacja_NFZ": {
       "Status": "refundowany lub częściowo_refundowany lub nierefundowany lub brak_danych",
       "Kategoria_Dostępności": "Rp lub Rpz lub OTC",
       "Poziom_Odpłatności": "bezpłatny lub 30% lub 50% lub 100%",
       "Warunki_Refundacji": "Szczegółowy opis warunków refundacji dla tego pacjenta",
       "Wskazania_Refundowane": [
         "Refundowane wskazanie 1",
         "Refundowane wskazanie 2"
       ],
       "Ograniczenia_Wiekowe": "Opis ograniczeń wiekowych lub 'Brak ograniczeń'",
       "Alternatywy_Refundowane": [
         "Alternatywny lek refundowany 1",
         "Alternatywny lek refundowany 2"
       ],
       "Źródło": "KOMPLETNY URL do NFZ lub obwieszczenia ministerialnego (https://...) lub nazwa źródła"
     },
     "Źródło": "KOMPLETNY URL do ChPL, URPL lub oficjalnego źródła (https://...) lub nazwa źródła"
   }
 ]
}
`;




   console.log("📤 Wysyłanie zapytania do Perplexity API...");
   
   // Konfiguracja zapytania do API Perplexity
  const openRouterResponse = await axios.post(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        model: "openai/gpt-4o-mini-search-preview", // Możesz zmienić na inny model np. "anthropic/claude-3.5-sonnet", "meta-llama/llama-3.1-8b-instruct:free"
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        temperature: 0.2, // Niska temperatura dla bardziej precyzyjnych odpowiedzi medycznych
        max_tokens: 2500
      },
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'http://localhost:3000', // Opcjonalne - dla statystyk
          'X-Title': 'MedDiagnosis App' // Opcjonalne - nazwa Twojej aplikacji
        }
      }
    );
   
   console.log("✅ Odpowiedź od Perplexity otrzymana, status:", perplexityResponse.status);
   console.log("📊 Użycie tokenów:", {
     prompt_tokens: perplexityResponse.data.usage?.prompt_tokens,
     completion_tokens: perplexityResponse.data.usage?.completion_tokens,
     total_tokens: perplexityResponse.data.usage?.total_tokens
   });

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
     
     Charakterystyki_Leków: Array.isArray(parsedResponse.Charakterystyki_Leków) 
       ? parsedResponse.Charakterystyki_Leków.map(lek => ({
           Nazwa: lek.Nazwa || "Brak danych",
           Typ: lek.Typ || "Brak danych",
           Dawkowanie: lek.Dawkowanie || "Brak danych",
           
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

           Uwagi_Specjalne: Array.isArray(lek.Uwagi_Specjalne) 
             ? lek.Uwagi_Specjalne 
             : lek.Uwagi_Specjalne 
               ? [lek.Uwagi_Specjalne] 
               : [],

           Refundacja_NFZ: {
             Status: lek.Refundacja_NFZ?.Status || "brak_danych",
             Kategoria_Dostępności: lek.Refundacja_NFZ?.Kategoria_Dostępności || "",
             Poziom_Odpłatności: lek.Refundacja_NFZ?.Poziom_Odpłatności || "",
             Warunki_Refundacji: lek.Refundacja_NFZ?.Warunki_Refundacji || "",
             Wskazania_Refundowane: Array.isArray(lek.Refundacja_NFZ?.Wskazania_Refundowane) 
               ? lek.Refundacja_NFZ.Wskazania_Refundowane 
               : lek.Refundacja_NFZ?.Wskazania_Refundowane 
                 ? [lek.Refundacja_NFZ.Wskazania_Refundowane] 
                 : [],
             Ograniczenia_Wiekowe: lek.Refundacja_NFZ?.Ograniczenia_Wiekowe || "",
             Alternatywy_Refundowane: Array.isArray(lek.Refundacja_NFZ?.Alternatywy_Refundowane) 
               ? lek.Refundacja_NFZ.Alternatywy_Refundowane 
               : lek.Refundacja_NFZ?.Alternatywy_Refundowane 
                 ? [lek.Refundacja_NFZ.Alternatywy_Refundowane] 
                 : [],
             Źródło: lek.Refundacja_NFZ?.Źródło || ""
           },
           
           Źródło: lek.Źródło || ""
         }))
       : []
   };
   
   console.log("✅ Odpowiedź została oczyszczona i ustrukturyzowana");
   console.log("📊 Liczba charakterystyk leków:", cleanedResponse.Charakterystyki_Leków.length);

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
