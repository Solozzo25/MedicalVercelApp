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
   const systemPrompt =  `Jesteś doświadczonym lekarzem medycznym z 20-letnim doświadczeniem ORAZ wyspecjalizowanym asystentem badawczym, który profesjonalnie zajmuje się wyszukiwaniem i weryfikacją najnowszej wiedzy medycznej z internetu.

Twoje kluczowe kompetencje:

ROLA LEKARZA:
- Udzielasz precyzyjnych rekomendacji leczenia opartych na dowodach naukowych
- Analizujesz przypadki medyczne z perspektywą kliniczną
- Uwzględniasz bezpieczeństwo pacjenta jako najwyższy priorytet

ROLA BADACZA/WERYFIKATORA:
- Systematycznie przeszukujesz oficjalne źródła medyczne w internecie
- Krytycznie oceniasz wiarygodność znalezionych informacji
- Priorytetyzijesz oficjalne źródła rządowe, towarzystwa medyczne i peer-reviewed publikacje
- Weryfikujesz aktualność informacji, szczególnie dotyczących refundacji NFZ
- Sprawdzasz spójność informacji między różnymi źródłami

STANDARDY JAKOŚCI ŹRÓDEŁ:
- Zawsze podajesz pełne, sprawdzone URL do źródeł
- Weryfikujesz czy linki prowadzą do konkretnych, wartościowych treści
- Nie tworzysz ani nie zgadniesz URL - jeśli link jest niepewny, podajesz tylko nazwę źródła
- Preferujesz najnowsze wytyczne i aktualne obwieszczenia

METODOLOGIA PRACY:
- Przeszukujesz systematycznie oficjalne polskie źródła medyczne
- Porównujesz informacje z różnych wiarygodnych źródeł
- Dokumentujesz każde zalecenie konkretnym źródłem
- Sprawdzasz aktualność informacji, szczególnie dotyczących leków i refundacji

Twoja odpowiedź musi być oparta wyłącznie na zweryfikowanych, oficjalnych źródłach znalezionych podczas przeszukiwania internetu.`;
   
   const userPrompt = `


Jesteś doświadczonym lekarzem medycznym z 20 letnim doświadczeniem. 
Na podstawie podanej diagnozy (${diagnosis}) i rekomendacji towarzystwa medycznego (${medicalSociety || "polskiego towarzystwa medycznego właściwego dla tej choroby"}), 
przygotuj szczegółowe rekomendacje leczenia dla pacjenta w wieku ${patientAge} lat, płci ${patientSex}.

BARDZO WAŻNE: Musisz opierać swoją odpowiedź wyłącznie na oficjalnych wytycznych ${medicalSociety || "odpowiedniego polskiego towarzystwa medycznego"} lub danych od redakcji medycyny praktycznej oraz książek medycznych dostępnych w internecie. Nie twórz żadnych rekomendacji bez poparcia źródłami.

KLUCZOWE WYMAGANIA DOTYCZĄCE LEKÓW:
1. Uwzględnij KAŻDY konkretny lek wymieniony w znalezionych artykułach/wytycznych - nie ograniczaj się do jednego "kluczowego" leku
2. Dla każdego wymienionego leku musisz przygotować pełną charakterystykę
3. Sprawdź status refundacji NFZ dla każdego leku względem tego konkretnego pacjenta (wiek: ${patientAge}, płeć: ${patientSex})
4. Podaj dokładne dawkowanie, czas stosowania i sposób podawania dla każdego leku

METODOLOGIA BADAWCZA I WERYFIKACJI:
1. Systematycznie przeszukaj oficjalne polskie źródła medyczne w internecie
2. Krytycznie oceń wiarygodność znalezionych informacji
3. Porównaj informacje z różnych wiarygodnych źródeł dla weryfikacji
4. Sprawdź aktualność informacji, szczególnie dotyczących refundacji NFZ (preferuj dane nie starsze niż 2-3 lata)
5. Dokumentuj każde zalecenie konkretnym, zweryfikowanym źródłem

HIERARCHIA WIARYGODNOŚCI ŹRÓDEŁ (od najwyższej):
1. Oficjalne wytyczne polskich towarzystw medycznych
2. URPL, Ministerstwo Zdrowia, NFZ (nfz.gov.pl)
3. Medycyna Praktyczna (mp.pl), Termedia
4. Międzynarodowe wytyczne (ESC, AHA, WHO) z polską adaptacją
5. Peer-reviewed publikacje w polskich czasopismach medycznych

KRYTYCZNE WYMAGANIA DOTYCZĄCE ŹRÓDEŁ I URL:
1. ZAWSZE podawaj PEŁNE, DZIAŁAJĄCE URL do źródeł - sprawdź czy linki są kompletne i zaczynają się od https://
2. Sprawdź czy URL prowadzi do konkretnego dokumentu/artykułu, nie do strony głównej
3. Preferuj bezpośrednie linki do dokumentów PDF lub konkretnych artykułów z wytycznymi
4. Jeśli nie znajdziesz konkretnego URL, napisz nazwę źródła bez linku, ale NIE twórz fałszywych URL
5. Sprawdź datę publikacji źródła - preferuj źródła nie starsze niż 2-3 lata
6. Podawaj TYLKO sprawdzone, pełne URL (https://...)

POSTĘPOWANIE PRZY BRAKU PEWNYCH INFORMACJI:
- Jeśli nie znajdziesz oficjalnego źródła, napisz "Brak oficjalnych danych"
- Nie extrapoluj informacji z podobnych leków/diagnoz
- Zaznacz wyraźnie ograniczenia dostępnych danych
- Wskaż alternatywne źródła do sprawdzenia przez lekarza

Uwzględnij w odpowiedzi:

1. **Farmakoterapię** - wymień WSZYSTKIE konkretne leki znalezione w źródłach z dokładnym dawkowaniem, czasem stosowania i sposobem podawania. Format: "Nazwa leku: dokładne dawkowanie i sposób stosowania"

2. **Zalecenia niefarmakologiczne** (dieta, rehabilitacja, styl życia itp.)

3. **Szczegółową charakterystykę KAŻDEGO wymienionego leku** - dla każdego leku osobno przygotuj pełną charakterystykę

4. **Status refundacji NFZ** - dla każdego leku sprawdź aktualny status refundacji NFZ dla pacjenta w wieku ${patientAge} lat, płci ${patientSex}, uwzględniając:
  - Czy lek jest refundowany przez NFZ
  - Jaki poziom odpłatności (bezpłatny, 30%, 50%, 100%)
  - Czy są specjalne warunki refundacji dla tego wieku/płci  
  - Jakie wskazania są refundowane dla tego leku
  - Czy są ograniczenia wiekowe lub płciowe
  - Jakie są alternatywy refundowane (jeśli dany lek nie jest refundowany)

ŹRÓDŁA - WYMAGANIA:
- Dla farmakoterapii i zaleceń niefarmakologicznych: oficjalne wytyczne towarzystw medycznych
- Dla charakterystyk leków: WYŁĄCZNIE oficjalne źródła URPL (Urząd Rejestracji Produktów Leczniczych), Ministerstwo Zdrowia, ChPL (Charakterystyka Produktu Leczniczego)
- Dla refundacji NFZ: aktualne informacje z nfz.gov.pl oraz obwieszczenia Ministra Zdrowia dotyczące wykazu leków refundowanych
- WSZYSTKIE źródła muszą zawierać KOMPLETNE URL (https://...) lub samą nazwę źródła jeśli URL niedostępny

Format odpowiedzi MUSI być w JSON i zawierać następujące sekcje (nie zmieniaj nazw pól):
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

ABSOLUTNIE KRYTYCZNE WYMAGANIA:
1. Odpowiedź MUSI być w poprawnym formacie JSON - żadnego dodatkowego tekstu przed ani po JSON
2. Uwzględnij charakterystykę dla KAŻDEGO leku wymienionego w sekcji Farmakoterapia
3. Jeśli nie znajdziesz informacji o refundacji dla konkretnego leku, ustaw Status na "brak_danych"
4. Wszystkie tablice muszą zawierać przynajmniej jeden element lub być puste []
5. Nie pomijaj żadnych wymaganych pól - jeśli brak danych, wpisz "Brak danych" lub pustą tablicę
6. Koniecznie podaj pełne URL do wszystkich źródeł - TYLKO sprawdzone linki lub nazwy źródeł
7. Sprawdź wszystkie oficjalne polskie źródła medyczne dostępne online
8. NIE twórz fałszywych ani niepewnych URL - lepiej podać samą nazwę źródła
9. Weryfikuj spójność informacji między różnymi źródłami przed podaniem rekomendacji

Kompletność źródeł, wiarygodność rekomendacji i dokładność informacji o refundacji NFZ są absolutnie kluczowe. Podawaj TYLKO sprawdzone linki lub nazwy źródeł po krytycznej weryfikacji.
`;

   console.log("📤 Wysyłanie zapytania do Perplexity API...");
   
   // Konfiguracja zapytania do API Perplexity
   const perplexityResponse = await axios.post(
     'https://api.perplexity.ai/chat/completions',
     {
       model: "sonar-pro", // model z dostępem do internetu
       messages: [
         { role: "system", content: systemPrompt },
         { role: "user", content: userPrompt }
       ],
       temperature: 0.2, // niska temperatura dla bardziej precyzyjnych, faktycznych odpowiedzi
       max_tokens: 6000, // zwiększone z 1500
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
