import type { BuildInfoQuery } from '$lib/gql/__generated__/graphql';

/**
 * Der Versionsstempel des Backends, wie ihn der Footer anzeigt.
 *
 * Aus dem generierten Query-Typ abgeleitet statt von Hand geschrieben: so kann er nicht vom
 * Schema abweichen. Und er steht hier und nicht in `$lib/server/`, weil eine Komponente ihn
 * importiert — alles unter `$lib/server/` ist für Client-Code gesperrt.
 */
export type ServerBuildInfo = BuildInfoQuery['buildInfo'];
