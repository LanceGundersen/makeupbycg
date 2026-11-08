# makeupbycg.com

One-page site for Makeup by CG (Murfreesboro, TN). Static HTML/CSS/JS on
Cloudflare Pages, plus a single Pages Function for the inquiry form. No
framework, no build step, no database.

```
public/            everything that gets served
  index.html
  style.css
  main.js
  img/             placeholder photography (see Credits)
  _headers
functions/api/contact.js   POST /api/contact -> Turnstile check -> email
wrangler.jsonc
```

## Run locally

```bash
npm install
npm run dev          # http://localhost:8788
```

`.dev.vars` holds Cloudflare's public Turnstile *test* secret so the form
verifies locally. Without `CF_API_TOKEN` and `CF_ACCOUNT_ID` the form returns
"Email is not configured yet." That is expected.

## Deploy

```bash
npx wrangler login
export CLOUDFLARE_ACCOUNT_ID=<account id>
npx wrangler pages project create makeupbycg --production-branch main
npm run deploy -- --project-name makeupbycg --branch main
```

Default URL: `https://makeupbycg.pages.dev`.

### Before the form goes live

1. Create a Turnstile widget (Dashboard > Turnstile) for the Pages hostname and
   the final domain. Replace `data-sitekey` in `public/index.html` and set the
   secret: `npx wrangler pages secret put TURNSTILE_SECRET --project-name makeupbycg`
2. Onboard the domain for Email Sending and confirm the `from` address in
   `wrangler.jsonc` (`CONTACT_FROM`). `CONTACT_TO` is where inquiries land.
3. Pages config has no `send_email` binding, so the function uses the Email
   Sending REST API. Create an API token with email sending permission and set:
   `npx wrangler pages secret put CF_API_TOKEN --project-name makeupbycg` and
   `npx wrangler pages secret put CF_ACCOUNT_ID --project-name makeupbycg`.

### Moving the domain off Squarespace

1. Add `makeupbycg.com` to Cloudflare (free plan) and copy the two nameservers.
2. In Squarespace Domains, set custom nameservers to those two.
3. In the Pages project, add `makeupbycg.com` as a custom domain.
4. Recreate any email DNS records (MX/SPF) before switching if mail uses them.

## Photos

Portfolio images and the logo came from the previous makeupbycg.com site
(hero, mask, gray, flowers, femme, sheet1-3, bts, artist, logo-light, mark).
The logo was recolored for the dark background (black ink to ivory, pink kept).
Underwater work and lessons are intentionally left out.

To swap a photo, replace the file in `public/img/` keeping the name, or edit the
`src` / `url(...)` in `index.html`. Hero and bleed panels want about 2000px
wide; reel cards about 1500px tall-side. JPEG quality 74-78.

`remix.jpg` (costume / set design, Aubrey Odom) and `tcp.jpg` (home decor,
Jovan Vasiljevic) are Unsplash placeholders for the two "Elsewhere" panels.
Replace them with real photos from Creative ReMix and The Creative Peacock.
The hero is a crop of the FEMME Rebelle cover (`hero.jpg`, 2x upscaled from a
1032px crop), so a higher-resolution original would sharpen it on large screens.
