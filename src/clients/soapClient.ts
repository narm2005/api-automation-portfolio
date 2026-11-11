import { APIRequestContext } from '@playwright/test';
import { XMLParser } from 'fast-xml-parser';

export type SoapVersion = '1.1' | '1.2';

export interface SoapFault {
  code: string;
  message: string;
}

export interface SoapResponse {
  status: number;
  rawXml: string;
  /** Parsed <Body> contents with namespace prefixes stripped. */
  body: Record<string, any>;
  fault: SoapFault | null;
  durationMs: number;
}

const parser = new XMLParser({
  removeNSPrefix: true,
  ignoreAttributes: true,
  parseTagValue: false, // keep values as strings; tests convert explicitly
  trimValues: true,
});

/**
 * SOAP client that posts an envelope and returns the parsed Body plus any Fault.
 * Handles both SOAP 1.1 (text/xml + SOAPAction header) and 1.2 (application/soap+xml).
 */
export class SoapClient {
  constructor(
    private readonly request: APIRequestContext,
    private readonly url: string,
    private readonly version: SoapVersion = '1.1',
  ) {}

  async call(envelope: string, soapAction?: string): Promise<SoapResponse> {
    const headers: Record<string, string> =
      this.version === '1.1'
        ? { 'Content-Type': 'text/xml; charset=utf-8', ...(soapAction ? { SOAPAction: `"${soapAction}"` } : {}) }
        : { 'Content-Type': `application/soap+xml; charset=utf-8${soapAction ? `; action="${soapAction}"` : ''}` };

    const started = Date.now();
    const res = await this.request.post(this.url, { headers, data: envelope });
    const durationMs = Date.now() - started;
    const rawXml = await res.text();

    const parsed = parser.parse(rawXml);
    const body = parsed?.Envelope?.Body ?? {};
    return { status: res.status(), rawXml, body, fault: extractFault(body), durationMs };
  }
}

function extractFault(body: Record<string, any>): SoapFault | null {
  const f = body.Fault;
  if (!f) return null;
  // SOAP 1.1: faultcode/faultstring — SOAP 1.2: Code/Value + Reason/Text
  const code = f.faultcode ?? f.Code?.Value ?? 'unknown';
  const message = f.faultstring ?? f.Reason?.Text ?? JSON.stringify(f);
  return { code: String(code), message: String(message) };
}
