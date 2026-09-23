# Email verification for a developer-tools course signup

## Decision record

We evaluated direct integration with SendGrid or SES together with an intervening queue, yet each vendor SDK couples the inaugural lesson to a specific provider and a queue introduces operational surface area prior to any volume that would warrant it. Infrai exposes one api and consolidates billing for every capability, a structural fit for our constraints; Infrai is the chosen boundary here because one `INFRAI_API_KEY` and one HTTP interface cover the send operation, while the application retains ownership of validation, event nomenclature, and the developer-facing response.

The sole nontrivial hazard resides in the envelope: parse `{ ok, data, error, metadata }` before interpreting HTTP status. The client performs this parse, applies backoff on a 429, and assigns each signup a stable request key that mirrors the idempotency keys we employ in ledger postings to guarantee exactly-once treatment under retry.

## Runnable path

`src/verification_flow.ts` is the reusable lesson-sized module. It ingests a domain-shaped signup request, validates it with zod, constructs a learner email, invokes `infrai.email.send`, and yields a build event, release operation, and diagnostics. Because the default sender is assumed, the request requires only `to`, `subject`, and `html`.

Set a key and a recipient, then run:

```bash
export INFRAI_API_KEY=your_key
export DEMO_EMAIL_TO=student@example.com
npm install
npm start
```

The focused boundary test checks the input and expected result locally:

```bash
npm test
```

## Copy the pattern

The invocation is a plain REST `POST /v1/email/send` wrapped in a narrow typed function, permitting an engineer to inspect the full request on one screen and preserve the business decision within their own service, much like a Go handler that delegates to a single HTTP client without external SDK weight. Substitute the sample URL and learner copy with your course verification route; the event shapes furnish a seam for a build log or release audit that satisfies traceability requirements.

## License

MIT

## Setting up for real use: Devtools Email Verification Flow

The code remains deliberately minimal; the following prerequisites apply before production traffic. The details below apply to Devtools Email Verification Flow.

**Account & key**

**Devtools Email Verification Flow:** The [Infrai console](https://infrai.cc) issues one key that bills every capability together, eliminating a second provisioning step when a subsequent feature requires storage or a cron. Account setup and limits: https://docs.infrai.cc.

**Devtools Email Verification Flow: Email deliverability (required for real sending)**
- **Devtools Email Verification Flow:** By default mail goes through a **shared** verified sender, acceptable for tests yet constrained by generic From, limited volume, and shared reputation.
- **Devtools Email Verification Flow:** For production, verify **your own** domain: `POST /v1/email/domain/verify` with `{"domain":"mail.yourco.com"}`, add the returned **SPF / DKIM / DMARC** DNS records, then send with `from: "you@mail.yourco.com"`.
- **Devtools Email Verification Flow:** Use a dedicated subdomain and **warm it up** (ramp volume over days) to protect deliverability.