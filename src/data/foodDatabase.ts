export interface FoodBase {
  name: string;
  proteinPer100g: number;
  carbsPer100g: number;
  fatsPer100g: number;
}

export const foodDatabase: Record<string, FoodBase> = {
  "frango": { name: "Frango Grelhado", proteinPer100g: 31, carbsPer100g: 0, fatsPer100g: 3.6 },
  "arroz": { name: "Arroz Branco", proteinPer100g: 2.7, carbsPer100g: 28, fatsPer100g: 0.3 },
  "ovo": { name: "Ovo Cozido", proteinPer100g: 13, carbsPer100g: 1.1, fatsPer100g: 11 },
  "banana": { name: "Banana", proteinPer100g: 1.1, carbsPer100g: 23, fatsPer100g: 0.3 },
  "patinho": { name: "Carne Patinho", proteinPer100g: 26, carbsPer100g: 0, fatsPer100g: 7 },
};