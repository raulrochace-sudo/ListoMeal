# ListoMeal: estado de esta versión

Esta carpeta combina la versión nueva proporcionada el 25 de septiembre con:

- la nueva imagen de portada y la selección de ingredientes bilingüe;
- pasos de cocina ampliados a siete, con indicaciones de cocción segura;
- un botón para tomar una segunda foto después del primer escaneo;
- el identificador de Google Analytics `G-1C18Z2ZPTY`;
- un pequeño servidor Flask para servir el frontend compilado y consultar fotos de Pexels.

Los filtros «Low carb» y «Alta en proteína» y los cálculos de calorías se retiraron porque el ZIP no indica porciones ni cantidades suficientes para calcular cifras fiables. Las recetas locales siguen siendo plantillas; se deben probar con alimentos y cantidades reales antes de ofrecerlas como instrucciones completas.

## Pendiente para publicar

Este paquete es código fuente y **no contiene `dist/` compilado**. En un entorno con acceso a npm, instalar dependencias con `npm install` y compilar con `npm run build`. Instalar también `requirements.txt` para ejecutar el servidor (`gunicorn server:app --bind 0.0.0.0:$PORT`). No sustituir los archivos del servicio actual hasta comprobar la compilación y las rutas `/`, `/api/photo` y `/api/_healthcheck`.

Configurar `PEXELS_API_KEY` en el entorno del servidor para ver fotografías de Pexels. La ruta `/api/feedback` responde 503 hasta conectar almacenamiento persistente; la interfaz muestra un error al intentar enviar comentarios. El escaneo inicial y el segundo se realizan en el dispositivo, sin enviar fotografías al servidor.

El código original de `backend/index.ts` utiliza AppDeploy y se conserva como referencia; no se ejecuta en Flask.
