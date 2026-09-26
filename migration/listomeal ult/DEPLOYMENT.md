# ListoMeal: estado de esta versión

Esta carpeta combina la versión nueva proporcionada el 25 de septiembre con:

- la nueva imagen de portada y la selección de ingredientes bilingüe;
- la selección inicial de idioma según la preferencia del navegador del teléfono, una portada equivalente en español y una preferencia manual que se conserva;
- pasos de cocina ampliados a siete, con indicaciones de cocción segura;
- un botón para tomar una segunda foto después del primer escaneo;
- el identificador de Google Analytics `G-1C18Z2ZPTY`;
- un pequeño servidor Flask para servir el frontend compilado y generar imágenes específicas para cada receta, si se configura la opción de pago.

Los filtros «Low carb» y «Alta en proteína» y los cálculos de calorías se retiraron porque el ZIP no indica porciones ni cantidades suficientes para calcular cifras fiables. Las recetas locales siguen siendo plantillas; se deben probar con alimentos y cantidades reales antes de ofrecerlas como instrucciones completas.

## Pendiente para publicar

Este paquete es código fuente y **no contiene `dist/` compilado**. En un entorno con acceso a npm, instalar dependencias con `npm install` y compilar con `npm run build`. Instalar también `requirements.txt` para ejecutar el servidor (`gunicorn server:app --bind 0.0.0.0:$PORT`). No sustituir los archivos del servicio actual hasta comprobar la compilación y las rutas `/`, `/api/photo` y `/api/_healthcheck`.

La ruta `/api/feedback` responde 503 hasta conectar almacenamiento persistente; la interfaz muestra un error al intentar enviar comentarios. El escaneo inicial y el segundo se realizan en el dispositivo, sin enviar fotografías al servidor.

## Imágenes específicas para recetas (opcional)

Esta versión sustituye la consulta a Pexels por imágenes generadas con la descripción e ingredientes de cada receta. **Está desactivada por defecto y no gasta dinero**. Sin configurar todas estas variables, las tarjetas permanecen sin imagen:

- `OPENAI_API_KEY`: clave de la API de OpenAI (guardar como secreto de Render; nunca en GitHub).
- `RECIPE_IMAGE_STORAGE`: ruta **persistente** de un disco montado en Render, por ejemplo `/var/data/listomeal-images`. El almacenamiento efímero de una instancia gratuita no sirve como caché ni como control permanente de gasto.
- `RECIPE_IMAGE_MONTHLY_LIMIT`: límite de solicitudes nuevas por mes UTC. Por ejemplo, `100`; a calidad media 1024 × 1024, el precio de salida publicado para GPT Image 1.5 es $0.034 por imagen más el costo de tokens de entrada. `0` desactiva la generación.

El servidor guarda la imagen y cuenta una solicitud antes de llamar a la API; una solicitud fallida consume una plaza del límite por precaución. La clave solo se usa en el servidor. El límite local depende de la conservación del disco y no reemplaza un límite de gasto en la plataforma OpenAI. Si se usan varias instancias, **todas deben compartir el mismo disco/base de datos** o no se puede garantizar el límite conjunto. Las imágenes son ilustraciones generadas, no fotografías reales de un plato preparado. `PEXELS_API_KEY` ya no se usa en este flujo.

El código original de `backend/index.ts` utiliza AppDeploy y se conserva como referencia; no se ejecuta en Flask.

## Preparación del lote de 500 imágenes

El catálogo actual contiene **470 recetas distintas**, con el mismo ID en inglés y español. `catalog/recipes.en.json` se exporta del catálogo de la app con `node scripts/export_recipe_catalog.cjs`. Faltan 30 recetas distintas para llegar a 500; no generar imágenes duplicadas solo para cumplir una cifra. El servidor ahora identifica las recetas locales por ID estable y reutiliza su imagen entre idiomas. Si ya existe una imagen en el disco persistente, se sirve incluso después de desactivar las nuevas generaciones.

`python3 scripts/batch_recipe_photos.py` solo muestra cuántas recetas hay y no realiza ninguna llamada de pago. Para generar, configurar primero una clave de API facturable, `RECIPE_IMAGE_STORAGE` con un disco persistente y `RECIPE_IMAGE_MONTHLY_LIMIT` acorde al lote, revisar una muestra de fotos y luego ejecutar `python3 scripts/batch_recipe_photos.py --execute --max-new 20`. Repetir con un máximo mayor solo tras la revisión y el presupuesto. El archivo SQLite cuenta intentos fallidos y las imágenes existentes se reutilizan. La ruta no debe ser el almacenamiento efímero de Render.

El sitio público solamente sirve fotos ya guardadas. No permite generaciones nuevas en las visitas por defecto, para que terceros no consuman el presupuesto de las 500 fotos. `RECIPE_IMAGE_ON_DEMAND=1` habilita expresamente nuevas generaciones por solicitud pública y no se recomienda para este lote.
