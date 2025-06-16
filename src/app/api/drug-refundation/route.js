import { NextResponse } from 'next/server';

// Konfiguracja Vercel
export const maxDuration = 60; // 60 sekund
export const dynamic = 'force-dynamic';

// Funkcja do pobierania refundacji dla grupy leków (max 4)
async function fetchGroupRefundation(drugChunk, apiKey) {
  console.log(`🔍 Pobieranie refundacji dla grupy: ${drugChunk.join(', ')}`);
  
  const systemPrompt = `Jesteś ekspertem od wyszukiwania danych refundacyjnych z oficjalnych źródeł polskich`;

  const userPrompt = `Sprawdź refundację NFZ dla następujących leków: ${drugChunk.join(', ')}

WAŻNE: Wyszukuj TYLKO dane refundacyjne z serwisu lekinfo24.pl lub oficjalnych źródeł NFZ

Dla każdego leku sprawdź:
- czy jest refundowany (true/false)
- poziom odpłatności (bezpłatny, 30%, 50%, 100%)
- grupy pacjentów uprawnione do refundacji
- przykładowe preparaty handlowe dostępne w Polsce
- link do strony z refundacją (jeśli dostępny)

Zwróć dane w dokładnie tym formacie JSON:
{
  "leki": [
    {
      "lek": "nazwa_leku_1",
      "status": "dostępny",
      "refundacja": {
        "refundowany": true,
        "odplatnosc": "30%",
        "grupy_pacjentow": ["Pacjenci z chorobą X (kod Y)", "Pacjenci z chorobą Z"],
        "przykladowy_preparat": ["PREPARAT1 20mg", "PREPARAT2 40mg"],
        "link": "https://lekinfo24.pl/..."
      }
    },
    {
      "lek": "nazwa_leku_2", 
      "status": "niedostępny",
      "uwagi": "Brak w wykazie refundacji NFZ"
    }
  ]
}`;

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'http://localhost:3000',
        'X-Title': 'MedDiagnosis App'
      },
      body: JSON.stringify({
        model: "perplexity/sonar-pro",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        temperature: 0.1,
        max_tokens: 4000
      })
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }

    const responseData = await response.json();
    const responseContent = responseData.choices[0].message.content;
    
    // Parsowanie JSON z obsługą markdown
    let cleanedContent = responseContent;
    if (responseContent.includes('```')) {
      cleanedContent = responseContent
        .replace(/^```json\s*\n?/m, '')
        .replace(/\n?```\s*$/m, '')
        .trim();
    }
    
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

    const apiKey = process.env.OPENROUTER_API_KEY;
    
    if (!apiKey) {
      console.log("❌ Błąd: Brak klucza API OpenRouter");
      return NextResponse.json({ 
        error: 'Błąd konfiguracji API' 
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
      oszczędność: `${Math.round((1 - drugChunks.length / drugs.length) * 100)}% zapytań API`
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