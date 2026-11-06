// Meridian brand overlay — applies the Meridian brand to the Procela platform.
//
// Runs in a throwaway node:20-slim container (see docker-compose.meridian.yml),
// alongside the UNMODIFIED upstream evaluation stack. docker-compose.eval.yml
// and seed.mjs in this folder are the verbatim Procela evaluation bundle,
// auto-synced from the platform on every release; this file plus
// docker-compose.meridian.yml are the ONLY Meridian additions — so a platform
// release carries through with a plain `docker compose pull`, nothing to
// re-fork or rebuild.
//
// Flow: wait for the backend, dev-login as SUPER_ADMIN (the eval build runs
// AUTH_PROVIDER=dev, so this is passwordless), then PUT the Meridian brand
// (name, logo, colours) through the platform's public branding API. Idempotent
// — it runs every boot and themes the login screen too. Uses only Node's
// built-in fetch; no repo, no dependencies.

const BASE = process.env.API_URL || 'http://backend:3001/api/v1';
const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL || 'eval.admin@meridian.local';

// ── Meridian brand ─────────────────────────────────────────────────────────
// NNS-inspired maritime palette: deep navy primary + gold accent. The logo is
// an inline SVG (gold meridian/globe on navy) shipped as a data: URL so no
// file server is needed — the platform's branding API accepts data:image/*.
const LOGO_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" role="img" aria-label="Meridian">
  <rect width="64" height="64" rx="14" fill="#0a2540"/>
  <g fill="none" stroke="#c8a227" stroke-width="2.6">
    <circle cx="32" cy="32" r="18"/>
    <ellipse cx="32" cy="32" rx="8" ry="18"/>
    <line x1="14" y1="32" x2="50" y2="32"/>
  </g>
  <line x1="32" y1="12" x2="32" y2="52" stroke="#c8a227" stroke-width="2.6"/>
</svg>`;

const BRANDING = {
  companyName:        'Meridian',
  logoUrl:            'data:image/svg+xml;base64,' + Buffer.from(LOGO_SVG).toString('base64'),
  primaryColor:       '#0b3d6b',
  primaryHoverColor:  '#082c4e',
  primaryLightColor:  '#d6e3f0',
  sidebarColor:       '#0a2540',
  sidebarHoverColor:  '#12395c',
  sidebarAccentColor: '#c8a227',  // gold active-nav accent (platform >= the branding-accent release; ignored by older builds)
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function waitForHealth(timeoutMs = 180_000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const r = await fetch(`${BASE}/health`);
      if (r.ok) return;
    } catch { /* not up yet */ }
    console.log('waiting for backend…');
    await sleep(2000);
  }
  throw new Error('backend did not become healthy in time');
}

async function login() {
  const r = await fetch(`${BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: ADMIN_EMAIL, name: 'Eval Admin', role: 'SUPER_ADMIN' }),
  });
  const j = await r.json().catch(() => ({}));
  const token = j?.data?.accessToken;
  if (!r.ok || !token) {
    throw new Error(`login failed (${r.status}) — this assumes AUTH_PROVIDER=dev: ${JSON.stringify(j)}`);
  }
  return token;
}

async function applyBranding(token) {
  const r = await fetch(`${BASE}/branding`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(BRANDING),
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok || !j?.success) {
    // Non-fatal: the demo still loads, it just won't be Meridian-themed.
    console.warn(`branding apply failed (${r.status}): ${JSON.stringify(j)} — continuing`);
    return;
  }
  console.log(`Applied the ${j.data?.companyName || 'Meridian'} brand (name, logo, colours).`);
}

async function main() {
  await waitForHealth();
  const token = await login();
  await applyBranding(token);
}

main().catch((e) => {
  console.error('Meridian brand overlay failed:', e.message);
  process.exit(1);
});
