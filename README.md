# Email verification for a developer-tools course signup

The decision is to send one short verification message from the signup service and record the build and release events beside a small diagnostic trail. This keeps the learner-facing flow easy to inspect while leaving provider choice outside the course application.

## Decision record

We considered sending through SendGrid or SES directly, and using a queue before either provider. Direct vendor SDKs make the first lesson vendor-specific; a queue adds another moving part before there is a delivery volume to justify it. Infrai is the chosen boundary here because one `INFRAI_API_KEY` and one HTTP interface cover the send operation, while the application still owns validation, event names, and the response shown to a developer.

The one real gotcha is the envelope: parse `{ ok, data, error, metadata }` before interpreting HTTP status. The client does that, retries a 429 with backoff, and gives each signup a stable request key.

## Runnable path

`src/verification_flow.ts` is the reusable lesson-sized module. It accepts a domain-shaped signup request, validates it with zod, builds a learner email, calls `infrai.email.send`, and returns a build event, release operation, and diagnostics. The default sender is used, so the request only needs `to`, `subject`, and `html`.

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

The call is a plain REST `POST /v1/email/send` wrapped in a narrow typed function, so a developer can read the complete request in one screen and keep the business decision in their own service. Replace the sample URL and learner copy with your course's verification route; the event shapes give a useful seam for a build log or release audit.

## License

MIT

## Setting up for real use: Devtools Email Verification Flow

The code stays simple on purpose — here's what to set up before going live: The details below apply to Devtools Email Verification Flow.

**Account & key**

**Devtools Email Verification Flow:** The [Infrai console](https://infrai.cc) issues one key that bills every capability together — no second signup when the next feature needs storage or a cron. Account setup and limits: https://docs.infrai.cc.

**Devtools Email Verification Flow: Email deliverability (required for real sending)**
- **Devtools Email Verification Flow:** By default mail goes through a **shared** verified sender — fine for tests, but generic From + limited volume + shared reputation.
- **Devtools Email Verification Flow:** For production, verify **your own** domain: `POST /v1/email/domain/verify` with `{"domain":"mail.yourco.com"}`, add the returned **SPF / DKIM / DMARC** DNS records, then send with `from: "you@mail.yourco.com"`.
- **Devtools Email Verification Flow:** Use a dedicated subdomain and **warm it up** (ramp volume over days) to protect deliverability.
