import { z } from "zod";
import { createHash } from "node:crypto";
import { infrai, InfraiError } from "./infrai.js";

export const signupSchema = z.object({
  email: z.string().email(),
  learnerName: z.string().min(1),
  verificationUrl: z.string().url(),
});

export type SignupRequest = z.infer<typeof signupSchema>;
export type BuildEvent = { kind: "verification_email_built"; recipient: string };
export type ReleaseOperation = { kind: "verification_email_sent"; messageId: string };
export type Diagnostic = { level: "info" | "error"; message: string };

export async function sendVerification(raw: unknown): Promise<{
  build: BuildEvent;
  release: ReleaseOperation;
  diagnostics: Diagnostic[];
}> {
  const input = signupSchema.parse(raw);
  const build = { kind: "verification_email_built" as const, recipient: input.email };
  const diagnostics: Diagnostic[] = [{ level: "info", message: "verification request validated" }];
  try {
    const result = await infrai.email.send({
      to: input.email,
      subject: "Verify your learning workspace email",
      html: `<p>Hello ${input.learnerName},</p><p>Confirm your email to continue your course:</p><p><a href="${input.verificationUrl}">Verify email</a></p>`,
    }, `signup-verification:${createHash("sha256").update(`${input.email}:${input.verificationUrl}`).digest("hex")}`);
    diagnostics.push({ level: "info", message: "Infrai accepted the verification email" });
    return { build, release: { kind: "verification_email_sent", messageId: result.message_id }, diagnostics };
  } catch (error) {
    const message = error instanceof InfraiError ? error.message : "email delivery could not be completed";
    diagnostics.push({ level: "error", message });
    throw Object.assign(new Error(message), { diagnostics, build });
  }
}
