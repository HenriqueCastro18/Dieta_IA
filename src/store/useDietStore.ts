import { create } from 'zustand';
import { MacroNutrients } from '../core/entities/Nutrients';

// Interface estendida para incluir micronutrientes no histórico
export interface FoodItem extends MacroNutrients {
  name: string;
  timestamp: number;
  sodium: number;
  fiber: number;
  sugar: number;
}

interface DietState {
  totalMacros: MacroNutrients & { sodium: number; fiber: number; sugar: number };
  foods: FoodItem[];
  addFood: (food: FoodItem) => void;
  removeFood: (timestamp: number) => void;
  clearFoods: () => void; // Alterado de resetDiet para clearFoods
}

// Função auxiliar para evitar erros de precisão decimal
const fixPrecision = (n: number) => parseFloat(n.toFixed(2));

export const useDietStore = create<DietState>((set) => ({
  totalMacros: { 
    proteins: 0, 
    carbs: 0, 
    fats: 0, 
    calories: 0, 
    sodium: 0, 
    fiber: 0, 
    sugar: 0 
  },
  foods: [],

  addFood: (food) => set((state) => ({
    foods: [food, ...state.foods],
    totalMacros: {
      proteins: fixPrecision(state.totalMacros.proteins + (food.proteins || 0)),
      carbs: fixPrecision(state.totalMacros.carbs + (food.carbs || 0)),
      fats: fixPrecision(state.totalMacros.fats + (food.fats || 0)),
      calories: fixPrecision(state.totalMacros.calories + (food.calories || 0)),
      sodium: fixPrecision(state.totalMacros.sodium + (food.sodium || 0)),
      fiber: fixPrecision(state.totalMacros.fiber + (food.fiber || 0)),
      sugar: fixPrecision(state.totalMacros.sugar + (food.sugar || 0)),
    }
  })),

  removeFood: (timestamp) => set((state) => {
    const foodToRemove = state.foods.find(f => f.timestamp === timestamp);
    if (!foodToRemove) return state;

    return {
      foods: state.foods.filter(f => f.timestamp !== timestamp),
      totalMacros: {
        proteins: fixPrecision(state.totalMacros.proteins - (foodToRemove.proteins || 0)),
        carbs: fixPrecision(state.totalMacros.carbs - (foodToRemove.carbs || 0)),
        fats: fixPrecision(state.totalMacros.fats - (foodToRemove.fats || 0)),
        calories: fixPrecision(state.totalMacros.calories - (foodToRemove.calories || 0)),
        sodium: fixPrecision(state.totalMacros.sodium - (foodToRemove.sodium || 0)),
        fiber: fixPrecision(state.totalMacros.fiber - (foodToRemove.fiber || 0)),
        sugar: fixPrecision(state.totalMacros.sugar - (foodToRemove.sugar || 0)),
      }
    };
  }),

  // Esta função agora condiz com a chamada no SummaryPanel
  clearFoods: () => set({
    totalMacros: { 
      proteins: 0, 
      carbs: 0, 
      fats: 0, 
      calories: 0, 
      sodium: 0, 
      fiber: 0, 
      sugar: 0 
    },
    foods: []
  }),
}));