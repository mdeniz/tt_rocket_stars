const test = require('node:test');
const assert = require('node:assert/strict');

const supabase = import('../../src/lib/supabase.js');

test('keeps Supabase disabled when public configuration is absent', async () => {
  const { getSupabaseConfig, createSupabaseBrowserClient } = await supabase;
  const config = getSupabaseConfig({});

  assert.equal(config.enabled, false);
  assert.equal(config.reason, 'missing-public-config');
  assert.match(config.diagnostic, /disabled/);
  assert.equal(createSupabaseBrowserClient({}), null);
});

test('accepts a valid hosted Supabase URL and public anonymous key', async () => {
  const { getSupabaseConfig, createSupabaseBrowserClient } = await supabase;
  const env = {
    VITE_SUPABASE_URL: 'https://example.supabase.co',
    VITE_SUPABASE_ANON_KEY: 'public-anonymous-key',
  };
  const config = getSupabaseConfig(env);

  assert.equal(config.enabled, true);
  assert.equal(config.url, env.VITE_SUPABASE_URL);
  assert.equal(config.anonKey, env.VITE_SUPABASE_ANON_KEY);
  assert.ok(createSupabaseBrowserClient(env)?.auth);
});

test('accepts localhost HTTP for local development', async () => {
  const { getSupabaseConfig } = await supabase;
  const config = getSupabaseConfig({
    VITE_SUPABASE_URL: 'http://localhost:54321',
    VITE_SUPABASE_ANON_KEY: 'public-anonymous-key',
  });

  assert.equal(config.enabled, true);
});

test('rejects malformed URLs, incomplete configuration, and privileged keys', async () => {
  const { getSupabaseConfig } = await supabase;

  assert.equal(getSupabaseConfig({ VITE_SUPABASE_URL: 'not-a-url', VITE_SUPABASE_ANON_KEY: 'key' }).enabled, false);
  assert.equal(getSupabaseConfig({ VITE_SUPABASE_URL: 'https://example.supabase.co' }).enabled, false);
  assert.equal(getSupabaseConfig({
    VITE_SUPABASE_URL: 'https://example.supabase.co',
    VITE_SUPABASE_ANON_KEY: 'service_role_secret',
  }).enabled, false);
});
