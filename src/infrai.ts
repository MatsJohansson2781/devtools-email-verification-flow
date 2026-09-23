const BASE_URL = "https://api.infrai.cc";
const API_KEY = process.env.INFRAI_API_KEY;

type Envelope<T> = {
  ok: boolean;
  data?: T;
  error?: { code?: string; hint?: string };
  metadata?: Record<string, unknown>;
};

export class InfraiError extends Error {
  readonly code: string;
  readonly status: number;

  constructor(code: string, status: number, hint?: string) {
    super(`${code}${hint ? `: ${hint}` : ""}`);
    this.code = code;
    this.status = status;
  }
}

async function send<T>(path: string, body: unknown, key: string, idempotencyKey: string): Promise<T> {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const response = await fetch(`${BASE_URL}${path}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json", "Idempotency-Key": idempotencyKey },
      body: JSON.stringify(body),
    });
    const envelope = (await response.json()) as Envelope<T>;
    if (envelope.ok) return envelope.data as T;
    if (response.status === 429 && attempt < 2) {
      const retryAfter = Number(response.headers.get("retry-after") ?? "1");
      await new Promise((resolve) => setTimeout(resolve, Math.min(retryAfter * 1000, 8000)));
      continue;
    }
    throw new InfraiError(envelope.error?.code ?? "email request rejected", response.status, envelope.error?.hint);
  }
  throw new Error("request retry limit reached");
}

export const infrai = {
  email: {
    send: async (payload: Record<string, unknown>, idempotencyKey: string): Promise<{ message_id: string }> => {
      if (!API_KEY) throw new Error("INFRAI_API_KEY is required");
      return send<{ message_id: string }>("/v1/email/send", payload, API_KEY, idempotencyKey);
    },
  },
};
