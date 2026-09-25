"""Serve the built ListoMeal frontend and its photo endpoint."""
import json
import os
from pathlib import Path
from urllib.parse import urlencode
from urllib.request import Request, urlopen

from flask import Flask, jsonify, request, send_from_directory

ROOT = Path(__file__).resolve().parent
app = Flask(__name__, static_folder="dist", static_url_path="")


@app.get("/api/_healthcheck")
def health():
    return jsonify(message="Success")


@app.post("/api/photo")
def photo():
    title = str((request.get_json(silent=True) or {}).get("title") or "").strip()[:100]
    if not title:
        return jsonify(error="Missing recipe title"), 400
    key = os.getenv("PEXELS_API_KEY")
    if not key:
        return jsonify(configured=False, found=False)
    try:
        url = "https://api.pexels.com/v1/search?" + urlencode({"query": title + " food meal", "per_page": 1, "orientation": "landscape"})
        with urlopen(Request(url, headers={"Authorization": key}), timeout=8) as response:
            photos = json.load(response).get("photos", [])
        if photos:
            item = photos[0]
            src = item.get("src", {})
            image = src.get("landscape") or src.get("large") or src.get("medium")
            if image:
                return jsonify(configured=True, found=True, imageUrl=image,
                               photographer=item.get("photographer", "Pexels"),
                               photographerUrl=item.get("photographer_url", "https://www.pexels.com"),
                               pexelsUrl=item.get("url", "https://www.pexels.com"))
    except Exception:
        app.logger.exception("Pexels photo lookup failed")
    return jsonify(configured=True, found=False)


@app.post("/api/feedback")
def feedback():
    # A durable database must be configured before accepting feedback.
    return jsonify(error="Feedback storage is not configured"), 503


@app.get("/")
@app.get("/<path:resource>")
def frontend(resource=""):
    if resource and (ROOT / "dist" / resource).is_file():
        return send_from_directory(ROOT / "dist", resource)
    return send_from_directory(ROOT / "dist", "index.html")


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.getenv("PORT", "10000")))
