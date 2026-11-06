# Meridian — Evaluation Stack

Run the whole **Meridian** governance platform locally from pre-built images —
no source checkout, no build step. Meridian is delivered on the Procela
governance platform; this bundle pulls the upstream platform images and applies
the Meridian brand (name, logo, colours) at first boot.

## Quick start

Requires Docker (with Compose).

```bash
cp .env.example .env            # then set JWT_SECRET to any long random string
docker compose -f docker-compose.eval.yml up
```

Then open:

- **http://localhost:3000** — the app. Sign-in is passwordless in the eval build
  (dev auth): enter any name/email, or use the "Test Accounts" quick-login.
- **http://localhost:8025** — Mailpit inbox (password-reset / "Report a problem"
  email is captured here; nothing leaves your machine).

A **shipbuilding** demo tenant is loaded on first boot so the app isn't empty.
The Meridian brand is applied on every boot.

## Staying current

Because this stack runs the **upstream platform images** and only re-skins them
at boot, every platform release reaches Meridian with no re-fork or rebuild:

```bash
docker compose -f docker-compose.eval.yml pull
docker compose -f docker-compose.eval.yml up
```

Leave `MERIDIAN_TAG=latest` to always get the newest build, or pin a specific
one (e.g. `MERIDIAN_TAG=0.1.31`) in `.env` for a reproducible evaluation.

## What's in the box

| File | Purpose |
|---|---|
| `docker-compose.eval.yml` | The stack: Postgres, Redis, Mailpit, the platform backend + frontend images, and a one-shot seed. |
| `.env.example` | Copy to `.env`. The one line to change is `JWT_SECRET`. |
| `seed.mjs` | Applies the Meridian brand (idempotent) and loads the demo tenant on first boot. |
| `meridian-icon.svg` | The Meridian logo (navy + gold). Shipped inline by the seed; kept here as the source. |
| `EULA.txt` | Evaluation license. |
| `THIRD-PARTY-NOTICES.txt` | Open-source license notices for bundled dependencies. |

## Branding

The Meridian name, logo and the NNS-inspired navy/gold colours are applied by
`seed.mjs` through the platform's branding API — so they theme the whole app
including the login screen, and survive restarts. To tweak them, edit the
`BRANDING` block at the top of `seed.mjs` and re-run:

```bash
docker compose -f docker-compose.eval.yml run --rm eval-seed
```

## Notes

- **Evaluation build.** Passwordless `dev` auth, demo data, local mail capture,
  AI off unless you add a key in `.env`. Not a production deployment.
- **Data persists** in a Docker volume (`postgres_data`); the seed never wipes
  data you've added. To start fresh: `docker compose -f docker-compose.eval.yml down -v`.
- **AI features** are off by default. Set `AI_FEATURES_ENABLED=true` and a
  provider key in `.env` to try the assistant, template generation and
  suggestions.
