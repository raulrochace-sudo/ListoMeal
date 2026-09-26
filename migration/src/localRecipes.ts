import { dishes, type CuratedDish } from './curatedCatalog';
import { expandedDishes } from './expandedCatalog';
import { estimateNutrition, type Nutrition } from './nutrition';

export type LocalRecipe = {
  id: string; title: string; summary: string; minutes: number; method: string;
  ingredients: string[]; pantryBasics: string[]; optionalExtras: string[];
  steps: string[]; kidTip: string; nutrition?: Nutrition;
  styleKey?: string; familyKey?: string;
};
type Lang = 'en' | 'es';
type ProfileLike = { avoid: string; dislikes: string; diet: string };
const meat = new Set(['chicken','ground chicken','ground beef','stew beef','steak','pork','pork chops','ground pork','turkey','cooked turkey','salmon','canned salmon','white fish','shrimp','tuna','sausage','ham']);
const animalProducts = new Set(['eggs','cheese','milk','yogurt','feta','mozzarella','ricotta','parmesan','goat cheese']);
const normalize = (text: string) => text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
const words = (text: string) => text.split(/[,;\n]/).map(normalize).filter(Boolean);
const singular = (word: string) => word.replace(/oes$/, 'o').replace(/ies$/, 'y').replace(/es$/, match => match === 'es' && /[xsz]es$/.test(word) ? 'es' : 's').replace(/s$/, '');
const matchesIngredient = (a: string, b: string) => {
  const left = normalize(a).split(/[^a-z0-9]+/).filter(Boolean).map(singular);
  const right = normalize(b).split(/[^a-z0-9]+/).filter(Boolean).map(singular);
  return left.length > 0 && right.length > 0 && (left.every(word => right.includes(word)) || right.every(word => left.includes(word)));
};
const category = (title: string) => {
  if (/quesadilla/i.test(title)) return 'quesadilla';
  if (/nachos/i.test(title)) return 'nachos';
  if (/pasta|bolognese|lasagna|noodles|orzo|spaghetti|soba/i.test(title)) return 'pasta';
  if (/soup|chili|caldo/i.test(title)) return 'soup';
  if (/taco|fajita|tostada|burrito|wrap|pita/i.test(title)) return 'taco';
  if (/omelet|frittata|breakfast|eggs /i.test(title)) return 'egg';
  if (/salad/i.test(title)) return 'salad';
  if (/sandwich|panini|toast|mollete/i.test(title)) return 'sandwich';
  if (/stir fry|skillet/i.test(title)) return 'skillet';
  if (/curry|dal/i.test(title)) return 'curry';
  if (/rice bowl|fried rice/i.test(title)) return 'rice';
  if (/sheet-pan|foil|roast|baked/i.test(title)) return 'oven';
  if (/potato|hash/i.test(title)) return 'potato';
  return normalize(title);
};
function recipeFromDish(dish: CuratedDish, lang: Lang): LocalRecipe {
  return {
    id: dish.id,
    title: dish[lang],
    summary: lang === 'es' ? `Comida de ${dish.foodEs.slice(0, 3).join(', ')} con instrucciones paso a paso.` : `A ${dish.food.slice(0, 3).join(', ')} meal with step-by-step cooking instructions.`,
    minutes: dish.minutes, method: dish.method,
    ingredients: lang === 'es' ? dish.foodEs : dish.food,
    pantryBasics: lang === 'es' ? dish.pantryEs : dish.pantry,
    optionalExtras: [], steps: lang === 'es' ? dish.stepsEs : dish.stepsEn,
    kidTip: lang === 'es' ? 'Sirve las salsas aparte para que cada quien ajuste su plato.' : 'Serve sauces on the side so everyone can adjust their plate.',
    nutrition: estimateNutrition(dish.nutritionKeys, [], dish.pantry),
    styleKey: category(dish.en), familyKey: dish.food[0],
  };
}
const catalog = [...dishes, ...expandedDishes];
export function library(lang: Lang): LocalRecipe[] { return catalog.map(d => recipeFromDish(d, lang)); }
export function getLocalMeals(args: {lang:Lang;ingredients:string[];time:string;method:string;profile:ProfileLike;recentTitles:string[];nutritionGoal?:'none'|'lowCarb'|'highProtein';limit?:number}) {
  const {lang,ingredients,time,method,profile,recentTitles,nutritionGoal='none',limit=3} = args;
  const have = ingredients.map(normalize);
  const forbidden = [...words(profile.avoid),...words(profile.dislikes)];
  const diet = normalize(profile.diet);
  const recent = new Set(recentTitles.map(normalize));
  const maxMinutes = time === '60' ? 999 : Number(time || 20);
  const allowed = catalog.flatMap((dish, index) => {
    const keys = [...dish.food,...dish.foodEs,...dish.pantry,...dish.pantryEs].map(normalize);
    if (forbidden.some(term => keys.some(item => matchesIngredient(item,term)))) return [];
    if (/vegan|vegano/.test(diet) && dish.food.some(item => meat.has(item) || animalProducts.has(item))) return [];
    if (/vegetarian|vegetariano/.test(diet) && dish.food.some(item => meat.has(item))) return [];
    const recipe = recipeFromDish(dish, lang);
    if (nutritionGoal === 'lowCarb' && (!recipe.nutrition || recipe.nutrition.carbs > 30)) return [];
    if (nutritionGoal === 'highProtein' && (!recipe.nutrition || recipe.nutrition.protein < 25)) return [];
    const food = [...dish.food,...dish.foodEs].map(normalize);
    const main = [dish.food[0],dish.foodEs[0]].map(normalize);
    const matches = have.filter(item => food.some(name => matchesIngredient(name,item))).length;
    if (have.length > 0 && matches === 0) return [];
    const mainMatch = have.some(item => main.some(name => matchesIngredient(name,item)));
    const score = matches * 14 + (mainMatch ? 20 : have.length ? -12 : 0)
      + (dish.minutes <= maxMinutes ? 5 : -Math.min(22,dish.minutes-maxMinutes))
      + (method === 'Easiest' ? dish.minutes <= 20 ? 5 : 0 : dish.method === method ? 10 : -6)
      - (recent.has(normalize(recipe.title)) ? 60 : 0) - index * 0.0001;
    return [{recipe,score}];
  }).sort((a,b) => b.score-a.score);
  const result:LocalRecipe[] = []; const used = new Set<string>();
  for (const choose of [false,true]) for (const {recipe} of allowed) {
    if (result.length === limit) return result;
    if (!choose && recent.has(normalize(recipe.title))) continue;
    if (used.has(recipe.styleKey || '')) continue;
    result.push(recipe); used.add(recipe.styleKey || '');
  }
  return result;
}
