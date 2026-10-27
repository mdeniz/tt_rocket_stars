# Trusted Cloud Chrome DevTools Verification

## Scope

The hosted development artifact was verified at:

```text
https://mdeniz.github.io/tt_rocket_stars/index_next.html?verify=issue-209
```

The stable `index.html` artifact was not changed or promoted.

Chrome DevTools MCP was used against an authenticated browser context and an
isolated signed-out browser context. No access tokens, passwords, cookies, or
administrative credentials were recorded.

## Authenticated synchronization

- Opened the hosted development artifact with the existing authenticated
  session.
- Navigated to Settings and used the cloud pilot discovery action.
- The UI displayed the authenticated cloud access state and account-owned pilot
  rows.
- Network evidence included `GET /auth/v1/user` with HTTP 200 and two
  `POST /functions/v1/trusted-cloud` responses with HTTP 200.
- The trusted function was deployed as version 10 with platform JWT validation
  enabled (`verify_jwt = true`).
- No application console errors or warnings were reported during the check.

This verifies the hosted authenticated transport path. Two-account ownership,
conflict, retry, and deletion checks remain incomplete and are tracked as
OpenSpec task 3.2.

## Signed-out behavior

The signed-out check used an isolated browser context at:

```text
https://mdeniz.github.io/tt_rocket_stars/index_next.html?verify=issue-209-signed-out
```

Observed results:

- Mission Control rendered with local pilot controls.
- The only network requests were the HTML document and its embedded image
  resource.
- No Supabase Auth, Edge Function, REST, RPC, or other cloud request occurred.
- No console errors or warnings were reported.

## Offline continuation

The same isolated context was switched to Chrome DevTools `Offline` network
conditions. The following local interactions completed successfully:

- Clicked `Start TT Rocket Stars`.
- Opened `New Mission`.
- Closed the first-run tour with `Skip tour`.
- Mission Control remained rendered and usable.

No additional network request occurred while offline and no console errors or
warnings were reported. This confirms that local gameplay remains available
without a cloud session or network connection.

## Limitations

- This is empirical Chrome DevTools evidence, not real iPhone/iPad Safari
  validation.
- The authenticated context contained one active account. The second-account
  ownership and deletion matrix remains a required provider verification under
  OpenSpec task 3.2.
