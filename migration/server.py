"""ListoMeal frontend and capped, persistent recipe-image generation."""
import base64
import hashlib
import json
import os
import re
import sqlite3
from datetime import datetime, timezone
from pathlib import Path
from urllib.error import HTTPError
from urllib.request import Request, urlopen
from threading import Lock

from flask import Flask, jsonify, request, send_from_directory

ROOT = Path(__file__).resolve().parent
app = Flask(__name__, static_folder="dist", static_url_path="")
_scan_lock = Lock()
_scan_month = ""
_scan_used = 0
_scan_cache = {}


@app.post("/api/scan")
def scan_food():
    """Analyze a user-submitted fridge photo. Never expose the API key to the browser."""
    global _scan_month, _scan_used, _scan_cache
    key = os.getenv("OPENAI_API_KEY", "").strip()
    try:
        limit = max(0, int(os.getenv("SCAN_MONTHLY_LIMIT", "0")))
    except ValueError:
        limit = 0
    if not key or not limit:
        return jsonify(error="Vision scan is not configured"), 503
    if request.content_length and request.content_length > 2_800_000:
        return jsonify(error="Image too large"), 413
    data = request.get_json(silent=True)
    if not isinstance(data, dict) or not isinstance(data.get("image"), str):
        return jsonify(error="Missing image"), 400
    encoded = data["image"]
    if not encoded.startswith("data:image/jpeg;base64,") or len(encoded) > 2_700_000:
        return jsonify(error="Invalid image"), 400
    try:
        image = base64.b64decode(encoded.partition(",")[2], validate=True)
    except ValueError:
        return jsonify(error="Invalid image"), 400
    if len(image) > 2_000_000 or not image.startswith(b"\xff\xd8\xff"):
        return jsonify(error="Invalid JPEG"), 400
    digest = hashlib.sha256(image).hexdigest()
    month = datetime.now(timezone.utc).strftime("%Y-%m")
    # Single-process quota. Render free instances lose this counter on restart;
    # use a persistent external limiter before opening scans to unrestricted traffic.
    with _scan_lock:
        if month != _scan_month:
            _scan_month, _scan_used, _scan_cache = month, 0, {}
        if digest in _scan_cache:
            return jsonify(foods=_scan_cache[digest], cached=True)
        if _scan_used >= limit:
            return jsonify(error="Scan limit reached"), 429
        _scan_used += 1  # Reserve before issuing a potentially billable request.
    payload = {
        "model": "gpt-4o", "temperature": 0, "max_tokens": 450,
        "response_format": {"type": "json_object"},
        "messages": [{"role": "user", "content": [
            {"type": "text", "text": (
                "List the distinct edible ingredients visibly present in this refrigerator or pantry photograph. "
                "Read package labels if legible, identify unpackaged foods by sight. "
                "Never infer foods hidden inside opaque containers, behind other objects, or from generic packaging. "
                "Ignore drinks that are only water, condiments if unclear, and household objects. "
                "Return JSON exactly as {\"foods\":[{\"en\":\"English ingredient name\",\"es\":\"Nombre del ingrediente en español\"}]}. "
                "Use short common grocery names, at most 16 foods, no explanations. "
                "When uncertain omit the food; the person will review and add missing items."
            )},
            {"type": "image_url", "image_url": {"url": encoded, "detail": "high"}}
        ]}]}
    api_request = Request("https://api.openai.com/v1/chat/completions",
                          data=json.dumps(payload).encode(), headers={
                              "Authorization": "Bearer " + key,
                              "Content-Type": "application/json"})
    try:
        with urlopen(api_request, timeout=55) as response:
            answer = json.load(response)
        result = json.loads(answer["choices"][0]["message"]["content"])
        foods = result.get("foods", [])
        if not isinstance(foods, list):
            raise ValueError("Invalid food list")
        cleaned = []
        seen = set()
        for food in foods[:16]:
            if not isinstance(food, dict):
                continue
            en, es = food.get("en"), food.get("es")
            if not all(isinstance(x, str) and 1 <= len(x.strip()) <= 45 for x in (en, es)):
                continue
            if en.strip().lower() not in seen:
                cleaned.append({"en": en.strip(), "es": es.strip()})
                seen.add(en.strip().lower())
        with _scan_lock:
            if len(_scan_cache) < limit:
                _scan_cache[digest] = cleaned
        return jsonify(foods=cleaned, cached=False)
    except HTTPError as exc:
        app.logger.warning("Vision request returned HTTP %s", exc.code)
        return jsonify(error="Vision provider unavailable"), 502
    except Exception:
        app.logger.exception("Vision request failed")
        return jsonify(error="Vision scan failed"), 502


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


def recipe_digest(data):
    recipe_id = str(data.get("id") or "")
    if re.fullmatch(r"local-[1-9]\d*", recipe_id):
        return hashlib.sha256(("local:" + recipe_id).encode()).hexdigest()
    return hashlib.sha256(json.dumps(
        [data.get("title"), data.get("summary"), data.get("method"), data.get("ingredients")],
        ensure_ascii=False).encode()).hexdigest()


@app.post("/api/photo")
def photo():
    key, directory, cap = settings()
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
    # Bundled photos survive redeploys even on Render's free filesystem.
    # Local IDs are shared by both languages; one image serves both.
    digest = recipe_digest(data)
    for suffix in ("webp", "png"):
        bundled = ROOT / "dist" / "recipe-images" / (digest + "." + suffix)
        if bundled.is_file():
            return jsonify(found=True, imageUrl="/recipe-images/" + digest + "." + suffix, cached=True)
    if not directory:
        return jsonify(found=False, configured=False)
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
            # A previous failed/interrupted offline attempt can leave a quota
            # reservation; no image exists, so allow this recipe to be retried.
            db.execute("DELETE FROM requests WHERE id=?", (digest,))
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
                           "quality": os.getenv("RECIPE_IMAGE_QUALITY", "medium"), "n": 1}).encode()
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
    except HTTPError as exc:
        # Expose only the API's machine-readable error code. Its message can
        # contain part of the secret key, so never print or return that text.
        try:
            api_error = json.loads(exc.read().decode("utf-8"))
            error_code = api_error.get("error", {}).get("code") or api_error.get("error", {}).get("type")
            error_code = error_code if isinstance(error_code, str) and re.fullmatch(r"[a-zA-Z0-9_]{1,80}", error_code) else "unknown"
            error_message = api_error.get("error", {}).get("message")
            error_message = error_message if isinstance(error_message, str) else "No message provided"
            error_message = re.sub(r"(?i)sk-[^\s\"',:;]+", "[KEY REDACTED]", error_message.replace(key, "[KEY REDACTED]"))[:320]
        except (ValueError, UnicodeDecodeError, AttributeError):
            error_code = "unknown"
            error_message = "No message provided"
        if directory:
            with sqlite3.connect(directory / "quota.sqlite") as db:
                db.execute("DELETE FROM requests WHERE id=?", (digest,))
        if exc.code == 401:
            return jsonify(found=False, reason=f"OpenAI returned 401, error code: {error_code}. Details: {error_message}"), 401
        if exc.code == 429:
            return jsonify(found=False, reason="Rate limit or billing limit (429). Check API billing and retry later."), 429
        app.logger.error("Recipe image API failed with HTTP %s", exc.code)
        return jsonify(found=False, reason=f"Image API returned HTTP {exc.code}"), 502
    except Exception:
        if directory and (directory / "quota.sqlite").exists():
            with sqlite3.connect(directory / "quota.sqlite") as db:
                db.execute("DELETE FROM requests WHERE id=?", (digest,))
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
