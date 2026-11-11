# API Automation Portfolio — GraphQL + SOAP

![API Tests](https://github.com/narm2005/api-automation-portfolio/actions/workflows/api-tests.yml/badge.svg)

A Playwright + TypeScript framework that tests **modern GraphQL APIs** and **legacy SOAP services**
side by side. No browser is launched; Playwright's `APIRequestContext` handles the HTTP calls.

**Author:** Narmadha Palanisamy (QA Automation Engineer) · [GitHub](https://github.com/narm2005)

---

## What this demonstrates

| Area | How it's shown |
|---|---|
| **GraphQL queries** | Variables, filters, nested objects, data-driven tests from JSON |
| **GraphQL mutations** | Create / update / delete flows against GraphQLZero |
| **GraphQL error handling** | Asserting the `errors` array: GraphQL returns HTTP 200 even on failure |
| **SOAP 1.1 / 1.2** | Envelope templates, `SOAPAction` headers, XML parsing with namespaces stripped |
| **SOAP Faults** | Server faults (divide by zero) vs client faults (bad input) vs business errors |
| **Schema contract testing** | Introspection-based check that fails on breaking schema changes |
| **Cross-protocol integration** | GraphQL and SOAP systems must agree on the same reference data |
| **Security hygiene** | XML-escaping of test data so input can't break or inject into envelopes |
| **CI/CD** | GitHub Actions matrix + Jenkins parallel stages, JUnit + HTML reports, nightly schedule |

## Project structure

```
src/
  clients/
    graphqlClient.ts      # query(), queryOk() — returns data + errors + timing
    soapClient.ts         # call() — SOAP 1.1/1.2 headers, parsed Body, Fault extraction
  graphql/queries/*.graphql   # queries live in files, not inline strings
  soap/templates/*.xml        # envelopes with {{placeholders}}
  data/*.json                 # test data + schema contract
  utils/files.ts              # loadQuery(), renderTemplate() with XML escaping
  config.ts                   # endpoints, overridable via .env
tests/
  graphql/   countries · negative · mutations
  soap/      calculator · countryInfo
  contract/  schema.contract · cross-protocol
```

## Run it

```bash
npm install
cp .env.example .env          # optional: point at other environments
npm test                      # everything
npm run test:graphql          # one protocol at a time
npm run test:soap
npm run test:contract
npm run report                # open the HTML report
```

Tag filtering: `npx playwright test --grep @smoke`

## APIs under test (public, no auth)

- **Countries GraphQL**: `https://countries.trevorblades.com/graphql`
- **GraphQLZero** (fake CRUD): `https://graphqlzero.almansi.me/api`
- **Calculator SOAP**: `http://www.dneonline.com/calculator.asmx` ([WSDL](http://www.dneonline.com/calculator.asmx?WSDL))
- **CountryInfo SOAP**: `http://webservices.oorsprong.org/websamples.countryinfo/CountryInfoService.wso` ([WSDL](http://webservices.oorsprong.org/websamples.countryinfo/CountryInfoService.wso?WSDL))

> These are free public demo services, so the occasional outage is expected. CI retries twice.

## Design decisions

- **One client per protocol and thin tests.** Tests read as business checks, and the transport details stay in the clients.
- **`queryOk()` vs `query()`.** Happy-path tests use `queryOk`, which fails on any GraphQL error. Negative tests use `query` and assert the exact error.
- **Strings, not auto-typed XML.** The SOAP parser keeps values as strings and tests convert explicitly, which avoids silent coercion bugs (`"007"` → `7`).
- **Additive schema changes are allowed and removals fail.** The contract test only checks the fields consumers rely on.

## Portfolio site

`docs/index.html` is a one-page portfolio. To host it free, open **Settings → Pages** on GitHub, choose *Deploy from a branch*, then select `main` and `/docs`.
It will be live at `https://narm2005.github.io/api-automation-portfolio/`.
