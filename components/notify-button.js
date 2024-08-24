import { useDB } from "../hooks/useDB.js";
import { useUser } from "../hooks/useUser.js";

// Setup Notifications
const VAPI_PUBLIC_KEY =
  "BPBJ9NGWGwE2Iz8JFVTJ0-ysOKJGMb2NJMSlTxokwEN_3ZFiSIaxmGSLG9Di66Of8DRzHp8oHUGMcnnis0-YTrM";

async function isUserSubscribed() {
  const swRegistration = await navigator.serviceWorker.ready;
  return await swRegistration.pushManager.getSubscription();
}

async function subscribeUser() {
  // if (await isUserSubscribed()) return;
  const swRegistration = await navigator.serviceWorker.ready;
  const pushSubscription = await swRegistration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: VAPI_PUBLIC_KEY,
  });
  const db = useDB();
  const user = useUser();
  db.get("users").set(await user.get("alias"), { pushSubscription: JSON.stringify(pushSubscription) });
  user.put({ pushSubscription: JSON.stringify(pushSubscription) });

  // Send the subscription to server
  await fetch("/api/web-push-subscribe", {
    method: "POST",
    body: JSON.stringify(pushSubscription),
    headers: {
      "Content-Type": "application/json",
    },
  });
}

async function subscribeUserToEvent(eventId) {
  subscribeUser();
}

async function SetUpNewNotification() {
  if (!("serviceWorker" in navigator)) {
    console.log("Service Worker not supported");
    return;
  }

  if (!("PushManager" in window)) {
    console.log("Push API not supported");
    return;
  }
  const swRegistration = await navigator.serviceWorker.ready;

  const push = await swRegistration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: VAPI_PUBLIC_KEY,
  });

  navigator.serviceWorker.register("/service-worker.js").then((swReg) => {
    console.log("Service Worker Registered", swReg);
    swRegistration = swReg;
  });
}

customElements.define(
  "notify-button",
  class extends HTMLElement {
    constructor() {
      super();
      this.addEventListener("input", this);
      this.addEventListener("click", this);
      this.input = this.querySelector("input");
      this.syncChecked();
    }

    get notifications() {
      return useDB().get("events").get(this.dataset.id).get("usersToNotify");
    }

    syncChecked = async () => {
      const alias = await useUser().get("alias");
      this.notifications.map().on(async (user) => {
        if (!user) return;
        if (user.alias === alias) {
          this.input.checked = true;
        }
      });
    };

    handleEvent(event) {
      if ("input" === event.type) {
        this.toggleNotify(this.input.checked);
      }
      if ("click" === event.type) {
        this.toggleNotify((this.input.checked = !this.input.checked));
      }
    }

    async toggleNotify(notify) {
      const user = useUser();
      this.notifications[notify ? "set" : "unset"](user);
      if (notify) subscribeUserToEvent(this.dataset.id);
    }
  }
);
