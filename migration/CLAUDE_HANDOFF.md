# ListoMeal — Claude Handoff

Production app: https://listomeal-h7fs0n.v2.appdeploy.ai/

AppDeploy snapshot used for this handoff: `1790053159728`

## Product

ListoMeal is a bilingual English/Spanish meal-planning web app for busy families, with a strong product focus on busy moms. The main promise is: use what you already have, reduce dinner stress, and get practical meal ideas quickly.

Users can type ingredients, pick common ingredients, or scan a fridge/pantry photo; choose available time and cooking method; receive exactly 3 meal ideas; and then use Cook With Me for step-by-step cooking.

## Core architecture

- React 19 + Vite + Tailwind CSS
- AppDeploy frontend+backend
- Local 500-recipe matching engine in `src/localRecipes.ts`
- Deep Scan runs on-device with TensorFlow.js, COCO-SSD, MobileNet, and Tesseract OCR
- Pexels photo lookup through backend `POST /api/photo`
- Tester feedback stored through backend `POST /api/feedback`
- Favorites, History, Family Profile, and language preference stored in browser `localStorage`
- First-run onboarding
- Cook With Me step-by-step flow with local audio feedback

## Important product behavior to preserve

- English and Spanish
- Exactly 3 meal suggestions
- Core recipe generation uses the local recipe library and does not consume AppDeploy AI credits
- Deep Scan is local/on-device and does not consume AppDeploy AI credits
- Type It / Pick It / Scan It
- 10 / 20 / 30 / No rush time choices
- Easiest / Stove / Oven / Air Fryer / Microwave cooking methods
- Family profile, allergies/avoid, dislikes, and dietary preferences
- Favorites and History
- Cook With Me
- Feedback flow
- Current family/busy-mom-oriented Home design
- Green/orange/cream ListoMeal branding
- Appliance visuals for cooking methods

## AppDeploy-specific integrations

Frontend imports `api` from `@appdeploy/client`.

Backend imports from `@appdeploy/sdk`, including `router`, `db`, `secrets`, and legacy `ai` support.

AppDeploy injects those platform SDK packages. They are intentionally not listed as normal npm dependencies.

### Secret handling

`PEXELS_API_KEY` is configured as an AppDeploy server-side secret and is intentionally NOT included in this ZIP.

Never hard-code API keys or secret values into source code.

## Backend routes

- `GET /api/_healthcheck`
- `POST /api/feedback`
- `POST /api/photo`
- `POST /api/ai` — legacy AI route retained in the backend; current core recipe and scan workflows are local

## If migrating away from AppDeploy

Replace these platform-specific pieces:

1. `@appdeploy/client` frontend API transport
2. `@appdeploy/sdk` router
3. AppDeploy database calls used for tester feedback
4. AppDeploy secret handling for Pexels
5. Any use of the legacy `/api/ai` route

The React UI, local recipe engine, Deep Scan models/OCR, localStorage behavior, and most of the product logic can remain.

## Asset note

The family hero and mascot assets are included. The logo file in this handoff is a reconstructed crop from the current ListoMeal visual reference so the project remains runnable outside the production snapshot. If exact brand asset fidelity is required, use the logo from the production/AppDeploy resource store.

## Guidance for Claude

Please preserve existing working behavior and branding unless explicitly asked to change it. Do not remove local recipe generation, Deep Scan, bilingual support, or AppDeploy integrations by accident. Before changing architecture, explain what would need to migrate and what would continue working.
