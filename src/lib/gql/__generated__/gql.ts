/* eslint-disable */
import * as types from './graphql';
import type { TypedDocumentNode as DocumentNode } from '@graphql-typed-document-node/core';

/**
 * Map of all GraphQL operations in the project.
 *
 * This map has several performance disadvantages:
 * 1. It is not tree-shakeable, so it will include all operations in the project.
 * 2. It is not minifiable, so the string of a GraphQL query will be multiple times inside the bundle.
 * 3. It does not support dead code elimination, so it will add unused operations.
 *
 * Therefore it is highly recommended to use the babel or swc plugin for production.
 * Learn more about it here: https://the-guild.dev/graphql/codegen/plugins/presets/preset-client#reducing-bundle-size
 */
type Documents = {
    "\n\tquery BuildInfo {\n\t\tbuildInfo {\n\t\t\tversion\n\t\t\tcommit\n\t\t\tbuiltAt\n\t\t}\n\t}\n": typeof types.BuildInfoDocument,
    "\n\tquery Session {\n\t\tsession {\n\t\t\tnarrowed\n\t\t\tinteractive\n\t\t\teffectiveRoles\n\t\t\tgrantedRoles\n\t\t\tperson {\n\t\t\t\tid\n\t\t\t\tmail\n\t\t\t\tname\n\t\t\t}\n\t\t}\n\t}\n": typeof types.SessionDocument,
    "\n\tquery MyTokens {\n\t\tmyTokens {\n\t\t\tid\n\t\t\tdescription\n\t\t\tcreatedAt\n\t\t\texpiresAt\n\t\t\tlastUsedAt\n\t\t\trevokedAt\n\t\t}\n\t}\n": typeof types.MyTokensDocument,
    "\n\tmutation CreatePersonalAccessToken($description: String!, $expiresInDays: Int) {\n\t\tcreatePersonalAccessToken(description: $description, expiresInDays: $expiresInDays) {\n\t\t\tsecret\n\t\t\ttoken {\n\t\t\t\tid\n\t\t\t\tdescription\n\t\t\t\tcreatedAt\n\t\t\t\texpiresAt\n\t\t\t\tlastUsedAt\n\t\t\t\trevokedAt\n\t\t\t}\n\t\t}\n\t}\n": typeof types.CreatePersonalAccessTokenDocument,
    "\n\tmutation RevokePersonalAccessToken($id: ID!) {\n\t\trevokePersonalAccessToken(id: $id) {\n\t\t\tid\n\t\t}\n\t}\n": typeof types.RevokePersonalAccessTokenDocument,
    "\n\tquery Semesters {\n\t\tsemesters {\n\t\t\tid\n\t\t\tcode\n\t\t\tphase\n\t\t\treachablePhases\n\t\t\twishesPublishedAt\n\t\t}\n\t}\n": typeof types.SemestersDocument,
    "\n\tmutation CreateSemester($code: String!) {\n\t\tcreateSemester(code: $code) {\n\t\t\tid\n\t\t\tcode\n\t\t}\n\t}\n": typeof types.CreateSemesterDocument,
    "\n\tmutation AdvanceSemesterPhase($id: ID!, $to: Phase!) {\n\t\tadvanceSemesterPhase(id: $id, to: $to) {\n\t\t\tid\n\t\t\tphase\n\t\t}\n\t}\n": typeof types.AdvanceSemesterPhaseDocument,
    "\n\tmutation PublishWishes($id: ID!) {\n\t\tpublishWishes(id: $id) {\n\t\t\tid\n\t\t\twishesPublishedAt\n\t\t}\n\t}\n": typeof types.PublishWishesDocument,
    "\n\tquery DiagnoseAccess($mail: String!) {\n\t\tdiagnoseAccess(mail: $mail) {\n\t\t\tactive\n\t\t\tperson {\n\t\t\t\tid\n\t\t\t\tmail\n\t\t\t\tname\n\t\t\t\troles\n\t\t\t}\n\t\t\tgrants {\n\t\t\t\trole\n\t\t\t\tgrantedAt\n\t\t\t\texpiresAt\n\t\t\t\tgrantedBy {\n\t\t\t\t\tmail\n\t\t\t\t\tname\n\t\t\t\t}\n\t\t\t}\n\t\t\tdecisions {\n\t\t\t\trule\n\t\t\t\tallowed\n\t\t\t\treason\n\t\t\t}\n\t\t}\n\t}\n": typeof types.DiagnoseAccessDocument,
    "\n\tquery People($search: String, $includeInactive: Boolean) {\n\t\tpeople(search: $search, includeInactive: $includeInactive) {\n\t\t\tid\n\t\t\tmail\n\t\t\tname\n\t\t\troles\n\t\t}\n\t}\n": typeof types.PeopleDocument,
    "\n\tmutation CreatePerson($mail: String!, $name: String) {\n\t\tcreatePerson(mail: $mail, name: $name) {\n\t\t\tid\n\t\t\tmail\n\t\t}\n\t}\n": typeof types.CreatePersonDocument,
    "\n\tmutation SetPersonRoles($id: ID!, $roles: [Role!]!, $expiresAt: Time) {\n\t\tsetPersonRoles(id: $id, roles: $roles, expiresAt: $expiresAt) {\n\t\t\tid\n\t\t\troles\n\t\t}\n\t}\n": typeof types.SetPersonRolesDocument,
    "\n\tmutation SetPersonActive($id: ID!, $active: Boolean!) {\n\t\tsetPersonActive(id: $id, active: $active) {\n\t\t\tid\n\t\t}\n\t}\n": typeof types.SetPersonActiveDocument,
};
const documents: Documents = {
    "\n\tquery BuildInfo {\n\t\tbuildInfo {\n\t\t\tversion\n\t\t\tcommit\n\t\t\tbuiltAt\n\t\t}\n\t}\n": types.BuildInfoDocument,
    "\n\tquery Session {\n\t\tsession {\n\t\t\tnarrowed\n\t\t\tinteractive\n\t\t\teffectiveRoles\n\t\t\tgrantedRoles\n\t\t\tperson {\n\t\t\t\tid\n\t\t\t\tmail\n\t\t\t\tname\n\t\t\t}\n\t\t}\n\t}\n": types.SessionDocument,
    "\n\tquery MyTokens {\n\t\tmyTokens {\n\t\t\tid\n\t\t\tdescription\n\t\t\tcreatedAt\n\t\t\texpiresAt\n\t\t\tlastUsedAt\n\t\t\trevokedAt\n\t\t}\n\t}\n": types.MyTokensDocument,
    "\n\tmutation CreatePersonalAccessToken($description: String!, $expiresInDays: Int) {\n\t\tcreatePersonalAccessToken(description: $description, expiresInDays: $expiresInDays) {\n\t\t\tsecret\n\t\t\ttoken {\n\t\t\t\tid\n\t\t\t\tdescription\n\t\t\t\tcreatedAt\n\t\t\t\texpiresAt\n\t\t\t\tlastUsedAt\n\t\t\t\trevokedAt\n\t\t\t}\n\t\t}\n\t}\n": types.CreatePersonalAccessTokenDocument,
    "\n\tmutation RevokePersonalAccessToken($id: ID!) {\n\t\trevokePersonalAccessToken(id: $id) {\n\t\t\tid\n\t\t}\n\t}\n": types.RevokePersonalAccessTokenDocument,
    "\n\tquery Semesters {\n\t\tsemesters {\n\t\t\tid\n\t\t\tcode\n\t\t\tphase\n\t\t\treachablePhases\n\t\t\twishesPublishedAt\n\t\t}\n\t}\n": types.SemestersDocument,
    "\n\tmutation CreateSemester($code: String!) {\n\t\tcreateSemester(code: $code) {\n\t\t\tid\n\t\t\tcode\n\t\t}\n\t}\n": types.CreateSemesterDocument,
    "\n\tmutation AdvanceSemesterPhase($id: ID!, $to: Phase!) {\n\t\tadvanceSemesterPhase(id: $id, to: $to) {\n\t\t\tid\n\t\t\tphase\n\t\t}\n\t}\n": types.AdvanceSemesterPhaseDocument,
    "\n\tmutation PublishWishes($id: ID!) {\n\t\tpublishWishes(id: $id) {\n\t\t\tid\n\t\t\twishesPublishedAt\n\t\t}\n\t}\n": types.PublishWishesDocument,
    "\n\tquery DiagnoseAccess($mail: String!) {\n\t\tdiagnoseAccess(mail: $mail) {\n\t\t\tactive\n\t\t\tperson {\n\t\t\t\tid\n\t\t\t\tmail\n\t\t\t\tname\n\t\t\t\troles\n\t\t\t}\n\t\t\tgrants {\n\t\t\t\trole\n\t\t\t\tgrantedAt\n\t\t\t\texpiresAt\n\t\t\t\tgrantedBy {\n\t\t\t\t\tmail\n\t\t\t\t\tname\n\t\t\t\t}\n\t\t\t}\n\t\t\tdecisions {\n\t\t\t\trule\n\t\t\t\tallowed\n\t\t\t\treason\n\t\t\t}\n\t\t}\n\t}\n": types.DiagnoseAccessDocument,
    "\n\tquery People($search: String, $includeInactive: Boolean) {\n\t\tpeople(search: $search, includeInactive: $includeInactive) {\n\t\t\tid\n\t\t\tmail\n\t\t\tname\n\t\t\troles\n\t\t}\n\t}\n": types.PeopleDocument,
    "\n\tmutation CreatePerson($mail: String!, $name: String) {\n\t\tcreatePerson(mail: $mail, name: $name) {\n\t\t\tid\n\t\t\tmail\n\t\t}\n\t}\n": types.CreatePersonDocument,
    "\n\tmutation SetPersonRoles($id: ID!, $roles: [Role!]!, $expiresAt: Time) {\n\t\tsetPersonRoles(id: $id, roles: $roles, expiresAt: $expiresAt) {\n\t\t\tid\n\t\t\troles\n\t\t}\n\t}\n": types.SetPersonRolesDocument,
    "\n\tmutation SetPersonActive($id: ID!, $active: Boolean!) {\n\t\tsetPersonActive(id: $id, active: $active) {\n\t\t\tid\n\t\t}\n\t}\n": types.SetPersonActiveDocument,
};

