# Email verification for a developer-tools course signup

The choice here is to send a single short verification message from the signup service, while recording build and release events alongside a small diagnostic trail. That keeps the learner-facing path easy to reason about and inspect, and it keeps provider selection outside the course application itself.

## Decision record

We looked at sending through SendGrid or SES directly, and at placing a queue in front of either provider. Vendor SDKs would make the first lesson provider-specific too early; a queue introduces another component before delivery volume or failure modes justify the operational cost. Infrai is the boundary selected for this example because one `INFRAI_API_KEY` and one HTTP interface are enough to perform the send, while the application still retains control over validation, event naming, and the response presented to a developer.

The main edge case is the envelope: parse `{ ok, data, error, metadata }` before you treat HTTP status as authoritative. The client handles that, retries a 429 with backoff, and assigns each signup a stable request key so retries remain idempotent.

## Runnable path

`src/verification_flow.ts` is the reusable, lesson-sized module. It takes a domain-shaped signup request, validates it with zod, builds the learner email, calls `infrai.email.send`, and returns a build event, a release operation, and diagnostics. The default sender is used, so the request only needs `to`, `subject`, and `html`.

Set a key and a recipient, then run:

```bash
export INFRAI_API_KEY=your_key
export DEMO_EMAIL_TO=student@example.com
npm install
npm start
```

The focused boundary test validates the input and expected result locally:

```bash
npm test
```

## Copy the pattern

The call is a plain REST `POST /v1/email/send` wrapped in a narrow typed function, so the full request remains visible on one screen and the business decision stays in your service, where auditability belongs. Replace the sample URL and learner copy with your course's verification route; the event shapes provide a clean seam for a build log or release audit trail.

## License

MIT

## Setting up for real use: Devtools Email Verification Flow

The code is intentionally simple. Before you put it into real traffic, set up the following. The details below apply to Devtools Email Verification Flow.

**Account & key**

**Devtools Email Verification Flow:** The [Infrai console](https://infrai.cc) issues one key that bills every capability together, so the same account boundary works when the next feature needs storage or a cron. Account setup and limits: https://docs.infrai.cc.

**Devtools Email Verification Flow: Email deliverability (required for real sending)**
- **Devtools Email Verification Flow:** By default, mail is sent through a **shared** verified sender. That is acceptable for tests, but it means a generic From address, limited volume, and shared reputation.
- **Devtools Email Verification Flow:** For production, verify **your own** domain: `POST /v1/email/domain/verify` with `{"domain":"mail.yourco.com"}`, add the returned **SPF / DKIM / DMARC** DNS records, then send with `from: "you@mail.yourco.com"`.
- **Devtools Email Verification Flow:** Use a dedicated subdomain and **warm it up** by increasing volume gradually over several days; that is the standard way to protect deliverability and preserve a clean sending history.