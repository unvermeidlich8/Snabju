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
  event.waitUntil(clients.openWindow(event.notification.data.url));
});
