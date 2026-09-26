import { useEffect, useMemo, useRef, useState } from 'react';
const api = { post: async (path: string, body: unknown) => {
  const response = await fetch(path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  if (!response.ok) throw new Error(`Request failed: ${response.status}`);
  return { data: await response.json() };
} };
import { getLocalMeals } from './localRecipes';
import type { Nutrition } from './nutrition';
import * as cocoSsd from '@tensorflow-models/coco-ssd';
import * as mobilenet from '@tensorflow-models/mobilenet';
import { createWorker } from 'tesseract.js';
import '@tensorflow/tfjs';
import {
  BookOpen,
  Camera,
  ChefHat,
  Clock3,
  Flame,
  Heart,
  History,
  Languages,
  MessageCircle,
  Minus,
  Music,
  Plus,
  Refrigerator,
  Share2,
  Shuffle,
  Sparkles,
  Star,
  UserRound,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react';

type Recipe = {
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

type Profile = {
  name: string;
  adults: number;
  kids: number;
  ages: string;
  avoid: string;
  dislikes: string;
  diet: string;
};
type HistoryItem = {
  recipe: Recipe;
  rating: 'loved' | 'good' | 'meh' | 'nope';
  at: string;
};
type Lang = 'en' | 'es';
type Tab = 'home' | 'favorites' | 'history' | 'profile';

const commonIngredients: { key: string; en: string; es: string }[] = [
  { key: 'chicken', en: 'Chicken', es: 'Pollo' },
  { key: 'ground beef', en: 'Ground beef', es: 'Carne molida' },
  { key: 'eggs', en: 'Eggs', es: 'Huevo' },
  { key: 'rice', en: 'Rice', es: 'Arroz' },
  { key: 'pasta', en: 'Pasta', es: 'Pasta' },
  { key: 'potatoes', en: 'Potatoes', es: 'Papas' },
  { key: 'tortillas', en: 'Tortillas', es: 'Tortillas' },
  { key: 'cheese', en: 'Cheese', es: 'Queso' },
  { key: 'beans', en: 'Beans', es: 'Frijoles' },
  { key: 'tomatoes', en: 'Tomatoes', es: 'Jitomate' },
  { key: 'onion', en: 'Onion', es: 'Cebolla' },
  { key: 'broccoli', en: 'Broccoli', es: 'Brócoli' },
];

const localScanFoods: Record<string, { en: string; es: string }> = {
  apple: { en: 'Apple', es: 'Manzana' },
  banana: { en: 'Banana', es: 'Plátano' },
  orange: { en: 'Orange', es: 'Naranja' },
  broccoli: { en: 'Broccoli', es: 'Brócoli' },
  carrot: { en: 'Carrot', es: 'Zanahoria' },
  sandwich: { en: 'Sandwich', es: 'Sándwich' },
  'hot dog': { en: 'Hot dog', es: 'Hot dog' },
  pizza: { en: 'Pizza', es: 'Pizza' },
  donut: { en: 'Donut', es: 'Dona' },
  cake: { en: 'Cake', es: 'Pastel' },
};

const ocrFoodLabels: Array<{ keys: string[]; en: string; es: string }> = [
  { keys: ['egg', 'eggs', 'huevo', 'huevos'], en: 'Eggs', es: 'Huevos' },
  { keys: ['milk', 'leche'], en: 'Milk', es: 'Leche' },
  { keys: ['cheese', 'queso', 'cheddar', 'mozzarella'], en: 'Cheese', es: 'Queso' },
  { keys: ['chicken', 'pollo'], en: 'Chicken', es: 'Pollo' },
  { keys: ['beef', 'ground beef', 'carne molida'], en: 'Ground beef', es: 'Carne molida' },
  { keys: ['pork', 'cerdo'], en: 'Pork', es: 'Cerdo' },
  { keys: ['turkey', 'pavo'], en: 'Turkey', es: 'Pavo' },
  { keys: ['ham', 'jamon', 'jamón'], en: 'Ham', es: 'Jamón' },
  { keys: ['bacon', 'tocino'], en: 'Bacon', es: 'Tocino' },
  { keys: ['tortilla', 'tortillas'], en: 'Tortillas', es: 'Tortillas' },
  { keys: ['bread', 'pan'], en: 'Bread', es: 'Pan' },
  { keys: ['rice', 'arroz'], en: 'Rice', es: 'Arroz' },
  { keys: ['pasta', 'spaghetti', 'macaroni'], en: 'Pasta', es: 'Pasta' },
  { keys: ['beans', 'frijol', 'frijoles'], en: 'Beans', es: 'Frijoles' },
  { keys: ['potato', 'potatoes', 'papa', 'papas'], en: 'Potatoes', es: 'Papas' },
  { keys: ['tomato', 'tomatoes', 'tomate', 'tomates'], en: 'Tomatoes', es: 'Tomates' },
  { keys: ['onion', 'onions', 'cebolla'], en: 'Onion', es: 'Cebolla' },
  { keys: ['broccoli', 'brócoli'], en: 'Broccoli', es: 'Brócoli' },
  { keys: ['carrot', 'carrots', 'zanahoria'], en: 'Carrot', es: 'Zanahoria' },
  { keys: ['yogurt', 'yoghurt'], en: 'Yogurt', es: 'Yogur' },
  { keys: ['cream', 'crema'], en: 'Cream', es: 'Crema' },
  { keys: ['butter', 'mantequilla'], en: 'Butter', es: 'Mantequilla' },
  { keys: ['avocado', 'aguacate'], en: 'Avocado', es: 'Aguacate' },
  { keys: ['apple', 'manzana'], en: 'Apple', es: 'Manzana' },
  { keys: ['banana', 'platano', 'plátano'], en: 'Banana', es: 'Plátano' },
  { keys: ['orange', 'naranja'], en: 'Orange', es: 'Naranja' },
  { keys: ['corn', 'maiz', 'maíz'], en: 'Corn', es: 'Maíz' },
];

const imageNetFoodLabels: Array<{ keys: string[]; en: string; es: string }> = [
  { keys: ['granny smith', 'apple'], en: 'Apple', es: 'Manzana' },
  { keys: ['banana'], en: 'Banana', es: 'Plátano' },
  { keys: ['orange'], en: 'Orange', es: 'Naranja' },
  { keys: ['lemon'], en: 'Lemon', es: 'Limón' },
  { keys: ['pineapple'], en: 'Pineapple', es: 'Piña' },
  { keys: ['pomegranate'], en: 'Pomegranate', es: 'Granada' },
  { keys: ['fig'], en: 'Fig', es: 'Higo' },
  { keys: ['strawberry'], en: 'Strawberry', es: 'Fresa' },
  { keys: ['jackfruit'], en: 'Jackfruit', es: 'Yaca' },
  { keys: ['custard apple'], en: 'Custard apple', es: 'Chirimoya' },
  { keys: ['broccoli'], en: 'Broccoli', es: 'Brócoli' },
  { keys: ['cauliflower'], en: 'Cauliflower', es: 'Coliflor' },
  { keys: ['cucumber', 'cuke'], en: 'Cucumber', es: 'Pepino' },
  { keys: ['zucchini', 'courgette'], en: 'Zucchini', es: 'Calabacita' },
  { keys: ['butternut squash', 'acorn squash', 'spaghetti squash'], en: 'Squash', es: 'Calabaza' },
  { keys: ['bell pepper'], en: 'Bell pepper', es: 'Pimiento' },
  { keys: ['head cabbage'], en: 'Cabbage', es: 'Repollo' },
  { keys: ['artichoke'], en: 'Artichoke', es: 'Alcachofa' },
  { keys: ['mushroom'], en: 'Mushrooms', es: 'Champiñones' },
  { keys: ['corn'], en: 'Corn', es: 'Maíz' },
  { keys: ['pizza'], en: 'Pizza', es: 'Pizza' },
  { keys: ['cheeseburger'], en: 'Ground beef', es: 'Carne molida' },
  { keys: ['hotdog', 'hot dog'], en: 'Hot dog', es: 'Hot dog' },
  { keys: ['burrito'], en: 'Tortillas', es: 'Tortillas' },
  { keys: ['carbonara'], en: 'Pasta', es: 'Pasta' },
  { keys: ['spaghetti'], en: 'Pasta', es: 'Pasta' },
  { keys: ['french loaf', 'bagel'], en: 'Bread', es: 'Pan' },
  { keys: ['guacamole'], en: 'Avocado', es: 'Aguacate' },
  { keys: ['meat loaf'], en: 'Ground beef', es: 'Carne molida' },
  { keys: ['ice cream'], en: 'Ice cream', es: 'Helado' },
  { keys: ['hen', 'cock', 'drumstick', 'rotisserie'], en: 'Chicken', es: 'Pollo' },
  { keys: ['omelet', 'omelette', 'eggnog'], en: 'Eggs', es: 'Huevos' },
  { keys: ['milk can', 'milk'], en: 'Milk', es: 'Leche' },
  { keys: ['cheese'], en: 'Cheese', es: 'Queso' },
  { keys: ['burrito', 'taco', 'enchilada'], en: 'Tortillas', es: 'Tortillas' },
  { keys: ['mashed potato', 'potato'], en: 'Potatoes', es: 'Papas' },
];

let localDetectorPromise: ReturnType<typeof cocoSsd.load> | null = null;
let localClassifierPromise: ReturnType<typeof mobilenet.load> | null = null;
let ocrWorkerPromise: ReturnType<typeof createWorker> | null = null;

function getLocalDetector() {
  if (!localDetectorPromise) localDetectorPromise = cocoSsd.load({ base: 'lite_mobilenet_v2' });
  return localDetectorPromise;
}
function getLocalClassifier() {
  if (!localClassifierPromise) localClassifierPromise = mobilenet.load({ version: 2, alpha: 1.0 });
  return localClassifierPromise;
}
function ingredientFromImageNet(className: string, lang: Lang) {
  const normalized = className.toLowerCase();
  return imageNetFoodLabels.find(item => item.keys.some(key => normalized.includes(key)))?.[lang];
}
function ingredientsFromOcr(text: string, lang: Lang) {
  const normalized = text.toLowerCase();
  return ocrFoodLabels.filter(item => item.keys.some(key => normalized.includes(key))).map(item => item[lang]);
}
function getOcrWorker() {
  if (!ocrWorkerPromise) ocrWorkerPromise = createWorker('eng');
  return ocrWorkerPromise;
}
function makeScanCrops(photo: HTMLImageElement) {
  const crops: HTMLCanvasElement[] = [];
  const cols = 3;
  const rows = 3;
  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      const canvas = document.createElement('canvas');
      canvas.width = 224;
      canvas.height = 224;
      const ctx = canvas.getContext('2d');
      if (!ctx) continue;
      const sw = photo.naturalWidth / cols;
      const sh = photo.naturalHeight / rows;
      ctx.drawImage(photo, col * sw, row * sh, sw, sh, 0, 0, 224, 224);
      crops.push(canvas);
    }
  }
  return crops;
}

const starterProfile: Profile = { name: 'My Family', adults: 2, kids: 2, ages: '', avoid: '', dislikes: '', diet: '' };

const copy = {
  en: {
    tagline: 'Dinner? Listo.', subtitle: 'Turn what you already have into a family meal.', type: 'Type It', pick: 'Pick It', scan: 'Scan It',
    ingredients: 'What do you have?', placeholder: 'chicken, rice, broccoli, tortillas…', time: 'How much time?', method: 'How are you cooking?',
    generate: 'Give me 3 meals', scanning: 'Scanning your food…', generating: 'Cooking up ideas…', coming: 'Illustrative food photo', cook: 'Cook With Me',
    favorite: 'Favorite', noFav: 'No favorites yet. Tap the heart on a meal you want to make again.', noHistory: 'No cooking history yet.', profile: 'Family Profile',
    save: 'Save profile', adults: 'Adults', kids: 'Kids', ages: 'Kids’ ages', avoid: 'Allergies / avoid', dislikes: 'Dislikes', diet: 'Dietary needs',
    results: 'Tonight’s ideas', change: 'Change ingredients', pantry: 'Pantry basics', optional: 'Optional extras', home: 'Cook', history: 'History', favorites: 'Favorites',
    next: 'Next step', back: 'Back', done: 'Done', rate: 'How was it?', scanHelp: 'Take or choose a clear photo of your fridge, pantry, or groceries. Deep Scan combines two vision models, 3x3 image scanning, and package-label reading on your device. The first scan can take longer and uses no AI credits.',
    scanButton: 'Choose photo', visible: 'I found', scanError: 'I couldn’t read that photo. Try another one or type the ingredients.', error: 'Something went wrong. Please try again.', saved: 'Saved', profileSaved: 'Family profile saved.',
    noPhoto: 'Generated images are illustrations of the recipe, not photos of a prepared dish.', newRecipe: 'Start New Recipe',
    surprise: 'Surprise me', tryAnother: 'Try another', share: 'Share', shopping: 'Shopping list', have: 'You have', needToBuy: 'Pick up', copyList: 'Copy list', listCopied: 'List copied',
    nutritionLabel: 'Nutrition goal', lowCarb: 'Lower carb', highProtein: 'Higher protein', kcal: 'kcal', proteinShort: 'protein', carbsShort: 'carbs', estimateNote: 'Approx. per adult serving; actual amounts depend on portions and ingredients.',
  },
  es: {
    tagline: '¿Cena? Listo.', subtitle: 'Convierte lo que ya tienes en una comida para la familia.', type: 'Escribir', pick: 'Elegir', scan: 'Escanear', ingredients: '¿Qué tienes?',
    placeholder: 'pollo, arroz, brócoli, tortillas…', time: '¿Cuánto tiempo tienes?', method: '¿Cómo vas a cocinar?', generate: 'Dame 3 comidas', scanning: 'Escaneando tu comida…', generating: 'Preparando ideas…',
    coming: 'Foto ilustrativa de comida', cook: 'Cocinar conmigo', favorite: 'Favorito', noFav: 'Todavía no hay favoritos. Toca el corazón de una comida que quieras repetir.', noHistory: 'Todavía no hay historial.',
    profile: 'Perfil familiar', save: 'Guardar perfil', adults: 'Adultos', kids: 'Niños', ages: 'Edades de los niños', avoid: 'Alergias / evitar', dislikes: 'No les gusta', diet: 'Necesidades de dieta',
    results: 'Ideas para hoy', change: 'Cambiar ingredientes', pantry: 'Básicos de despensa', optional: 'Extras opcionales', home: 'Cocinar', history: 'Historial', favorites: 'Favoritos', next: 'Siguiente paso', back: 'Atrás', done: 'Terminar', rate: '¿Qué tal quedó?',
    scanHelp: 'Toma o elige una foto clara de tu refri, despensa o compras. Deep Scan combina dos modelos de visión, escaneo 3x3 y lectura de etiquetas en tu dispositivo. El primer escaneo puede tardar más y no usa créditos de IA.', scanButton: 'Elegir foto', visible: 'Encontré',
    scanError: 'No pude leer esa foto. Intenta otra o escribe los ingredientes.', error: 'Algo salió mal. Intenta de nuevo.', saved: 'Guardado', profileSaved: 'Perfil familiar guardado.', noPhoto: 'Las imágenes generadas ilustran la receta; no son fotos del platillo preparado.', newRecipe: 'Comenzar receta nueva',
    surprise: 'Sorpréndeme', tryAnother: 'Cambiar esta', share: 'Compartir', shopping: 'Lista de compras', have: 'Ya tienes', needToBuy: 'Falta comprar', copyList: 'Copiar lista', listCopied: 'Lista copiada',
    nutritionLabel: 'Objetivo nutricional', lowCarb: 'Menos carbohidratos', highProtein: 'Más proteína', kcal: 'kcal', proteinShort: 'proteína', carbsShort: 'carbohidratos', estimateNote: 'Aprox. por porción de adulto; los valores cambian según cantidades e ingredientes.',
  },
};

function readLocal<T>(key: string, fallback: T): T {
  try { const raw = localStorage.getItem(key); return raw ? (JSON.parse(raw) as T) : fallback; } catch { return fallback; }
}

function initialLanguage(): Lang {
  const saved = readLocal<Lang | null>('listomeal-lang-choice', null);
  if (saved === 'en' || saved === 'es') return saved;
  const preferences = typeof navigator === 'undefined' ? [] : (navigator.languages?.length ? navigator.languages : [navigator.language]);
  for (const locale of preferences) {
    const base = locale.toLowerCase().split('-')[0];
    if (base === 'en' || base === 'es') return base;
  }
  return 'en';
}

async function shareContent(payload: { title: string; text: string }): Promise<'shared' | 'copied' | 'failed'> {
  const url = typeof window !== 'undefined' ? window.location.href : '';
  if (typeof navigator !== 'undefined' && navigator.share) {
    try { await navigator.share({ title: payload.title, text: payload.text, url }); return 'shared'; } catch { return 'failed'; }
  }
  if (typeof navigator !== 'undefined' && navigator.clipboard) {
    try { await navigator.clipboard.writeText(`${payload.text} ${url}`.trim()); return 'copied'; } catch { return 'failed'; }
  }
  return 'failed';
}

function streakFromHistory(history: HistoryItem[]) {
  const days = new Set(history.map(h => new Date(h.at).toDateString()));
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const anchor = new Date(today);
  if (!days.has(anchor.toDateString())) {
    anchor.setDate(anchor.getDate() - 1);
    if (!days.has(anchor.toDateString())) return 0;
  }
  let streak = 0; const cursor = new Date(anchor);
  while (days.has(cursor.toDateString())) { streak += 1; cursor.setDate(cursor.getDate() - 1); }
  return streak;
}

function canSpeak() { return typeof window !== 'undefined' && 'speechSynthesis' in window; }
function speak(text: string, lang: Lang) {
  if (!canSpeak()) return;
  window.speechSynthesis.cancel();
  const utter = new SpeechSynthesisUtterance(text);
  utter.lang = lang === 'es' ? 'es-ES' : 'en-US';
  utter.rate = 0.95;
  window.speechSynthesis.speak(utter);
}

function App() {
  const [lang, setLang] = useState<Lang>(initialLanguage);
  const [tab, setTab] = useState<Tab>('home');
  const [mode, setMode] = useState<'type' | 'pick' | 'scan'>('type');
  const [typed, setTyped] = useState('');
  const [picked, setPicked] = useState<string[]>([]);
  const [time, setTime] = useState('20');
  const [method, setMethod] = useState('Easiest');
  const [nutritionGoal, setNutritionGoal] = useState<'none' | 'lowCarb' | 'highProtein'>('none');
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(false);
  const [scanLoading, setScanLoading] = useState(false);
  const [scanCount, setScanCount] = useState(0);
  const [errorMsg, setErrorMsg] = useState('');
  const [favorites, setFavorites] = useState<Recipe[]>(() => readLocal('listomeal-favorites', [] as Recipe[]));
  const [history, setHistory] = useState<HistoryItem[]>(() => readLocal('listomeal-history', [] as HistoryItem[]));
  const [profile, setProfile] = useState<Profile>(() => readLocal('listomeal-profile', starterProfile));
  const [cookRecipe, setCookRecipe] = useState<Recipe | null>(null);
  const [cookStep, setCookStep] = useState(0);
  const [toast, setToast] = useState('');
  const [showWelcome, setShowWelcome] = useState(() => !readLocal('listomeal-welcome-done', false));
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackSentiment, setFeedbackSentiment] = useState<'good' | 'okay' | 'bad' | ''>('');
  const [feedbackIssue, setFeedbackIssue] = useState('');
  const [feedbackComment, setFeedbackComment] = useState('');
  const [feedbackSending, setFeedbackSending] = useState(false);
  const t = copy[lang];
  const streak = useMemo(() => streakFromHistory(history), [history]);
  const [musicOn, setMusicOn] = useState(() => readLocal('listomeal-music', false));
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => localStorage.setItem('listomeal-lang', JSON.stringify(lang)), [lang]);
  useEffect(() => { document.documentElement.lang = lang; }, [lang]);
  useEffect(() => localStorage.setItem('listomeal-favorites', JSON.stringify(favorites)), [favorites]);
  useEffect(() => localStorage.setItem('listomeal-history', JSON.stringify(history)), [history]);
  useEffect(() => localStorage.setItem('listomeal-music', JSON.stringify(musicOn)), [musicOn]);
  useEffect(() => {
    const audio = audioRef.current; if (!audio) return;
    if (musicOn) { audio.volume = 0.35; void audio.play().catch(() => setMusicOn(false)); } else audio.pause();
  }, [musicOn]);

  const allIngredients = useMemo(() => {
    const typedList = typed.split(/[,\n]/).map(x => x.trim()).filter(Boolean);
    return Array.from(new Set([...typedList, ...picked]));
  }, [typed, picked]);

  const flash = (message: string) => { setToast(message); window.setTimeout(() => setToast(''), 1800); };

  function generateRecipes() {
    if (allIngredients.length === 0) {
      setErrorMsg(lang === 'en' ? 'Add at least one ingredient first.' : 'Agrega por lo menos un ingrediente.');
      return;
    }
    setLoading(true); setErrorMsg('');
    const next = getLocalMeals({ lang, ingredients: allIngredients, time, method, profile, nutritionGoal, recentTitles: history.slice(0, 8).map(h => h.recipe.title) }) as Recipe[];
    setRecipes(next); if (!next.length) setErrorMsg(lang === 'en' ? 'No meals match this goal. Try another goal or change ingredients.' : 'No hay recetas para ese objetivo. Prueba otro objetivo o cambia los ingredientes.'); setLoading(false); window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function surpriseMe() {
    setErrorMsg(''); setLoading(true);
    const next = getLocalMeals({ lang, ingredients: [], time, method, profile, nutritionGoal, recentTitles: history.slice(0, 8).map(h => h.recipe.title) }) as Recipe[];
    setRecipes(next); setLoading(false); setTab('home'); window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function swapRecipe(index: number) {
    const exclude = [...recipes.map(r => r.title), ...history.slice(0, 8).map(h => h.recipe.title)];
    const pool = getLocalMeals({ lang, ingredients: allIngredients, time, method, profile, nutritionGoal, recentTitles: exclude }) as Recipe[];
    const replacement = pool.find(r => !recipes.some(existing => existing.id === r.id));
    if (!replacement) { flash(lang === 'en' ? 'No other match right now' : 'No hay otra opción por ahora'); return; }
    setRecipes(prev => prev.map((r, i) => (i === index ? replacement : r)));
    flash(lang === 'en' ? 'Swapped for a new idea' : 'Cambiado por una idea nueva');
  }

  async function shareRecipe(recipe: Recipe) {
    const text = lang === 'en'
      ? `${recipe.title} — ${recipe.minutes} min with ${recipe.method}. Found it with ListoMeal 🍽️`
      : `${recipe.title} — ${recipe.minutes} min con ${recipe.method}. Lo encontré con ListoMeal 🍽️`;
    const result = await shareContent({ title: recipe.title, text });
    if (result === 'copied') flash(lang === 'en' ? 'Link copied to share' : 'Enlace copiado para compartir');
  }

  async function shareCookedRecipe(recipe: Recipe) {
    const text = lang === 'en'
      ? `Dinner? Listo. Just made ${recipe.title} in ${recipe.minutes} minutes with ListoMeal 🍽️👏`
      : `¿Cena? Listo. Acabo de hacer ${recipe.title} en ${recipe.minutes} minutos con ListoMeal 🍽️👏`;
    const result = await shareContent({ title: recipe.title, text });
    if (result === 'copied') flash(lang === 'en' ? 'Copied to share' : 'Copiado para compartir');
  }

  async function shareStreak() {
    const text = lang === 'en'
      ? `I've cooked ${streak} night${streak === 1 ? '' : 's'} in a row with ListoMeal 🔥 Dinner? Listo.`
      : `¡Llevo ${streak} noche${streak === 1 ? '' : 's'} seguida${streak === 1 ? '' : 's'} cocinando con ListoMeal! 🔥`;
    const result = await shareContent({ title: 'ListoMeal', text });
    if (result === 'copied') flash(lang === 'en' ? 'Copied to share' : 'Copiado para compartir');
  }

  async function scanPhoto(file: File) {
    setScanLoading(true); setErrorMsg('');
    const imageUrl = URL.createObjectURL(file);
    try {
      const photo = new Image(); photo.src = imageUrl;
      await new Promise<void>((resolve, reject) => { photo.onload = () => resolve(); photo.onerror = () => reject(new Error('Could not load photo')); });
      const [detector, classifier] = await Promise.all([getLocalDetector(), getLocalClassifier()]);
      const predictions = await detector.detect(photo);
      const detected = predictions.filter(prediction => prediction.score >= 0.32).map(prediction => localScanFoods[prediction.class]?.[lang]).filter((item): item is string => Boolean(item));
      const scanAreas: Array<HTMLImageElement | HTMLCanvasElement> = [photo, ...makeScanCrops(photo)];
      const classifiedGroups = await Promise.all(scanAreas.map(area => classifier.classify(area, 10)));
      const classified = classifiedGroups.flat().filter(prediction => prediction.probability >= 0.045).map(prediction => ingredientFromImageNet(prediction.className, lang)).filter((item): item is string => Boolean(item));
      let labelMatches: string[] = [];
      try { const worker = await getOcrWorker(); const result = await worker.recognize(photo); labelMatches = ingredientsFromOcr(result.data.text, lang); } catch { labelMatches = []; }
      const found = Array.from(new Set([...detected, ...classified, ...labelMatches])).slice(0, 16);
      setMode('pick');
      if (found.length === 0) {
        setErrorMsg(lang === 'en' ? 'Deep Scan could not confidently identify food in that photo. Try a brighter photo where package labels and food are visible, or pick/type ingredients manually.' : 'Deep Scan no pudo identificar comida con suficiente seguridad. Intenta una foto más iluminada donde se vean los alimentos y las etiquetas, o elige/escribe los ingredientes manualmente.');
        return;
      }
      setPicked(prev => Array.from(new Set([...prev, ...found]))); setScanCount(n => n + 1); flash(`${t.visible}: ${found.join(', ')}`);
    } catch { setErrorMsg(t.scanError); } finally { URL.revokeObjectURL(imageUrl); setScanLoading(false); }
  }

  function toggleFavorite(recipe: Recipe) { setFavorites(prev => prev.some(r => r.id === recipe.id) ? prev.filter(r => r.id !== recipe.id) : [recipe, ...prev]); }
  function rate(recipe: Recipe, rating: HistoryItem['rating']) {
    setHistory(prev => [{ recipe, rating, at: new Date().toISOString() }, ...prev.filter(h => h.recipe.id !== recipe.id)].slice(0, 40));
    if (rating === 'loved' && !favorites.some(r => r.id === recipe.id)) setFavorites(prev => [recipe, ...prev]);
    setCookRecipe(null); setCookStep(0); flash(t.saved);
  }
  function saveProfile() { localStorage.setItem('listomeal-profile', JSON.stringify(profile)); flash(t.profileSaved); }
  async function submitFeedback() {
    if (!feedbackSentiment) return; setFeedbackSending(true);
    try {
      await api.post('/api/feedback', { sentiment: feedbackSentiment, issue: feedbackIssue, comment: feedbackComment, lang, ingredients: allIngredients.slice(0, 20), method, recipeTitle: cookRecipe?.title ?? recipes[0]?.title ?? '' });
      setShowFeedback(false); setFeedbackSentiment(''); setFeedbackIssue(''); setFeedbackComment(''); flash(lang === 'en' ? 'Thanks for helping make ListoMeal better!' : '¡Gracias por ayudarnos a mejorar ListoMeal!');
    } catch { flash(lang === 'en' ? 'Could not send feedback. Try again.' : 'No se pudo enviar. Intenta de nuevo.'); } finally { setFeedbackSending(false); }
  }
  function startNewRecipe() {
    setRecipes([]); setTyped(''); setPicked([]); setScanCount(0); setMode('type'); setTime('20'); setMethod('Easiest'); setErrorMsg(''); setCookRecipe(null); setCookStep(0); setTab('home'); window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  const nav = [
    { id: 'home' as Tab, label: t.home, icon: ChefHat },
    { id: 'favorites' as Tab, label: t.favorites, icon: Heart },
    { id: 'history' as Tab, label: t.history, icon: History },
    { id: 'profile' as Tab, label: t.profile, icon: UserRound },
  ];

  return (
    <div className="min-h-screen bg-[#fffaf2] text-[#24352d] pb-24">
      {showWelcome && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/45 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-[2rem] bg-white p-6 shadow-2xl">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-orange-100 px-3 py-1 text-xs font-black uppercase tracking-wider text-orange-600"><Sparkles size={14} /> {lang === 'en' ? 'Welcome to ListoMeal' : 'Bienvenido a ListoMeal'}</div>
            <h2 className="text-3xl font-black leading-tight">{lang === 'en' ? 'Dinner gets easier in 3 steps.' : 'La cena se hace fácil en 3 pasos.'}</h2>
            <div className="mt-5 space-y-3 text-sm font-semibold text-slate-700">
              <div className="rounded-2xl bg-orange-50 p-4">📸 {lang === 'en' ? 'Scan your fridge, pick ingredients, or type what you have.' : 'Escanea tu refri, elige ingredientes o escribe lo que tienes.'}</div>
              <div className="rounded-2xl bg-amber-50 p-4">🍽️ {lang === 'en' ? 'Get 3 matches from 500 local recipes.' : 'Recibe 3 opciones entre 500 recetas locales.'}</div>
              <div className="rounded-2xl bg-emerald-50 p-4">👨‍🍳 {lang === 'en' ? 'Use Cook With Me for simple step-by-step cooking.' : 'Usa Cocinar conmigo para seguir pasos sencillos.'}</div>
            </div>
            <p className="mt-4 text-xs text-slate-500">{lang === 'en' ? 'Your recipe matching and Deep Scan run locally, so the core experience does not use AI credits.' : 'Las recetas y Deep Scan funcionan localmente, así que la experiencia principal no usa créditos de IA.'}</p>
            <button className="primary-btn mt-6 w-full justify-center py-4" onClick={() => { localStorage.setItem('listomeal-welcome-done', JSON.stringify(true)); setShowWelcome(false); }}>{lang === 'en' ? 'Start cooking' : 'Empezar a cocinar'}</button>
          </div>
        </div>
      )}
      <header className="sticky top-0 z-20 border-b border-orange-100 bg-[#fffaf2]/95 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <button className="flex items-center gap-2" onClick={() => setTab('home')} aria-label="ListoMeal home">
            <span className="logo-shine rounded-xl"><img src="/resources/listomeal-logo.jpg" alt="ListoMeal — Dinner? Listo." loading="eager" className="h-12 w-auto max-w-[190px] rounded-xl object-contain" /></span>
          </button>
          <div className="flex items-center gap-2">
            <button className={`flex items-center gap-2 rounded-full border px-3 py-2 text-sm font-bold shadow-sm transition duration-200 ${musicOn ? 'border-orange-300 bg-orange-50 text-orange-600' : 'border-orange-200 bg-white'}`} onClick={() => setMusicOn(m => !m)} aria-label={musicOn ? (lang === 'en' ? 'Mute kitchen music' : 'Silenciar música') : (lang === 'en' ? 'Play kitchen music' : 'Reproducir música')}>{musicOn ? <Music size={16} /> : <VolumeX size={16} />}</button>
            <button className="flex items-center gap-2 rounded-full border border-orange-200 bg-white px-3 py-2 text-sm font-bold shadow-sm" onClick={() => { const next = lang === 'en' ? 'es' : 'en'; localStorage.setItem('listomeal-lang-choice', JSON.stringify(next)); setLang(next); }}><Languages size={16} /> {lang === 'en' ? 'ES' : 'EN'}</button>
          </div>
        </div>
      </header>
      <audio ref={audioRef} src="/resources/kitchen-lo-fi.mp3" loop preload="none" />
      <main className="mx-auto max-w-5xl px-4 py-5">
        {tab === 'home' && <>{recipes.length === 0 ? (
          <section className="mx-auto max-w-5xl">
            <div className="mb-5 overflow-hidden rounded-[2rem] shadow-xl shadow-orange-100"><img src={lang === 'es' ? '/resources/hero-banner-es.png' : '/resources/hero-banner.jpg'} alt={lang === 'es' ? 'ListoMeal — Convierte lo que tienes en algo delicioso' : 'ListoMeal — Turn what you have into something amazing'} className="block h-auto w-full" loading="eager" /></div>
            <div className="home-benefits mb-4 grid grid-cols-3 gap-2"><div className="benefit-pill"><span className="benefit-icon">🌿</span><span>{lang === 'en' ? 'Use what you have' : 'Usa lo que tienes'}</span></div><div className="benefit-pill"><span className="benefit-icon">⏱</span><span>{lang === 'en' ? 'Quick & easy' : 'Rápido y fácil'}</span></div><div className="benefit-pill"><span className="benefit-icon">❤</span><span>{lang === 'en' ? 'Meals families love' : 'Comidas que aman'}</span></div></div>
            {streak >= 2 && <button type="button" onClick={shareStreak} className="mb-4 flex w-full items-center justify-between gap-2 rounded-2xl border border-orange-200 bg-gradient-to-r from-orange-50 to-amber-50 px-4 py-3 text-left transition duration-200 hover:-translate-y-0.5 hover:shadow-md"><span className="flex items-center gap-2 text-sm font-extrabold text-orange-700"><Flame size={18} className="text-orange-500" />{lang === 'en' ? `${streak} night streak — keep it going!` : `¡Racha de ${streak} noches seguidas!`}</span><span className="inline-flex items-center gap-1 text-xs font-bold text-orange-500"><Share2 size={14} />{t.share}</span></button>}
            <button type="button" className="scan-hero-card mb-3" onClick={() => setMode('scan')}><span className="scan-hero-icon"><Camera size={28} /></span><span className="min-w-0 flex-1 text-left"><strong>{lang === 'en' ? 'Scan Your Fridge or Pantry' : 'Escanea tu refri o despensa'}</strong><small>{lang === 'en' ? 'Find recipes with what you already have' : 'Encuentra recetas con lo que ya tienes'}</small></span><span className="scan-arrow">›</span></button>
            <button type="button" onClick={surpriseMe} disabled={loading} className="mb-5 flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-emerald-300 bg-emerald-50/60 px-4 py-3 text-sm font-extrabold text-emerald-700 transition duration-200 hover:-translate-y-0.5 hover:bg-emerald-50 disabled:opacity-50"><Shuffle size={16} />{t.surprise}</button>
            <div className="rounded-[2rem] border border-orange-100 bg-white p-4 shadow-sm md:p-6">
              <div className="mb-3 text-center text-xs font-black uppercase tracking-[0.2em] text-slate-400">{lang === 'en' ? 'Or add ingredients another way' : 'O agrega ingredientes de otra forma'}</div>
              <div className="mb-5 grid grid-cols-3 gap-2 rounded-2xl bg-orange-50 p-1.5">
                <button className={`mode-btn ${mode === 'type' ? 'active' : ''}`} onClick={() => setMode('type')}><Plus size={17} />{t.type}</button>
                <button className={`mode-btn ${mode === 'pick' ? 'active' : ''}`} onClick={() => setMode('pick')}><Refrigerator size={17} />{t.pick}</button>
                <button className={`mode-btn ${mode === 'scan' ? 'active' : ''}`} onClick={() => setMode('scan')}><Camera size={17} />{t.scan}</button>
              </div>
              {mode === 'type' && <div><label className="label">{t.ingredients}</label><textarea className="field min-h-28" value={typed} onChange={e => setTyped(e.target.value)} placeholder={t.placeholder} /></div>}
              {mode === 'pick' && <div><label className="label">{t.ingredients}</label><div className="flex flex-wrap gap-2">{commonIngredients.map(item => { const label = lang === 'en' ? item.en : item.es; return <button key={item.key} onClick={() => setPicked(prev => prev.includes(label) ? prev.filter(x => x !== label) : [...prev, label])} className={`chip ${picked.includes(label) ? 'selected' : ''}`}>{picked.includes(label) ? <Minus size={14} /> : <Plus size={14} />} {label}</button>; })}</div>{allIngredients.length > 0 && <div className="mt-4 rounded-2xl bg-emerald-50 p-3 text-sm font-semibold text-emerald-900">{allIngredients.join(' • ')}</div>}{scanCount > 0 && <div className="mt-4 rounded-2xl border border-orange-200 bg-orange-50 p-4"><p className="mb-3 text-sm font-bold text-orange-900">{lang === 'es' ? '¿Tienes más ingredientes? Toma otra foto del refri o la despensa; sumaremos lo que encontremos a esta lista.' : 'Have more ingredients? Take another photo of your fridge or pantry; we will add what we find to this list.'}</p><label className="primary-btn inline-flex cursor-pointer"><Camera size={18}/>{scanLoading ? t.scanning : lang === 'es' ? 'Tomar otra foto' : 'Take another photo'}<input className="hidden" type="file" accept="image/*" capture="environment" disabled={scanLoading} onChange={e => { const f = e.target.files?.[0]; e.target.value = ''; if (f) void scanPhoto(f); }} /></label><p className="mt-2 text-xs text-slate-600">{lang === 'es' ? 'Puedes corregir la lista antes de generar recetas.' : 'You can correct the list before generating recipes.'}</p></div>}</div>}
              {mode === 'scan' && <div className="rounded-3xl border-2 border-dashed border-orange-200 bg-orange-50/60 p-7 text-center"><Camera className="mx-auto mb-3 text-orange-500" size={42} /><p className="mx-auto mb-4 max-w-md text-sm text-slate-600">{t.scanHelp}</p><label className="primary-btn inline-flex cursor-pointer"><Camera size={18} />{scanLoading ? t.scanning : t.scanButton}<input className="hidden" type="file" accept="image/*" capture="environment" disabled={scanLoading} onChange={e => { const f = e.target.files?.[0]; e.target.value = ''; if (f) void scanPhoto(f); }} /></label></div>}
              <div className="mt-6 space-y-5">
                <div><label className="label"><Clock3 size={16} />{t.time}</label><div className="grid grid-cols-4 gap-2">{['10','20','30','60'].map(v => <button key={v} className={`choice ${time === v ? 'selected' : ''}`} onClick={() => setTime(v)}>{v === '60' ? (lang === 'en' ? 'No rush' : 'Sin prisa') : `${v}m`}</button>)}</div></div>
                <div><label className="label"><ChefHat size={16} />{t.method}</label><div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">{[
                  { value: 'Easiest', kind: 'easy' as const, en: 'Easiest', es: 'Más fácil' },
                  { value: 'Stove', kind: 'stove' as const, en: 'Stove', es: 'Estufa' },
                  { value: 'Oven', kind: 'oven' as const, en: 'Oven', es: 'Horno' },
                  { value: 'Air Fryer', kind: 'airfryer' as const, en: 'Air Fryer', es: 'Air Fryer' },
                  { value: 'Microwave', kind: 'microwave' as const, en: 'Microwave', es: 'Microondas' },
                ].map(option => <button key={option.value} type="button" className={`method-choice ${method === option.value ? 'selected' : ''}`} onClick={() => setMethod(option.value)}><ApplianceVisual kind={option.kind} label={lang === 'en' ? option.en : option.es} /><span className="method-name">{lang === 'en' ? option.en : option.es}</span></button>)}</div></div>
                <div><label className="label"><Heart size={16} />{t.nutritionLabel}</label><div className="grid grid-cols-3 gap-2">{([{value:'none',label:lang==='en'?'Any':'Cualquiera'},{value:'lowCarb',label:t.lowCarb},{value:'highProtein',label:t.highProtein}] as const).map(option=><button key={option.value} type="button" className={`choice ${nutritionGoal===option.value?'selected':''}`} onClick={()=>setNutritionGoal(option.value)}>{option.label}</button>)}</div><p className="mt-2 text-xs text-slate-500">{t.estimateNote}</p></div>

              </div>
              {errorMsg && <div className="mt-4 rounded-2xl bg-red-50 p-3 text-sm font-semibold text-red-700">{errorMsg}</div>}
              <button className="primary-btn mt-6 w-full justify-center py-4 text-base" disabled={loading || scanLoading} onClick={generateRecipes}><Sparkles size={19} />{loading ? t.generating : t.generate}</button>
            </div>
          </section>
        ) : (
          <section><div className="mb-5 flex flex-wrap items-end justify-between gap-3"><div><p className="text-sm font-bold uppercase tracking-wider text-orange-500">ListoMeal</p><h2 className="font-display text-3xl font-semibold">{t.results}</h2></div><button className="secondary-btn" onClick={() => setRecipes([])}>{t.change}</button></div><div className="grid gap-5 lg:grid-cols-3">{recipes.map((recipe, i) => <div key={recipe.id} className={`rise-in ${i === 1 ? 'rise-in-2' : i === 2 ? 'rise-in-3' : 'rise-in-1'}`}><RecipeCard recipe={recipe} t={t} lang={lang} favorite={favorites.some(r => r.id === recipe.id)} onFavorite={() => toggleFavorite(recipe)} onCook={() => { setCookRecipe(recipe); setCookStep(0); }} onShare={() => shareRecipe(recipe)} onSwap={() => swapRecipe(i)} /></div>)}</div><div className="mt-7 flex justify-center"><button className="primary-btn w-full max-w-md justify-center py-4 text-base" onClick={startNewRecipe}><Plus size={19} />{t.newRecipe}</button></div></section>
        )}</>}
        {tab === 'favorites' && <section><h2 className="page-title"><Heart className="text-orange-500" /> {t.favorites}</h2>{favorites.length === 0 ? <Empty text={t.noFav} /> : <div className="grid gap-5 lg:grid-cols-3">{favorites.map(r => <RecipeCard key={r.id} recipe={r} t={t} lang={lang} favorite onFavorite={() => toggleFavorite(r)} onCook={() => { setCookRecipe(r); setCookStep(0); }} onShare={() => shareRecipe(r)} />)}</div>}</section>}
        {tab === 'history' && <section><h2 className="page-title"><History className="text-orange-500" /> {t.history}</h2>{history.length === 0 ? <Empty text={t.noHistory} /> : <div className="space-y-3">{history.map(h => <button key={`${h.recipe.id}-${h.at}`} onClick={() => { setCookRecipe(h.recipe); setCookStep(0); }} className="flex w-full items-center justify-between rounded-3xl border border-orange-100 bg-white p-4 text-left shadow-sm"><div><div className="font-extrabold">{h.recipe.title}</div><div className="mt-1 text-xs text-slate-500">{new Date(h.at).toLocaleDateString()} • {h.recipe.minutes} min</div></div><span className="rounded-full bg-orange-50 px-3 py-1 text-sm font-bold text-orange-600">{h.rating === 'loved' ? '♥ Loved' : h.rating}</span></button>)}</div>}</section>}
        {tab === 'profile' && <section className="mx-auto max-w-2xl"><h2 className="page-title"><UserRound className="text-orange-500" /> {t.profile}</h2><div className="rounded-[2rem] border border-orange-100 bg-white p-5 shadow-sm"><label className="label">Name</label><input className="field" value={profile.name} onChange={e => setProfile({ ...profile, name: e.target.value })} /><div className="mt-4 grid grid-cols-2 gap-3"><NumberField label={t.adults} value={profile.adults} onChange={v => setProfile({ ...profile, adults: v })} /><NumberField label={t.kids} value={profile.kids} onChange={v => setProfile({ ...profile, kids: v })} /></div><label className="label mt-4">{t.ages}</label><input className="field" value={profile.ages} onChange={e => setProfile({ ...profile, ages: e.target.value })} placeholder="3, 7, 11" /><label className="label mt-4">{t.avoid}</label><input className="field" value={profile.avoid} onChange={e => setProfile({ ...profile, avoid: e.target.value })} /><label className="label mt-4">{t.dislikes}</label><input className="field" value={profile.dislikes} onChange={e => setProfile({ ...profile, dislikes: e.target.value })} /><label className="label mt-4">{t.diet}</label><input className="field" value={profile.diet} onChange={e => setProfile({ ...profile, diet: e.target.value })} /><button className="primary-btn mt-6 w-full justify-center" onClick={saveProfile}>{t.save}</button></div></section>}
      </main>
      <button className="fixed bottom-24 right-4 z-30 flex items-center gap-2 rounded-full bg-emerald-600 px-4 py-3 text-sm font-extrabold text-white shadow-xl transition hover:bg-emerald-700" onClick={() => setShowFeedback(true)}><MessageCircle size={18} />{lang === 'en' ? 'Feedback' : 'Comentario'}</button>
      <nav className="fixed bottom-3 left-1/2 z-30 flex w-[calc(100%-24px)] max-w-md -translate-x-1/2 justify-around rounded-3xl border border-orange-100 bg-white/95 p-2 shadow-xl backdrop-blur">{nav.map(item => <button key={item.id} onClick={() => setTab(item.id)} className={`nav-btn ${tab === item.id ? 'active' : ''}`}><item.icon size={20} /><span>{item.label}</span></button>)}</nav>
      {showFeedback && <div className="fixed inset-0 z-50 grid place-items-center bg-black/45 p-4 backdrop-blur-sm"><div className="w-full max-w-md rounded-[2rem] bg-white p-6 shadow-2xl"><div className="flex items-start justify-between gap-3"><div><div className="text-xs font-black uppercase tracking-widest text-emerald-600">{lang === 'en' ? 'Quick feedback' : 'Comentario rápido'}</div><h2 className="mt-1 text-2xl font-black">{lang === 'en' ? 'How is ListoMeal doing?' : '¿Cómo te está funcionando ListoMeal?'}</h2></div><button className="icon-btn" onClick={() => setShowFeedback(false)} aria-label="Close feedback"><X size={18} /></button></div><div className="mt-5 grid grid-cols-3 gap-2">{([['good','👍'],['okay','😐'],['bad','👎']] as const).map(([value,emoji]) => <button key={value} className={`rounded-2xl border p-4 text-3xl ${feedbackSentiment === value ? 'border-emerald-500 bg-emerald-50' : 'border-orange-100 bg-[#fffaf2]'}`} onClick={() => setFeedbackSentiment(value)}>{emoji}</button>)}</div><label className="label mt-5">{lang === 'en' ? 'What could be better?' : '¿Qué podría mejorar?'}</label><select className="field" value={feedbackIssue} onChange={e => setFeedbackIssue(e.target.value)}><option value="">{lang === 'en' ? 'Choose one (optional)' : 'Elige una (opcional)'}</option><option value="scan">{lang === 'en' ? 'Scan missed an ingredient' : 'El escáner no detectó algo'}</option><option value="recipe">{lang === 'en' ? 'Recipe was not a good match' : 'La receta no fue buena opción'}</option><option value="photo">{lang === 'en' ? 'Recipe photo was wrong' : 'La foto no correspondía'}</option><option value="hard">{lang === 'en' ? 'Too complicated' : 'Muy complicada'}</option><option value="other">{lang === 'en' ? 'Something else' : 'Otra cosa'}</option></select><label className="label mt-4">{lang === 'en' ? 'Anything else?' : '¿Algo más?'}</label><textarea className="field min-h-24" maxLength={600} value={feedbackComment} onChange={e => setFeedbackComment(e.target.value)} placeholder={lang === 'en' ? 'Optional comment…' : 'Comentario opcional…'} /><button className="primary-btn mt-5 w-full justify-center" disabled={!feedbackSentiment || feedbackSending} onClick={submitFeedback}>{feedbackSending ? (lang === 'en' ? 'Sending…' : 'Enviando…') : (lang === 'en' ? 'Send feedback' : 'Enviar comentario')}</button></div></div>}
      {cookRecipe && <CookModal recipe={cookRecipe} step={cookStep} setStep={setCookStep} onClose={() => setCookRecipe(null)} onRate={rating => rate(cookRecipe, rating)} onShare={() => shareCookedRecipe(cookRecipe)} have={allIngredients} t={t} lang={lang} />}
      {toast && <div className="fixed left-1/2 top-20 z-50 -translate-x-1/2 rounded-full bg-[#24352d] px-4 py-2 text-sm font-bold text-white shadow-xl">{toast}</div>}
    </div>
  );
}

