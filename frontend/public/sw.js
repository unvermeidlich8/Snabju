self.addEventListener('push', event => {
  const data = event.data ? event.data.json() : {};
  event.waitUntil(self.registration.showNotification(data.title || 'Snabju', {
    body: data.body || 'Новое уведомление',
    icon: '/icon.svg',
    badge: '/icon.svg',
    data: { url: data.url || '/admin/orders' },
  }));
});
self.addEventListener('notificationclick', event => {
  event.notification.close();
  const targetUrl = new URL(event.notification.data.url || '/admin/orders', self.location.origin).href;

  event.waitUntil((async () => {
    const windows = await clients.matchAll({ type: 'window', includeUncontrolled: true });
    const appWindow = windows.find(windowClient => new URL(windowClient.url).origin === self.location.origin);

    if (appWindow) {
      await appWindow.navigate(targetUrl);
      return appWindow.focus();
    }

    return clients.openWindow(targetUrl);
  })());
});
