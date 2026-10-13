# Sugar Shack Cookies

Cinematic scroll-driven 3D site. React + TypeScript + Vite + Three.js (React Three Fiber, drei) + GSAP ScrollTrigger + Tailwind.

## Run

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # type-check + production build into dist/
npm run preview    # serve the production build
```

## Deploy

- **Vercel:** import the repo. Framework preset "Vite", build `npm run build`, output `dist`. No other settings.
- **Netlify:** import the repo. `netlify.toml` already sets build `npm run build` and publish `dist`.

## Where to edit things

| What | File |
| --- | --- |
| All copy, 6 languages (en, th, fr, de, zh, es) | `src/i18n.ts` |
| Prices, currency, SKUs, Instagram / contact / shipping / FAQ links | `src/config.ts` |
| Product photos | `public/images/*.jpg` |
| Checkout hook-up (Shopify etc.) | `src/lib/checkout.ts` (`startCheckout`) |
| Cookie flavors in 3D (crust colors, chunks, filling) | `src/scene/variants.ts` |
| Scroll to cookie pose (the break sequence timing) | `src/scene/pose.ts` |

Checkout is a placeholder: it takes no payment and creates no order, and it tells the visitor so.
Prices are placeholders. Reviews are labelled placeholders until you replace them in `src/i18n.ts`.

## Test scripts (optional)

`scripts/` holds Playwright scripts used during development (screenshots, cart, language, fallback, reverse scroll).
Start `npm run dev`, then for example `node scripts/func.mjs`. They expect Chromium at `/opt/pw-browsers/chromium`; edit the path on your machine.
