import { GoogleGenerativeAI } from "@google/generative-ai";

// No Vite, usamos import.meta.env
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

export const GeminiService = {
  async fetchNutrition(query: string) {
    if (!API_KEY) {
      console.error("ERRO: VITE_GEMINI_API_KEY não encontrada.");
      return null;
    }

    try {
      const genAI = new GoogleGenerativeAI(API_KEY);

      // Configuração para o modelo 2.0 Flash
      const model = genAI.getGenerativeModel({
        model: "gemini-2.5-flash",
        generationConfig: {
          responseMimeType: "application/json",
        },
      });

      const prompt = `
        Atue como um especialista em nutrição. Analise o alimento: "${query}".
        Forneça os dados nutricionais para 100g ou 100ml.
        Retorne obrigatoriamente este JSON:
        {
          "name": "Nome do alimento",
          "proteinPer100g": 0,
          "carbsPer100g": 0,
          "fatsPer100g": 0,
          "fiber": 0,
          "sodiumMg": 0,
          "sugarTotal": 0
        }
        Caso não identifique o alimento, retorne null.
      `;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text().trim();

      if (text === "null") return null;

      const parsedData = JSON.parse(text);

      // Sanitização básica para garantir que os cálculos no NutritionPanel funcionem
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
      console.error("Erro na Gemini API:", error);
      return null;
    }
  }
};