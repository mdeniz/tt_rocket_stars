const { readFileSync } = require('node:fs');
const { join } = require('node:path');

const source = readFileSync(join(__dirname, '..', 'docs/api-incident-response.md'), 'utf8');
const terms = ['request.completed', 'api.error', 'request ID', 'passwords', 'tokens', 'cookies', 'email bodies', 'child', 'pilot identifiers', 'pilot payloads', 'gameplay answers', 'Local operation', 'approval'];

function assertObservabilityContract(document = source) {
  for (const term of terms) if (!document.toLowerCase().includes(term.toLowerCase())) throw new Error(`Observability contract is missing: ${term}`);
  if (/service[_ -]?role|real user data/i.test(document)) throw new Error('Observability contract contains unsafe credential or data handling.');
  return true;
}

if (require.main === module) { assertObservabilityContract(); console.log('Verified privacy-safe API observability contract'); }
module.exports = { assertObservabilityContract, terms };
