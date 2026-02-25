"use client";

import { useEffect, useState } from "react";

export function useBrowserNotifications() {
  const [supported, setSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>("default");

  useEffect(() => {
    if ("Notification" in window) {
      setSupported(true);
      setPermission(Notification.permission);
    }
  }, []);

  const requestPermission = async () => {
    if (!supported) return false;
    const result = await Notification.requestPermission();
    setPermission(result);
    return result === "granted";
  };

  const showNotification = (title: string, options?: NotificationOptions) => {
    if (supported && permission === "granted") {
      return new Notification(title, {
        icon: "/favicon.ico",
        badge: "/favicon.ico",
        ...options,
      });
    }
    return null;
  };

  return {
    supported,
    permission,
    requestPermission,
    showNotification,
  };
}
