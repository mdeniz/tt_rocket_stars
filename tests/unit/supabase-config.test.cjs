const assert = require('node:assert/strict');
const test = require('node:test');

const supabase = import('../../src/lib/supabase.js');

test('accepts only a public HTTPS Supabase configuration', async () => {
  const { getSupabaseConfig } = await supabase;
  const config = getSupabaseConfig({
    VITE_SUPABASE_URL: 'https://example.supabase.co',
    VITE_SUPABASE_ANON_KEY: 'public-anon-key',
  });
  assert.equal(config.enabled, true);
  assert.equal(config.anonKey, 'public-anon-key');
});

test('keeps cloud disabled when configuration is absent, local, or privileged', async () => {
  const { getSupabaseConfig } = await supabase;
  assert.equal(getSupabaseConfig({}).enabled, false);
  assert.equal(getSupabaseConfig({
    VITE_SUPABASE_URL: 'http://attacker.example',
    VITE_SUPABASE_ANON_KEY: 'public-anon-key',
  }).enabled, false);
  assert.equal(getSupabaseConfig({
    VITE_SUPABASE_URL: 'https://example.supabase.co',
    VITE_SUPABASE_ANON_KEY: 'service_role_secret',
  }).enabled, false);
});
