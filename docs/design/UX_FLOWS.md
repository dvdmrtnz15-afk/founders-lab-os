# UX Flows

## Governed Build Flow

```txt
Open cockpit
  -> attach context
  -> generate plan
  -> approve plan
  -> run implementation
  -> preview
  -> run checks
  -> prepare PR
  -> review and release
```

## Mobile QA Flow

```txt
pnpm dev:phone
  -> open LAN URL on iPhone
  -> verify layout and core interactions
  -> capture issue evidence
  -> fix before release handoff
```
