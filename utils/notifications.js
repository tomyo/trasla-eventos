/**
 * Notification utilities for TRASLA events application
 */

/**
 * Requests notification permission from the user
 * @returns {Promise<string>} The permission status: 'granted', 'denied', or 'default'
 */
export async function requestNotificationPermission() {
  if (!("Notification" in window)) {
    console.warn("This browser does not support notifications");
    return "unsupported";
  }

  if (Notification.permission === "granted") {
    return "granted";
  }

  if (Notification.permission === "denied") {
    return "denied";
  }

  // Request permission
  const permission = await Notification.requestPermission();
  return permission;
}

/**
 * Shows a browser notification if permissions are granted
 * @param {string} title - The notification title
 * @param {Object} options - Notification options
 * @param {string} options.body - The notification body text
 * @param {string} options.icon - Path to notification icon
 * @param {Array<number>} options.vibrate - Vibration pattern
 * @param {string} options.tag - Notification tag for replacing previous notifications
 * @param {Object} options.data - Custom data to attach to the notification
 * @returns {Promise<Notification|null>} The created notification or null if not supported/permitted
 */
export async function showNotification(title, options = {}) {
  const permission = await requestNotificationPermission();

  if (permission !== "granted") {
    console.warn("Notification permission not granted, cannot show notification");
    return null;
  }

  const defaultOptions = {
    icon: "/assets/icons/favicon-192x192.png",
    badge: "/assets/icons/favicon-192x192.png",
    vibrate: [200, 100, 200],
    ...options,
  };

  try {
    const notification = new Notification(title, defaultOptions);
    return notification;
  } catch (error) {
    console.error("Error showing notification:", error);
    return null;
  }
}

/**
 * Shows a success notification
 * @param {string} message - Success message
 * @param {Object} data - Optional data to attach
 * @returns {Promise<Notification|null>}
 */
export async function showSuccessNotification(message, data = {}) {
  return showNotification("¡Éxito! 🎉", {
    body: message,
    tag: "trasla-success",
    data,
  });
}

/**
 * Shows an error notification
 * @param {string} message - Error message
 * @param {Object} data - Optional data to attach
 * @returns {Promise<Notification|null>}
 */
export async function showErrorNotification(message, data = {}) {
  return showNotification("Error", {
    body: message,
    vibrate: [200, 100, 200, 100, 200],
    tag: "trasla-error",
    data,
  });
}

/**
 * Shows an info notification
 * @param {string} title - Info title
 * @param {string} message - Info message
 * @param {Object} data - Optional data to attach
 * @returns {Promise<Notification|null>}
 */
export async function showInfoNotification(title, message, data = {}) {
  return showNotification(title, {
    body: message,
    tag: "trasla-info",
    data,
  });
}

/**
 * Checks if notifications are supported and permitted
 * @returns {boolean}
 */
export function areNotificationsAvailable() {
  return "Notification" in window && Notification.permission === "granted";
}

/**
 * Checks if service worker registration supports showing notifications
 * @returns {Promise<boolean>}
 */
export async function canUseServiceWorkerNotifications() {
  if (!("serviceWorker" in navigator)) {
    return false;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    return "showNotification" in registration;
  } catch (error) {
    console.error("Error checking service worker notifications:", error);
    return false;
  }
}
