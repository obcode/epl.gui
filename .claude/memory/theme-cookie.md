---
name: theme-cookie
description: Warum die Themewahl in einem Cookie steckt und nicht in localStorage, und wo die Injektionsgrenze liegt
metadata:
  type: project
---

Entschieden am 2026-07-31 beim Bau des GUI-Rahmens. `theme-change` stand vorher in der
package.json und in der CLAUDE.md, wurde aber nie benutzt und ist jetzt entfernt.

## Cookie statt localStorage

Die App rendert serverseitig. Bei localStorage kennt der Server die Wahl nicht, liefert das
Default-Markup aus, und erst das erste Client-Skript setzt `data-theme` — sichtbares
Aufblitzen bei **jedem** Full Load, besonders unangenehm beim Wechsel hell ↔ dunkel.

Ein Cookie liegt dem SSR-Request bei. `hooks.server.ts` löst ihn auf und setzt das Attribut
über `transformPageChunk` in `app.html` ein, wo `%tallox.themeattr%` steht.

Der Platzhalter umfasst **das ganze Attribut**, nicht nur den Wert. Grund: die Auswahl
„System" bedeutet _kein_ `data-theme` — nur dann greifen die in `app.css` mit `--default`
und `--prefersdark` markierten Themes. Ein leeres `data-theme=""` bliebe stumm auf dem
Fallback stehen.

## Die Allowlist ist eine Sicherheitsgrenze

`resolveTheme()` in `src/lib/themes.ts` schreibt seinen Rückgabewert **ungeescaped** in das
`<html>`-Tag. Ein selbst gesetzter Cookie ginge damit direkt ins Markup. Deshalb ist die
Prüfung eine Allowlist gegen `THEMES` und kein Regex und kein Escaper — was nicht in der
Liste steht, wird zu `system`. `themes.test.ts` prüft das mit einem Ausbruchsversuch.

Zwei Listen, die zusammenpassen müssen: `THEMES` in `src/lib/themes.ts` (Auswahl) und der
`themes:`-Block in `src/app.css` (erzeugtes CSS). Ein Eintrag, den nur die eine Seite kennt,
schaltet sichtbar auf nichts um.

Siehe auch [[toolchain-gotchas]].
