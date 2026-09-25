import { ai, db, router, json, error, secrets } from '@appdeploy/sdk';

type Profile = { name?: string; adults?: number; kids?: number; ages?: string; avoid?: string; dislikes?: string; diet?: string; };
type Body = { mode?: 'recipes' | 'scan'; lang?: 'en' | 'es'; ingredients?: string[]; time?: string; method?: string; profile?: Profile; recentTitles?: string[]; image?: { data?: string; mimeType?: string }; };
function parseJson(text: string): unknown { const cleaned = text.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, ''); return JSON.parse(cleaned); }

export const handler = router({
  'GET /api/_healthcheck': [async () => json({ message: 'Success' })],
  'POST /api/feedback': [async ({ body }) => {
    const input = body as { sentiment?: string; issue?: string; comment?: string; lang?: string; ingredients?: unknown; method?: string; recipeTitle?: string; };
    if (!['good', 'okay', 'bad'].includes(input.sentiment || '')) return error('Choose a rating first', 400);
    const ingredients = Array.isArray(input.ingredients) ? input.ingredients.filter((x): x is string => typeof x === 'string').slice(0, 20) : [];
    const [id] = await db.add('tester_feedback', [{ sentiment: input.sentiment, issue: String(input.issue || '').slice(0,40), comment: String(input.comment || '').slice(0,600), lang: input.lang === 'es' ? 'es' : 'en', ingredients, method: String(input.method || '').slice(0,40), recipeTitle: String(input.recipeTitle || '').slice(0,160), createdAt: new Date().toISOString() }]);
    if (!id) return error('Could not save feedback', 500); return json({ saved: true, id });
  }],
  'POST /api/photo': [async ({ body }) => {
    const input = body as { title?: string }; const title = input.title?.trim(); if (!title) return error('Missing recipe title', 400);
    try {
      const secretNames = await secrets.listSecretNames(); if (!secretNames.includes('PEXELS_API_KEY')) return json({ configured: false });
      const apiKey = await secrets.readSecret('PEXELS_API_KEY'); const query = encodeURIComponent(`${title} food meal`);
      const response = await fetch(`https://api.pexels.com/v1/search?query=${query}&per_page=1&orientation=landscape`, { headers: { Authorization: apiKey } });
      if (!response.ok) { console.warn('Pexels photo search failed', response.status); return json({ configured: true, found: false }); }
      const data = (await response.json()) as { photos?: Array<{url?:string;photographer?:string;photographer_url?:string;src?:{large?:string;medium?:string;landscape?:string}}> };
      const photo = data.photos?.[0]; const imageUrl = photo?.src?.landscape || photo?.src?.large || photo?.src?.medium; if (!photo || !imageUrl) return json({ configured:true, found:false });
      return json({ configured:true, found:true, imageUrl, photographer:photo.photographer||'Pexels', photographerUrl:photo.photographer_url||'https://www.pexels.com', pexelsUrl:photo.url||'https://www.pexels.com' });
    } catch (err) { console.warn('Recipe photo lookup error', err); return json({ configured:false, found:false }); }
  }],
  'POST /api/ai': [async ({ body }) => {
    const input = body as Body;
    try {
      if (input.mode === 'scan') {
        if (!input.image?.data || !input.image.mimeType) return error('Missing image',400);
        const result = await ai.generate({ system:'You identify ordinary food ingredients visible in kitchen photos. Be conservative: only name items you can actually see with reasonable confidence. Never invent hidden ingredients.', prompt: input.lang === 'es' ? 'Identifica los ingredientes de comida visibles. Devuelve SOLO JSON válido con esta forma: {"ingredients":["ingrediente 1","ingrediente 2"]}. Usa nombres sencillos en español.' : 'Identify the visible food ingredients. Return ONLY valid JSON in this shape: {"ingredients":["ingredient 1","ingredient 2"]}. Use simple English names.', images:[{data:input.image.data,mimeType:input.image.mimeType}], maxTokens:700, thinkingMode:'FAST' });
        const parsed = parseJson(result.text) as { ingredients?: unknown }; const ingredients = Array.isArray(parsed.ingredients) ? parsed.ingredients.filter((x): x is string => typeof x === 'string').slice(0,30) : []; return json({ ingredients });
      }
      if (input.mode === 'recipes') {
        const ingredients=(input.ingredients??[]).filter(x=>typeof x==='string'&&x.trim()).slice(0,40); if(!ingredients.length)return error('Add ingredients first',400); const profile=input.profile??{}; const language=input.lang==='es'?'Spanish':'English';
        const prompt=`Create exactly 3 genuinely different family meals. Respond ONLY with valid JSON: {"recipes":[{"title":"","summary":"","minutes":20,"method":"","ingredients":["quantity + ingredient"],"pantryBasics":[""],"optionalExtras":[""],"steps":[""],"kidTip":""}]}. Language: ${language}. Available ingredients: ${ingredients.join(', ')}. Target time: ${input.time ?? '20'} minutes. Preferred equipment: ${input.method ?? 'Easiest'}. Family: ${profile.adults ?? 2} adults, ${profile.kids ?? 0} kids, kids ages: ${profile.ages || 'not specified'}. STRICTLY avoid allergies/restrictions: ${profile.avoid || 'none listed'}. Dislikes: ${profile.dislikes || 'none listed'}. Dietary needs: ${profile.diet || 'none listed'}. Recently shown meals to avoid repeating when practical: ${(input.recentTitles ?? []).join(' | ') || 'none'}. Primarily use the available ingredients. Separate common pantry basics such as oil, salt, pepper, water, common dried spices. Put truly optional additions in optionalExtras. Each recipe must be a recognizable composed dish, not unrelated items cooked separately. Give realistic quantities and 4-7 clear cooking steps. Include safe doneness guidance where relevant. Do not claim the user has ingredients that were not supplied except pantry basics or clearly optional extras.`;
        const result=await ai.generate({prompt,maxTokens:3200,thinkingMode:'FAST'}); const parsed=parseJson(result.text) as {recipes?:unknown}; if(!Array.isArray(parsed.recipes))return error('AI response was not usable',502);
        const recipes=parsed.recipes.slice(0,3).map((raw,index)=>{const r=raw as Record<string,unknown>;return{id:`${Date.now()}-${index}-${Math.random().toString(36).slice(2,7)}`,title:String(r.title??`Meal ${index+1}`),summary:String(r.summary??''),minutes:Number(r.minutes??Number(input.time)??20),method:String(r.method??input.method??'Easiest'),ingredients:Array.isArray(r.ingredients)?r.ingredients.map(String):ingredients,pantryBasics:Array.isArray(r.pantryBasics)?r.pantryBasics.map(String):[],optionalExtras:Array.isArray(r.optionalExtras)?r.optionalExtras.map(String):[],steps:Array.isArray(r.steps)?r.steps.map(String).slice(0,8):[],kidTip:String(r.kidTip??'')}}); return json({recipes});
      }
      return error('Unknown mode',400);
    } catch(err){console.error('ListoMeal AI error',err);return error('ListoMeal could not generate a result right now. Please try again.',500);}
  }],
});
