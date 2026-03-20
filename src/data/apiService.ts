/// <reference types="vite/client" />
import { GoogleGenerativeAI } from "@google/generative-ai";
import initialDatabase from "./foodDatabase.json"; 

// A chave agora é puxada do ambiente (Vercel ou .env local)
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(API_KEY);

export interface FoodInfo {
  name: string;
  proteinPer100g: number;
  carbsPer100g: number;
  fatsPer100g: number;
  sugarTotal: number;
  sugarAdded: number;
  fiber: number;
  sodiumMg: number;
}

const CACHE_NAME = "nutrilog_dynamic_cache";

export const fetchFoodData = async (ingredient: string): Promise<FoodInfo | null> => {
  // Normalização para busca consistente
  const searchKey = ingredient
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .replace(/\s+/g, " ");

  const staticDb = initialDatabase as Record<string, FoodInfo>;

  // 1. BUSCA NO BANCO LOCAL (JSON)
  const foundKey = Object.keys(staticDb).find(key => 
    searchKey.includes(key) || key.includes(searchKey)
  );

  if (foundKey) {
    console.log(`%c✅ [JSON] Base encontrada: "${foundKey}"`, "color: #2ecc71; font-weight: bold;");
    return staticDb[foundKey];
  }

  // 2. VERIFICA NO CACHE DO NAVEGADOR (LocalStorage)
  const localCache = JSON.parse(localStorage.getItem(CACHE_NAME) || "{}");
  if (localCache[searchKey]) {
    console.log(`%c⚡ [CACHE] Recuperado: "${searchKey}"`, "color: #f1c40f; font-weight: bold;");
    return localCache[searchKey];
  }

  // 3. CONSULTA AO GEMINI (Fallback)
  console.log(`%c🚀 [API] Solicitando ao Gemini: "${ingredient}"`, "color: #3498db; font-weight: bold;");
  
  // Usando a versão estável mais eficiente para processamento de dados rápidos
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  try {
    const prompt = `Retorne APENAS um objeto JSON para 100g de "${ingredient}" (alimento cru/base). 
    Formato estrito: {"name": string, "p": number, "c": number, "f": number, "sugar": number, "addedSugar": number, "fiber": number, "sodium": number}`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Regex para garantir que pegamos apenas o bloco JSON caso a IA envie texto extra
    const jsonMatch = text.match(/\{.*\}/s);
    if (!jsonMatch) return null;

    const food = JSON.parse(jsonMatch[0]);

    const normalizedData: FoodInfo = {
      name: food.name || ingredient,
      proteinPer100g: Number(food.p) || 0,
      carbsPer100g: Number(food.c) || 0,
      fatsPer100g: Number(food.f) || 0,
      sugarTotal: Number(food.sugar) || 0,
      sugarAdded: Number(food.addedSugar) || 0,
      fiber: Number(food.fiber) || 0,
      sodiumMg: searchKey === "sal" ? 38758 : (Number(food.sodium) || 0)
    };

    // Persistência em Cache para otimizar futuras requisições
    localCache[searchKey] = normalizedData;
    localStorage.setItem(CACHE_NAME, JSON.stringify(localCache));

    return normalizedData;
  } catch (error) {
    console.error("Erro na comunicação com o Gemini API:", error);
    return null;
  }
};