# Supabase connection-pool operations

The hosted free-tier project has a small PostgREST connection pool. Browser
cloud operations are serialized by the client, but stale server sessions can
still remain after a cancelled request or an external browser/agent process.
Pool monitoring must therefore be read-only by default.

## Read-only inspection

Run this query through an authenticated Supabase SQL editor or MCP connection:

```sql
select pid,
       state,
       application_name,
       now() - xact_start as transaction_age,
       wait_event_type,
       wait_event,
       left(query, 180) as query
from pg_stat_activity
where application_name = 'PostgREST 14.18'
order by xact_start nulls last;
```

Investigate `idle in transaction` and `idle in transaction (aborted)` sessions
whose transaction age is materially older than normal request latency. Do not
terminate active sessions solely because they are active, and do not treat
ordinary `idle`/`ClientRead` listener sessions as leaks.

## Targeted cleanup

Only after confirming that the sessions are stale, a project maintainer may run
this narrowly scoped cleanup. It changes database session state and must not be
automated from the browser:

```sql
select pid,
       pg_terminate_backend(pid) as terminated
from pg_stat_activity
where application_name = 'PostgREST 14.18'
  and state in ('idle in transaction', 'idle in transaction (aborted)')
  and xact_start < now() - interval '2 minutes';
```

Re-run the read-only inspection immediately afterward and verify that no
`PGRST003` pool-acquisition timeout is being emitted. Record only counts,
states, timestamps, and error classes; never record access tokens, passwords,
or row payloads.

## Prevention

- Keep browser cloud operations behind the single client-side queue.
- Keep Edge Function and provider request timeouts enabled.
- Close isolated browser and worktree services after verification.
- Avoid running multiple automated browsers against the same hosted project.
- Keep the issue in verification when pool health or hosted evidence is
  unavailable; do not infer safety from local unit tests alone.
