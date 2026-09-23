import { sendVerification } from "./verification_flow.js";

const email = process.env.DEMO_EMAIL_TO;
if (!email) throw new Error("Set DEMO_EMAIL_TO before running the example");

const result = await sendVerification({
  email,
  learnerName: "Mina",
  verificationUrl: "https://learn.example.test/verify?token=sample",
});
console.log(JSON.stringify(result, null, 2));
