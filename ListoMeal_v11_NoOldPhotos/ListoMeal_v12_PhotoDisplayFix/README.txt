# ListoMeal AI MVP

This is the first ListoMeal version wired for a real AI recipe generator.

## What it does
- English / Spanish
- User-entered ingredients
- Time available
- Stove / oven / air fryer / microwave / easiest
- Adults + kids
- Avoid / allergies / dislikes
- Generates 3 composed meals
- Separates pantry basics and optional extras
- Keeps the API key on the server

## Run it on Windows

1. Install Python 3 if you do not already have it.
2. Open Command Prompt inside this folder.
3. Install dependencies:

   pip install -r requirements.txt

4. Create an OpenAI API key in your OpenAI developer account.
5. In the same Command Prompt, set it for that window:

   set OPENAI_API_KEY=YOUR_KEY_HERE

6. Start ListoMeal:

   python server.py

7. Open this address in your browser:

   http://127.0.0.1:5000

## Important
- ChatGPT subscriptions and OpenAI API billing are separate.
- The app will use paid API usage when a valid key is connected.
- Do not place the API key directly in index.html.
- This is an MVP; before public launch, food-safety rules and allergy handling should be reviewed more rigorously.
