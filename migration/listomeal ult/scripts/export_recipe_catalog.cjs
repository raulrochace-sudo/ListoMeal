// Export the app's deterministic local recipe catalog for a reviewed photo batch.
const fs = require('fs');
const path = require('path');
const ts = require('../node_modules/typescript');
const source = fs.readFileSync(path.join(__dirname, '../src/localRecipes.ts'), 'utf8');
const js = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
}).outputText;
const exportsObject = {};
new Function('exports', `${js}\nexports.getCompleteCatalog = library;`)(exportsObject);
const en = exportsObject.getCompleteCatalog('en');
const es = exportsObject.getCompleteCatalog('es');
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
}));
const dest = path.join(__dirname, '../catalog/recipes.en.json');
fs.mkdirSync(path.dirname(dest), { recursive: true });
fs.writeFileSync(dest, JSON.stringify(items, null, 2) + '\n');
console.log(`${items.length} recipes exported to ${dest}`);
