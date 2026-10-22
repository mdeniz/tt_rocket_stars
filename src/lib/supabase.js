import { createClient } from '@supabase/supabase-js';

const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '[::1]']);

function getRuntimeEnv() {
  return import.meta.env ?? {};
}

function isAllowedSupabaseUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === 'https:'
      || (url.protocol === 'http:' && LOCAL_HOSTS.has(url.hostname));
  } catch {
    return false;
  }
}

function looksPrivileged(value) {
  const normalized = value.toLowerCase();
  return normalized.includes('service_role')
    || normalized.includes('supabase_service_role')
    || normalized.includes('sb_secret');
}

/**
 * Read and validate the public Supabase configuration exposed by Vite.
 * Missing configuration is an expected offline-only state, not an error.
 */
export function getSupabaseConfig(env = getRuntimeEnv()) {
  const url = String(env?.VITE_SUPABASE_URL ?? '').trim();
  const anonKey = String(env?.VITE_SUPABASE_ANON_KEY ?? '').trim();

  if (!url && !anonKey) {
    return {
      enabled: false,
      reason: 'missing-public-config',
      diagnostic: 'Supabase is disabled: public Vite configuration is not set.',
      errors: [],
    };
  }

  const errors = [];
  if (!url) errors.push('VITE_SUPABASE_URL is missing.');
  else if (!isAllowedSupabaseUrl(url)) errors.push('VITE_SUPABASE_URL must be an HTTPS URL or a localhost HTTP URL.');

  if (!anonKey) errors.push('VITE_SUPABASE_ANON_KEY is missing.');
  else if (looksPrivileged(anonKey)) errors.push('VITE_SUPABASE_ANON_KEY must be a public anonymous key, not a privileged secret.');

  if (errors.length > 0) {
    return {
      enabled: false,
      reason: 'invalid-public-config',
      diagnostic: `Supabase is disabled: ${errors.join(' ')}`,
      errors,
    };
  }

  return {
    enabled: true,
    url,
    anonKey,
    reason: null,
    diagnostic: 'Supabase public configuration is valid.',
    errors: [],
  };
}

/**
 * Create the browser client only when the optional public configuration is valid.
 * The anonymous key is safe for the browser; service-role keys must never be used here.
 */
export function createSupabaseBrowserClient(env = getRuntimeEnv()) {
  const config = getSupabaseConfig(env);
  if (!config.enabled) return null;

  return createClient(config.url, config.anonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });
}
