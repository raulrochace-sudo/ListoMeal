import { estimateNutrition, type Nutrition } from './nutrition';
export type LocalRecipe = {
  id: string;
  title: string;
  summary: string;
  minutes: number;
  method: string;
  ingredients: string[];
  pantryBasics: string[];
  optionalExtras: string[];
  steps: string[];
  kidTip: string;
  nutrition?: Nutrition;
};

type Lang = 'en' | 'es';
type ProfileLike = { avoid: string; dislikes: string; diet: string; };
type Family = { en: string; es: string; ingredients: string[]; vegetarian?: boolean; vegan?: boolean };
type Style = { en: string; es: string; method: string; minutes: number; extras: string[]; pantry: string[]; optional: string[]; summaryEn: string; summaryEs: string };
const proteinFamilies: Family[] = [
  { en: 'Chicken', es: 'Pollo', ingredients: ['chicken'] },
  { en: 'Ground Beef', es: 'Carne molida', ingredients: ['ground beef'] },
  { en: 'Steak', es: 'Bistec', ingredients: ['steak'] },
  { en: 'Pork', es: 'Cerdo', ingredients: ['pork'] },
  { en: 'Turkey', es: 'Pavo', ingredients: ['turkey'] },
  { en: 'Salmon', es: 'Salmón', ingredients: ['salmon'] },
  { en: 'Shrimp', es: 'Camarones', ingredients: ['shrimp'] },
  { en: 'Tuna', es: 'Atún', ingredients: ['tuna'] },
  { en: 'Sausage', es: 'Salchicha', ingredients: ['sausage'] },
  { en: 'Ham', es: 'Jamón', ingredients: ['ham'] },
];
const vegetarianFamilies: Family[] = [
  { en: 'Black Bean', es: 'Frijol negro', vegetarian: true, vegan: true, ingredients: ['black beans'] },
  { en: 'Pinto Bean', es: 'Frijol pinto', vegetarian: true, vegan: true, ingredients: ['pinto beans'] },
  { en: 'Chickpea', es: 'Garbanzo', vegetarian: true, vegan: true, ingredients: ['chickpeas'] },
  { en: 'Lentil', es: 'Lenteja', vegetarian: true, vegan: true, ingredients: ['lentils'] },
  { en: 'Tofu', es: 'Tofu', vegetarian: true, vegan: true, ingredients: ['tofu'] },
  { en: 'Mushroom', es: 'Champiñón', vegetarian: true, ingredients: ['mushrooms'] },
  { en: 'Potato', es: 'Papa', vegetarian: true, vegan: true, ingredients: ['potatoes'] },
  { en: 'Sweet Potato', es: 'Camote', vegetarian: true, vegan: true, ingredients: ['sweet potatoes'] },
  { en: 'Broccoli', es: 'Brócoli', vegetarian: true, vegan: true, ingredients: ['broccoli'] },
  { en: 'Cauliflower', es: 'Coliflor', vegetarian: true, vegan: true, ingredients: ['cauliflower'] },
];
const breakfastFamilies: Family[] = [
  { en: 'Egg', es: 'Huevo', vegetarian: true, ingredients: ['eggs'] },
  { en: 'Cheesy Egg', es: 'Huevo con queso', vegetarian: true, ingredients: ['eggs', 'cheese'] },
  { en: 'Potato Egg', es: 'Papa con huevo', vegetarian: true, ingredients: ['potatoes', 'eggs'] },
  { en: 'Bean Egg', es: 'Frijol con huevo', vegetarian: true, ingredients: ['beans', 'eggs'] },
  { en: 'Veggie Egg', es: 'Huevo con verduras', vegetarian: true, ingredients: ['eggs', 'bell pepper', 'onion'] },
];

