---
name: no-wish-aggregates
description: Vor der Veröffentlichung darf die Oberfläche keinerlei Aggregat über Wünsche zeigen — auch keine Counts oder Badges
metadata:
  type: feedback
---

Wünsche (Interessensbekundungen an Lehrveranstaltungen) sind bis zum
Veröffentlichungs-Stichtag für andere unsichtbar. Zweck: _kein Windhundverfahren_ — neue
Kolleg:innen sollen sich eintragen können, ohne dass es wie ein Angriff auf eine
alteingesessene Person wirkt.

**Zeilenfilterung allein reicht nicht.** Ein Badge „3 Kolleg:innen haben bereits Interesse"
verrät die Information vollständig, ohne einen einzigen Namen zu nennen. Dasselbe gilt für:

- ein „hat Wünsche"-Flag oder ein gefülltes/leeres Icon
- Sortierung nach Interessentenzahl
- Heatmap- oder Ampelfärbung, die von Wünschen abhängt
- „noch niemand hat sich eingetragen" als Hinweis
- Disabled-Zustände oder Tooltips, die aus fremden Einträgen folgen

**Why:** Die Oberfläche ist der Ort, an dem so ein Badge selbstverständlich wirkt — genau
deshalb entsteht das Leck hier und nicht im Backend. Und es ist kein Bug, sondern der
politische Schaden, den das ganze Werkzeug verhindern soll.

**How to apply:** Vor der Veröffentlichung keine Aggregate über Wünsche rendern. Wenn das
Backend einen Count liefert, ist er bereits gefiltert — **niemals clientseitig aus einer
Liste zählen**, denn die Liste ist ebenfalls gefiltert und der Count wäre dann falsch _und_
verräterisch, je nachdem, wer schaut.

Zweiter Leckkanal an derselben Stelle: **rohe Backend-Fehlermeldungen auf Schreibpfaden.**
Eine durchgereichte Verletzung einer Eindeutigkeitsregel verrät, dass schon jemand
eingetragen ist. Auf Schreibpfaden generische Meldungen anzeigen.

Die Regel selbst wird im Backend durchgesetzt ([[auth-header-relay]] erklärt, warum diese
Anwendung ohnehin keine Sicherheitsgrenze ist) — hier geht es darum, sie nicht durch die
Darstellung zu unterlaufen.
