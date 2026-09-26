"""Preview or generate the catalog photos with the app's existing cache and quota.

Run from the migration directory. Dry run is the default; --execute makes paid
API calls, so it requires the real persistent storage path and API key.
"""
import argparse
import json
import os
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--execute", action="store_true", help="Generate missing photos using the paid API")
    parser.add_argument("--max-new", type=int, default=500, help="Stop after this many new photos")
    args = parser.parse_args()
    if args.max_new < 0 or args.max_new > 500:
        parser.error("--max-new must be between 0 and 500")
    catalog = json.loads((ROOT / "catalog/recipes.en.json").read_text())
    key = os.environ.get("OPENAI_API_KEY", "").strip()
    path = os.environ.get("RECIPE_IMAGE_STORAGE", "").strip()
    directory = Path(path) if path else None
    monthly_cap = int(os.environ.get("RECIPE_IMAGE_MONTHLY_LIMIT", "0"))
    if args.execute and (not key or directory is None or monthly_cap < args.max_new):
        parser.error("Set OPENAI_API_KEY, RECIPE_IMAGE_STORAGE and an adequate RECIPE_IMAGE_MONTHLY_LIMIT first")
    if args.execute and not directory.is_absolute():
        parser.error("RECIPE_IMAGE_STORAGE must be an absolute persistent path")

    print(f"Catalog: {len(catalog)} recipes; requested maximum: {args.max_new} new images")
    if not args.execute:
        print("Dry run: no API calls or charges. Review the catalog and persistent storage first.")
        return
    from server import app  # Flask is only needed when actually running the batch
    app.config["BATCH_RECIPE_IMAGES"] = True
    created = already_saved = failures = 0
    with app.test_client() as client:
        for item in catalog:
            if created >= args.max_new:
                break
            payload = {k: item[k] for k in ("id", "title", "summary", "method", "ingredients")}
            response = client.post("/api/photo", json=payload)
            result = response.get_json() or {}
            if response.status_code != 200 or not result.get("found"):
                failures += 1
                print(f"Unable to create {item['id']}: {result}", file=sys.stderr)
                if result.get("limitReached"):
                    break
            elif result.get("cached"):
                already_saved += 1
            else:
                created += 1
                print(f"Generated {created}: {item['id']} {item['title']}")
    print(f"Finished: {created} new, {already_saved} cached, {failures} failed")


if __name__ == "__main__":
    main()
