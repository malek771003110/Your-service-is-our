// firebase-messaging-sw.js - متوافق مع كافة المتصفحات والآيفون PWA iOS Web Push
importScripts('https://www.gstatic.com/firebasejs/10.1.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.1.0/firebase-messaging-compat.js');

const firebaseConfig = {
  apiKey: "AIzaSyCj5YjdiruBTCfxDnxlDd4W6YA5iCWRfE4",
  authDomain: "home-services-app-a9c5e.firebaseapp.com",
  projectId: "home-services-app-a9c5e",
  storageBucket: "home-services-app-a9c5e.appspot.com",
  messagingSenderId: "287028219636",
  appId: "1:287028219636:web:2ad4b0e092a2c007e318a1"
};

try {
  firebase.initializeApp(firebaseConfig);
  const messaging = firebase.messaging();

  // Handle Firebase FCM background messages
  messaging.onBackgroundMessage((payload) => {
    console.log('📩 [SW] Received background message:', payload);
    const notificationTitle = payload.notification?.title || payload.data?.title || '🔔 تنبيه منصة خدمتك 🇯🇴';
    const notificationOptions = {
      body: payload.notification?.body || payload.data?.body || 'هناك تحديث جديد في المنصة',
      icon: './logo.png',
      badge: './logo.png',
      tag: payload.data?.type || 'admin_alert_' + Date.now(),
      data: payload.data || { url: './requests.html' },
      vibrate: [250, 100, 250, 100, 250],
      requireInteraction: true
    };
    self.registration.showNotification(notificationTitle, notificationOptions);
  });
} catch (e) {
  console.warn('[SW] Firebase messaging init warning:', e);
}

// Standard Web Push Event (For iOS 16.4+ Safari PWA and Chrome Web Push)
self.addEventListener('push', (event) => {
  console.log('🔔 [SW] Push event received:', event);
  let title = '🔔 تنبيه إداري - منصة خدمتك 🇯🇴';
  let body = 'هناك نشاط جديد في النظام يحتاج متابعتك.';
  let dataUrl = './requests.html';

  if (event.data) {
    try {
      const json = event.data.json();
      if (json.notification) {
        title = json.notification.title || title;
        body = json.notification.body || body;
      } else if (json.title) {
        title = json.title;
        body = json.body || body;
      }
      if (json.data && json.data.url) dataUrl = json.data.url;
    } catch (err) {
      body = event.data.text() || body;
    }
  }

  const origin = self.location.origin || '';
  const iconUrl = origin ? (origin + '/logo.png') : './logo.png';

  event.waitUntil(
    self.registration.showNotification(title, {
      body: body,
      icon: iconUrl,
      badge: iconUrl,
      vibrate: [250, 100, 250, 100, 250],
      tag: 'admin_push_' + Date.now(),
      data: { url: dataUrl }
    })
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  console.log('🔔 [SW] Notification clicked:', event);
  event.notification.close();

  const urlToOpen = event.notification.data?.url || './requests.html';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        for (let client of clientList) {
          if (client.url.includes('requests.html') && 'focus' in client) {
            return client.focus();
          }
        }
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
  );
});

console.log('✅ Service Worker fully active for iPhone Web Push & Android');