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
verifies locally. Email sending needs the deployed `send_email` binding, so a
local submit returns "Email is not configured yet." That is expected.

## Deploy

```bash
npx wrangler login
npx wrangler pages project create makeupbycg --production-branch main
npm run deploy -- --project-name makeupbycg
```

Default URL: `https://makeupbycg.pages.dev`.

### Before the form goes live

1. Create a Turnstile widget (Dashboard > Turnstile) for the Pages hostname and
   the final domain. Replace `data-sitekey` in `public/index.html` and set the
   secret: `npx wrangler pages secret put TURNSTILE_SECRET --project-name makeupbycg`
2. Onboard the domain for Email Sending and confirm the `from` address in
   `wrangler.jsonc` (`CONTACT_FROM`). `CONTACT_TO` is where inquiries land.

### Moving the domain off Squarespace

1. Add `makeupbycg.com` to Cloudflare (free plan) and copy the two nameservers.
2. In Squarespace Domains, set custom nameservers to those two.
3. In the Pages project, add `makeupbycg.com` as a custom domain.
4. Recreate any email DNS records (MX/SPF) before switching if mail uses them.

## Swapping in real photos

Replace the files in `public/img/` keeping the names (`lips`, `eye`, `dots`,
`mono`, `feathers`, `glitter`), or edit the `url(...)` references in
`index.html`. Keep the hero (`lips.jpg`) landscape at about 2200px wide and the
rest portrait at about 1500px wide, JPEG quality 70-75.

## Credits (placeholder photography, Unsplash)

Joey Nicotra, Good Faces (Samia / Marika), Lombe Kapaya, Sima Koocheki, IRIS AVI.
