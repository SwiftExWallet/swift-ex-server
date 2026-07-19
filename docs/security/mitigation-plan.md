# SwiftEX Server Security Mitigation Plan

Date: 2026-07-19

Scope: remediation plan for the issues documented in `docs/security/threat-model.md`, `docs/security/architecture.md`, and `docs/security/data-flow.md`.

Priority definitions:

| Priority | Meaning |
|---|---|
| P0 | Critical exposure or architecture control that should be fixed before further production expansion. |
| P1 | High-impact remediation that should follow immediately after P0 controls. |
| P2 | Hardening, monitoring, and maintainability work that reduces residual risk. |

## Executive Mitigation Roadmap

| Phase | Target outcome | Primary work |
|---|---|---|
| Phase 1: Identity and secrets | Stop token forgery and credential exposure paths. | Verify JWTs, rotate Firebase key, remove secret files, redact OTP/provider logs. |
| Phase 2: Webhooks and abuse controls | Prevent forged provider events and uncontrolled resource consumption. | Verify Banxa/MoonPay webhooks, add rate limits, body limits, timeouts, OTP attempt controls. |
| Phase 3: Financial authorization | Make wallet, activation, and provider signing flows actor-bound and auditable. | Require verified user where needed, validate ownership, persist order/activation state, enforce business policies. |
| Phase 4: Platform hardening | Improve deployment, observability, and data minimization. | CORS/proxy controls, structured audit logs, response DTOs, CI secret scanning, IAM/SSM least privilege. |

## P0 Remediations

| ID | Mitigation | Concrete implementation | Acceptance criteria |
|---|---|---|---|
| P0-01 | Verify user JWTs in middleware/guards | Replace `jwtService.decode(...)` in `AuthTokenMiddleware` with `verifyAsync`; require strict `Authorization: Bearer <token>` format; validate expiry, issuer, audience if configured. | Forged, expired, unsigned, malformed, and wrong-audience user tokens are rejected by tests. |
| P0-02 | Verify device JWTs in middleware/guards | Replace `jwtService.decode(...)` in `DeviceAuthTokenMiddleware` with `verifyAsync`; include token purpose/type in payload; reject expired or malformed device tokens. | Forged and expired device tokens cannot access any device-authenticated route. |
| P0-03 | Rotate and externalize Firebase credential | Revoke the tracked Firebase Admin SDK JSON key; remove the JSON file from the source tree and git history; load Firebase credentials from secret manager or workload identity. | No Firebase service-account JSON exists in repo/history; app boots using external secret; old key is disabled in Firebase/GCP. |
| P0-04 | Stop logging OTPs and sensitive payloads | Remove `console.log(JSON.stringify(message))` from mail service; redact OTP, tokens, wallet addresses, FCM tokens, signed URLs, provider request/response bodies. | Unit/integration tests or logger snapshot checks show OTP and token fields are redacted. |
| P0-05 | Verify Banxa webhook authenticity | Add provider-supported signature verification or strict source allowlist; capture raw body; validate timestamp; store event hash and verification result. | Unsigned, replayed, stale, and tampered Banxa webhooks return non-2xx and do not trigger notifications. |
| P0-06 | Use MoonPay webhook verifier | Configure raw body access; call `MoonPayService.parseWebhook` from `MoonPayController.handleWebhook`; reject invalid `moonpay-signature-v2`; persist valid events. | Invalid MoonPay signatures are rejected; valid events are parsed once and recorded idempotently. |
| P0-07 | Add global abuse controls | Add request body size limits, Nest throttling or API gateway limits, per-route limits for OTP/device/webhook/provider routes, and outbound HTTP timeouts. | Load tests show requests are bounded; provider calls time out; OTP and quote endpoints cannot be spammed from one actor. |
| P0-08 | Require strong auth for financial actions | Require verified user auth for wallet assignment, wallet activation, provider order/link creation, and any route that signs provider/blockchain artifacts unless product explicitly documents anonymous support. | Authorization matrix tests prove unauthenticated or device-only callers cannot create orders/links or activate wallets. |
| P0-09 | Enforce wallet/provider ownership policy | Do not accept arbitrary `userId` in wallet creation; derive actor from verified session; verify destination wallet belongs to current user/device before signing links/orders. | Attempts to create/modify/order for another user's wallet fail with 403. |
| P0-10 | Add OTP brute-force protection | Hash OTPs, bind OTP purpose, invalidate after use, track attempts, rate-limit send/verify/reset per email/device/IP. | More than the allowed failed OTP attempts locks or delays verification; OTP database never stores plaintext OTP values. |

