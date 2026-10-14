# Bindings

Configuration requires `mode` (`simulator`/`live`), 1–128 buttons and optional bridge `port` (default 16650). Live mode requires an HTTP(S) `companionUrl` origin without credentials, path or query. Each button has a unique safe `id`, unique physical `location` (`page/row/column`), optional `label`, and unique `namespace` (default `/companion-tiles/<id>`). Tile factory namespace must match configuration. Credentials are not supported by this release.

## Native messages

| Address | Direction | Value |
| --- | --- | --- |
| `<namespace>/image` | Bridge → widget | PNG data URI, or empty string when unavailable |
| `<namespace>/enabled` | Bridge → widget | 0 or 1 |
| `<namespace>/press` | Widget → bridge | 1 down / 0 up |
| `/companion-tiles/status` | Bridge → text | Status string |

Unique child IDs isolate tiles. State is shared across browsers; hold ownership uses native client IDs. Do not send live control messages to the Companion instance directly from widget scripts; route them through the bridge.

## Local HTTP API

- `GET /api/state`: `{mode, connected, error, buttons:[{id, location, namespace, label, image, enabled}]}`.
- `GET /events?client=<safe-client-id>`: SSE `state` events containing that snapshot, plus comment heartbeats. Disconnecting a direct HTTP client's final stream attempts release of holds with the same client ID.
- `POST /api/command`, JSON body `{id, pressed:<boolean>, client:<safe-client-id>}`. Only configured IDs are accepted. The bridge owns the location mapping; callers cannot supply arbitrary Companion URLs or locations. Cross-origin browser commands are rejected.

The Open Stage Control adapter has one feedback stream for all clients and separate per-client input IDs. It therefore relies on the hold timeout for browser disappearance rather than treating the shared feedback stream as one browser's lifecycle. Large connection-loss tests and transport timeout tuning should be verified for your network.

## Companion transport

WebSocket `/trpc`, method `subscription`, path `preview.graphics.location`, input `{location:{pageNumber,row,column}}`. PNG images are read from result data. Literal `PING` gets `PONG`. Disconnect triggers resubscription, not replay of button downs. HTTP POST `/api/location/<page>/<row>/<column>/down` and `/up` sends input. A graphics connection does not prove an HTTP input endpoint is operational; command failures are reported independently.
