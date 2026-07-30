# epl.gui

Web interface for **EPL**, the teaching-assignment planning system (_Einsatzplanung_) of
faculty 07 at Hochschule München.

> **Status: early construction.** Structure, tooling and CI are in place; the pages are being
> built. See [CLAUDE.md](CLAUDE.md) for the conventions.

A thin frontend over the [`epl.go`](https://github.com/obcode/epl.go) GraphQL backend — no
business logic, no persistence, and not a security boundary. The same API is reachable
directly with a Personal Access Token, so everything this app appears to enforce is
cosmetic; the backend is the gate.

## Stack

SvelteKit 2 · Svelte 5 (runes mode, enforced globally) · TypeScript · Tailwind v4 + daisyUI ·
graphql-request with codegen `client-preset` · adapter-node

## Development

Everything runs in the DevContainer from the `epl.dev` repo.

```bash
cp .env.example .env
pnpm install
pnpm dev        # :5173
```

`pnpm dev` binds `127.0.0.1` deliberately — without it Vite binds only `::1` and the
DevContainer port forward hangs silently.

```bash
pnpm check      # svelte-check, blocking in CI
pnpm lint
pnpm test       # vitest
pnpm test:e2e   # playwright, needs a running backend
```

After a backend schema change, with the backend running:

```bash
pnpm run update-schema   # fetch schema.graphql, then codegen
```

## Configuration

Two URLs, and the difference matters:

| Variable            | Used by     | Value                                                |
| ------------------- | ----------- | ---------------------------------------------------- |
| `PUBLIC_EPL_SERVER` | browser     | the public URL — it carries the OIDC cookie          |
| `EPL_SERVER`        | SSR process | container-internal, e.g. `http://epl-api:8080/query` |

The SSR hop bypasses the auth proxy, so this app relays the verified `X-Remote-User` itself
(see `src/lib/server/backend.ts`). Pointing `EPL_SERVER` at the public URL returns the IdP's
HTML login page and surfaces as a 500.

## License

BSD 3-Clause. See [LICENSE](LICENSE).
