# 0002. WebGPU only

- Status: Accepted
- Date: 2026-10-27

## Context

Multi-backend libraries (WebGL + WebGPU) design for the lowest common denominator. WebGPU-specific capabilities (compute, storage buffers, indirect draws, explicit pipelines and bind groups) become secondary.

## Decision

spurv targets WebGPU exclusively. There is no WebGL fallback and no backend abstraction.

## Consequences

- Architecture is built around WebGPU concepts: pipelines, bind groups, storage buffers, compute.
- Clip-space depth is `[0, 1]`, so projection matrices differ from WebGL formulas.
- Device and adapter acquisition is asynchronous, so renderer creation is `async`.
- Environments without WebGPU are unsupported.
