import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { createTypedDataAccess } from '../../../server/data-access/repository.ts';
import { createSupabaseDataProvider } from '../_shared/supabase-data-provider.ts';
import type { AuthenticatedRequestContext } from '../../../server/data-access/contracts.ts';
import {
  allowedOrigin,
  errorResponse,
  parseBearerToken,
  parseRequestBody,
  withTimeout,
} from '../_shared/cloud-contract.js';

const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') || '';
const configuredOrigins = Deno.env.get('ALLOWED_ORIGINS') || '';

function headers(origin) {
  const allowed = allowedOrigin(origin, configuredOrigins);
  return {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    ...(allowed ? { 'Access-Control-Allow-Origin': allowed, Vary: 'Origin' } : {}),
  };
}

function response(body, status, origin) {
  return new Response(JSON.stringify(body), { status, headers: headers(origin) });
}

function requireConfiguration() {
  if (!supabaseUrl || !supabaseAnonKey) throw Object.assign(new Error('Function is not configured.'), { code: 'cloud_unavailable' });
}

function browserPilot(pilot) {
  return {
    id: pilot.id,
    user_id: pilot.userId,
    local_id: pilot.localId,
    name: pilot.name,
    avatar: pilot.avatar,
    language: pilot.language,
    payload: pilot.payload,
    created_at: pilot.createdAt,
    updated_at: pilot.updatedAt,
  };
}

function browserSnapshot(snapshot) {
  if (!snapshot) return null;
  return {
    id: snapshot.id,
    user_id: snapshot.userId,
    pilot_id: snapshot.pilotId,
    version: snapshot.version,
    payload: snapshot.payload,
    created_at: snapshot.createdAt,
    updated_at: snapshot.updatedAt,
  };
}

function decodeBase64Url(value) {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=');
  return Uint8Array.from(atob(padded), character => character.charCodeAt(0));
}

function validatedUser(request) {
  requireConfiguration();
  const token = parseBearerToken(request.headers.get('Authorization'));
  const parts = token.split('.');
  if (parts.length !== 3) throw Object.assign(new Error('Authentication required.'), { code: 'unauthorized' });
  let claims;
  try {
    claims = JSON.parse(new TextDecoder().decode(decodeBase64Url(parts[1])));
  } catch {
    throw Object.assign(new Error('Authentication required.'), { code: 'unauthorized' });
  }
  if (typeof claims?.sub !== 'string' || !claims.sub.trim()) {
    throw Object.assign(new Error('Authentication required.'), { code: 'unauthorized' });
  }
  const user = { id: claims.sub, email: claims.email };
  return { token, user };
}

async function handle(request) {
  const origin = request.headers.get('Origin') || '';
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: headers(origin) });
  if (request.method !== 'POST') return response({ error: 'method_not_allowed' }, 405, origin);
  const raw = await request.json();
  const operation = parseRequestBody(raw, JSON.stringify(raw).length);
  return await withTimeout(async signal => {
    // Supabase validates this JWT before invoking the function (verify_jwt=true).
    // Decode only the validated subject so the function does not depend on a
    // second Auth request that can stall independently of the data operation.
    const { token, user } = validatedUser(request);
    const context: AuthenticatedRequestContext = { userId: user.id, accessToken: token };
    const client = createClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: {
        headers: { Authorization: `Bearer ${token}` },
        fetch: (input, init = {}) => fetch(input, { ...init, signal: init.signal || signal }),
      },
    });
    const access = createTypedDataAccess(() => createSupabaseDataProvider(client, context));
    if (operation.operation === 'upload') {
      const pilot = await access.upsertOwnedPilot(context, operation.pilot);
      const snapshot = await access.writeProgressSnapshot(context, { pilotId: pilot.id, expectedVersion: operation.expectedVersion, payload: operation.pilot });
      return response({ status: 'uploaded', version: snapshot.version, updatedAt: snapshot.updatedAt }, 200, origin);
    }
    if (operation.operation === 'download' || operation.operation === 'restorePilot') {
      const pilot = await access.readOwnedPilot(context, { localId: operation.localId });
      if (!pilot) return response({ status: 'not-found' }, 200, origin);
      return response({ status: 'downloaded', pilot: browserPilot(pilot), snapshot: browserSnapshot(await access.readProgressSnapshot(context, pilot.id)) }, 200, origin);
    }
    if (operation.operation === 'listPilots') {
      const pilots = await access.listOwnedPilots(context);
      return response({ status: 'listed', pilots: pilots.map(browserPilot) }, 200, origin);
    }
    await access.deleteOwnedCloudData(context);
    return response({ status: 'deleted' }, 200, origin);
  });
}

Deno.serve(async request => {
  try {
    return await handle(request);
  } catch (error) {
    const origin = request.headers.get('Origin') || '';
    const result = errorResponse(error);
    return response(result.body, result.status, origin);
  }
});