/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 *
 *
 * @example
 * ```ts
 * const query = graphql(`query GetUser($id: ID!) { user(id: $id) { name } }`);
 * ```
 *
 * The query argument is unknown!
 * Please regenerate the types.
 */
export function graphql(source: string): unknown;

/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n\tquery BuildInfo {\n\t\tbuildInfo {\n\t\t\tversion\n\t\t\tcommit\n\t\t\tbuiltAt\n\t\t}\n\t}\n"): (typeof documents)["\n\tquery BuildInfo {\n\t\tbuildInfo {\n\t\t\tversion\n\t\t\tcommit\n\t\t\tbuiltAt\n\t\t}\n\t}\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n\tquery Session {\n\t\tsession {\n\t\t\tnarrowed\n\t\t\tinteractive\n\t\t\teffectiveRoles\n\t\t\tgrantedRoles\n\t\t\tperson {\n\t\t\t\tid\n\t\t\t\tmail\n\t\t\t\tname\n\t\t\t}\n\t\t}\n\t}\n"): (typeof documents)["\n\tquery Session {\n\t\tsession {\n\t\t\tnarrowed\n\t\t\tinteractive\n\t\t\teffectiveRoles\n\t\t\tgrantedRoles\n\t\t\tperson {\n\t\t\t\tid\n\t\t\t\tmail\n\t\t\t\tname\n\t\t\t}\n\t\t}\n\t}\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n\tquery MyTokens {\n\t\tmyTokens {\n\t\t\tid\n\t\t\tdescription\n\t\t\tcreatedAt\n\t\t\texpiresAt\n\t\t\tlastUsedAt\n\t\t\trevokedAt\n\t\t}\n\t}\n"): (typeof documents)["\n\tquery MyTokens {\n\t\tmyTokens {\n\t\t\tid\n\t\t\tdescription\n\t\t\tcreatedAt\n\t\t\texpiresAt\n\t\t\tlastUsedAt\n\t\t\trevokedAt\n\t\t}\n\t}\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n\tmutation CreatePersonalAccessToken($description: String!, $expiresInDays: Int) {\n\t\tcreatePersonalAccessToken(description: $description, expiresInDays: $expiresInDays) {\n\t\t\tsecret\n\t\t\ttoken {\n\t\t\t\tid\n\t\t\t\tdescription\n\t\t\t\tcreatedAt\n\t\t\t\texpiresAt\n\t\t\t\tlastUsedAt\n\t\t\t\trevokedAt\n\t\t\t}\n\t\t}\n\t}\n"): (typeof documents)["\n\tmutation CreatePersonalAccessToken($description: String!, $expiresInDays: Int) {\n\t\tcreatePersonalAccessToken(description: $description, expiresInDays: $expiresInDays) {\n\t\t\tsecret\n\t\t\ttoken {\n\t\t\t\tid\n\t\t\t\tdescription\n\t\t\t\tcreatedAt\n\t\t\t\texpiresAt\n\t\t\t\tlastUsedAt\n\t\t\t\trevokedAt\n\t\t\t}\n\t\t}\n\t}\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n\tmutation RevokePersonalAccessToken($id: ID!) {\n\t\trevokePersonalAccessToken(id: $id) {\n\t\t\tid\n\t\t}\n\t}\n"): (typeof documents)["\n\tmutation RevokePersonalAccessToken($id: ID!) {\n\t\trevokePersonalAccessToken(id: $id) {\n\t\t\tid\n\t\t}\n\t}\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n\tquery Semesters {\n\t\tsemesters {\n\t\t\tid\n\t\t\tcode\n\t\t\tphase\n\t\t\treachablePhases\n\t\t\twishesPublishedAt\n\t\t}\n\t}\n"): (typeof documents)["\n\tquery Semesters {\n\t\tsemesters {\n\t\t\tid\n\t\t\tcode\n\t\t\tphase\n\t\t\treachablePhases\n\t\t\twishesPublishedAt\n\t\t}\n\t}\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n\tmutation CreateSemester($code: String!) {\n\t\tcreateSemester(code: $code) {\n\t\t\tid\n\t\t\tcode\n\t\t}\n\t}\n"): (typeof documents)["\n\tmutation CreateSemester($code: String!) {\n\t\tcreateSemester(code: $code) {\n\t\t\tid\n\t\t\tcode\n\t\t}\n\t}\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n\tmutation AdvanceSemesterPhase($id: ID!, $to: Phase!) {\n\t\tadvanceSemesterPhase(id: $id, to: $to) {\n\t\t\tid\n\t\t\tphase\n\t\t}\n\t}\n"): (typeof documents)["\n\tmutation AdvanceSemesterPhase($id: ID!, $to: Phase!) {\n\t\tadvanceSemesterPhase(id: $id, to: $to) {\n\t\t\tid\n\t\t\tphase\n\t\t}\n\t}\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n\tmutation PublishWishes($id: ID!) {\n\t\tpublishWishes(id: $id) {\n\t\t\tid\n\t\t\twishesPublishedAt\n\t\t}\n\t}\n"): (typeof documents)["\n\tmutation PublishWishes($id: ID!) {\n\t\tpublishWishes(id: $id) {\n\t\t\tid\n\t\t\twishesPublishedAt\n\t\t}\n\t}\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n\tquery DiagnoseAccess($mail: String!) {\n\t\tdiagnoseAccess(mail: $mail) {\n\t\t\tactive\n\t\t\tperson {\n\t\t\t\tid\n\t\t\t\tmail\n\t\t\t\tname\n\t\t\t\troles\n\t\t\t}\n\t\t\tgrants {\n\t\t\t\trole\n\t\t\t\tgrantedAt\n\t\t\t\texpiresAt\n\t\t\t\tgrantedBy {\n\t\t\t\t\tmail\n\t\t\t\t\tname\n\t\t\t\t}\n\t\t\t}\n\t\t\tdecisions {\n\t\t\t\trule\n\t\t\t\tallowed\n\t\t\t\treason\n\t\t\t}\n\t\t}\n\t}\n"): (typeof documents)["\n\tquery DiagnoseAccess($mail: String!) {\n\t\tdiagnoseAccess(mail: $mail) {\n\t\t\tactive\n\t\t\tperson {\n\t\t\t\tid\n\t\t\t\tmail\n\t\t\t\tname\n\t\t\t\troles\n\t\t\t}\n\t\t\tgrants {\n\t\t\t\trole\n\t\t\t\tgrantedAt\n\t\t\t\texpiresAt\n\t\t\t\tgrantedBy {\n\t\t\t\t\tmail\n\t\t\t\t\tname\n\t\t\t\t}\n\t\t\t}\n\t\t\tdecisions {\n\t\t\t\trule\n\t\t\t\tallowed\n\t\t\t\treason\n\t\t\t}\n\t\t}\n\t}\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n\tquery People($search: String, $includeInactive: Boolean) {\n\t\tpeople(search: $search, includeInactive: $includeInactive) {\n\t\t\tid\n\t\t\tmail\n\t\t\tname\n\t\t\troles\n\t\t}\n\t}\n"): (typeof documents)["\n\tquery People($search: String, $includeInactive: Boolean) {\n\t\tpeople(search: $search, includeInactive: $includeInactive) {\n\t\t\tid\n\t\t\tmail\n\t\t\tname\n\t\t\troles\n\t\t}\n\t}\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n\tmutation CreatePerson($mail: String!, $name: String) {\n\t\tcreatePerson(mail: $mail, name: $name) {\n\t\t\tid\n\t\t\tmail\n\t\t}\n\t}\n"): (typeof documents)["\n\tmutation CreatePerson($mail: String!, $name: String) {\n\t\tcreatePerson(mail: $mail, name: $name) {\n\t\t\tid\n\t\t\tmail\n\t\t}\n\t}\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n\tmutation SetPersonRoles($id: ID!, $roles: [Role!]!, $expiresAt: Time) {\n\t\tsetPersonRoles(id: $id, roles: $roles, expiresAt: $expiresAt) {\n\t\t\tid\n\t\t\troles\n\t\t}\n\t}\n"): (typeof documents)["\n\tmutation SetPersonRoles($id: ID!, $roles: [Role!]!, $expiresAt: Time) {\n\t\tsetPersonRoles(id: $id, roles: $roles, expiresAt: $expiresAt) {\n\t\t\tid\n\t\t\troles\n\t\t}\n\t}\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n\tmutation SetPersonActive($id: ID!, $active: Boolean!) {\n\t\tsetPersonActive(id: $id, active: $active) {\n\t\t\tid\n\t\t}\n\t}\n"): (typeof documents)["\n\tmutation SetPersonActive($id: ID!, $active: Boolean!) {\n\t\tsetPersonActive(id: $id, active: $active) {\n\t\t\tid\n\t\t}\n\t}\n"];

export function graphql(source: string) {
  return (documents as any)[source] ?? {};
}

export type DocumentType<TDocumentNode extends DocumentNode<any, any>> = TDocumentNode extends DocumentNode<  infer TType,  any>  ? TType  : never;