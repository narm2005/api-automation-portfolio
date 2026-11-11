import { test, expect } from '@playwright/test';
import { GraphQLClient } from '../../src/clients/graphqlClient';
import { SoapClient } from '../../src/clients/soapClient';
import { loadQuery, renderTemplate } from '../../src/utils/files';
import { endpoints } from '../../src/config';
import countries from '../../src/data/countries.json';

/**
 * Integration-style check: two independent systems (a GraphQL API and a
 * legacy SOAP service) must agree on the same reference data.
 * Mirrors real work like reconciling a modern API against a legacy backend.
 */
test.describe('Cross-protocol data consistency: GraphQL vs SOAP', () => {
  for (const c of countries) {
    test(`${c.code}: capital and currency agree`, async ({ request }) => {
      const gql = new GraphQLClient(request, endpoints.countriesGraphql);
      const soap = new SoapClient(request, endpoints.countryInfoSoap);

      const [gqlData, capitalRes, currencyRes] = await Promise.all([
        gql.queryOk<{ country: { capital: string; currency: string } }>(loadQuery('getCountry'), { code: c.code }),
        soap.call(renderTemplate('capitalCity', { isoCode: c.code })),
        soap.call(renderTemplate('countryCurrency', { isoCode: c.code })),
      ]);

      const soapCapital = capitalRes.body.CapitalCityResponse.CapitalCityResult;
      const soapCurrency = currencyRes.body.CountryCurrencyResponse.CountryCurrencyResult.sISOCode;

      expect(gqlData.country.capital).toBe(soapCapital);
      expect(gqlData.country.currency.split(',')).toContain(soapCurrency);
    });
  }
});
