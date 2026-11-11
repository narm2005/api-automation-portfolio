import { test, expect } from '@playwright/test';
import { GraphQLClient } from '../../src/clients/graphqlClient';
import { loadQuery } from '../../src/utils/files';
import { endpoints } from '../../src/config';
import contract from '../../src/data/countrySchema.contract.json';

type TypeRef = { kind: string; name: string | null; ofType?: TypeRef | null };

/** Unwrap NON_NULL / LIST wrappers to the named type. */
function namedType(t: TypeRef): string | null {
  return t.name ?? (t.ofType ? namedType(t.ofType) : null);
}

test('GraphQL schema has no breaking changes for consumer fields', async ({ request }) => {
  const gql = new GraphQLClient(request, endpoints.countriesGraphql);
  const data = await gql.queryOk<{ __type: { fields: { name: string; type: TypeRef }[] } }>(
    loadQuery('schemaFields'),
    { type: contract.type },
  );

  const live = Object.fromEntries(data.__type.fields.map((f) => [f.name, namedType(f.type)]));

  for (const [field, expectedType] of Object.entries(contract.requiredFields)) {
    expect.soft(live[field], `field "${field}" missing or retyped`).toBe(expectedType);
  }
});
