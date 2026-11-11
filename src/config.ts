import 'dotenv/config';

/** Central endpoint config — override any value via .env or CI variables. */
export const endpoints = {
  countriesGraphql:
    process.env.COUNTRIES_GRAPHQL_URL ?? 'https://countries.trevorblades.com/graphql',
  graphqlZero: process.env.GRAPHQLZERO_URL ?? 'https://graphqlzero.almansi.me/api',
  calculatorSoap:
    process.env.CALCULATOR_SOAP_URL ?? 'http://www.dneonline.com/calculator.asmx',
  countryInfoSoap:
    process.env.COUNTRYINFO_SOAP_URL ??
    'http://webservices.oorsprong.org/websamples.countryinfo/CountryInfoService.wso',
};
