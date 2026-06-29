# AI To-Do Planner (Netlify + Grok)

A goal → week-by-week to-do plan generator. The frontend is a static
`index.html`; a Netlify Function (`netlify/functions/generate-plan.js`)
calls the xAI Grok API server-side so your API key never reaches the browser.

## Project structure

```
.
├── index.html                       # the app (HTML/CSS/JS, no build step)
├── netlify.toml                     # tells Netlify where the functions live + the /api redirect
└── netlify/
    └── functions/
        └── generate-plan.js         # server-side proxy to api.x.ai
```

## 1. Get a Grok API key

Create one at [console.x.ai](https://console.x.ai) (xAI's developer console).

## 2. Deploy to Netlify

**Option A — drag and drop**
1. Go to [app.netlify.com/drop](https://app.netlify.com/drop)
2. Drag this whole folder in
3. Once deployed, go to **Site configuration → Environment variables** and add:
   - `XAI_API_KEY` = your key from step 1
4. Trigger a redeploy (env vars only apply to new deploys)

**Option B — Netlify CLI**
```bash
npm install -g netlify-cli
cd this-folder
netlify deploy --prod
netlify env:set XAI_API_KEY your-key-here
```

**Option C — Git**
Push this folder to a GitHub repo, then "Import an existing project" in Netlify
and point it at the repo. Add `XAI_API_KEY` under environment variables before
the first deploy.

## 3. Test locally (optional)

```bash
npm install -g netlify-cli
netlify dev
```
This serves `index.html` and runs the function locally at
`http://localhost:8888`, with `/api/generate-plan` proxied automatically.
Create a `.env` file with `XAI_API_KEY=your-key-here` so `netlify dev` can
read it.

## How it works

- The browser never sees the Grok API key — it only calls `/api/generate-plan`
  on your own domain.
- The plan is generated **one week at a time** (not all at once), which keeps
  each response small and lets the plan build on the previous week's progress.
- `generate-plan.js` forwards the prompt to `https://api.x.ai/v1/chat/completions`
  using the `grok-4.3` model, and returns just the generated text back to the page.

## Notes

- Netlify Functions need a Node runtime with native `fetch` (Node 18+), which
  is Netlify's default today — no extra dependencies to install.
- If you see "Server is missing XAI_API_KEY," the environment variable isn't
  set yet, or you deployed before setting it (redeploy after adding it).
