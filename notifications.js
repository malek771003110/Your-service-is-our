// notifications.js - نسخة مصلحة
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.1.0/firebase-app.js";
import { getMessaging, getToken, onMessage } from "https://www.gstatic.com/firebasejs/10.1.0/firebase-messaging.js";
import { getFirestore, doc, setDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.1.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyCj5YjdiruBTCfxDnxlDd4W6YA5iCWRfE4",
  authDomain: "home-services-app-a9c5e.firebaseapp.com",
  projectId: "home-services-app-a9c5e",
  storageBucket: "home-services-app-a9c5e.appspot.com",
  messagingSenderId: "287028219636",
  appId: "1:287028219636:web:2ad4b0e092a2c007e318a1"
};

const app = initializeApp(firebaseConfig);
const messaging = getMessaging(app);
const db = getFirestore(app);

// ⚠️ استبدل هذا بمفتاحك الصحيح من Firebase Console
const VAPID_KEY = "BLYG3ZcUi_Tf9t6cH7dRkAOJE-KEUk2bXL7AE4rta-4lTr_U5UfEr_eS0MAjvAHlqs_3ni0KALoRspUyRdN0aVE";

class NotificationManager {
  constructor() {
    this.isSupported = 'Notification' in window && 'serviceWorker' in navigator;
    this.permission = this.isSupported ? Notification.permission : 'denied';
    this.token = null;
    this.userId = null;
    this.userType = null;
  }

  async initialize(userId, userType) {
    console.log('🔔 تهيئة نظام الإشعارات...');
    
    if (!this.isSupported) {
      console.warn('⚠️ المتصفح لا يدعم الإشعارات');
      return { success: false, error: 'not_supported' };
    }

    this.userId = userId;
    this.userType = userType;

    try {
      // ✅ المسار الصحيح لـ Service Worker
      const registration = await navigator.serviceWorker.register(
        './firebase-messaging-sw.js',
        { scope: './' }
      );
      console.log('✅ Service Worker مسجل:', registration);

      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        console.warn('⚠️ المستخدم رفض الإشعارات');
        return { success: false, error: 'permission_denied' };
      }
      console.log('✅ تم منح إذن الإشعارات');

      // انتظر Service Worker يصير active
      await this.waitForServiceWorker(registration);

      const token = await getToken(messaging, {
        vapidKey: VAPID_KEY,
        serviceWorkerRegistration: registration
      });

      if (!token) {
        return { success: false, error: 'no_token' };
      }

      console.log('✅ FCM Token:', token);
      this.token = token;

      await this.saveTokenToFirestore(token);
      this.setupForegroundHandler();

      return { success: true, token };

    } catch (error) {
      console.error('❌ خطأ في التهيئة:', error);
      return { success: false, error: error.message };
    }
  }

  async waitForServiceWorker(registration) {
    return new Promise((resolve) => {
      if (registration.active) {
        resolve();
      } else {
        const sw = registration.installing || registration.waiting;
        if (sw) {
          sw.addEventListener('statechange', (e) => {
            if (e.target.state === 'activated') {
              resolve();
            }
          });
        } else {
          resolve();
        }
      }
    });
  }

  async saveTokenToFirestore(token) {
    try {
      const collection = this.userType === 'customer' ? 'customers' : 'approvedUsers';
      const userRef = doc(db, collection, this.userId);

      // ✅ استخدم setDoc مع merge
      await setDoc(userRef, {
        fcmToken: token,
        fcmTokenUpdatedAt: serverTimestamp(),
        notificationsEnabled: true
      }, { merge: true });

      console.log('✅ Token محفوظ في Firestore');
    } catch (error) {
      console.error('❌ فشل حفظ Token:', error);
    }
  }

  setupForegroundHandler() {
    onMessage(messaging, (payload) => {
      console.log('📩 إشعار وارد:', payload);

      const { title, body } = payload.notification;
      this.showInAppNotification(title, body, payload.data);

      if (Notification.permission === 'granted') {
        new Notification(title, {
          body,
          icon: './logo.png', // ✅ استخدم لوجو موجود
          badge: './logo.png'
        });
      }
    });
  }

  showInAppNotification(title, body, data) {
    const notification = document.createElement('div');
    notification.className = 'in-app-notification';
    notification.innerHTML = `
      <div class="notification-content">
        <div class="notification-icon">🔔</div>
        <div class="notification-text">
          <strong>${title}</strong>
          <p>${body}</p>
        </div>
        <button class="notification-close">×</button>
      </div>
    `;

    document.body.appendChild(notification);

    setTimeout(() => {
      notification.classList.add('fade-out');
      setTimeout(() => notification.remove(), 300);
    }, 5000);

    notification.querySelector('.notification-close').addEventListener('click', () => {
      notification.remove();
    });
  }
}

// CSS للإشعارات
const style = document.createElement('style');
style.textContent = `
  .in-app-notification {
    position: fixed;
    top: 20px;
    right: 20px;
    background: white;
    border-radius: 12px;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
    padding: 16px;
    min-width: 300px;
    max-width: 400px;
    z-index: 10000;
    animation: slideIn 0.3s ease-out;
    direction: rtl;
  }

  .in-app-notification.fade-out {
    animation: slideOut 0.3s ease-out;
  }

  .notification-content {
    display: flex;
    gap: 12px;
    align-items: flex-start;
  }

  .notification-icon {
    font-size: 24px;
  }

  .notification-text {
    flex: 1;
  }

  .notification-text strong {
    display: block;
    color: #2c3e50;
    font-size: 16px;
    margin-bottom: 4px;
  }

  .notification-text p {
    color: #7f8c8d;
    font-size: 14px;
    margin: 0;
  }

  .notification-close {
    background: transparent;
    border: none;
    font-size: 24px;
    color: #95a5a6;
    cursor: pointer;
  }

  @keyframes slideIn {
    from { transform: translateX(400px); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
  }

  @keyframes slideOut {
    from { transform: translateX(0); opacity: 1; }
    to { transform: translateX(400px); opacity: 0; }
  }
`;
document.head.appendChild(style);

export default NotificationManager;