# Companion Tiles

Live Companion image buttons for **Open Stage Control**, with an independent Node.js bridge. Each tile combines Companion's actual button image and a full-image push/release target. Move or resize the parent tile to keep both aligned.

Experimental 0.1.0. No mixer, ATEM or video transport is included. No runtime npm dependencies. A simulator is the default; starting the shipped example cannot control equipment.

## Requirements and compatibility

- Node.js 22 or newer for the bridge.
- Open Stage Control 1.31.1, installed separately: https://openstagecontrol.ammd.net/
- For live use: Companion's HTTP location down/up endpoints and `preview.graphics.location` tRPC WebSocket subscription. The originating integration was tested against Companion **5.0.1** (Satellite API banner 1.12.0); this bridge does not use Satellite.

The graphics subscription is an internal Companion interface, not a promise of compatibility with every Companion version. Unsupported subscription errors disable input. The extracted package is tested with mocks and a standalone simulator; see the changelog for live verification scope. Safari/macOS was checked; the original tile was tested in the parent workspace. Broader device and long-duration network-loss testing remains welcome.

## Hardware-free quick start

Download the release package and extract it, or clone this repository. From its directory:

```sh
npm start
```

In a separate Open Stage Control process, load `examples/session.json`, use `examples/open-stage-control.js` as the custom module, and configure server port `16652`, OSC port `16654`, **send** `127.0.0.1:16654`. That send address is a local dummy target: it ensures native input passes through the module, which consumes all output.

Equivalent CLI (replace executable and paths):

```sh
open-stage-control --no-gui --port 16652 --osc-port 16654 \
  --send 127.0.0.1:16654 \
  --load /absolute/path/companion-tiles/examples/session.json \
  --custom-module /absolute/path/companion-tiles/examples/open-stage-control.js
```

Open the displayed Open Stage Control URL. Clicking a synthetic tile turns it green. It latches the simulated selection; releasing ends the hold. The generated images are synthetic patterns, not screenshots of user equipment.

## Configure live buttons

Copy `examples/config.json` to `local-config.json` (ignored by Git), set `mode` to `live`, add `companionUrl` with your Companion HTTP origin, and configure explicit button locations:

```json
{
  "mode": "live",
  "companionUrl": "http://COMPANION_HOST:8000",
  "port": 16650,
  "buttons": [
    {"id": "preview", "label": "Preview", "location": "1/0/0"}
  ]
}
```

`COMPANION_HOST` is a placeholder; replace it. Use the actual page/row/column coordinates accepted by your Companion HTTP API (page is 1-based; row/column may be zero). Do not assume UI position labels match API coordinates: verify on a harmless test button first.

Build a matching session and start the live bridge:

```sh
node scripts/build-example.mjs --config local-config.json --output local-session.json
node src/server.mjs --config local-config.json
```

Load `local-session.json` in Open Stage Control. If changing the bridge port, pass its URL as the custom module's first argument:

```sh
open-stage-control --no-gui --port 16652 --osc-port 16654 \
  --send 127.0.0.1:16654 --load /absolute/path/local-session.json \
  --custom-module /absolute/path/examples/open-stage-control.js http://127.0.0.1:YOUR_PORT
```

The bridge HTTP API binds only to `127.0.0.1`. Phones/tablets connect to Open Stage Control, whose server calls the local bridge. No public exposure or router forwarding is required. Use a trusted LAN for Open Stage Control; this toolkit adds no user authentication.

## Reuse the tile factory

```js
import {companionTile} from './src/widgets.mjs';
const widget = companionTile({
  id: 'preview', label: 'Preview', width: 160, height: 160,
  namespace: '/companion-tiles/preview'
});
```

Insert the returned panel into your layout's `widgets` array. Give every instance a unique ID. Match its namespace to the corresponding button configuration. Generate a fresh instance instead of duplicating child IDs. Keep image and input layers inside the parent. The transparent input layer is a native push button, not a recreated HTML button. Appearance comes from Companion's live image; tile dimensions and surrounding layout come from Open Stage Control.

This example custom module consumes **all outgoing messages**. Use a dedicated process or deliberately compose its filter with your existing module; do not replace a production mixer module without integrating both handlers.

## Connection and release behavior

- Reconnect and resubscribe after graphics connection loss; clear stale images and disable new presses until fresh feedback exists.
- Deduplicate unchanged images. Bound stalled SSE consumers without dropping normal large snapshots.
- Serialize down/up per button, enforce one client's hold ownership, and consume duplicate downs.
- Attempt HTTP release when graphics disconnects, after a five-second hold timeout, and on graceful shutdown. Failed or uncertain HTTP writes retain the hold for retry.

These releases are best effort. Network failure, power loss or a killed process can prevent an up event; the bridge does not provide durable crash recovery. Do not use it as a safety interlock. Two configured IDs cannot alias the same physical button. Ownership applies within this bridge; it does not coordinate with other Companion surfaces.

## Development and license

```sh
npm run check
npm pack --dry-run
```

Source lives in `src/`; regenerate and commit `examples/session.json` after factory changes. CI checks Node 22 and 24 and generated-file consistency. GPL-3.0-or-later; see LICENSE and NOTICE. Independent project, not affiliated with Bitfocus or Open Stage Control. No Companion source or live imagery is bundled. No npm registry publication is required; release archives are ready to extract.
