# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this
repository. The workspace-level file at `/workspace/CLAUDE.md` (from the private `epl.dev`
repo) applies as well and covers the domain glossary, the cross-repo workflow and the git
conventions.

## What this is

A SvelteKit UI for **EPL**, the teaching-assignment planning system (_Einsatzplanung_) of
faculty 07 at Hochschule München. It is a **thin frontend over the `epl.go` GraphQL
backend**: no business logic, no persistence, and **never a security boundary**.

That last point is not a slogan here. The same GraphQL API is reachable directly with a
Personal Access Token, which bypasses this app entirely — so anything this UI appears to
enforce (hiding a button, filtering a list) is cosmetic. The backend is the gate.

UI language is German. Code, identifiers, comments and commit messages are English.

**This repository is public.** No hostnames, no operational detail, no names of colleagues.

## Commands

Package manager is **pnpm** (pinned via `packageManager`, use Corepack).

```bash
pnpm install
pnpm dev                 # :5173 — binds 127.0.0.1, see below
pnpm build               # adapter-node -> ./build
pnpm preview             # :4173
pnpm check               # svelte-check, blocking in CI
pnpm lint                # prettier --check . && eslint .
pnpm format
pnpm test                # vitest
pnpm test:e2e            # playwright, needs a running backend
pnpm codegen             # regenerate typed documents from schema.graphql
pnpm run update-schema   # refetch schema from $EPL_SERVER, then codegen
```

`pnpm dev` binds `127.0.0.1` on purpose: without it Vite binds only `::1` and the
DevContainer port forward hangs silently.

## Backend connection

Two URLs, and the difference matters:

- `PUBLIC_EPL_SERVER` — from the browser. In production the public URL; it carries the OIDC
  cookie.
- `EPL_SERVER` — from the SSR process, container-internal (`http://epl-api:8080/query`).
  **Never point this at the public URL:** the SSR process has no OIDC cookie and would get
  the IdP's HTML login page back, which surfaces as a 500 on an arbitrary page.

Because the SSR hop bypasses the auth proxy, this app must relay `X-Remote-User` itself.
That happens in `src/lib/server/backend.ts` via **AsyncLocalStorage**, set once in
`hooks.server.ts` — rather than threading `locals` through every load and handler signature,
where one forgotten call site would be a silent authorization failure.

`backendClient()` builds its headers **from scratch**. Client-supplied `Authorization` or
`X-Remote-*` headers are never forwarded.

## Data fetching

- **SSR loads** — `+page.server.ts` calls `backendRequest(...)`.
- **Client-side proxies** — `src/routes/gui-api/<domain>/<name>/+server.ts`.

Two deliberate choices, both lessons from the sibling project:

1. **`/gui-api/`, not `/api/`.** `/api/graphql` is the machine API served by the backend
   through Caddy. Keeping the app's own proxies in a separate namespace makes the boundary
   visible in the URL and prevents Caddy from silently shadowing a route.
2. **GET for reads, POST for writes.** The sibling project made every proxy POST and then
   needed a hand-maintained allowlist of "POSTs that are really reads" for its write-lock.
   Using the right verb makes that classification automatic.

GraphQL documents go through **graphql-codegen `client-preset`** (`graphql(...)` tagged
documents, typed end to end) — not untyped template strings. `schema.graphql` is the
committed copy of the backend schema; codegen reads that file, so it works offline and in CI.

## Conventions

- **Svelte 5 in runes mode**, globally. `svelte.config.js` sets `compilerOptions.runes: true`,
  so `export let`, `$:`, `on:click`, `createEventDispatcher` and `<slot>` are **compile
  errors**, not style preferences. Use `$props()`, `$state()`, `$derived`, `$effect()`,
  callback props, `{@render children()}`.
  `dynamicCompileOptions` compiles `node_modules` in legacy mode — that escape hatch is for
  dependencies, never for `src/`.
- **TypeScript only.** `strict: true`. No `.js` files in `src/`.
- **Styling: Tailwind v4 (CSS-first) + daisyUI**, theme via `theme-change`.
  Page wrapper `flex flex-col gap-4`; heading `text-2xl font-semibold`; cards
  `rounded-lg border border-base-300 bg-base-100 p-4`; status via **theme tokens**
  (`text-base-content/60`, `text-success`, `text-error`) — **never hard-coded colours** like
  `text-green-700`.
- **Responsive, tablet-first.** Full usability from 768px, clean at 375px. Horizontal padding
  comes from `+layout.svelte`; pages do not add their own. Grids are always
  `grid-cols-1 sm:grid-cols-N`, wide tables live in `overflow-x-auto`.
- **Prettier:** tabs, single quotes, no trailing commas, printWidth 100.
- **Links need `resolve()`** from `$app/paths` (`svelte/no-navigation-without-resolve`).

## Things the UI must not do

These follow from the domain, not from taste. Full reasoning in the backend's
`internal/policy` and in the workspace `CLAUDE.md`.

- **Before wishes are published, show no aggregate about them.** No counts, no
  "hat Wünsche" badges, no sorting by interest, no heat-map colouring. Such a badge leaks the
  _kein Windhundverfahren_ information completely without naming anyone. If the backend
  returns a count, it is already filtered — do not compute one client-side from a list.
- **Do not surface raw backend error strings on write paths.** A verbatim uniqueness
  violation reveals that someone else already registered.
- Role-based hiding (buttons, menu entries) is **cosmetic**. Write it for clarity, never rely
  on it.

## Tests

- **vitest** for pure logic in `src/lib/**`. Convention: pull logic out of `.svelte` into a
  `lib` module, test the module, import it back.
- **Playwright** smoke tests in `tests/`, need a running backend and are therefore **not** in
  the CI gate. In the DevContainer `/dev/shm` is 64 MB, so Chromium needs
  `--disable-dev-shm-usage` and capped workers.
