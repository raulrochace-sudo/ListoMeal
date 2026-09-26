// Indicative portions for one adult: one protein serving, one serving of each
// listed side, and (when listed) one teaspoon of cooking oil. These are rough
// planning figures, not nutrition facts for the meal a visitor actually makes.
export type Nutrition = { kcal: number; protein: number; carbs: number };
const servings: Record<string, Nutrition> = {
  chicken: { kcal: 165, protein: 31, carbs: 0 }, 'ground beef': { kcal: 215, protein: 26, carbs: 0 }, steak: { kcal: 210, protein: 27, carbs: 0 },
  pork: { kcal: 200, protein: 27, carbs: 0 }, turkey: { kcal: 160, protein: 29, carbs: 0 }, salmon: { kcal: 205, protein: 22, carbs: 0 },
  shrimp: { kcal: 100, protein: 23, carbs: 0 }, tuna: { kcal: 120, protein: 26, carbs: 0 }, sausage: { kcal: 280, protein: 13, carbs: 3 },
  ham: { kcal: 145, protein: 21, carbs: 2 }, 'black beans': { kcal: 115, protein: 8, carbs: 20 }, 'pinto beans': { kcal: 120, protein: 8, carbs: 22 },
  chickpeas: { kcal: 135, protein: 7, carbs: 23 }, lentils: { kcal: 115, protein: 9, carbs: 20 }, tofu: { kcal: 145, protein: 15, carbs: 4 },
  mushrooms: { kcal: 25, protein: 3, carbs: 4 }, potatoes: { kcal: 160, protein: 4, carbs: 37 }, 'sweet potatoes': { kcal: 115, protein: 2, carbs: 27 },
  broccoli: { kcal: 30, protein: 2, carbs: 6 }, cauliflower: { kcal: 25, protein: 2, carbs: 5 }, eggs: { kcal: 145, protein: 13, carbs: 1 },
  cheese: { kcal: 110, protein: 7, carbs: 1 }, rice: { kcal: 200, protein: 4, carbs: 45 }, pasta: { kcal: 200, protein: 7, carbs: 42 },
  tortillas: { kcal: 120, protein: 3, carbs: 24 }, 'tortilla chips': { kcal: 140, protein: 2, carbs: 18 }, beans: { kcal: 115, protein: 8, carbs: 20 },
  tomatoes: { kcal: 20, protein: 1, carbs: 4 }, onion: { kcal: 30, protein: 1, carbs: 7 }, carrot: { kcal: 25, protein: 1, carbs: 6 },
  lettuce: { kcal: 10, protein: 1, carbs: 2 }, 'bell pepper': { kcal: 25, protein: 1, carbs: 6 }, bread: { kcal: 80, protein: 3, carbs: 15 },
  flatbread: { kcal: 160, protein: 5, carbs: 30 }, tostadas: { kcal: 120, protein: 3, carbs: 22 },
  corn: { kcal: 70, protein: 2, carbs: 16 }, 'salsa verde': { kcal: 20, protein: 0, carbs: 4 },
};

export function estimateNutrition(main: string[], extras: string[], pantry: string[]): Nutrition | undefined {
  const ingredients = [...main, ...extras];
  // Never show a number if an ingredient has no serving estimate.
  if (ingredients.some(name => !servings[name])) return undefined;
  const total = ingredients.reduce((sum, name) => ({
    kcal: sum.kcal + servings[name].kcal, protein: sum.protein + servings[name].protein, carbs: sum.carbs + servings[name].carbs,
  }), { kcal: 0, protein: 0, carbs: 0 });
  if (pantry.includes('oil')) total.kcal += 40;
  return total;
}