const styles: Style[] = [
  { en: 'Taco Skillet', es: 'Sartén de tacos', method: 'Stove', minutes: 20, extras: ['tortillas', 'tomatoes'], pantry: ['oil', 'salt', 'pepper', 'cumin'], optional: ['cheese', 'avocado', 'lime'], summaryEn: 'A fast taco-style skillet for an easy family dinner.', summaryEs: 'Un sartén estilo taco rápido para una cena familiar fácil.' },
  { en: 'Rice Bowl', es: 'Tazón con arroz', method: 'Stove', minutes: 20, extras: ['rice', 'onion'], pantry: ['oil', 'salt', 'pepper'], optional: ['cilantro', 'lime', 'hot sauce'], summaryEn: 'A simple bowl built around rice and what you already have.', summaryEs: 'Un tazón sencillo con arroz y lo que ya tienes.' },
  { en: 'Pasta Toss', es: 'Pasta rápida', method: 'Stove', minutes: 20, extras: ['pasta', 'tomatoes'], pantry: ['oil', 'salt', 'pepper', 'garlic'], optional: ['parmesan', 'parsley'], summaryEn: 'Quick pasta with a flexible, pantry-friendly sauce.', summaryEs: 'Pasta rápida con una salsa flexible y fácil de despensa.' },
  { en: 'Quesadilla', es: 'Quesadilla', method: 'Stove', minutes: 10, extras: ['tortillas', 'cheese'], pantry: ['oil'], optional: ['salsa', 'avocado'], summaryEn: 'Crispy quesadillas with a filling the whole family can customize.', summaryEs: 'Quesadillas crujientes con un relleno que todos pueden personalizar.' },
  { en: 'Sheet-Pan Dinner', es: 'Cena en charola', method: 'Oven', minutes: 30, extras: ['potatoes', 'onion'], pantry: ['oil', 'salt', 'pepper', 'garlic'], optional: ['lemon', 'herbs'], summaryEn: 'A low-mess oven dinner with simple roasted sides.', summaryEs: 'Una cena al horno con poca limpieza y guarniciones sencillas.' },
  { en: 'Air Fryer Bites', es: 'Bocados en air fryer', method: 'Air Fryer', minutes: 20, extras: ['potatoes'], pantry: ['oil', 'salt', 'pepper', 'paprika'], optional: ['ranch', 'lime'], summaryEn: 'Crispy air-fryer bites with very little prep.', summaryEs: 'Bocados crujientes en air fryer con muy poca preparación.' },
  { en: 'Loaded Nachos', es: 'Nachos cargados', method: 'Oven', minutes: 20, extras: ['tortilla chips', 'cheese', 'tomatoes'], pantry: ['salt'], optional: ['salsa', 'avocado', 'sour cream'], summaryEn: 'A shareable tray of loaded nachos made for busy nights.', summaryEs: 'Una charola de nachos cargados ideal para noches ocupadas.' },
  { en: 'Burrito Bowl', es: 'Tazón burrito', method: 'Stove', minutes: 20, extras: ['rice', 'beans', 'tomatoes'], pantry: ['oil', 'salt', 'cumin'], optional: ['cheese', 'corn', 'lime'], summaryEn: 'A build-your-own burrito bowl with familiar ingredients.', summaryEs: 'Un tazón burrito para armar al gusto con ingredientes conocidos.' },
  { en: 'One-Pot Rice', es: 'Arroz de una olla', method: 'Stove', minutes: 30, extras: ['rice', 'tomatoes', 'onion'], pantry: ['oil', 'salt', 'pepper', 'garlic'], optional: ['peas', 'cilantro'], summaryEn: 'A cozy one-pot rice meal with minimal cleanup.', summaryEs: 'Una comida reconfortante de arroz en una sola olla y poca limpieza.' },
  { en: 'Veggie Stir-Fry', es: 'Salteado con verduras', method: 'Stove', minutes: 20, extras: ['broccoli', 'carrot', 'onion'], pantry: ['oil', 'soy sauce', 'garlic'], optional: ['rice', 'sesame seeds'], summaryEn: 'A colorful stir-fry that works with almost any vegetables.', summaryEs: 'Un salteado colorido que funciona con casi cualquier verdura.' },
  { en: 'Wrap', es: 'Wrap', method: 'Easiest', minutes: 10, extras: ['tortillas', 'lettuce', 'tomatoes'], pantry: ['salt', 'pepper'], optional: ['cheese', 'ranch'], summaryEn: 'A quick handheld meal for lunches or no-fuss dinners.', summaryEs: 'Una comida rápida para lunch o una cena sin complicaciones.' },
  { en: 'Mexican-Style Soup', es: 'Sopa estilo mexicana', method: 'Stove', minutes: 30, extras: ['tomatoes', 'corn', 'beans'], pantry: ['salt', 'pepper', 'cumin', 'garlic'], optional: ['lime', 'cilantro', 'tortilla chips'], summaryEn: 'A warm, flexible soup with familiar Mexican-inspired flavors.', summaryEs: 'Una sopa calientita y flexible con sabores mexicanos conocidos.' },
  { en: 'Creamy Skillet', es: 'Sartén cremoso', method: 'Stove', minutes: 20, extras: ['onion'], pantry: ['oil', 'salt', 'pepper', 'garlic'], optional: ['cream cheese', 'spinach'], summaryEn: 'A creamy skillet dinner that comes together fast.', summaryEs: 'Una cena cremosa en sartén que se prepara rápido.' },
  { en: 'Baked Casserole', es: 'Cazuela al horno', method: 'Oven', minutes: 30, extras: ['rice', 'cheese'], pantry: ['oil', 'salt', 'pepper'], optional: ['corn', 'breadcrumbs'], summaryEn: 'A family-style baked casserole with pantry staples.', summaryEs: 'Una cazuela familiar al horno con básicos de despensa.' },
  { en: 'Flatbread Melt', es: 'Pan plano gratinado', method: 'Oven', minutes: 20, extras: ['flatbread', 'cheese', 'tomatoes'], pantry: ['oil', 'garlic'], optional: ['spinach', 'onion'], summaryEn: 'A pizza-like melt that is fast and easy to customize.', summaryEs: 'Un gratinado tipo pizza rápido y fácil de personalizar.' },
  { en: 'Microwave Bowl', es: 'Tazón al microondas', method: 'Microwave', minutes: 10, extras: ['rice', 'cheese'], pantry: ['salt', 'pepper'], optional: ['salsa', 'corn'], summaryEn: 'A super-fast microwave bowl for the busiest days.', summaryEs: 'Un tazón rapidísimo al microondas para los días más ocupados.' },
  { en: 'Loaded Potato', es: 'Papa cargada', method: 'Microwave', minutes: 20, extras: ['potatoes', 'cheese'], pantry: ['salt', 'pepper'], optional: ['green onion', 'sour cream'], summaryEn: 'A filling loaded potato that turns leftovers into dinner.', summaryEs: 'Una papa cargada que convierte sobras en una cena completa.' },
  { en: 'Crispy Tostadas', es: 'Tostadas crujientes', method: 'Oven', minutes: 20, extras: ['tostadas', 'beans', 'lettuce'], pantry: ['salt'], optional: ['cheese', 'salsa', 'avocado'], summaryEn: 'Crunchy tostadas with easy mix-and-match toppings.', summaryEs: 'Tostadas crujientes con toppings fáciles de combinar.' },
  { en: 'Fajita Skillet', es: 'Fajitas en sartén', method: 'Stove', minutes: 20, extras: ['bell pepper', 'onion', 'tortillas'], pantry: ['oil', 'salt', 'pepper', 'cumin'], optional: ['lime', 'cheese'], summaryEn: 'Fast fajitas with peppers and onions in one pan.', summaryEs: 'Fajitas rápidas con pimientos y cebolla en un solo sartén.' },
  { en: 'Salsa Verde Plate', es: 'Platillo en salsa verde', method: 'Stove', minutes: 30, extras: ['salsa verde', 'onion'], pantry: ['oil', 'salt'], optional: ['rice', 'tortillas', 'cilantro'], summaryEn: 'A simple salsa verde dinner with big flavor and little fuss.', summaryEs: 'Una cena sencilla en salsa verde con mucho sabor y poca complicación.' },
];

