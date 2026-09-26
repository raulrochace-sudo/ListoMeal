// Export the app's deterministic local recipe catalog for a reviewed photo batch.
const fs = require('fs');
const path = require('path');
const ts = require('../node_modules/typescript');
const transpile = (filename) => ts.transpileModule(fs.readFileSync(path.join(__dirname, '../src', filename), 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
}).outputText;
const nutrition = {};
new Function('exports', transpile('nutrition.ts'))(nutrition);
const curated = {};
new Function('exports', transpile('curatedCatalog.ts'))(curated);
const expanded = {};
new Function('exports', transpile('expandedCatalog.ts'))(expanded);
const exportsObject = {};
new Function('exports', 'require', transpile('localRecipes.ts'))(exportsObject, name => {
  if (name === './nutrition') return nutrition;
  if (name === './curatedCatalog') return curated;
  if (name === './expandedCatalog') return expanded;
  throw new Error(`Unexpected module: ${name}`);
});
const en = exportsObject.library('en');
const es = exportsObject.library('es');
if (en.length !== es.length || en.some((recipe, i) => recipe.id !== es[i].id)) {
  throw new Error('English and Spanish catalogs do not have matching IDs');
}
const items = en.map((recipe, i) => ({
  id: recipe.id,
  title: recipe.title,
  titleEs: es[i].title,
  summary: recipe.summary,
  method: recipe.method,
  ingredients: recipe.ingredients,
  pantryBasics: recipe.pantryBasics,
  nutrition: recipe.nutrition,
}));
const dest = path.join(__dirname, '../catalog/recipes.en.json');
fs.mkdirSync(path.dirname(dest), { recursive: true });
fs.writeFileSync(dest, JSON.stringify(items, null, 2) + '\n');
console.log(`${items.length} recipes exported to ${dest}`);
