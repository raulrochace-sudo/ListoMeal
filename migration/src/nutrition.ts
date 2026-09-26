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
  'caesar dressing':{kcal:80,protein:0,carbs:1},
  apple:{kcal:50,protein:0,carbs:14},avocado:{kcal:80,protein:1,carbs:4},'barbecue sauce':{kcal:35,protein:0,carbs:9},barley:{kcal:100,protein:3,carbs:22},basil:{kcal:1,protein:0,carbs:0},beets:{kcal:35,protein:1,carbs:8},breadcrumbs:{kcal:55,protein:2,carbs:10},'butternut squash':{kcal:65,protein:1,carbs:16},cabbage:{kcal:20,protein:1,carbs:5},'canned salmon':{kcal:150,protein:23,carbs:0},celery:{kcal:10,protein:0,carbs:2},'coconut milk':{kcal:90,protein:1,carbs:3},'cooked turkey':{kcal:145,protein:28,carbs:0},couscous:{kcal:175,protein:6,carbs:36},'cranberry sauce':{kcal:35,protein:0,carbs:9},cucumber:{kcal:15,protein:1,carbs:3},dill:{kcal:1,protein:0,carbs:0},'dumpling wrappers':{kcal:90,protein:2,carbs:19},eggplant:{kcal:25,protein:1,carbs:6},feta:{kcal:75,protein:4,carbs:1},flour:{kcal:55,protein:2,carbs:12},garlic:{kcal:5,protein:0,carbs:1},ginger:{kcal:3,protein:0,carbs:1},'goat cheese':{kcal:80,protein:5,carbs:0},'green beans':{kcal:25,protein:2,carbs:5},'green onion':{kcal:5,protein:0,carbs:1},grits:{kcal:145,protein:3,carbs:31},'ground chicken':{kcal:170,protein:26,carbs:0},'ground pork':{kcal:225,protein:23,carbs:0},hominy:{kcal:85,protein:2,carbs:18},honey:{kcal:20,protein:0,carbs:6},kale:{kcal:25,protein:2,carbs:5},'kidney beans':{kcal:110,protein:8,carbs:20},'lasagna sheets':{kcal:190,protein:7,carbs:40},lemon:{kcal:5,protein:0,carbs:2},lime:{kcal:5,protein:0,carbs:2},mango:{kcal:50,protein:1,carbs:12},milk:{kcal:60,protein:4,carbs:6},mozzarella:{kcal:85,protein:6,carbs:1},noodles:{kcal:190,protein:6,carbs:39},olives:{kcal:25,protein:0,carbs:1},orange:{kcal:30,protein:1,carbs:8},orzo:{kcal:190,protein:7,carbs:40},parmesan:{kcal:45,protein:4,carbs:0},'pasta shells':{kcal:190,protein:7,carbs:40},pastry:{kcal:175,protein:3,carbs:20},'peanut butter':{kcal:95,protein:4,carbs:3},peas:{kcal:65,protein:4,carbs:12},pesto:{kcal:80,protein:1,carbs:2},pineapple:{kcal:40,protein:0,carbs:11},pita:{kcal:165,protein:5,carbs:33},'pork chops':{kcal:185,protein:26,carbs:0},pumpkin:{kcal:45,protein:2,carbs:11},radishes:{kcal:5,protein:0,carbs:1},'red onion':{kcal:15,protein:0,carbs:3},ricotta:{kcal:85,protein:5,carbs:3},'soba noodles':{kcal:190,protein:8,carbs:40},'soy sauce':{kcal:5,protein:1,carbs:1},spinach:{kcal:10,protein:1,carbs:1},'stew beef':{kcal:220,protein:27,carbs:0},'teriyaki sauce':{kcal:40,protein:1,carbs:8},tomatillos:{kcal:20,protein:1,carbs:4},walnuts:{kcal:90,protein:2,carbs:2},'white beans':{kcal:115,protein:8,carbs:21},'white fish':{kcal:110,protein:23,carbs:0},yogurt:{kcal:70,protein:7,carbs:5},zucchini:{kcal:20,protein:1,carbs:4},
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
