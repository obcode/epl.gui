---
name: toolchain-gotchas
description: Drei Stolperfallen beim Aufsetzen der SvelteKit-Toolchain, die je zehn Minuten gekostet haben
metadata:
  type: project
---

Gefunden beim Aufsetzen am 2026-07-30. Alle drei sehen nach Konfigurationsfehlern des
Projekts aus und sind es nicht.

## `allowBuilds` ist eine Map, keine Liste

pnpm 10/11 blockiert native postinstall-Skripte. Die Freigabe steht seit pnpm 10 **nicht mehr
im `pnpm`-Feld der package.json**, sondern in `pnpm-workspace.yaml` — und zwar als Map:

```yaml
allowBuilds:
  '@tailwindcss/oxide': true
  esbuild: true
```

Die Listenform (`- esbuild`) wird stillschweigend ignoriert; `pnpm install` meldet weiterhin
`ERR_PNPM_IGNORED_BUILDS`. Ebenso `pnpm.onlyBuiltDependencies` in der package.json.

Zweite Falle an derselben Stelle: nach dem Ändern der Datei sagt `pnpm install` „Already up
to date" und übergeht die neue Einstellung. `pnpm install --force` oder eine echte
Lockfile-Änderung erzwingt sie.

## `test` gehört nicht in die vite.config

Ein `test`-Block in `vite.config.ts` ist zwar zur Laufzeit funktionsfähig, aber kein
gültiges `UserConfigExport` — `pnpm run check` meldet zu Recht *„Object literal may only
specify known properties, and 'test' does not exist"*. Deshalb liegt die Vitest-Konfiguration
in einer eigenen `vitest.config.ts` mit `defineConfig` aus `vitest/config`.

Der `include`-Glob muss dort eng auf `src/**` stehen, sonst zieht `pnpm test` die
Playwright-Specs aus `tests/` mit hinein und scheitert daran, dass sie einen Browser
erwarten.

## Links brauchen `resolve()`

`eslint-plugin-svelte` 3.x erzwingt `svelte/no-navigation-without-resolve`: ein
`href="/irgendwas"` ist ein Lint-Fehler. Richtig:

```svelte
<script lang="ts">
	import { resolve } from '$app/paths';
</script>
<a href={resolve('/')}>…</a>
```
