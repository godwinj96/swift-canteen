import crypto from "node:crypto";

export interface CreateCheckoutParams {
  amount: number;
  reference: string;
  callbackUrl: string;
  customerEmail: string;
}

export interface CreateCheckoutResult {
  checkoutUrl: string;
  providerRef: string;
}

export interface BachsWebhookPayload {
  reference: string;
  status: "PENDING" | "SUCCESSFUL" | "FAILED";
  paidAt?: string;
}

function getConfig() {
  const apiKey = process.env.BACHS_SECRET_KEY;
  const baseUrl = process.env.BACHS_BASE_URL ?? "https://api.bachs.io";
  const webhookSecret = process.env.BACHS_WEBHOOK_SECRET;
  if (!apiKey || !webhookSecret) {
    throw new Error("Bachs API credentials are not configured");
  }
  return { apiKey, baseUrl, webhookSecret };
}

export async function createHostedCheckout(
  params: CreateCheckoutParams
): Promise<CreateCheckoutResult> {
  const { apiKey, baseUrl } = getConfig();

  const response = await fetch(`${baseUrl}/v1/checkout`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      amount: params.amount,
      reference: params.reference,
      callback_url: params.callbackUrl,
      customer_email: params.customerEmail,
    }),
  });

  if (!response.ok) {
    throw new Error(`Bachs checkout creation failed: ${response.status}`);
  }

  const data = (await response.json()) as { checkout_url: string; id: string };
  return { checkoutUrl: data.checkout_url, providerRef: data.id };
}

export function verifyWebhookSignature(rawBody: string, signatureHeader: string | null): boolean {
  if (!signatureHeader) return false;
  const { webhookSecret } = getConfig();
  const expected = crypto
    .createHmac("sha256", webhookSecret)
    .update(rawBody)
    .digest("hex");
  const expectedBuf = Buffer.from(expected, "hex");
  const providedBuf = Buffer.from(signatureHeader, "hex");
  if (expectedBuf.length !== providedBuf.length) return false;
  return crypto.timingSafeEqual(expectedBuf, providedBuf);
}

export function parseWebhookPayload(rawBody: string): BachsWebhookPayload {
  return JSON.parse(rawBody) as BachsWebhookPayload;
}