const breakfastStyles: Style[] = [
  { en: 'Breakfast Tacos', es: 'Tacos de desayuno', method: 'Stove', minutes: 10, extras: ['tortillas'], pantry: ['oil', 'salt', 'pepper'], optional: ['cheese', 'salsa'], summaryEn: 'Fast breakfast tacos that also work for dinner.', summaryEs: 'Tacos de desayuno rápidos que también funcionan para la cena.' },
  { en: 'Breakfast Burrito', es: 'Burrito de desayuno', method: 'Stove', minutes: 20, extras: ['tortillas', 'potatoes'], pantry: ['oil', 'salt', 'pepper'], optional: ['cheese', 'salsa'], summaryEn: 'A filling breakfast burrito with simple pantry staples.', summaryEs: 'Un burrito de desayuno llenador con básicos sencillos.' },
  { en: 'Egg Rice Bowl', es: 'Tazón de arroz con huevo', method: 'Stove', minutes: 20, extras: ['rice'], pantry: ['oil', 'salt', 'pepper'], optional: ['avocado', 'hot sauce'], summaryEn: 'A quick rice bowl topped with eggs and easy extras.', summaryEs: 'Un tazón de arroz rápido con huevo y extras sencillos.' },
  { en: 'Breakfast Quesadilla', es: 'Quesadilla de desayuno', method: 'Stove', minutes: 10, extras: ['tortillas', 'cheese'], pantry: ['oil'], optional: ['salsa', 'avocado'], summaryEn: 'Crispy breakfast quesadillas ready in minutes.', summaryEs: 'Quesadillas de desayuno crujientes listas en minutos.' },
  { en: 'Egg Toast Melt', es: 'Pan tostado con huevo', method: 'Oven', minutes: 20, extras: ['bread', 'cheese'], pantry: ['salt', 'pepper'], optional: ['tomatoes', 'spinach'], summaryEn: 'A warm egg-and-cheese toast melt for any time of day.', summaryEs: 'Un pan caliente con huevo y queso para cualquier hora.' },
  { en: 'Microwave Egg Bowl', es: 'Tazón de huevo al microondas', method: 'Microwave', minutes: 10, extras: ['cheese'], pantry: ['salt', 'pepper'], optional: ['spinach', 'tomatoes'], summaryEn: 'A fast microwave egg bowl with almost no cleanup.', summaryEs: 'Un tazón de huevo al microondas rápido y con casi nada de limpieza.' },
  { en: 'Egg Potato Skillet', es: 'Sartén de papa con huevo', method: 'Stove', minutes: 20, extras: ['potatoes', 'onion'], pantry: ['oil', 'salt', 'pepper'], optional: ['cheese', 'salsa'], summaryEn: 'A hearty potato-and-egg skillet for breakfast or dinner.', summaryEs: 'Un sartén llenador de papa con huevo para desayuno o cena.' },
  { en: 'Breakfast Nachos', es: 'Nachos de desayuno', method: 'Oven', minutes: 20, extras: ['tortilla chips', 'cheese'], pantry: ['salt'], optional: ['beans', 'salsa'], summaryEn: 'Fun breakfast nachos that kids can help assemble.', summaryEs: 'Nachos de desayuno divertidos que los niños pueden ayudar a armar.' },
  { en: 'Egg Fried Rice', es: 'Arroz frito con huevo', method: 'Stove', minutes: 20, extras: ['rice', 'onion'], pantry: ['oil', 'soy sauce'], optional: ['peas', 'carrot'], summaryEn: 'A quick fried-rice meal that is perfect for leftover rice.', summaryEs: 'Un arroz frito rápido perfecto para aprovechar arroz sobrante.' },
  { en: 'Breakfast Pizza', es: 'Pizza de desayuno', method: 'Oven', minutes: 20, extras: ['flatbread', 'cheese'], pantry: ['oil', 'salt', 'pepper'], optional: ['tomatoes', 'spinach'], summaryEn: 'A fun flatbread breakfast pizza for the whole family.', summaryEs: 'Una pizza de desayuno en pan plano para toda la familia.' },
  { en: 'Egg Bean Bowl', es: 'Tazón de huevo con frijoles', method: 'Stove', minutes: 20, extras: ['beans', 'rice'], pantry: ['oil', 'salt'], optional: ['salsa', 'cheese'], summaryEn: 'A protein-packed bowl made from simple staples.', summaryEs: 'Un tazón con buena proteína hecho con ingredientes sencillos.' },
  { en: 'Egg Fajita Wrap', es: 'Wrap de fajita con huevo', method: 'Stove', minutes: 20, extras: ['bell pepper', 'onion', 'tortillas'], pantry: ['oil', 'salt', 'pepper'], optional: ['cheese', 'salsa'], summaryEn: 'Eggs, peppers and onions wrapped into an easy meal.', summaryEs: 'Huevo, pimientos y cebolla envueltos en una comida fácil.' },
  { en: 'Egg Pasta', es: 'Pasta con huevo', method: 'Stove', minutes: 20, extras: ['pasta'], pantry: ['oil', 'salt', 'pepper', 'garlic'], optional: ['parmesan', 'spinach'], summaryEn: 'A simple savory egg pasta for a quick family meal.', summaryEs: 'Una pasta sencilla con huevo para una comida familiar rápida.' },
  { en: 'Baked Egg Cups', es: 'Huevitos al horno', method: 'Oven', minutes: 30, extras: ['cheese'], pantry: ['oil', 'salt', 'pepper'], optional: ['spinach', 'bell pepper'], summaryEn: 'Easy baked egg cups that are great for make-ahead meals.', summaryEs: 'Huevitos fáciles al horno ideales para preparar con anticipación.' },
  { en: 'Air Fryer Egg Toast', es: 'Pan con huevo en air fryer', method: 'Air Fryer', minutes: 10, extras: ['bread', 'cheese'], pantry: ['salt', 'pepper'], optional: ['tomatoes', 'hot sauce'], summaryEn: 'Crispy air-fryer egg toast in about ten minutes.', summaryEs: 'Pan crujiente con huevo en air fryer en unos diez minutos.' },
  { en: 'Egg Tostadas', es: 'Tostadas con huevo', method: 'Stove', minutes: 20, extras: ['tostadas', 'beans'], pantry: ['oil', 'salt'], optional: ['salsa', 'cheese'], summaryEn: 'Crunchy tostadas topped with eggs and pantry staples.', summaryEs: 'Tostadas crujientes con huevo y básicos de despensa.' },
  { en: 'Egg Salsa Verde', es: 'Huevo en salsa verde', method: 'Stove', minutes: 20, extras: ['salsa verde', 'onion'], pantry: ['oil', 'salt'], optional: ['tortillas', 'cheese'], summaryEn: 'Eggs simmered in salsa verde for a quick Mexican-style meal.', summaryEs: 'Huevos en salsa verde para una comida mexicana rápida.' },
  { en: 'Egg Veggie Stir-Fry', es: 'Salteado de huevo con verduras', method: 'Stove', minutes: 20, extras: ['broccoli', 'carrot', 'onion'], pantry: ['oil', 'soy sauce'], optional: ['rice', 'sesame seeds'], summaryEn: 'A fast veggie stir-fry finished with scrambled egg.', summaryEs: 'Un salteado rápido de verduras terminado con huevo revuelto.' },
  { en: 'Egg Loaded Potato', es: 'Papa cargada con huevo', method: 'Microwave', minutes: 20, extras: ['potatoes', 'cheese'], pantry: ['salt', 'pepper'], optional: ['salsa', 'green onion'], summaryEn: 'A loaded potato topped with eggs for extra staying power.', summaryEs: 'Una papa cargada con huevo para hacerla más completa.' },
  { en: 'Egg Casserole', es: 'Cazuela de huevo', method: 'Oven', minutes: 30, extras: ['potatoes', 'cheese'], pantry: ['oil', 'salt', 'pepper'], optional: ['spinach', 'onion'], summaryEn: 'A simple baked egg casserole for breakfast-for-dinner nights.', summaryEs: 'Una cazuela sencilla de huevo para noches de desayuno como cena.' },
];

