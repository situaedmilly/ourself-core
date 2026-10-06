# OURSELFECOSYSTEM — GitHub WebSelfHook Endpoint

Status: REALIZED (bounded GitHub Actions egress)

## Canonical route

GitHub Actions
→ POST
→ Bubble terminal_dispatch
→ OURSELF transmission / ingestion boundary

Endpoint:

https://ureel---freed-self-realit.bubbleapps.io/version-test/api/1.1/wf/terminal_dispatch

## Envelope

```json
{
  "request_id": "<github.run_id>-<github.run_attempt>",
  "source": "github",
  "intent": "<workflow input>",
  "payload_json": "<JSON string>"
}
```

## Current semantics

- GitHub is the event/transport origin.
- Bubble terminal_dispatch is the currently confirmed receiving endpoint.
- This implementation is manually invoked with `workflow_dispatch`.
- It is intentionally bounded; it does not create autonomous execution on every repository event.
- A successful HTTP response proves transport response only. It does not prove OURSELF authority, Bubble actuation, state mutation, or causal execution.

## Native GitHub webhook status

NOT REALIZED THROUGH THE CONNECTED GITHUB CONTROL SURFACE.

The available GitHub connector exposes repository/content/Actions operations but no repository webhook CRUD operation. Therefore this file must not be interpreted as proof that a native GitHub repository webhook has been configured.

## Next gate

If native GitHub webhook semantics are required, configure a repository webhook whose destination is an independently verified OURSELF public ingress. Until that ingress exists, the canonical realized route remains:

GitHub Actions → Bubble terminal_dispatch.
