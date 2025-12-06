// firebase-messaging-sw.js
// ضع هذا الملف في المجلد الرئيسي للمشروع (نفس مستوى index.html)

importScripts('https://www.gstatic.com/firebasejs/10.1.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.1.0/firebase-messaging-compat.js');

// Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyCj5YjdiruBTCfxDnxlDd4W6YA5iCWRfE4",
  authDomain: "home-services-app-a9c5e.firebaseapp.com",
  projectId: "home-services-app-a9c5e",
  storageBucket: "home-services-app-a9c5e.appspot.com",
  messagingSenderId: "287028219636",
  appId: "1:287028219636:web:2ad4b0e092a2c007e318a1"
};

firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log('📩 Received background message:', payload);

  const notificationTitle = payload.notification.title || 'إشعار جديد';
  const notificationOptions = {
    body: payload.notification.body || 'لديك إشعار جديد',
    icon: payload.notification.icon || '/icon-192x192.png',
    badge: '/badge-72x72.png',
    tag: payload.data?.type || 'general',
    data: payload.data,
    vibrate: [200, 100, 200],
    requireInteraction: true,
    actions: [
      {
        action: 'open',
        title: 'فتح',
        icon: '/icons/open.png'
      },
      {
        action: 'close',
        title: 'إغلاق',
        icon: '/icons/close.png'
      }
    ]
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  console.log('🔔 Notification clicked:', event);
  event.notification.close();

  if (event.action === 'open' || !event.action) {
    const urlToOpen = event.notification.data?.url || '/';
    
    event.waitUntil(
      clients.matchAll({ type: 'window', includeUncontrolled: true })
        .then((clientList) => {
          // Check if app is already open
          for (let client of clientList) {
            if (client.url === urlToOpen && 'focus' in client) {
              return client.focus();
            }
          }
          // Open new window if not already open
          if (clients.openWindow) {
            return clients.openWindow(urlToOpen);
          }
        })
    );
  }
});

console.log('✅ Firebase Messaging Service Worker loaded');