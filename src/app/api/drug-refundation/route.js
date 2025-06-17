import { NextResponse } from 'next/server';

// Konfiguracja Vercel
export const maxDuration = 60; // 60 sekund
export const dynamic = 'force-dynamic';

// Funkcja do pobierania refundacji dla grupy leków (max 4) - OPENAI + WEB SEARCH
async function fetchGroupRefundation(drugChunk, apiKey) {
  console.log(`🔍 Pobieranie refundacji dla grupy: ${drugChunk.join(', ')}`);
  
  const userPrompt = `Wyszukaj refundację NFZ dla następujących leków: ${drugChunk.join(', ')}

ZADANIE: Znajdź aktualne dane refundacyjne z oficjalnych źródeł polskich (lekinfo24.pl, nfz.gov.pl).

WYMAGANIA:
- Sprawdź każdy lek osobno w polskich bazach refundacji
- Preferuj lekinfo24.pl jako główne źródło
- Podaj konkretne kody refundacyjne NFZ jeśli dostępne
- Sprawdź preparaty dostępne w Polsce

STRUKTURA ODPOWIEDZI - TYLKO JSON:
{
  "leki": [
    {
      "lek": "${drugChunk[0]}",
      "status": "dostępny",
      "refundacja": {
        "refundowany": true,
        "odplatnosc": "bezpłatny",
        "grupy_pacjentow": ["Wszystkie wskazania rejestracyjne"],
        "przykladowy_preparat": ["Nazwa 500mg", "Nazwa 1000mg"],
        "link": "https://lekinfo24.pl/..."
      }
    }
  ]
}

WAŻNE: Odpowiedź MUSI być poprawnym JSON bez markdown ani komentarzy!`;

  try {
    // Wywołanie OpenAI Responses API z web search
    const response = await fetch('https://api.openai.com/v1/responses', {
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
          "search_context_size": "medium",
          "user_location": {
            "type": "approximate",
            "country": "PL",
            "city": "Warsaw",
            "region": "Mazowieckie", 
            "timezone": "Europe/Warsaw"
          }
        }],
        temperature: 0.1,
        max_output_tokens: 3000
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("❌ Błąd OpenAI API:", response.status, errorText);
      throw new Error(`OpenAI API Error: ${response.status} - ${errorText}`);
    }

	

    // Parsowanie odpowiedzi OpenAI Responses API
    const responseData = await response.json();
	
	console.log("🔍 PEŁNA ODPOWIEDŹ OPENAI:");
	console.log("=====================================");
	console.log(JSON.stringify(responseData, null, 2));
	console.log("=====================================");
    
    console.log("🔍 DIAGNOSTYKA OpenAI Responses:");
    console.log("📊 Status:", responseData.status);
    console.log("📊 Output type:", typeof responseData.output);
    
    // Wyciągnij content z output (Responses API ma inną strukturę)
    let responseContent;
    if (responseData.output && Array.isArray(responseData.output)) {
      const messageOutput = responseData.output.find(item => item.type === 'message');
      if (messageOutput && messageOutput.content && Array.isArray(messageOutput.content)) {
        const textContent = messageOutput.content.find(item => item.type === 'output_text');
        responseContent = textContent?.text || '';
      }
    }
    
    if (!responseContent) {
      console.error("❌ Nie można wyekstraktować treści z odpowiedzi OpenAI");
      throw new Error("Nie można wyekstraktować treści z odpowiedzi OpenAI");
    }

    console.log(`📏 Długość odpowiedzi: ${responseContent.length}`);
    console.log(`📝 Pierwsze 200 znaków:`, responseContent.substring(0, 200));
    
    // ULEPSZONE parsowanie JSON
    let cleanedContent = responseContent.trim();

    // Usuń markdown jeśli istnieje
    if (cleanedContent.includes('```')) {
      cleanedContent = cleanedContent
        .replace(/^```json\s*\n?/m, '')
        .replace(/\n?```\s*$/m, '')
        .trim();
    }

    // Znajdź JSON w odpowiedzi
    const jsonStart = cleanedContent.indexOf('{');
    const jsonEnd = cleanedContent.lastIndexOf('}') + 1;

    if (jsonStart !== -1 && jsonEnd > jsonStart) {
      cleanedContent = cleanedContent.substring(jsonStart, jsonEnd);
    }

    // Usuń komentarze
    cleanedContent = cleanedContent
      .replace(/\/\*[\s\S]*?\*\//g, '') // Usuń /* komentarze */
      .replace(/\/\/.*$/gm, '')           // Usuń // komentarze
      .trim();

    console.log(`🔧 Wyczyszczony JSON (${cleanedContent.length} znaków)`);

    return JSON.parse(cleanedContent);

  } catch (error) {
    console.error(`❌ Błąd dla grupy ${drugChunk.join(', ')}:`, error.message);
    
    // Zwróć błąd dla całej grupy
    return {
      leki: drugChunk.map(drug => ({
        lek: drug,
        status: "błąd",
        uwagi: `Błąd pobierania danych: ${error.message}`
      }))
    };
  }
}

export async function POST(request) {
  console.log("🔄 Funkcja drug-refundation została wywołana");
  
  try {
    const { drugs } = await request.json();
    
    console.log("📋 Lista leków do sprawdzenia refundacji:", drugs);
    
    if (!drugs || !Array.isArray(drugs) || drugs.length === 0) {
      return NextResponse.json({ 
        error: 'Brak listy leków do sprawdzenia' 
      }, { status: 400 });
    }

    // ZMIANA: Używamy OpenAI API zamiast OpenRouter
    const apiKey = process.env.OPENAI_API_KEY;
    
    if (!apiKey) {
      console.log("❌ Błąd: Brak klucza API OpenAI");
      return NextResponse.json({ 
        error: 'Błąd konfiguracji API - brak klucza OpenAI' 
      }, { status: 500 });
    }

    // GRUPOWANIE PO 4 LEKI
    const drugChunks = [];
    for (let i = 0; i < drugs.length; i += 4) {
      drugChunks.push(drugs.slice(i, i + 4));
    }

    console.log(`🔄 Podzielono ${drugs.length} leków na ${drugChunks.length} grup po max 4 leki`);
    
    // Pobierz refundacje dla wszystkich grup równolegle
    const groupPromises = drugChunks.map(chunk => 
      fetchGroupRefundation(chunk, apiKey)
    );
    
    const groupResults = await Promise.all(groupPromises);
    
    // Spłaszcz wyniki z grup do jednej tablicy
    const allRefundations = [];
    groupResults.forEach(groupResult => {
      if (groupResult.leki) {
        allRefundations.push(...groupResult.leki);
      }
    });
    
    console.log("✅ Pobrano refundacje dla wszystkich leków");
    
    // Podsumowanie
    const summary = {
      total: allRefundations.length,
      dostępne: allRefundations.filter(r => r.status === "dostępny").length,
      niedostępne: allRefundations.filter(r => r.status === "niedostępny").length,
      błędy: allRefundations.filter(r => r.status === "błąd").length,
      grupy: drugChunks.length,
      oszczędność: `${Math.round((1 - drugChunks.length / drugs.length) * 100)}% zapytań API`,
      model: "OpenAI GPT-4o + Web Search"
    };
    
    console.log("📊 Podsumowanie refundacji:", summary);
    
    return NextResponse.json({
      refundations: allRefundations,
      summary
    }, { status: 200 });

  } catch (error) {
    console.error("❌ Błąd główny:", error);
    
    return NextResponse.json({ 
      error: 'Wystąpił błąd podczas pobierania refundacji',
      details: error.message
    }, { status: 500 });
  }
}