## P1 Remediations

| ID | Mitigation | Concrete implementation | Acceptance criteria |
|---|---|---|---|
| P1-01 | Centralize route authorization | Replace middleware exclusion lists with Nest guards and route metadata for public/device/user/financial scopes. | Route inventory is generated from metadata; tests cover every controller route and required auth level. |
| P1-02 | Add DTOs and strict validation everywhere | Add DTOs for all bodies/query/params/webhooks; enable `forbidNonWhitelisted: true` and `transform`; validate chain-specific wallet addresses and provider fields. | Unknown fields fail validation; bad params/query values return 400 before service logic. |
| P1-03 | Add response DTOs/data minimization | Return explicit user/device/wallet/provider response shapes; omit password hashes, OTPs, FCM tokens, MAC addresses, internal errors, and raw provider payloads. | API responses contain only approved fields in snapshot/contract tests. |
| P1-04 | Persist provider order intent | Create an order-intent collection with user ID, device ID, provider, amount, currency, wallet, request hash, idempotency key, status, and provider IDs. | Every generated Alchemy/Banxa/MoonPay link/order has a durable local record before response. |
| P1-05 | Persist webhook events and state transitions | Store provider event ID, payload hash, signature result, linked order, previous/new status, notification outcome, and replay decision. | Duplicate webhook delivery is idempotent; invalid state transitions are rejected or quarantined. |
| P1-06 | Add wallet activation state machine | Record activation intent before Stellar XDR generation; enforce one active activation per user/device/address; track signed/submitted/confirmed/failed states. | Repeated activation requests return existing state or fail safely without generating unlimited signed XDRs. |
| P1-07 | Validate provider business rules | Enforce allowlisted currencies/networks/payment methods, min/max amounts, jurisdiction availability, wallet ownership, and risk checks before provider calls. | Invalid or unsupported order/link parameters fail locally before provider credentials are used. |
| P1-08 | Restrict CORS | Replace `origin: '*'` with approved app/web origins from config; define whether credentials are allowed; add environment-specific validation. | Requests from unknown browser origins are rejected; allowed origins are documented and tested. |
| P1-09 | Configure trusted proxy/IP handling | Trust `x-forwarded-for` only from known load balancers/API gateways; otherwise use socket IP; enforce geo restrictions server-side for sensitive routes. | Spoofed forwarded headers from direct clients cannot alter country decisions. |
| P1-10 | Add structured audit logging | Emit request ID, route, actor IDs, auth decision, provider order ID, webhook event ID, outcome, and redacted metadata to durable storage/log pipeline. | Security events can be traced end-to-end without exposing OTPs/tokens/secrets. |
| P1-11 | Add outbound provider resilience | Add timeouts, retry with backoff, circuit breakers, bounded queues, and per-actor provider quotas for Axios/fetch calls. | Slow providers do not exhaust API workers; queue length and timeout metrics are visible. |
| P1-12 | Fix route drift and known bugs | Remove stale middleware exclusions, fix duplicate `PUT /api/v1/users` handlers, fix `req.CurrentUser` vs `req.currentUser`, align README route inventory. | Route tests pass and documentation matches controllers. |

## P2 Remediations

