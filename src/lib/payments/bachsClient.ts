import crypto from "node:crypto";
import { ApiError } from "@/lib/errors";

export interface CreateCheckoutParams {
  amount: number;
  currency: string;
  reference: string;
  successUrl: string;
  cancelUrl: string;
  customerEmail: string;
  customerName: string;
  metadata?: Record<string, string>;
}

export interface CreateCheckoutResult {
  checkoutUrl: string;
  checkoutId: string;
  expiresAt: Date;
}

export interface BachsCollectionEvent {
  type: "collection.succeeded" | "collection.failed" | "collection.underpaid";
  checkoutId: string;
  amount: string;
  currency: string;
}

const REPLAY_TOLERANCE_SECONDS = 300;

function getConfig() {
  const apiKey = process.env.BACHS_API_KEY;
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

  const response = await fetch(`${baseUrl}/v1/checkout-sessions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      pricing: { currency: params.currency, amount: params.amount.toFixed(2) },
      customer: { email: params.customerEmail, name: params.customerName },
      success_url: params.successUrl,
      cancel_url: params.cancelUrl,
      reference: params.reference,
      metadata: params.metadata,
    }),
  });

  if (!response.ok) {
    // Bachs error shape: { detail, error_code, doc_url, errors? } — see
    // https://docs.bachs.io/errors. Surface `detail`/`error_code` instead of
    // discarding them, so a real Bachs-side rejection (e.g. an unfunded
    // balance currency, a validation error) doesn't collapse into an opaque
    // 500 with no way to diagnose it from the server logs or the client.
    const errorBody = (await response.json().catch(() => null)) as
      | { detail?: string; error_code?: string }
      | null;
    console.error("Bachs checkout creation failed", {
      status: response.status,
      errorCode: errorBody?.error_code,
      detail: errorBody?.detail,
    });
    throw new ApiError(
      502,
      "We couldn't start your payment right now. Please try again shortly.",
      { bachsErrorCode: errorBody?.error_code, bachsDetail: errorBody?.detail }
    );
  }

  const data = (await response.json()) as { checkout_id: string; checkout_url: string; expires_at: string };
  return { checkoutUrl: data.checkout_url, checkoutId: data.checkout_id, expiresAt: new Date(data.expires_at) };
}

export function verifyWebhookSignature(
  rawBody: string,
  timestampHeader: string | null,
  signatureHeader: string | null
): boolean {
  if (!timestampHeader || !signatureHeader) return false;

  const timestamp = Number(timestampHeader);
  if (!Number.isFinite(timestamp)) return false;
  if (Math.abs(Date.now() / 1000 - timestamp) > REPLAY_TOLERANCE_SECONDS) return false;

  const { webhookSecret } = getConfig();
  const message = `${timestampHeader}.${rawBody}`;
  const expected = crypto.createHmac("sha256", webhookSecret).update(message).digest("hex");

  const expectedBuf = Buffer.from(expected, "hex");
  const providedBuf = Buffer.from(signatureHeader, "hex");
  if (expectedBuf.length !== providedBuf.length) return false;
  return crypto.timingSafeEqual(expectedBuf, providedBuf);
}

interface RawBachsWebhookEnvelope {
  id: string;
  type: string;
  created_at: string;
  organization_id: string;
  data: {
    charge_id?: string;
    checkout_id: string;
    status: string;
    amount: string;
    currency: string;
  };
}

const HANDLED_EVENT_TYPES = ["collection.succeeded", "collection.failed", "collection.underpaid"] as const;

export function parseWebhookPayload(rawBody: string): BachsCollectionEvent | null {
  const envelope = JSON.parse(rawBody) as RawBachsWebhookEnvelope;
  if (!HANDLED_EVENT_TYPES.includes(envelope.type as BachsCollectionEvent["type"])) {
    return null;
  }
  return {
    type: envelope.type as BachsCollectionEvent["type"],
    checkoutId: envelope.data.checkout_id,
    amount: envelope.data.amount,
    currency: envelope.data.currency,
  };
}
