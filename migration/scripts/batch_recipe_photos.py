"""Preview or generate the catalog photos with the app's existing cache and quota.

Run from the migration directory. Dry run is the default; --execute makes paid
API calls, so it requires an API key. Images are saved into public/recipe-images
and can be committed to GitHub to survive free Render redeployments.
The batch converts generated PNGs to smaller WebP files before committing.
"""
import argparse
import json
import os
import sys
from pathlib import Path
from PIL import Image

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
    directory = ROOT / "public" / "recipe-images"
    os.environ["RECIPE_IMAGE_STORAGE"] = str(directory)
    monthly_cap = int(os.environ.get("RECIPE_IMAGE_MONTHLY_LIMIT", str(args.max_new)))
    os.environ["RECIPE_IMAGE_MONTHLY_LIMIT"] = str(monthly_cap)
    if args.execute and (not key or monthly_cap < args.max_new):
        parser.error("Set OPENAI_API_KEY and an adequate RECIPE_IMAGE_MONTHLY_LIMIT first")

    print(f"Catalog: {len(catalog)} recipes; requested maximum: {args.max_new} new images; destination: {directory}")
    if not args.execute:
        print("Dry run: no API calls or charges. Review the catalog and persistent storage first.")
        return
    from server import app, recipe_digest  # Flask is only needed when actually running the batch
    app.config["BATCH_RECIPE_IMAGES"] = True
    created = already_saved = failures = 0
    with app.test_client() as client:
        for item in catalog:
            if created >= args.max_new:
                break
            payload = {k: item[k] for k in ("id", "title", "summary", "method", "ingredients")}
            digest = recipe_digest(payload)
            final_image = directory / (digest + ".webp")
            if final_image.exists():
                already_saved += 1
                continue
            response = client.post("/api/photo", json=payload)
            result = response.get_json() or {}
            if response.status_code != 200 or not result.get("found"):
                failures += 1
                print(f"Unable to create {item['id']}: {result}", file=sys.stderr)
                print("Stopped on the first error. You can rerun the same command after resolving it; saved photos will be skipped.", file=sys.stderr)
                break
            elif result.get("cached"):
                # A previous run may have created a PNG before being interrupted.
                source = directory / (digest + ".png")
                with Image.open(source) as photo:
                    photo.convert("RGB").save(final_image, "WEBP", quality=82, method=6)
                source.unlink()
                already_saved += 1
            else:
                source = directory / (digest + ".png")
                with Image.open(source) as photo:
                    photo.convert("RGB").save(final_image, "WEBP", quality=82, method=6)
                source.unlink()
                created += 1
                print(f"Generated {created}: {item['id']} {item['title']}")
    print(f"Finished: {created} new, {already_saved} cached, {failures} failed")


if __name__ == "__main__":
    main()