function ApplianceVisual({ kind, label }: { kind: 'easy' | 'stove' | 'oven' | 'airfryer' | 'microwave'; label: string }) {
  return <div className="method-photo" role="img" aria-label={label}><svg viewBox="0 0 160 110" className="appliance-svg" aria-hidden="true">
    {kind === 'airfryer' && <><rect x="47" y="14" width="66" height="82" rx="20" fill="#20252b"/><rect x="57" y="27" width="46" height="37" rx="10" fill="#101317"/><circle cx="80" cy="45" r="12" fill="#fb923c"/><rect x="65" y="70" width="30" height="8" rx="4" fill="#9ca3af"/><rect x="70" y="77" width="20" height="13" rx="4" fill="#111827"/></>}
    {kind === 'oven' && <><rect x="31" y="16" width="98" height="81" rx="10" fill="#d1d5db"/><rect x="39" y="25" width="82" height="17" rx="5" fill="#374151"/><circle cx="51" cy="33" r="4" fill="#f97316"/><circle cx="109" cy="33" r="4" fill="#9ca3af"/><rect x="43" y="49" width="74" height="39" rx="5" fill="#1f2937"/><rect x="52" y="57" width="56" height="23" rx="3" fill="#7c2d12"/><rect x="62" y="67" width="36" height="6" rx="3" fill="#fb923c"/></>}
    {kind === 'stove' && <><rect x="30" y="74" width="100" height="14" rx="7" fill="#64748b"/><ellipse cx="80" cy="74" rx="37" ry="9" fill="#111827"/><path d="M53 45h54l-8 30H61z" fill="#334155"/><rect x="98" y="49" width="34" height="7" rx="4" fill="#334155"/><path d="M72 75c-8-9 2-16 7-24 9 10 10 16 1 24z" fill="#f97316"/></>}
    {kind === 'microwave' && <><rect x="23" y="25" width="114" height="67" rx="10" fill="#d1d5db"/><rect x="33" y="35" width="72" height="47" rx="6" fill="#1f2937"/><rect x="42" y="43" width="54" height="31" rx="4" fill="#111827"/><path d="M53 58h32" stroke="#fb923c" strokeWidth="4" strokeLinecap="round"/><rect x="113" y="36" width="14" height="10" rx="3" fill="#22c55e"/><circle cx="120" cy="57" r="4" fill="#64748b"/><circle cx="120" cy="69" r="4" fill="#64748b"/></>}
    {kind === 'easy' && <><path d="M43 54h74l-9 35H52z" fill="#374151"/><rect x="35" y="46" width="90" height="10" rx="5" fill="#9ca3af"/><path d="M80 19v27M60 24l10 22M101 24L91 46" stroke="#f97316" strokeWidth="6" strokeLinecap="round"/><circle cx="80" cy="76" r="8" fill="#22c55e"/></>}
  </svg></div>;
}