| ID | Mitigation | Concrete implementation | Acceptance criteria |
|---|---|---|---|
| P2-01 | Add CI secret scanning | Add secret scanning for Firebase keys, private keys, API keys, `.env`, and provider secrets in pull requests. | PRs fail when credential patterns are introduced. |
| P2-02 | Add config schema validation | Validate required env vars at startup with type checks and safe defaults; fail with clear missing-config errors. | App refuses invalid config and health/readiness surfaces reason without secrets. |
| P2-03 | Limit SSM parameter import | Replace broad prefix import with an allowlist of required parameter names; alert on changes to security-critical parameters. | Runtime can only read expected parameters for its environment/component. |
| P2-04 | Harden GitHub OIDC/IAM | Restrict trust policy to exact repo, branch/environment, and workflow; separate build and deploy permissions; require protected environments. | IAM policy review shows least privilege for ECR push and ECS update only. |
| P2-05 | Add image provenance and dependency checks | Generate SBOM, sign images, scan dependencies and Docker image in CI. | Deployments reference signed image digest and scan results. |
| P2-06 | Add market ingestion audit | Store ingestion run records with provider URL, status, response hash, item count, latency, and previous known-good marker. | Market data failures and anomalous updates are visible and reversible. |
| P2-07 | Add operational alerts | Alert on auth failures, OTP abuse, webhook verification failures, provider error/timeout spikes, Stellar source balance, and order signing volume. | Alerts trigger during simulated abuse/error scenarios. |
| P2-08 | Add retention and privacy rules | Define retention for OTPs, auth events, device data, wallet mappings, provider events, and logs; hash/encrypt high-risk identifiers where practical. | Retention policy is documented and automated cleanup jobs exist where needed. |

## Suggested Implementation Sequence

1. Replace JWT decode with verify in both middleware classes and add regression tests for forged/expired tokens.
2. Rotate/remove the Firebase service-account JSON and remove OTP/provider payload logging.
3. Add rate limits and OTP attempt controls for auth/device/provider/webhook endpoints.
4. Implement MoonPay and Banxa webhook verification with raw body handling and event persistence.
5. Add route authorization tests, then require verified user auth for wallet activation and provider order/link creation.
6. Add order-intent and wallet-activation state records with idempotency keys.
7. Tighten validation, response DTOs, CORS, and trusted proxy handling.
8. Harden deployment secrets, CI scanning, audit logs, and monitoring.

## Verification Matrix

| Control | Test type | Example cases |
|---|---|---|
| JWT verification | Unit and e2e | Forged token, expired token, missing bearer prefix, deleted user/device, unverified user. |
| Auth route limits | E2E/load | Repeated login failures, OTP resend flood, OTP verify brute force, password reset flood. |
| Financial authorization | E2E | Device-only caller attempts wallet activation/order creation; user attempts another user's wallet. |
| Webhook verification | Unit/e2e | Valid signature, invalid signature, stale timestamp, replayed event ID, tampered body. |
| Validation | Unit/e2e | Extra fields, bad wallet address, unsupported chain/currency, negative/oversized amount. |
| Logging redaction | Unit/snapshot | OTP, JWT, Firebase token, provider signed URL, wallet address, email. |
| Provider resilience | Unit/integration | Timeout, retryable error, permanent error, queue saturation, circuit open. |
| Deployment controls | CI/policy review | Secret scan failure, image digest output, IAM least privilege, required environment approval. |

## Ownership Checklist

| Area | Suggested owner |
|---|---|
| JWT guards and route authorization | Backend API owner |
| OTP controls and account recovery policy | Backend API owner plus product/security |
| Wallet ownership and activation policy | Backend API owner plus blockchain/product owner |
| Provider order/webhook persistence | Backend API owner plus payments/ramp owner |
| Firebase credential rotation | Cloud/platform owner |
| SSM/IAM/GitHub Actions hardening | DevOps/platform owner |
| Logging, redaction, alerts | Backend API owner plus observability/security |

## Definition Of Done

A mitigation is complete only when all of the following are true:

- The code change is merged with unit or e2e tests that cover the abuse case.
- Existing data or credentials exposed by the previous behavior have been rotated, backfilled, or invalidated where needed.
- Logs and responses are verified not to expose new secrets or PII.
- Operational metrics or audit events exist for high-risk flows.
- The route inventory and security docs are updated to reflect the new behavior.
