# Cows & Bulls

A number guessing game of logic and deduction — play solo vs computer or challenge a friend online in real time.

---

## Step-by-step setup

### Step 1 — Install Node.js (skip if already installed)
Go to https://nodejs.org, download the **LTS** version, install it like any Mac app.
Verify in Terminal: `node --version`

### Step 2 — Create your Supabase project
1. Go to https://supabase.com → create a free account → **New project**
2. Name it `cowsandbulls`, set a password, pick a region, wait ~1 min for it to spin up
3. Left sidebar → **SQL Editor** → New query
4. Paste the entire contents of `supabase-schema.sql` → click **Run**
5. Left sidebar → gear icon → **Settings → API**
6. Copy your **Project URL**
7. Click the **"Legacy anon, service_role API keys"** tab and copy the **anon public** key

### Step 3 — Configure environment variables
In this project folder, duplicate `.env.local.example`, rename the copy to `.env.local`, and fill in:
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```

### Step 4 — Install & run locally
In VS Code's terminal (Terminal → New Terminal):
```
npm install
npm run dev
```
Open the printed `localhost` address in your browser.

### Step 5 — Push to GitHub
Create a new repo called `cowsandbulls` on GitHub, then:
```
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/cowsandbulls.git
git push -u origin main
```

### Step 6 — Deploy to Vercel
1. https://vercel.com → sign in with GitHub → **Add New → Project**
2. Import your `cowsandbulls` repo
3. Add the same two environment variables under **Environment Variables**
4. Click **Deploy**

You'll get a live URL — every future `git push` auto-deploys.

---

## Features
- 4 or 5 digit games
- Solo mode vs a computer opponent
- 2-player online mode with real-time sync via Supabase
- Training mode — optional in-game help analysing guesses and suggesting next moves, visible to your opponent whenever it's switched on
- Dedicated rules page

## Tech stack
Next.js 14 · Supabase (real-time database) · Tailwind CSS · Vercel
