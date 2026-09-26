"""ListoMeal frontend and capped, persistent recipe-image generation."""
import base64
import hashlib
import json
import os
import re
import sqlite3
from datetime import datetime, timezone
from pathlib import Path
from urllib.request import Request, urlopen

from flask import Flask, jsonify, request, send_from_directory

ROOT = Path(__file__).resolve().parent
app = Flask(__name__, static_folder="dist", static_url_path="")


@app.get("/api/_healthcheck")
def health():
    return jsonify(message="Success")


def settings():
    key = os.getenv("OPENAI_API_KEY", "").strip()
    path = os.getenv("RECIPE_IMAGE_STORAGE", "").strip()
    try:
        cap = max(0, int(os.getenv("RECIPE_IMAGE_MONTHLY_LIMIT", "0")))
    except ValueError:
        cap = 0
    return key, Path(path) if path else None, cap


@app.post("/api/photo")
def photo():
    key, directory, cap = settings()
    if not directory:
        return jsonify(found=False, configured=False)
    data = request.get_json(silent=True) or {}
    title = str(data.get("title") or "").strip()[:100]
    summary = str(data.get("summary") or "").strip()[:240]
    method = str(data.get("method") or "").strip()[:50]
    items = data.get("ingredients")
    if not title or not isinstance(items, list):
        return jsonify(error="Missing recipe"), 400
    ingredients = [x.strip()[:70] for x in items[:15] if isinstance(x, str) and x.strip()]
    if not ingredients:
        return jsonify(found=False)
    recipe_id = str(data.get("id") or "")
    # Local recipe IDs are identical in both languages, so a translated recipe
    # reuses its existing image instead of paying for another generation.
    identity = ("local:" + recipe_id) if re.fullmatch(r"local-[1-9]\d*", recipe_id) else json.dumps(
        [title, summary, method, ingredients], ensure_ascii=False)
    digest = hashlib.sha256(identity.encode()).hexdigest()
    try:
        image = directory / (digest + ".png")
        url = "/api/recipe-image/" + digest
        if image.is_file():
            return jsonify(found=True, imageUrl=url, cached=True)
        # The public site serves prepared photos. Only the offline batch tool
        # may generate new ones unless on-demand generation is explicitly enabled.
        generation_allowed = app.config.get("BATCH_RECIPE_IMAGES", False) or os.getenv("RECIPE_IMAGE_ON_DEMAND") == "1"
        if not key or not cap or not generation_allowed:
            return jsonify(found=False, configured=False)
        directory.mkdir(parents=True, exist_ok=True)
        with sqlite3.connect(directory / "quota.sqlite", timeout=20) as db:
            db.execute("CREATE TABLE IF NOT EXISTS requests (id TEXT PRIMARY KEY, month TEXT NOT NULL)")
            db.execute("BEGIN IMMEDIATE")
            if image.is_file():
                return jsonify(found=True, imageUrl=url, cached=True)
            month = datetime.now(timezone.utc).strftime("%Y-%m")
            count = db.execute("SELECT count(*) FROM requests WHERE month=?", (month,)).fetchone()[0]
            if count >= cap:
                return jsonify(found=False, limitReached=True)
            db.execute("INSERT OR IGNORE INTO requests VALUES (?, ?)", (digest, month))
            if db.execute("SELECT changes()").fetchone()[0] == 0:
                return jsonify(found=False)
            db.commit()
        prompt = ("Realistic editorial food photograph illustrating this specific cooked recipe. "
                  "Show its named ingredients and method, no unrelated main dish, no people, words, logos or watermarks. "
                  f"Recipe: {title}. Description: {summary}. Method: {method}. Ingredients: {', '.join(ingredients)}.")
        body = json.dumps({"model": "gpt-image-1.5", "prompt": prompt, "size": "1024x1024",
                           "quality": "medium", "n": 1}).encode()
        req = Request("https://api.openai.com/v1/images/generations", data=body,
                      headers={"Authorization": "Bearer " + key, "Content-Type": "application/json"})
        with urlopen(req, timeout=120) as response:
            result = json.load(response)
        raw = base64.b64decode(result["data"][0]["b64_json"], validate=True)
        if len(raw) > 8_000_000 or not raw.startswith(b"\x89PNG\r\n\x1a\n"):
            raise ValueError("Invalid PNG response")
        temporary = directory / (digest + ".tmp")
        temporary.write_bytes(raw)
        temporary.replace(image)
        return jsonify(found=True, imageUrl=url, cached=False)
    except Exception:
        app.logger.exception("Recipe image generation failed")
        return jsonify(found=False)


@app.get("/api/recipe-image/<digest>")
def recipe_image(digest):
    _, directory, _ = settings()
    if not directory or len(digest) != 64 or any(c not in "0123456789abcdef" for c in digest):
        return "Not found", 404
    return send_from_directory(directory, digest + ".png", mimetype="image/png", max_age=86400)


@app.post("/api/feedback")
def feedback():
    return jsonify(error="Feedback storage is not configured"), 503


@app.get("/")
@app.get("/<path:resource>")
def frontend(resource=""):
    if resource and (ROOT / "dist" / resource).is_file():
        return send_from_directory(ROOT / "dist", resource)
    return send_from_directory(ROOT / "dist", "index.html")


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.getenv("PORT", "10000")))
