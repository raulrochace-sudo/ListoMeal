
import os, json, re, base64
from pathlib import Path
from flask import Flask, request, jsonify, send_from_directory
from openai import OpenAI

BASE_DIR = Path(__file__).parent
app = Flask(__name__, static_folder=str(BASE_DIR / "static"), static_url_path="")

@app.after_request
def add_no_cache_headers(response):
    if request.path == "/" or request.path.endswith(".html"):
        response.headers["Cache-Control"] = "no-store, no-cache, must-revalidate, max-age=0"
        response.headers["Pragma"] = "no-cache"
        response.headers["Expires"] = "0"
    return response

def clean_json(text):
    text = text.strip()
    text = re.sub(r"^```(?:json)?\s*", "", text)
    text = re.sub(r"\s*```$", "", text)
    return json.loads(text)


@app.route("/api/scan", methods=["POST"])
def scan():
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        return jsonify({"error": "OPENAI_API_KEY is not configured on the server."}), 503

    data = request.get_json(force=True) or {}
    image_data = data.get("image_data", "")
    language = data.get("language", "en")
    if not image_data.startswith("data:image/"):
        return jsonify({"error": "No valid image was provided."}), 400

    lang_name = "Spanish" if language == "es" else "English"

    prompt = f"""
You are the fridge/pantry scanner for ListoMeal.

Analyze the supplied image and identify ONLY food ingredients or clearly edible grocery items
that are reasonably visible. Do not guess hidden contents or infer brands from vague shapes.

Return ONLY valid JSON:
{{
  "ingredients": [
    {{"name":"ingredient name","confidence":"high|medium"}}
  ]
}}

Rules:
1. Output ingredient names in {lang_name}.
2. Prefer generic names: "milk", "eggs", "cheddar cheese", "broccoli", not brand names.
3. Do not include containers, shelves, utensils, appliances, cleaning products, or non-food objects.
4. If an item is uncertain, omit it rather than guessing.
5. Duplicate items should appear once.
6. Keep the list concise and useful for cooking.
"""

    client = OpenAI(api_key=api_key)
    try:
        response = client.responses.create(
            model="gpt-5.6-luna",
            input=[
                {
                    "role": "user",
                    "content": [
                        {"type": "input_text", "text": prompt},
                        {"type": "input_image", "image_url": image_data},
                    ],
                }
            ],
        )
        payload = clean_json(response.output_text)
        return jsonify(payload)
    except Exception as e:
        return jsonify({"error": f"Image scan failed: {str(e)}"}), 500



@app.route("/api/recipe-image", methods=["POST"])
def recipe_image():
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        return jsonify({"error": "OPENAI_API_KEY is not configured on the server."}), 503

    data = request.get_json(force=True) or {}
    title = (data.get("title") or "").strip()
    summary = (data.get("summary") or "").strip()
    ingredients = data.get("ingredients", []) or []

    if not title:
        return jsonify({"error": "Recipe title is required."}), 400

    ingredient_text = ", ".join([str(x) for x in ingredients[:12]])

    prompt = f"""
Create a photorealistic, appetizing food photo of the finished dish.
Dish name: {title}
Short description: {summary}
Main ingredients: {ingredient_text}

Requirements:
- Show the exact finished meal implied by the recipe title and description.
- Keep the image aligned with the listed ingredients.
- Do not show unrelated prominent ingredients.
- Natural home-kitchen food photography style.
- No text, no labels, no packaging, no logos, no hands.
- Show the whole plated dish clearly and make it look delicious.
"""

    client = OpenAI(api_key=api_key)
    try:
        result = client.images.generate(
            model="gpt-image-1",
            prompt=prompt,
            size="1024x1024",
            quality="low",
        )
        image_base64 = result.data[0].b64_json
        return jsonify({"image_data": f"data:image/png;base64,{image_base64}"})
    except Exception as e:
        return jsonify({"error": f"Image generation failed: {str(e)}"}), 500

@app.route("/")
def home():
    return send_from_directory(BASE_DIR / "static", "index.html")

