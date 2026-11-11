import { test, expect } from '@playwright/test';
import { SoapClient } from '../../src/clients/soapClient';
import { renderTemplate } from '../../src/utils/files';
import { endpoints } from '../../src/config';
import countries from '../../src/data/countries.json';

test.describe('CountryInfo SOAP service', () => {
  let soap: SoapClient;
  test.beforeEach(({ request }) => {
    soap = new SoapClient(request, endpoints.countryInfoSoap, '1.1');
  });

  for (const c of countries) {
    test(`CapitalCity(${c.code}) = ${c.capital}`, async () => {
      const res = await soap.call(renderTemplate('capitalCity', { isoCode: c.code }));
      expect(res.status).toBe(200);
      expect(res.body.CapitalCityResponse.CapitalCityResult).toBe(c.capital);
    });
  }

  test('CountryCurrency returns a complex type', async () => {
    const res = await soap.call(renderTemplate('countryCurrency', { isoCode: 'JP' }));
    const result = res.body.CountryCurrencyResponse.CountryCurrencyResult;
    expect(result).toEqual({ sISOCode: 'JPY', sName: expect.stringMatching(/Yen/i) });
  });

  test('unknown country code returns a business error, not a fault', async () => {
    const res = await soap.call(renderTemplate('capitalCity', { isoCode: 'ZZ' }));
    expect(res.status).toBe(200);
    expect(res.fault).toBeNull();
    expect(res.body.CapitalCityResponse.CapitalCityResult).toMatch(/not found/i);
  });

  test('template escapes XML-special characters in test data', async () => {
    // Would break the envelope if not escaped — should come back as a normal "not found"
    const res = await soap.call(renderTemplate('capitalCity', { isoCode: '<&>' }));
    expect(res.fault).toBeNull();
    expect(res.status).toBe(200);
  });
});