function RecipeCard({ recipe, t, lang, favorite, onFavorite, onCook, onShare, onSwap }: { recipe: Recipe; t: typeof copy.en; lang: Lang; favorite: boolean; onFavorite: () => void; onCook: () => void; onShare?: () => void; onSwap?: () => void; }) {
  return <article className="group overflow-hidden rounded-[2rem] border border-orange-100 bg-white shadow-card transition duration-300 hover:-translate-y-1 hover:shadow-cardHover"><div className="relative h-40 overflow-hidden bg-gradient-to-br from-amber-100 via-orange-50 to-emerald-50"><RecipePhoto recipe={recipe} fallback={t.coming} /><div className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-black/55 px-2.5 py-1 text-[11px] font-extrabold text-white backdrop-blur-sm"><Clock3 size={12} />{recipe.minutes} min · {recipe.method}</div><div className="absolute right-3 top-3 flex gap-2">{onShare && <button aria-label={t.share} onClick={onShare} className="grid h-10 w-10 place-items-center rounded-full bg-white text-slate-500 shadow transition duration-200 hover:scale-110 hover:text-orange-500"><Share2 size={18} /></button>}<button aria-label={t.favorite} onClick={onFavorite} className={`grid h-10 w-10 place-items-center rounded-full bg-white shadow transition duration-200 hover:scale-110 ${favorite ? 'text-red-500' : 'text-slate-400'}`}><Heart size={20} fill={favorite ? 'currentColor' : 'none'} /></button></div></div><div className="p-5"><h3 className="font-display text-xl font-semibold leading-tight text-[#1f2d26]">{recipe.title}</h3><p className="mt-2 text-sm leading-6 text-slate-600">{recipe.summary}</p><div className="mt-4 flex flex-wrap gap-1.5">{recipe.ingredients.slice(0,5).map(i => <span key={i} className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-800">{i}</span>)}</div>{recipe.nutrition && <div className="mt-3 rounded-xl bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-900"><span>≈ {recipe.nutrition.kcal} {t.kcal}</span><span className="mx-2">·</span><span>{recipe.nutrition.protein}g {t.proteinShort}</span><span className="mx-2">·</span><span>{recipe.nutrition.carbs}g {t.carbsShort}</span><p className="mt-1 font-normal text-slate-600">{t.estimateNote}</p></div>}<div className="mt-4 flex gap-2"><button className="primary-btn flex-1 justify-center" onClick={onCook}><ChefHat size={18} />{t.cook}</button>{onSwap && <button aria-label={t.tryAnother} title={t.tryAnother} onClick={onSwap} className="inline-flex items-center justify-center rounded-2xl border border-orange-100 bg-white px-3 text-slate-600 transition duration-200 hover:-translate-y-0.5 hover:border-orange-200"><Shuffle size={16} /></button>}</div>{recipe.kidTip && <div className="mt-3 rounded-2xl bg-amber-50 p-3 text-xs leading-5 text-amber-900"><strong>{lang === 'en' ? 'Kid tip:' : 'Tip para niños:'}</strong> {recipe.kidTip}</div>}</div></article>;
}

function CookModal({ recipe, step, setStep, onClose, onRate, onShare, have, t, lang }: { recipe: Recipe; step: number; setStep: (n:number)=>void; onClose:()=>void; onRate:(r:HistoryItem['rating'])=>void; onShare:()=>void; have: string[]; t: typeof copy.en; lang:Lang; }) {
  const [transitioning,setTransitioning]=useState(false); const finished=step>=recipe.steps.length;
  const [mode,setMode]=useState<'read'|'listen'>('read'); const speechSupported = canSpeak();
  const haveNorm = have.map(x => x.toLowerCase().trim());
  const owned = recipe.ingredients.filter(i => haveNorm.some(h => i.toLowerCase().includes(h) || h.includes(i.toLowerCase())));
  const toBuy = recipe.ingredients.filter(i => !owned.includes(i));
  function copyShoppingList(){ const list = toBuy.length > 0 ? toBuy : recipe.ingredients; void navigator.clipboard?.writeText(`${recipe.title}\n${list.map(i=>`- ${i}`).join('\n')}`).catch(()=>undefined); }
  function currentSpokenText(){
    if (finished) return lang === 'en' ? `Dinner is listo! ${t.rate}` : `¡La cena está lista! ${t.rate}`;
    if (step === 0) return `${lang==='en'?'You will need':'Vas a necesitar'}: ${recipe.ingredients.join(', ')}. ${lang==='en'?'Step 1':'Paso 1'}: ${recipe.steps[0]}`;
    return `${lang==='en'?'Step':'Paso'} ${step+1}: ${recipe.steps[step]}`;
  }
  useEffect(() => {
    if (mode === 'listen' && speechSupported) speak(currentSpokenText(), lang);
    return () => { if (speechSupported) window.speechSynthesis.cancel(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, mode, finished]);
  function playTransitionSound(isFinal:boolean){try{const AudioContextClass=window.AudioContext||(window as unknown as {webkitAudioContext?:typeof AudioContext}).webkitAudioContext;if(!AudioContextClass)return;const context=new AudioContextClass();const gain=context.createGain();gain.connect(context.destination);gain.gain.setValueAtTime(.0001,context.currentTime);gain.gain.exponentialRampToValueAtTime(.1,context.currentTime+.01);gain.gain.exponentialRampToValueAtTime(.0001,context.currentTime+(isFinal?.34:.2));const first=context.createOscillator();first.type='sine';first.frequency.setValueAtTime(isFinal?660:720,context.currentTime);first.connect(gain);first.start(context.currentTime);first.stop(context.currentTime+(isFinal?.22:.16));if(isFinal){const second=context.createOscillator();second.type='sine';second.frequency.setValueAtTime(880,context.currentTime+.12);second.connect(gain);second.start(context.currentTime+.12);second.stop(context.currentTime+.34);}window.setTimeout(()=>void context.close(),450);}catch{}}
  function goNext(){if(transitioning)return;playTransitionSound(step===recipe.steps.length-1);setTransitioning(true);window.setTimeout(()=>{setStep(step+1);setTransitioning(false);},750);}
  return <div className="fixed inset-0 z-40 bg-black/45 p-3 backdrop-blur-sm"><div className="relative mx-auto flex h-full max-w-xl flex-col overflow-hidden rounded-[2rem] bg-[#fffaf2] shadow-2xl"><div className="flex items-start justify-between border-b border-orange-100 bg-white p-5"><div><div className="text-xs font-bold uppercase tracking-widest text-orange-500">{t.cook}</div><h2 className="mt-1 text-xl font-black">{recipe.title}</h2></div><button className="icon-btn" onClick={onClose}><X size={20}/></button></div>{speechSupported && <div className="flex gap-2 border-b border-orange-100 bg-white px-5 pb-4"><button className={`mode-btn flex-1 ${mode==='read'?'active':''}`} onClick={()=>{setMode('read');window.speechSynthesis.cancel();}}><BookOpen size={16}/>{lang==='en'?'Read':'Leer'}</button><button className={`mode-btn flex-1 ${mode==='listen'?'active':''}`} onClick={()=>setMode('listen')}><Volume2 size={16}/>{lang==='en'?'Listen':'Escuchar'}</button></div>}<div className="flex-1 overflow-y-auto p-5">{step===0&&<div className="mb-5 rounded-3xl bg-white p-4 shadow-sm"><h3 className="font-black">{lang==='en'?'Before you start':'Antes de empezar'}</h3><div className="mt-3 flex items-center justify-between gap-2"><p className="label !mb-0">{t.shopping}</p><button onClick={copyShoppingList} className="inline-flex items-center gap-1 rounded-full border border-orange-100 bg-orange-50 px-2.5 py-1 text-[11px] font-extrabold text-orange-600">{t.copyList}</button></div>{owned.length>0&&<p className="mt-2 text-xs font-bold text-emerald-700">{t.have}: {owned.join(', ')}</p>}{toBuy.length>0?<p className="mt-1 text-sm font-semibold text-slate-700">{t.needToBuy}: {toBuy.join(', ')}</p>:<p className="mt-1 text-sm font-semibold text-emerald-700">{lang==='en'?'You have everything you need!':'¡Ya tienes todo lo que necesitas!'}</p>}{recipe.pantryBasics.length>0&&<><p className="label mt-3">{t.pantry}</p><p className="text-sm">{recipe.pantryBasics.join(' • ')}</p></>}</div>}{!finished?<div className="rounded-[2rem] bg-white p-6 shadow-sm"><div className="mb-3 flex items-center justify-between gap-2"><div className="text-sm font-bold text-orange-500">{lang==='en'?'Step':'Paso'} {step+1} / {recipe.steps.length}</div>{mode==='listen'&&speechSupported&&<button aria-label={lang==='en'?'Replay':'Repetir'} onClick={()=>speak(currentSpokenText(),lang)} className="icon-btn"><Volume2 size={16}/></button>}</div><p className="text-xl font-bold leading-8">{recipe.steps[step]}</p></div>:<div className="rounded-[2rem] bg-white p-6 text-center shadow-sm"><Star className="mx-auto mb-3 text-orange-500" size={44}/><h3 className="text-2xl font-black">{lang==='en'?'Dinner is listo!':'¡La cena está lista!'}</h3><p className="mt-2 text-slate-600">{t.rate}</p><div className="mt-5 grid grid-cols-2 gap-2"><button className="rating" onClick={()=>onRate('loved')}>♥ {lang==='en'?'Loved it':'Me encantó'}</button><button className="rating" onClick={()=>onRate('good')}>👍 {lang==='en'?'Good':'Bien'}</button><button className="rating" onClick={()=>onRate('meh')}>😐 Meh</button><button className="rating" onClick={()=>onRate('nope')}>👎 Nope</button></div><button onClick={onShare} className="primary-btn mt-4 w-full justify-center"><Share2 size={16}/>{lang==='en'?'Share your win':'Comparte tu logro'}</button></div>}</div><div className="flex gap-2 border-t border-orange-100 bg-white p-4"><button className="secondary-btn flex-1 justify-center" disabled={step===0||transitioning} onClick={()=>setStep(Math.max(0,step-1))}>{t.back}</button>{!finished&&<button className="primary-btn flex-1 justify-center" disabled={transitioning} onClick={goNext}>{step===recipe.steps.length-1?t.done:t.next}</button>}</div>{transitioning&&<div className="absolute inset-0 z-50 grid place-items-center bg-[#fffaf2]/95 p-6 backdrop-blur-sm"><div className="text-center"><img src="/resources/yum-mascot.png" alt="ListoMeal cartoon child enjoying food" className="mx-auto max-h-[62vh] w-auto max-w-full animate-pulse rounded-[2rem] object-contain drop-shadow-xl"/><div className="mt-3 text-lg font-black text-orange-600">{lang==='en'?'Mmm… almost there!':'¡Mmm… ya casi!'}</div></div></div>}</div></div>;
}

function RecipePhoto({ recipe, fallback }: { recipe:Recipe; fallback:string }) {
  const [url,setUrl]=useState('');
  const [failed,setFailed]=useState(false);
  useEffect(()=>{let active=true;setUrl('');setFailed(false);void api.post('/api/photo',{id:recipe.id,title:recipe.title,summary:recipe.summary,ingredients:recipe.ingredients,method:recipe.method}).then(response=>{if(active&&response.data.imageUrl)setUrl(response.data.imageUrl);}).catch(()=>undefined);return()=>{active=false;};},[recipe.id,recipe.title,recipe.summary]);
  if(!url||failed)return <div className="grid h-full place-items-center text-center"><div><ChefHat className="mx-auto mb-2 text-orange-400" size={42}/><div className="text-xs font-bold uppercase tracking-widest text-orange-500">{fallback}</div></div></div>;
  return <div className="relative h-full w-full"><img src={url} alt={recipe.title} className="h-full w-full object-cover" onError={()=>setFailed(true)}/><div className="absolute bottom-0 left-0 right-0 bg-black/55 px-2 py-1 text-[10px] text-white">AI generated illustration · Ilustración generada por IA</div></div>;
}
function NumberField({label,value,onChange}:{label:string;value:number;onChange:(v:number)=>void}){return <div><label className="label">{label}</label><div className="flex items-center justify-between rounded-2xl border border-orange-100 bg-[#fffaf2] p-2"><button className="icon-btn" onClick={()=>onChange(Math.max(0,value-1))}><Minus size={17}/></button><strong>{value}</strong><button className="icon-btn" onClick={()=>onChange(value+1)}><Plus size={17}/></button></div></div>;}
function Empty({text}:{text:string}){return <div className="rounded-[2rem] border border-dashed border-orange-200 bg-white p-10 text-center text-slate-500">{text}</div>;}

export default App;
