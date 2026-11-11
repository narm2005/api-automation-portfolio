import { test, expect } from '@playwright/test';
import { SoapClient } from '../../src/clients/soapClient';
import { renderTemplate } from '../../src/utils/files';
import { endpoints } from '../../src/config';
import cases from '../../src/data/calculator.json';

test.describe('Calculator SOAP service (SOAP 1.1)', () => {
  let soap: SoapClient;
  test.beforeEach(({ request }) => {
    soap = new SoapClient(request, endpoints.calculatorSoap, '1.1');
  });

  for (const c of cases) {
    test(`${c.operation}(${c.a}, ${c.b}) = ${c.expected} @smoke`, async () => {
      const envelope = renderTemplate('calculator', { operation: c.operation, a: c.a, b: c.b });
      const res = await soap.call(envelope, `http://tempuri.org/${c.operation}`);

      expect(res.status).toBe(200);
      expect(res.fault).toBeNull();
      const result = res.body[`${c.operation}Response`]?.[`${c.operation}Result`];
      expect(Number(result)).toBe(c.expected);
    });
  }

  test('divide by zero returns a SOAP Fault', async () => {
    const envelope = renderTemplate('calculator', { operation: 'Divide', a: 10, b: 0 });
    const res = await soap.call(envelope, 'http://tempuri.org/Divide');

    expect(res.status).toBe(500);
    expect(res.fault).not.toBeNull();
    expect(res.fault!.code).toMatch(/Server|Receiver/);
  });

  test('non-numeric input returns a SOAP Fault', async () => {
    const envelope = renderTemplate('calculator', { operation: 'Add', a: 'abc', b: 1 });
    const res = await soap.call(envelope, 'http://tempuri.org/Add');

    expect(res.status).toBe(500);
    expect(res.fault?.code).toMatch(/Client|Sender/);
  });

  test('response envelope is well-formed SOAP 1.1', async () => {
    const res = await soap.call(renderTemplate('calculator', { operation: 'Add', a: 1, b: 1 }), 'http://tempuri.org/Add');
    expect(res.rawXml).toContain('http://schemas.xmlsoap.org/soap/envelope/');
    expect(res.rawXml).toMatch(/<AddResult>2<\/AddResult>/);
  });
});
