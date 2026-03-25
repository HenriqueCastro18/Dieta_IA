/// <reference types="vite/client" />
import { GoogleGenerativeAI } from "@google/generative-ai";

// Importação dos três bancos de dados JSON
import foodG from "../data/foodDatabase.json"; 
import foodML from "../data/MLDatabase.json";
import foodUN from "../data/UNIDatabase.json";

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
  baseUnit?: string;
  conversions?: {
    un?: number;
    ml?: number;
    [key: string]: number | undefined;
  };
}

const CACHE_NAME = "nutrilog_dynamic_cache_v2";

/**
 * Busca dados nutricionais priorizando os bancos locais (G, ML, UN)
 * e usando o Gemini como fallback.
 */
export const fetchFoodData = async (
  ingredient: string, 
  unit: 'g' | 'ml' | 'un' = 'g'
): Promise<FoodInfo | null> => {
  
  // 1. NORMALIZAÇÃO DA BUSCA
  const searchKey = ingredient
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .replace(/\s+/g, " ");

  // 2. SELEÇÃO DO BANCO DE DADOS BASEADO NA UNIDADE
  let activeDatabase: Record<string, any>;
  
  switch (unit) {
    case 'ml':
      activeDatabase = foodML;
      break;
    case 'un':
      activeDatabase = foodUN;
      break;
    default:
      activeDatabase = foodG;
  }

  // Busca por chave exata ou por inclusão no nome
  const foundKey = Object.keys(activeDatabase).find(key => 
    key === searchKey || 
    key.replace(/_/g, " ") === searchKey ||
    activeDatabase[key].name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").includes(searchKey)
  );

  if (foundKey) {
    console.log(`%c✅ [DB-${unit.toUpperCase()}] Encontrado: "${foundKey}"`, "color: #2ecc71; font-weight: bold;");
    return activeDatabase[foundKey] as FoodInfo;
  }

  // 3. VERIFICAÇÃO NO CACHE LOCAL (LocalStorage)
  const cacheKey = `${unit}_${searchKey}`;
  const localCache = JSON.parse(localStorage.getItem(CACHE_NAME) || "{}");
  
  if (localCache[cacheKey]) {
    console.log(`%c⚡ [CACHE] Recuperado: "${cacheKey}"`, "color: #f1c40f; font-weight: bold;");
    return localCache[cacheKey];
  }

  // 4. FALLBACK: CONSULTA AO GEMINI
  console.log(`%c🚀 [API] Solicitando ao Gemini: "${ingredient}" (Unidade: ${unit})`, "color: #3498db; font-weight: bold;");
  
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

  try {
    const prompt = `Retorne APENAS um objeto JSON para 100g/100ml de "${ingredient}". 
    Se a unidade for "un", estime o peso de 1 unidade em "conv_un".
    Formato: {"name": string, "p": number, "c": number, "f": number, "sugar": number, "addedSugar": number, "fiber": number, "sodium": number, "conv_un": number}`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
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
      sodiumMg: searchKey === "sal" ? 38758 : (Number(food.sodium) || 0),
      baseUnit: unit === 'ml' ? 'ml' : 'g',
      conversions: {
        un: food.conv_un || (unit === 'un' ? 100 : undefined)
      }
    };

    // Salva no cache para evitar chamadas repetidas à API paga/limitada
    localCache[cacheKey] = normalizedData;
    localStorage.setItem(CACHE_NAME, JSON.stringify(localCache));

    return normalizedData;
  } catch (error) {
    console.error("Erro na comunicação com o Gemini API:", error);
    return null;
  }
};