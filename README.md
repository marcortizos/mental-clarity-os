# Mental Clarity OS — going live

This folder is the real, hosted version of the app. It's the same product
you've been testing, with three things swapped out so it can run on your
own domain instead of inside Claude:

- **Storage** → Supabase (real accounts + a database), instead of Claude's
  artifact storage.
- **Claude API calls** → routed through `/api/claude.js`, a small backend
  function that holds your API key server-side. The key never reaches
  the browser.
- **Login** → email + password, backed by Supabase Auth.

Everything else — the questions, the voice, the design, the logic — is
unchanged.

There are two accounts to create (Supabase, Vercel) and about 15 minutes
of copy-pasting. Follow this in order.

---

## 1. Create your Supabase project

1. Go to [supabase.com](https://supabase.com) → sign up → **New project**.
2. Pick any name and a strong database password (save it somewhere —
   you likely won't need it again, but keep it).
3. Wait ~2 minutes for the project to finish setting up.
4. In the left sidebar: **SQL Editor → New query**. Paste in the entire
   contents of `supabase-schema.sql` (in this folder) and click **Run**.
   This creates the table that holds everyone's check-ins and settings,
   and locks it down so each person can only ever see their own data.
5. In the left sidebar: **Project Settings → API**. You'll see two
   values you need next:
   - **Project URL**
   - **anon public** key (a long string starting with `eyJ...`)

## 2. Add your Supabase keys to the app

Open `index.html` in this folder, find these two lines near the top of
the `<script>` section:

```js
const SUPABASE_URL = 'YOUR_SUPABASE_PROJECT_URL';
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY';
```

Replace both placeholder strings with the values from step 1.5. Save
the file.

*(This "anon" key is safe to expose in frontend code — it's designed
for that. It only grants access within the rules you set up in the SQL
schema, which is why the schema step matters.)*

## 3. Get your Anthropic API key

1. Go to [console.anthropic.com](https://console.anthropic.com) →
   **API Keys** → create a new key if you don't already have one.
2. Copy it. You'll paste it into Vercel in the next step, not into any
   file in this folder — it should never live in a file that gets
   uploaded anywhere public.

## 4. Deploy to Vercel

1. Go to [vercel.com](https://vercel.com) → sign up (GitHub sign-in is
   easiest if you have a GitHub account).
2. Put this whole folder in a GitHub repo (or use the Vercel CLI —
   `npx vercel` from inside this folder — if you'd rather skip GitHub).
3. In Vercel: **Add New → Project**, import the repo.
4. Before deploying, open **Environment Variables** and add:
   - Key: `ANTHROPIC_API_KEY`
   - Value: the key from step 3
5. Click **Deploy**. Vercel will give you a URL like
   `mental-clarity-os.vercel.app` — the app is now live at that address.

## 5. Connect your own domain

1. In the Vercel project: **Settings → Domains → Add**.
2. Enter something like `app.marcortizos.com`.
3. Vercel gives you a DNS record to add. Go to wherever marcortizos.com's
   DNS is managed (your domain registrar, or Squarespace/Framer/etc. if
   the site's built there) and add that record.
4. Usually live within a few minutes, sometimes up to a couple hours.

## 6. Connect Stan Store

In your $99 product's delivery settings, change the delivery type to
**"redirect to a link"** and point it at:

```
https://app.marcortizos.com/
```

(swap in your real domain). Someone who buys lands on the login/signup
screen and creates their account right there.

## 7. Test it yourself before anyone else touches it

Do the whole thing end to end, as if you were a customer:

- Open the real URL, sign up with a real email
- Run a morning check-in
- Close the tab, reopen it, confirm you're still signed in and the
  entry is still there
- Check the Supabase **Table Editor → user_data** — you should see a
  row with your check-in inside it

If all of that works, it's actually live.

---

## What's in this folder

- `index.html` — the app
- `api/claude.js` — the backend function that proxies Claude API calls
- `supabase-schema.sql` — run once, in Supabase's SQL Editor
- `manifest.json` + `icons/` — lets people "Add to Home Screen" with a
  real icon and full-screen view
- `package.json` — minimal, just so Vercel recognizes the project

## If something breaks

- **"Missing ANTHROPIC_API_KEY"** → the environment variable didn't get
  set, or you need to redeploy after adding it (Vercel → Deployments →
  the "..." menu → Redeploy).
- **Login screen error mentioning Supabase** → double check the URL and
  anon key were pasted in correctly, no extra spaces or quotes.
- **Signed up but nothing saves** → check the SQL schema actually ran
  successfully (Supabase → Table Editor → you should see `user_data`
  listed as a table).
