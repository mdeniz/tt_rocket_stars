function sessionFrom(client) {
  return client?.auth?.getSession?.().then(result => result?.data?.session || null);
}

/**
 * Temporary publishable Supabase transport. The cloud-sync domain layer only
 * consumes these operations; provider table and RPC details stay here.
 */
export function createSupabaseCloudProvider(client) {
  return {
    session: () => sessionFrom(client),
    async readSnapshot(pilotId) {
      const { data, error } = await client.from('progress_snapshots')
        .select('version,payload,updated_at').eq('pilot_id', pilotId).maybeSingle();
      if (error) throw error;
      return data;
    },
    async findPilotId(localId) {
      const { data, error } = await client.from('pilots').select('id')
        .eq('local_id', localId).maybeSingle();
      if (error) throw error;
      return data?.id;
    },
    async upsertPilot(session, local) {
      const { data, error } = await client.from('pilots').upsert({
        user_id: session.user.id,
        local_id: local.localId,
        name: local.name,
        avatar: local.avatar,
        language: local.language,
        payload: local.payload,
        updated_at: local.updatedAt,
      }, { onConflict: 'user_id,local_id' }).select('id').single();
      if (error) throw error;
      return data;
    },
    async writeSnapshot(session, pilotId, expectedVersion, local) {
      if (typeof client.rpc === 'function') {
        const { data, error } = await client.rpc('upsert_my_progress_snapshot', {
          p_pilot_id: pilotId,
          p_expected_version: expectedVersion,
          p_payload: local,
        });
        if (error) throw error;
        return Number(data?.version || expectedVersion + 1);
      }
      const { error } = await client.from('progress_snapshots').upsert({
        user_id: session.user.id,
        pilot_id: pilotId,
        version: expectedVersion + 1,
        payload: local,
        updated_at: local.updatedAt,
      }, { onConflict: 'pilot_id' });
      if (error) throw error;
      return expectedVersion + 1;
    },
    async readPilot(session, localId) {
      const { data, error } = await client.from('pilots')
        .select('id,local_id,name,avatar,language,payload,updated_at').eq('user_id', session.user.id)
        .eq('local_id', localId).maybeSingle();
      if (error) throw error;
      return data;
    },
    async readPilotSnapshot(session, pilotId) {
      const { data, error } = await client.from('progress_snapshots')
        .select('version,payload,updated_at').eq('user_id', session.user.id)
        .eq('pilot_id', pilotId).maybeSingle();
      if (error) throw error;
      return data;
    },
    async listPilots(session) {
      const query = client.from('pilots').select('local_id,name,avatar,language,payload,updated_at')
        .eq('user_id', session.user.id).limit(50);
      const response = typeof query.many === 'function' ? await query.many() : await query;
      if (response?.error) throw response.error;
      return Array.isArray(response?.data) ? response.data : (response?.data ? [response.data] : []);
    },
    async deleteCloudData() {
      const { error } = await client.rpc('delete_my_cloud_data', {});
      if (error) throw error;
    },
  };
}
