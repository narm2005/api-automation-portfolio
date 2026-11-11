import { readFileSync } from 'fs';
import { join } from 'path';

const SRC = join(__dirname, '..');

/** Load a .graphql query file from src/graphql/queries. */
export function loadQuery(name: string): string {
  return readFileSync(join(SRC, 'graphql', 'queries', `${name}.graphql`), 'utf-8');
}

/**
 * Load a SOAP envelope from src/soap/templates and fill {{placeholders}}.
 * Values are XML-escaped so test data can never break the envelope.
 */
export function renderTemplate(name: string, values: Record<string, string | number> = {}): string {
  const raw = readFileSync(join(SRC, 'soap', 'templates', `${name}.xml`), 'utf-8');
  return raw.replace(/\{\{(\w+)\}\}/g, (_, key: string) => {
    if (!(key in values)) throw new Error(`Template "${name}" is missing value for {{${key}}}`);
    return escapeXml(String(values[key]));
  });
}

function escapeXml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
