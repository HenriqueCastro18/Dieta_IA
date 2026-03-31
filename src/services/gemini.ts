import Groq from "groq-sdk";

const API_KEY = import.meta.env.VITE_GROQ_API_KEY;

const groq = new Groq({
  apiKey: API_KEY,
  dangerouslyAllowBrowser: true 
});


export const fetchFoodData = async (query: string) => {
  if (!API_KEY) {
    console.error("🔥 [V8 ENGINE] VITE_GROQ_API_KEY não encontrada no .env.");
    return null;
  }

  try {
    const systemPrompt = `Você é o laboratório de nutrição de elite CORE V8.
    Sua única função é analisar alimentos e retornar os macronutrientes EXATOS para 100g (ou 100ml).
    Responda APENAS com JSON puro. Zero texto extra.`;

    const userPrompt = `
      Analise: "${query}".
      
      ESTRUTURA JSON OBRIGATÓRIA:
      {
        "name": "Nome Formatado",
        "proteinPer100g": 0,
        "carbsPer100g": 0,
        "fatsPer100g": 0,
        "fiber": 0,
        "sodiumMg": 0,
        "sugarTotal": 0
      }
    `;

    const completion = await groq.chat.completions.create({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      model: "llama-3.3-70b-versatile",
      temperature: 0.1, 
      response_format: { type: "json_object" }
    });

    let text = completion.choices[0]?.message?.content || "{}";

    text = text.replace(/```json/g, "").replace(/```/g, "").trim();

    if (text === "{}" || text === "null") return null;

    const parsedData = JSON.parse(text);

    return {
      name: String(parsedData.name || query),
      proteinPer100g: Number(parsedData.proteinPer100g) || 0,
      carbsPer100g: Number(parsedData.carbsPer100g) || 0,
      fatsPer100g: Number(parsedData.fatsPer100g) || 0,
      fiber: Number(parsedData.fiber) || 0,
      sodiumMg: Number(parsedData.sodiumMg) || 0,
      sugarTotal: Number(parsedData.sugarTotal) || 0
    };

  } catch (error) {
    console.error("🔥 [V8 ENGINE] Erro na API da Groq:", error);
    return null;
  }
};


export const generateText = async (prompt: string) => {
  if (!API_KEY) throw new Error("VITE_GROQ_API_KEY não configurada.");
  
  try {
    const completion = await groq.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "llama-3.3-70b-versatile",
    });
    return completion.choices[0]?.message?.content?.trim() || "";
  } catch (error) {
    console.error("🔥 [V8 ENGINE] Erro ao gerar texto com Groq:", error);
    throw error;
  }
};