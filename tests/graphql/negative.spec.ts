import { test, expect } from '@playwright/test';
import { GraphQLClient } from '../../src/clients/graphqlClient';
import { loadQuery } from '../../src/utils/files';
import { endpoints } from '../../src/config';

/**
 * GraphQL rarely uses HTTP status codes for errors — the contract is the
 * `errors` array. These tests prove the API rejects bad input cleanly.
 */
test.describe('Countries GraphQL API — negative & validation', () => {
  let gql: GraphQLClient;
  test.beforeEach(({ request }) => {
    gql = new GraphQLClient(request, endpoints.countriesGraphql);
  });

  test('unknown field is rejected with a validation error', async () => {
    const res = await gql.query('{ country(code: "IN") { name population } }');
    expect(res.errors).toBeDefined();
    expect(res.errors![0].message).toMatch(/Cannot query field "population"/);
    expect(res.data ?? null).toBeNull();
  });

  test('missing required variable is rejected', async () => {
    const res = await gql.query(loadQuery('getCountry'), {});
    expect(res.errors?.[0].message).toMatch(/\$code/);
  });

  test('wrong variable type is rejected', async () => {
    const res = await gql.query(loadQuery('countriesByContinent'), { continent: 123 });
    expect(res.errors).toBeDefined();
  });

  test('non-existent country returns null, not an error', async () => {
    const res = await gql.query<{ country: unknown }>(loadQuery('getCountry'), { code: 'ZZ' });
    expect(res.errors).toBeUndefined();
    expect(res.data?.country).toBeNull();
  });

  test('malformed query syntax is rejected', async () => {
    const res = await gql.query('{ country(code: "IN") { name ');
    expect(res.errors?.[0].message).toMatch(/Syntax Error/i);
  });
});
