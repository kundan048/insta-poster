# Daily Instagram Auto-Poster — Free Path

**Claude API (content)** → **free SVG→PNG rendering** → **this repo as free image hosting** → **Instagram Graph API directly (free)**

The only ongoing cost is your Anthropic API tokens (usually a few cents/day for one short post).

## Important: this repo must be PUBLIC

Instagram needs to fetch your generated image from a public URL. We use
`raw.githubusercontent.com` (free) as that image host, which only works if the repo is
public. Don't worry — your API keys stay safe in GitHub *Secrets*, which are never exposed
in a public repo, even in the workflow logs.

## Setup

### 1. Get an Anthropic API key
console.anthropic.com → API Keys → Create Key. (Separate, pay-as-you-go billing from your
claude.ai subscription — a daily post costs a tiny fraction of a cent.)

### 2. Get your Instagram Business Account ID + Access Token (free, no Metricool)

1. Make sure your Instagram account (already confirmed as Business ✅) is linked to a
   **Facebook Page** you manage. (Instagram app → Settings → Account → linked accounts on
   Facebook, or via business.facebook.com if not linked yet.)
2. Go to **developers.facebook.com** → My Apps → Create App → choose "Other" → "Business" type.
3. In your new app, add the **Instagram Graph API** product.
4. Go to **Tools → Graph API Explorer** (in the Facebook developer dashboard):
   - Select your app from the dropdown
   - Select your Page/Instagram user
   - Under permissions, add: `instagram_basic`, `instagram_content_publish`, `pages_show_list`, `pages_read_engagement`
   - Click "Generate Access Token" — this gives you a short-lived token
5. **Get your Instagram Business Account ID:** with that token, call:
   `GET https://graph.facebook.com/v21.0/me/accounts` → find your Page → copy its `id`, then
   `GET https://graph.facebook.com/v21.0/{page-id}?fields=instagram_business_account` → this
   returns your `IG_USER_ID`.
6. **Get a long-lived token** (lasts ~60 days, so you'll refresh it periodically):
   `GET https://graph.facebook.com/v21.0/oauth/access_token?grant_type=fb_exchange_token&client_id={app-id}&client_secret={app-secret}&fb_exchange_token={short-lived-token}`
   This is the `IG_ACCESS_TOKEN` value.
7. Since you're only posting to your own account, you can use this in the app's
   **Development mode** — no Meta app review needed as long as you keep your own account
   added as an admin/tester of the app.

This part (steps 2–6) is genuinely the fiddliest bit of the whole free setup — happy to
walk through it live with you step by step if you get stuck on any single call.

### 3. Push these files to a new **public** GitHub repo
Same as before: create repo (this time set to Public), upload `index.js`, `lib/card-template.js`,
`package.json`, `README.md`, and create `.github/workflows/daily-post.yml` with the workflow content.

### 4. Add GitHub Secrets
Settings → Secrets and variables → Actions:
- `ANTHROPIC_API_KEY`
- `IG_USER_ID`
- `IG_ACCESS_TOKEN`

And a repo **Variable**: `NICHE_PROMPT` (what your posts should be about).

### 5. Test locally (optional but recommended first)
```bash
cp .env.example .env   # fill in real values
npm install
node --env-file=.env index.js
```

### 6. Turn it on
Actions tab → "Daily Instagram Post" → "Run workflow" to test manually. If it succeeds,
it now runs automatically every day at the scheduled time.

## Maintenance
- The long-lived access token expires roughly every 60 days — you'll need to repeat step 2.6
  to refresh it and update the `IG_ACCESS_TOKEN` secret. There's no way around this being
  manual on the free path (paid tools like Metricool handle token refresh for you).
- The card design lives in `lib/card-template.js` — tweak colors/fonts there anytime.
