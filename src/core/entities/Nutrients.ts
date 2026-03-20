export interface MacroNutrients {
  proteins: number;
  carbs: number;
  fats: number;
  calories: number;
}

export interface FoodItem {
  id: string;
  name: string;
  macros: MacroNutrients;
  category: 'protein' | 'carb' | 'fat' | 'mixed';
}