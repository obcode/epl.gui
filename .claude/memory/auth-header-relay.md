---
name: auth-header-relay
description: Der SSR-Hop umgeht den Auth-Proxy und muss X-Remote-User selbst mitschicken — umgesetzt über AsyncLocalStorage
metadata:
  type: project
---

## Das Problem

In der Produktion authentifiziert ein Auth-Proxy (Caddy → oauth2-proxy → OIDC) und setzt
`X-Remote-User` autoritativ. Für den Browser stimmt das.

Der **SSR-Hop** aber läuft containerintern: der Node-Prozess dieser Anwendung ruft
`http://tallox-api:8080/query` auf und geht damit **an Caddy vorbei**. Das Backend sieht dort
kein `X-Remote-User`, wenn diese Anwendung es nicht selbst mitschickt.

Der naheliegende Ausweg — `TALLOX_SERVER` auf die öffentliche URL zeigen lassen — funktioniert
nicht: der SSR-Prozess hat kein OIDC-Cookie und bekäme die HTML-Loginseite des IdP zurück.
Symptom ist ein 500er auf einer beliebigen Seite, nicht etwa ein 401.

## Die Lösung

`hooks.server.ts` liest die Header einmal und legt sie in einen **AsyncLocalStorage**
(`authContext` in `src/lib/server/backend.ts`). `backendClient()` liest ihn.

Warum nicht `event.locals` durchreichen: das wären Änderungen an jeder `load()`-Signatur und
jedem `/gui-api`-Handler. Eine vergessene Stelle wäre ein **stiller** Autorisierungsfehler —
die Anfrage liefe unauthentifiziert weiter, ohne dass irgendwo etwas fehlschlägt.

Getestet in `src/lib/server/backend.test.ts`: Weitergabe über `await`-Grenzen und Isolation
nebenläufiger Requests. Das ist die Eigenschaft, auf der alles beruht.

## Regel

**`backendClient()` baut seine Header immer neu.** Ein vom Client mitgeschickter
`Authorization`- oder `X-Remote-*`-Header wird nie weitergereicht — sonst könnte sich jeder
als beliebige Person ausgeben. Caddy verwirft eingehende `X-Remote-*` zwar schon, aber diese
Anwendung darf sich nicht darauf verlassen.
