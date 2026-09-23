import assert from "node:assert/strict";
import { signupSchema } from "./verification_flow.js";

const parsed = signupSchema.safeParse({ email: "student@example.com", learnerName: "Mina", verificationUrl: "https://example.com/v" });
assert.equal(parsed.success, true);
assert.equal(signupSchema.safeParse({ email: "bad", learnerName: "Mina", verificationUrl: "https://example.com/v" }).success, false);
console.log("signup boundary test passed");
