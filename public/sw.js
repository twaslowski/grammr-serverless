self.addEventListener("push", function (event) {
  if (!event.data) {
    return;
  }

  const data = event.data.json();
  const options = {
    body: data.body,
    icon: data.icon || "/favicon/android-chrome-192x192.png",
    badge: "/favicon/android-chrome-192x192.png",
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      url: data.url || "/",
    },
  };

  event.waitUntil(self.registration.showNotification(data.title, options));
});

self.addEventListener("notificationclick", function (event) {
  event.notification.close();

  const target = new URL(event.notification.data?.url || "/", self.location.origin);

  event.waitUntil(self.clients.openWindow(target.href));
});
