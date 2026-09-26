# ListoMeal: fotos y objetivos nutricionales

El catálogo contiene 470 recetas distintas. Cada receta usa el mismo ID en inglés y español; la foto generada se comparte entre ambos idiomas. Las imágenes generadas ilustran los ingredientes, no garantizan reproducir exactamente el plato casero.

## Precio y pago

El modelo usado es `gpt-image-1.5`, calidad `medium`, tamaño `1024x1024`.
La tarifa publicada por OpenAI es aproximadamente USD $0.034 por imagen: 470 x $0.034 ≈ USD $15.98, más posibles tokens de entrada, impuestos o cargos aplicables. Revisa el precio actual antes de comprar. Un saldo inicial de $20 a $25 puede cubrir esta tanda, pero no es una garantía de costo final.

Abre https://platform.openai.com/settings/organization/billing/overview , inicia sesión y selecciona «Add payment details» o «Buy credits». Verifica si está activada la recarga automática; desactívala si no la deseas. Tu suscripción a ChatGPT y los créditos de API se facturan por separado.

## Generar imágenes una sola vez (Windows)

1. Aplica los archivos de este parche en la carpeta `ListoMeal/migration/` de tu copia de GitHub Desktop.
2. En Windows, abre la carpeta `ListoMeal/migration/`. Haz clic en la barra de dirección del Explorador de archivos, escribe `powershell` y presiona Enter.
3. Ejecuta: `powershell -ExecutionPolicy Bypass -File .\scripts\generate_photos_windows.ps1`
4. Pega tu **clave de API** cuando el programa la pida. No compartas la clave ni la guardes en GitHub, capturas o conversaciones.
5. El script prepara hasta 470 fotos y las convierte a archivos WebP dentro de `migration/public/recipe-images/`. Si se detiene, ejecuta el mismo comando de nuevo: omite las fotos ya guardadas. Revisa que cada foto corresponda a la receta antes de publicarla.
6. En GitHub Desktop, comprueba los cambios, haz Commit to main y Push origin. Render reconstruirá el sitio automáticamente si Auto Deploy sigue habilitado. Abre listomeal.com después del despliegue.

No hay que configurar `OPENAI_API_KEY` en Render: el lote genera los archivos en tu computadora y se sirven desde el código publicado. El generador no produce fotos durante las visitas al sitio. Los filtros «Menos carbohidratos» y «Más proteína» usan porciones modelo de un adulto; el conteo de calorías y macronutrientes es aproximado, no se adapta a las cantidades que cocine cada persona.
