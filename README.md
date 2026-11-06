# Meridian — Evaluation Stack

Run the whole **Meridian** governance platform locally from pre-built images —
no source checkout, no build step. Meridian is delivered on the Procela
governance platform: this bundle pulls the upstream platform images and applies
the Meridian brand (name, logo, navy/gold colours) at boot.

## Quick start

Requires Docker (with Compose). Launch **both** compose files — the platform
base plus the Meridian brand overlay:

```bash
cp .env.example .env            # then set JWT_SECRET to any long random string
docker compose -f docker-compose.eval.yml -f docker-compose.meridian.yml up
```

Then open:

- **http://localhost:3000** — the app. Sign-in is passwordless in the eval build
  (dev auth): enter any name/email, or use the "Test Accounts" quick-login.
- **http://localhost:8025** — Mailpit inbox (password-reset / "Report a problem"
  email is captured here; nothing leaves your machine).

A **shipbuilding** demo tenant is loaded on first boot so the app isn't empty.
The Meridian brand is applied on every boot.

> **Tip:** always pass both `-f` files. The base file on its own is plain,
> unbranded Procela; the overlay is what makes it Meridian.

## Staying current

This stack runs the **upstream platform images** and only adds a brand layer, so
every platform release reaches Meridian with no re-fork or rebuild:

```bash
docker compose -f docker-compose.eval.yml -f docker-compose.meridian.yml pull
docker compose -f docker-compose.eval.yml -f docker-compose.meridian.yml up
```

Leave `PROCELA_TAG=latest` to always get the newest build, or pin a specific one
(e.g. `PROCELA_TAG=0.1.35`) in `.env` for a reproducible evaluation.

## What's in the box

The bundle is split into two halves — the platform base (kept byte-identical to
the upstream evaluation bundle and refreshed automatically on every release) and
the Meridian brand overlay:

| File | Source | Purpose |
|---|---|---|
| `docker-compose.eval.yml` | platform (auto-synced) | The stack: Postgres, Redis, Mailpit, the platform backend + frontend images, migrate + demo-seed one-shots. |
| `seed.mjs` | platform (auto-synced) | Loads the demo tenant on first boot. |
| `THIRD-PARTY-NOTICES.txt` | platform (auto-synced) | Open-source license notices for bundled dependencies. |
| `docker-compose.meridian.yml` | Meridian | Brand overlay: re-brands mail-from, defaults the demo to shipbuilding, and adds the brand one-shot. |
| `brand.mjs` | Meridian | Applies the Meridian name, logo and navy/gold palette via the platform branding API (idempotent). |
| `meridian-icon.svg` | Meridian | The Meridian logo (navy + gold). Shipped inline by `brand.mjs`; kept here as the source. |
| `.env.example` | Meridian | Copy to `.env`. The one line to change is `JWT_SECRET`. |
| `EULA.txt` | Meridian | Evaluation license. |

## Branding

The Meridian name, logo and the NNS-inspired navy/gold colours are applied by
`brand.mjs` through the platform's branding API — so they theme the whole app
including the login screen, and survive restarts. To tweak them, edit the
`BRANDING` block at the top of `brand.mjs` and re-run:

```bash
docker compose -f docker-compose.eval.yml -f docker-compose.meridian.yml run --rm meridian-brand
```

## Notes

- **Evaluation build.** Passwordless `dev` auth, demo data, local mail capture,
  AI off unless you add a key in `.env`. Not a production deployment.
- **Data persists** in a Docker volume (`postgres_data`); the seed never wipes
  data you've added. To start fresh:
  `docker compose -f docker-compose.eval.yml -f docker-compose.meridian.yml down -v`.
- **AI features** are off by default. Set `AI_FEATURES_ENABLED=true` and a
  provider key in `.env` to try the assistant, template generation and
  suggestions.
- **Why two compose files?** The base is the unmodified platform bundle, so it
  updates automatically; the overlay holds only Meridian's brand. Keeping them
  separate is what lets the platform update without ever clobbering the brand.
