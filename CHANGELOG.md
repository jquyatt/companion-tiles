# Changelog

## 0.1.0 — 2026-10-14 (experimental)

- Extract combined image/push tiles, independent Companion bridge and native adapter.
- Add configurable locations/namespaces, unique binding validation and a hardware-free simulator.
- Add reconnect/subscription handling, hold ownership, queued down/up, best-effort release and bounded feedback streaming.
- Add tests for transport failure, reconnect, ownership, duplicate input, local HTTP validation and native adapter behavior.

Verification: 13 automated tests passed. Standalone native simulator click changed synthetic image feedback. The extracted bridge also completed an authorized live preview-tile round trip against the office Companion instance; Preview was restored and Program unchanged. Both live image subscriptions remained available. This was a short test, not a long-duration network-loss soak.
