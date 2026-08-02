// The SDL text is embedded at build time (`?raw`) rather than read at runtime: in the built
// container `schema.graphql` does not sit next to the server, and a file access would be a
// source of failure for something that does not change between two builds anyway.
//
// It is the same file `pnpm codegen` generates the types from. The reference therefore cannot
// diverge from what this application itself queries.
import schemaSDL from '../../../../schema.graphql?raw';
import { buildSchemaDoc } from '$lib/schemaDoc';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	return { doc: buildSchemaDoc(schemaSDL) };
};