const extraEs: Record<string, string> = {
  beans: 'frijoles', 'bell pepper': 'pimiento', bread: 'pan', broccoli: 'brócoli', carrot: 'zanahoria', cheese: 'queso',
  corn: 'elote', flatbread: 'pan plano', lettuce: 'lechuga', onion: 'cebolla', pasta: 'pasta', potatoes: 'papas',
  rice: 'arroz', 'salsa verde': 'salsa verde', tomatoes: 'jitomate', 'tortilla chips': 'totopos', tortillas: 'tortillas', tostadas: 'tostadas',
  cumin: 'comino', garlic: 'ajo', oil: 'aceite', paprika: 'paprika', pepper: 'pimienta', salt: 'sal', 'soy sauce': 'salsa de soya',
  avocado: 'aguacate', breadcrumbs: 'pan molido', cilantro: 'cilantro', 'cream cheese': 'queso crema', 'green onion': 'cebollín',
  herbs: 'hierbas', 'hot sauce': 'salsa picante', lemon: 'limón amarillo', lime: 'limón', parmesan: 'parmesano', parsley: 'perejil',
  peas: 'chícharos', ranch: 'aderezo ranch', salsa: 'salsa', 'sesame seeds': 'ajonjolí', 'sour cream': 'crema', spinach: 'espinaca',
};
function localize(item: string, lang: Lang) { return lang === 'es' ? (extraEs[item] || item) : item; }
function normalize(value: string) { return value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim(); }
function splitTerms(value: string) { return value.split(/[,;\n]/).map(normalize).filter(Boolean); }
function buildSteps(family: Family, style: Style, lang: Lang): string[] {
  const protein = lang === 'es' ? family.es.toLowerCase() : family.en.toLowerCase();
  const additions = style.extras.join(', ');
  const eggs = family.ingredients.includes('eggs');
  const rawMeat = family.ingredients.some(item => ['chicken', 'ground beef', 'steak', 'pork', 'turkey', 'salmon', 'shrimp', 'sausage'].includes(item));
  const safety = eggs
    ? (lang === 'es' ? 'Cocina el huevo hasta que la clara y la yema estén firmes; si es huevo revuelto, que no quede líquido.' : 'Cook eggs until whites and yolks are firm; scrambled eggs should have no visible liquid.')
    : rawMeat
      ? (lang === 'es' ? 'Cocina la proteína por completo y comprueba la temperatura interna con un termómetro: pollo o pavo 74 °C; carne molida 71 °C; pescado 63 °C; camarones opacos y firmes.' : 'Cook the protein fully and check its internal temperature with a thermometer: chicken or turkey 165°F; ground meat 160°F; fish 145°F; shrimp opaque and firm.')
      : (lang === 'es' ? 'Calienta la proteína vegetal hasta que esté bien caliente y las verduras hasta que queden tiernas.' : 'Heat plant protein until hot throughout and cook vegetables until tender.');
  const heat = style.method === 'Oven'
    ? (lang === 'es' ? 'Precalienta el horno a 200 °C. Coloca los ingredientes en una charola o refractario, separados en una sola capa.' : 'Preheat the oven to 400°F. Arrange ingredients on a baking sheet or dish in one layer.')
    : style.method === 'Air Fryer'
      ? (lang === 'es' ? 'Precalienta la freidora de aire a 190 °C. Coloca los ingredientes en una sola capa sin llenar demasiado la canasta.' : 'Preheat the air fryer to 375°F. Arrange ingredients in one layer without crowding the basket.')
      : style.method === 'Microwave'
        ? (lang === 'es' ? 'Pon los ingredientes en un recipiente apto para microondas y cúbrelo sin sellar para dejar salir el vapor.' : 'Put the ingredients in a microwave-safe bowl and cover loosely so steam can escape.')
        : (lang === 'es' ? 'Calienta un sartén a fuego medio; añade un poco de aceite si aparece entre los básicos de despensa.' : 'Heat a skillet over medium heat; add a little oil if listed among the pantry basics.');
  const cook = style.method === 'Oven'
    ? (lang === 'es' ? 'Hornea y revisa cada 10 minutos; mueve los ingredientes a mitad de cocción para que se doren de forma pareja.' : 'Bake and check every 10 minutes; turn ingredients halfway through so they brown evenly.')
    : style.method === 'Air Fryer'
      ? (lang === 'es' ? 'Cocina en tandas cortas de 5 minutos; sacude la canasta entre tandas y revisa que no se queme.' : 'Cook in 5-minute batches; shake the basket between batches and check for burning.')
      : style.method === 'Microwave'
        ? (lang === 'es' ? 'Calienta en intervalos de 1 minuto y revuelve entre intervalos para evitar partes frías.' : 'Heat in 1-minute intervals and stir between intervals to avoid cold spots.')
        : (lang === 'es' ? 'Cocina la proteína, volteándola o revolviéndola con frecuencia para que se caliente de forma uniforme.' : 'Cook the protein, turning or stirring regularly so it heats evenly.');
  return lang === 'es'
    ? [`Lee la lista de ingredientes. Separa ${protein} y prepara los demás: ${additions}. Lava las verduras y corta todo en trozos de tamaño parecido.`, `Prepara primero los acompañamientos que tardan más, como arroz, pasta o papas, siguiendo las instrucciones de su paquete; si son sobras, caliéntalos bien.`, heat, cook, safety, `Incorpora ${additions} según corresponda al platillo; añade primero los ingredientes que necesitan cocción y al final los que se sirven frescos. Revuelve para unir sabores.`, 'Prueba y ajusta la sazón con los básicos de despensa indicados. Deja reposar 2 minutos, sirve caliente y agrega extras opcionales solo si los tienes.']
    : [`Read the ingredient list. Set out ${protein} and prepare the rest: ${additions}. Wash vegetables and cut everything into similar-sized pieces.`, 'Prepare longer-cooking sides such as rice, pasta, or potatoes first, following package directions; heat leftovers thoroughly.', heat, cook, safety, `Add ${additions} as appropriate for the dish; cook items that need heat first and add fresh toppings last. Stir to combine.`, 'Taste and adjust seasoning using the listed pantry basics. Rest for 2 minutes, serve warm, and add optional extras only if available.'];
}
function buildRecipe(family: Family, style: Style, index: number, lang: Lang): LocalRecipe {
  const title = lang === 'en' ? `${family.en} ${style.en}` : `${style.es} de ${family.es.toLowerCase()}`;
  const familyIngredient = lang === 'en' ? family.en : family.es;
  const ingredients = [familyIngredient, ...style.extras.map(e => localize(e, lang))];
  return {
    id: `local-${index}`, title, summary: lang === 'en' ? style.summaryEn : style.summaryEs, minutes: style.minutes, method: style.method, ingredients,
    pantryBasics: style.pantry.map(p => localize(p, lang)), optionalExtras: style.optional.map(o => localize(o, lang)),
    steps: buildSteps(family, style, lang),
    nutrition: estimateNutrition(family.ingredients, style.extras, style.pantry),
    kidTip: lang === 'en' ? 'Keep sauces and toppings on the side so kids can build their own plate.' : 'Sirve salsas y toppings aparte para que los niños armen su propio plato.',
  };
}
function library(lang: Lang) {
  const recipes: LocalRecipe[] = []; let index = 1;
  for (const family of proteinFamilies) for (const style of styles) {
    // A short microwave or no-cook template cannot safely describe cooking raw meat or seafood.
    if (style.method === 'Microwave' || style.method === 'Easiest') continue;
    recipes.push(buildRecipe(family, style, index++, lang));
  }
  for (const family of vegetarianFamilies) for (const style of styles) recipes.push(buildRecipe(family, style, index++, lang));
  for (const family of breakfastFamilies) for (const style of breakfastStyles) recipes.push(buildRecipe(family, style, index++, lang));
  return recipes;
}
export function getLocalMeals(args: { lang: Lang; ingredients: string[]; time: string; method: string; profile: ProfileLike; recentTitles: string[]; nutritionGoal?: 'none' | 'lowCarb' | 'highProtein'; }) {
  const { lang, ingredients, time, method, profile, recentTitles, nutritionGoal = 'none' } = args;
  const have = ingredients.map(normalize), avoid = splitTerms(profile.avoid), dislikes = splitTerms(profile.dislikes), diet = normalize(profile.diet), recent = new Set(recentTitles.map(normalize));
  const maxMinutes = time === '60' ? 999 : Number(time || 20);
  const scored = library(lang).map((recipe, index) => {
    const searchable = normalize([recipe.title, ...recipe.ingredients, ...recipe.pantryBasics, ...recipe.optionalExtras].join(' '));
    const forbidden = [...avoid, ...dislikes].some(term => term && searchable.includes(term)); if (forbidden) return { recipe, score: -10000 };
    if (nutritionGoal === 'lowCarb' && (!recipe.nutrition || recipe.nutrition.carbs > 30)) return { recipe, score: -10000 };
    if (nutritionGoal === 'highProtein' && (!recipe.nutrition || recipe.nutrition.protein < 25)) return { recipe, score: -10000 };
    const isMeat = ['chicken','beef','steak','pork','turkey','salmon','shrimp','tuna','sausage','ham','pollo','carne','bistec','cerdo','pavo','salmon','camar','atun','salchicha','jamon'].some(term => searchable.includes(term));
    if ((diet.includes('vegetarian') || diet.includes('vegetar')) && isMeat) return { recipe, score: -10000 };
    if ((diet.includes('vegan') || diet.includes('vegano')) && (isMeat || searchable.includes('egg') || searchable.includes('huevo') || searchable.includes('cheese') || searchable.includes('queso'))) return { recipe, score: -10000 };
    const matches = have.filter(item => searchable.includes(item) || searchable.split(' ').some(word => item.includes(word) && word.length > 3)).length;
    let score = matches * 12; if (recipe.minutes <= maxMinutes) score += 5; else score -= Math.min(12, recipe.minutes - maxMinutes);
    if (method === 'Easiest') score += recipe.minutes <= 20 ? 4 : 0; else if (recipe.method === method) score += 8; else score -= 2;
    if (recent.has(normalize(recipe.title))) score -= 20; score += (500 - index) * 0.0001; return { recipe, score };
  });
  const eligible = scored.filter(item => item.score > -1000).sort((a,b) => b.score - a.score); const top = eligible.slice(0,3).map(item => item.recipe);
  if (top.length === 3) return top;
  // Never fill a short list with recipes that violate the chosen nutrition goal or allergies.
  return top;
}
