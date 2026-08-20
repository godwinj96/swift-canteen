import webpush from "web-push";
import { prisma } from "@/lib/prisma";

function getVapidDetails() {
  const publicKey = process.env.VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT;
  if (!publicKey || !privateKey || !subject) {
    throw new Error("VAPID credentials are not configured");
  }
  return { publicKey, privateKey, subject };
}

export interface PushSubscriptionInput {
  endpoint: string;
  keys: { p256dh: string; auth: string };
}

export async function saveSubscription(userId: string, subscription: PushSubscriptionInput) {
  await prisma.pushSubscription.upsert({
    where: { endpoint: subscription.endpoint },
    update: { userId, p256dh: subscription.keys.p256dh, auth: subscription.keys.auth },
    create: {
      userId,
      endpoint: subscription.endpoint,
      p256dh: subscription.keys.p256dh,
      auth: subscription.keys.auth,
    },
  });
}

export async function removeSubscription(endpoint: string) {
  await prisma.pushSubscription.deleteMany({ where: { endpoint } });
}

export interface PushPayload {
  title: string;
  body: string;
  url: string;
}

/**
 * Sends a push notification to every subscription registered for a user.
 * Self-heals on delivery: a 404/410 from the push service means the
 * subscription has expired or been revoked on the browser side, so that row
 * is deleted rather than retried forever. Never throws — a notification
 * failing to send must never break the order-status update it's attached to.
 */
export async function sendPushToUser(userId: string, payload: PushPayload): Promise<void> {
  // Everything below is best-effort. A missing VAPID config, a transient DB
  // hiccup while looking up subscriptions, or any other surprise here must
  // degrade to a silent no-op rather than propagate — this function is
  // always called from inside a core order-workflow request (accepting/
  // advancing an order), which must keep working even if the notification
  // subsystem is mid-outage or not yet configured on this deploy target.
  try {
    const vapid = getVapidDetails();
    webpush.setVapidDetails(vapid.subject, vapid.publicKey, vapid.privateKey);

    const subscriptions = await prisma.pushSubscription.findMany({ where: { userId } });
    if (subscriptions.length === 0) return;

    await Promise.all(
      subscriptions.map(async (sub) => {
        try {
          await webpush.sendNotification(
            { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
            JSON.stringify(payload)
          );
        } catch (error) {
          const statusCode = (error as { statusCode?: number }).statusCode;
          if (statusCode === 404 || statusCode === 410) {
            await removeSubscription(sub.endpoint);
          } else {
            console.error(`Push notification failed for subscription ${sub.id}:`, error);
          }
        }
      })
    );
  } catch (error) {
    console.warn("Push notification skipped due to an unexpected error:", error);
  }
}
