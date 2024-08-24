import webPush from "web-push";

const vapidKeys = {
  publicKey: process.env.VAPID_KEY_PUBLIC,
  privateKey: process.env.VAPID_KEY_PRIVATE,
};

webPush.setVapidDetails("mailto:info@trasla.com.ar", vapidKeys.publicKey, vapidKeys.privateKey);

export async function POST(request) {
  /**
   * @type {PushSubscription}
   */
  const pushSubscription = await request.json();
  const data = JSON.stringify({ some: "data" });
  const result = await webPush.sendNotification(pushSubscription, "Your Push Payload Text");
  console.log("Push Result", result);
  return new Response(JSON.stringify({ ok: true }));
}

function createVapidKeys() {
  const keys = webPush.generateVAPIDKeys();
  console.log("VAPID Keys", keys);
  return keys;
}
