import webPush from "web-push";

const vapidKeys = {
  publicKey: process.env.VAPID_KEY_PUBLIC,
  privateKey: process.env.VAPID_KEY_PRIVATE,
};

console.log("VAPID Keys", vapidKeys, process.env);
webPush.setVapidDetails("mailto:info@trasla.com.ar", vapidKeys.publicKey, vapidKeys.privateKey);

export async function POST(request) {
  /**
   * @type {PushSubscription}
   */
  const pushSubscription = await request.json();
  const result = webPush.sendNotification(pushSubscription, "Your Push Payload Text");
  console.log("Push Result", result);
  return new Response(JSON.stringify(result));
}

function createVapidKeys() {
  const keys = webPush.generateVAPIDKeys();
  console.log("VAPID Keys", keys);
  return keys;
}
