/// <reference types="vite/client" />
import Groq from "groq-sdk";


import foodG from "../data/foodDatabase.json"; 
import foodML from "../data/MLDatabase.json";
import foodUN from "../data/UNIDatabase.json";

const API_KEY = import.meta.env.VITE_GROQ_API_KEY;


const groq = new Groq({
  apiKey: API_KEY,
  dangerouslyAllowBrowser: true 
});

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

export const fetchFoodData = async (
  ingredient: string, 
  unit: 'g' | 'ml' | 'un' = 'g'
): Promise<FoodInfo | null> => {
  

  const searchKey = ingredient
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .replace(/\s+/g, "_"); 

  let activeDatabase: Record<string, any>;
  let targetFileName = "";
  

  switch (unit) {
    case 'ml':
      activeDatabase = foodML;
      targetFileName = "MLDatabase.json";
      break;
    case 'un':
      activeDatabase = foodUN;
      targetFileName = "UNIDatabase.json";
      break;
    default:
      activeDatabase = foodG;
      targetFileName = "foodDatabase.json";
  }


  const foundKey = Object.keys(activeDatabase).find(key => 
    key === searchKey || 
    activeDatabase[key].name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").includes(searchKey.replace(/_/g, " "))
  );

  if (foundKey) {
    console.log(`%c✅ [DB-${unit.toUpperCase()}] Encontrado no arquivo físico: "${foundKey}"`, "color: #2ecc71; font-weight: bold;");
    return activeDatabase[foundKey] as FoodInfo;
  }

  const cacheKey = `${unit}_${searchKey}`;
  const localCache = JSON.parse(localStorage.getItem(CACHE_NAME) || "{}");
  
  if (localCache[cacheKey]) {
    console.log(`%c⚡ [CACHE] Recuperado da memória: "${cacheKey}"`, "color: #f1c40f; font-weight: bold;");
    return localCache[cacheKey];
  }

  console.log(`%c🚀 [V8 ENGINE] Alimento inédito! Solicitando análise da Groq: "${ingredient}" (Unidade requerida: ${unit})...`, "color: #e74c3c; font-weight: bold;");
  
  if (!API_KEY) return null;

  try {
    const unitContext = unit === 'ml' ? '100ml' : '100g';
    
    const systemPrompt = `Você é o CORE Nutricional V8. Retorne APENAS um JSON puro.
    DIRETRIZ MATEMÁTICA ESTRITA: Os valores de nutrientes (p, c, f, sugar, fiber, sodium) DEVEM ser calculados EXATAMENTE para uma porção de ${unitContext}. 
    Se a solicitação incluir unidade "un" (ex: fatia, unidade, pedaço), você obrigatoriamente adiciona o campo "conv_un" estimando o peso em gramas de 1 unidade, MAS MANTÉM os nutrientes baseados na proporção de 100g.`;
    
    const userPrompt = `Alimento: "${ingredient}". Formato OBRIGATÓRIO (JSON): {"name": "Nome Formato Título", "p": 0, "c": 0, "f": 0, "sugar": 0, "addedSugar": 0, "fiber": 0, "sodium": 0, "conv_un": 0}`;

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

    if (!text || text === "null" || text === "{}") return null;

    const food = JSON.parse(text);

    const normalizedData: FoodInfo = {
      name: food.name || ingredient,
      proteinPer100g: Number(food.p) || 0,
      carbsPer100g: Number(food.c) || 0,
      fatsPer100g: Number(food.f) || 0,
      sugarTotal: Number(food.sugar) || 0,
      sugarAdded: Number(food.addedSugar) || 0,
      fiber: Number(food.fiber) || 0,
      sodiumMg: searchKey.includes("sal") ? 38758 : (Number(food.sodium) || 0),
      baseUnit: unit === 'ml' ? 'ml' : 'g', 
      conversions: {
        un: food.conv_un || (unit === 'un' ? 100 : undefined)
      }
    };

    localCache[cacheKey] = normalizedData;
    localStorage.setItem(CACHE_NAME, JSON.stringify(localCache));

    if (import.meta.env.DEV) {
        try {
            await fetch('/api/write-json', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    fileName: targetFileName,
                    key: searchKey,
                    data: normalizedData
                })
            });
            console.log(`%c💾 [V8 ENGINE] SUCESSO ABSOLUTO! "${ingredient}" foi salvo fisicamente em ${targetFileName}!`, "color: #9b59b6; font-weight: bold;");
        } catch (e) {
            console.error("Erro ao tentar gravar fisicamente no JSON:", e);
        }
    }

    return normalizedData;
  } catch (error) {
    console.error("🔥 Erro na comunicação com a Groq API:", error);
    return null;
  }
};