@app.route("/api/recipes", methods=["POST"])
def recipes():
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        return jsonify({
            "error": "OPENAI_API_KEY is not configured on the server."
        }), 503

    data = request.get_json(force=True) or {}
    ingredients = data.get("ingredients", [])
    language = data.get("language", "en")
    time_minutes = data.get("time_minutes", 20)
    method = data.get("method", "easiest")
    adults = data.get("adults", 2)
    kids = data.get("kids", 0)
    avoid = data.get("avoid", "")
    taste_profile = data.get("taste_profile", {}) or {}
    liked = taste_profile.get("liked", [])
    disliked = taste_profile.get("disliked", [])
    family_profile = data.get("family_profile", {}) or {}
    kid_ages = family_profile.get("kid_ages", [])
    diet = family_profile.get("diet", "")
    profile_dislikes = family_profile.get("dislikes", "")

    if not ingredients:
        return jsonify({"error": "Please provide ingredients."}), 400

    lang_name = "Spanish" if language == "es" else "English"

    prompt = f"""
You are the recipe engine for ListoMeal, a family meal app for busy parents.

Return ONLY valid JSON. No markdown, no commentary.

The user has:
- Ingredients explicitly entered: {ingredients}
- Available time: {time_minutes} minutes
- Preferred appliance/method: {method}
- Adults: {adults}
- Kids: {kids}
- Avoid/allergies/dislikes: {avoid or "none provided"}
- Previous meals the family liked: {liked or "none yet"}
- Previous meals the family disliked: {disliked or "none yet"}
- Kids' ages: {kid_ages or "not provided"}
- Family dietary preferences: {diet or "none provided"}
- Family disliked foods: {profile_dislikes or "none provided"}
- Output language: {lang_name}

Rules:
1. Create exactly 3 genuinely different, appetizing family meals.
2. Build the meals primarily from the user's entered ingredients.
3. You MAY suggest common pantry basics such as oil, salt, pepper, butter, garlic powder,
   onion powder, flour, sugar, milk, eggs, ketchup, mustard, mayo, soy sauce, or water.
4. Pantry basics MUST be listed separately. Never pretend the user entered them.
5. Optional extras MUST also be listed separately and clearly optional.
6. Do not simply tell the user to cook ingredients separately and combine them.
   Each result must be a recognizable composed dish with a sensible cooking technique.
7. Respect the selected appliance/method when practical. If a recipe requires another method,
   say so clearly in "method".
8. Respect the avoid/allergy field strictly.
9. Make instructions friendly for someone who is not an experienced cook.
10. Include quantities appropriate for the household size.
11. Include practical cooking times and temperatures when useful.
12. For meat, poultry, seafood, or eggs, say to verify safe doneness with an appropriate food thermometer
    rather than guessing from appearance.
13. Avoid medical or nutrition claims.
14. Use the family's history as a soft preference signal:
    - If previous meals were rated loved/good, favor similar flavors, formats, or cooking styles when they fit the current ingredients.
    - If previous meals were rated meh/nope, avoid repeating very similar dishes unless the current ingredients leave few alternatives.
    - Do not mention or expose internal preference scoring to the user.
15. Current ingredients, time, appliance choice, and allergy/avoid fields always take priority over taste history.
16. Use kids' ages only to make serving suggestions age-appropriate and practical; do not make medical claims.
17. Respect family dietary preferences and disliked foods when practical.

JSON shape:
{{
  "recipes": [
    {{
      "title": "string",
      "summary": "one short sentence",
      "time_minutes": 20,
      "difficulty": "Easy",
      "method": "Air Fryer",
      "uses_from_home": ["ingredient with quantity"],
      "pantry_basics": ["ingredient with quantity"],
      "optional": ["optional item"],
      "steps": ["step 1", "step 2", "step 3", "step 4"],
      "kid_tip": "short practical kid-friendly serving suggestion"
    }}
  ]
}}
"""

    client = OpenAI(api_key=api_key)
    try:
        response = client.responses.create(
            model="gpt-5.6-luna",
            input=prompt,
        )
        payload = clean_json(response.output_text)
        if "recipes" not in payload or len(payload["recipes"]) != 3:
            raise ValueError("Model did not return exactly 3 recipes.")
        return jsonify(payload)
    except Exception as e:
        return jsonify({"error": f"Recipe generation failed: {str(e)}"}), 500

if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5000, debug=True)
