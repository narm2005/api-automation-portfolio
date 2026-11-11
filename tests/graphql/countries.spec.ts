import { test, expect } from '@playwright/test';
import { GraphQLClient } from '../../src/clients/graphqlClient';
import { loadQuery } from '../../src/utils/files';
import { endpoints } from '../../src/config';
import countries from '../../src/data/countries.json';

type Country = {
  code: string; name: string; capital: string; currency: string;
  continent: { code: string; name: string };
  languages: { code: string; name: string }[];
};

test.describe('Countries GraphQL API — queries', () => {
  let gql: GraphQLClient;
  test.beforeEach(({ request }) => {
    gql = new GraphQLClient(request, endpoints.countriesGraphql);
  });

  // Data-driven: one test per row in countries.json
  for (const c of countries) {
    test(`country(${c.code}) returns ${c.name} @smoke`, async () => {
      const data = await gql.queryOk<{ country: Country }>(loadQuery('getCountry'), { code: c.code });

      expect(data.country).toMatchObject({
        code: c.code,
        name: c.name,
        capital: c.capital,
        continent: { code: c.continent },
      });
      expect(data.country.currency.split(',')).toContain(c.currency);
      expect(data.country.languages.length).toBeGreaterThan(0);
    });
  }

  test('filter by continent returns only that continent', async () => {
    const data = await gql.queryOk<{ countries: { code: string; continent: { code: string } }[] }>(
      loadQuery('countriesByContinent'),
      { continent: 'EU' },
    );
    expect(data.countries.length).toBeGreaterThan(30);
    for (const c of data.countries) expect(c.continent.code).toBe('EU');
    expect(data.countries.map((c) => c.code)).toEqual(expect.arrayContaining(['FR', 'DE', 'IT']));
  });

  test('response time is within SLA', async () => {
    const res = await gql.query(loadQuery('getCountry'), { code: 'IN' });
    expect.soft(res.durationMs, 'response time (ms)').toBeLessThan(3000);
  });
});
