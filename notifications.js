// notifications.js
// ضع هذا الملف في مجلد js/

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.1.0/firebase-app.js";
import { getMessaging, getToken, onMessage } from "https://www.gstatic.com/firebasejs/10.1.0/firebase-messaging.js";
import { getFirestore, doc, setDoc, updateDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.1.0/firebase-firestore.js";

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

// VAPID Key من Firebase Console -> Project Settings -> Cloud Messaging -> Web Push certificates
const VAPID_KEY = "YOUR_VAPID_KEY_HERE"; // ⚠️ استبدل هذا بمفتاحك من Firebase

class NotificationManager {
  constructor() {
    this.isSupported = 'Notification' in window && 'serviceWorker' in navigator;
    this.permission = this.isSupported ? Notification.permission : 'denied';
    this.token = null;
    this.userId = null;
    this.userType = null; // 'customer' or 'professional'
  }

  // ✅ تهيئة نظام الإشعارات
  async initialize(userId, userType) {
    if (!this.isSupported) {
      console.warn('⚠️ Push notifications not supported in this browser');
      return { success: false, error: 'not_supported' };
    }

    this.userId = userId;
    this.userType = userType;

    try {
      // Register service worker
      const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
      console.log('✅ Service Worker registered:', registration);

      // Request notification permission
      const permission = await this.requestPermission();
      if (permission !== 'granted') {
        return { success: false, error: 'permission_denied' };
      }

      // Get FCM token
      const token = await this.getOrCreateToken(registration);
      if (!token) {
        return { success: false, error: 'token_failed' };
      }

      // Save token to Firestore
      await this.saveTokenToFirestore(token);

      // Setup foreground message handler
      this.setupForegroundHandler();

      console.log('✅ Notifications initialized successfully');
      return { success: true, token };

    } catch (error) {
      console.error('❌ Notification initialization failed:', error);
      return { success: false, error: error.message };
    }
  }

  // 🔔 طلب إذن الإشعارات
  async requestPermission() {
    if (this.permission === 'granted') {
      return 'granted';
    }

    try {
      this.permission = await Notification.requestPermission();
      return this.permission;
    } catch (error) {
      console.error('❌ Permission request failed:', error);
      return 'denied';
    }
  }

  // 🎫 الحصول على Token
  async getOrCreateToken(registration) {
    try {
      const currentToken = await getToken(messaging, {
        vapidKey: VAPID_KEY,
        serviceWorkerRegistration: registration
      });

      if (currentToken) {
        console.log('✅ FCM Token:', currentToken);
        this.token = currentToken;
        return currentToken;
      } else {
        console.warn('⚠️ No registration token available');
        return null;
      }
    } catch (error) {
      console.error('❌ Token generation failed:', error);
      return null;
    }
  }

  // 💾 حفظ Token في Firestore
  async saveTokenToFirestore(token) {
    try {
      const collection = this.userType === 'customer' ? 'customers' : 'approvedUsers';
      const userRef = doc(db, collection, this.userId);

      await updateDoc(userRef, {
        fcmToken: token,
        fcmTokenUpdatedAt: serverTimestamp(),
        notificationsEnabled: true,
        deviceInfo: {
          userAgent: navigator.userAgent,
          platform: navigator.platform,
          language: navigator.language
        }
      });

      console.log('✅ Token saved to Firestore');
    } catch (error) {
      console.error('❌ Failed to save token:', error);
      throw error;
    }
  }

  // 📱 معالج الرسائل في الواجهة الأمامية (Foreground)
  setupForegroundHandler() {
    onMessage(messaging, (payload) => {
      console.log('📩 Foreground message received:', payload);

      const { title, body, icon } = payload.notification;
      const data = payload.data || {};

      // عرض إشعار مخصص في الصفحة
      this.showInAppNotification(title, body, data);

      // يمكن أيضاً عرض notification عادي
      if (this.permission === 'granted') {
        new Notification(title, {
          body,
          icon: icon || '/icon-192x192.png',
          badge: '/badge-72x72.png',
          tag: data.type || 'general',
          data
        });
      }
    });
  }

  // 🎨 عرض إشعار داخل التطبيق
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

    // Auto remove after 5 seconds
    setTimeout(() => {
      notification.classList.add('fade-out');
      setTimeout(() => notification.remove(), 300);
    }, 5000);

    // Close button
    notification.querySelector('.notification-close').addEventListener('click', () => {
      notification.classList.add('fade-out');
      setTimeout(() => notification.remove(), 300);
    });

    // Click to navigate
    if (data.url) {
      notification.style.cursor = 'pointer';
      notification.addEventListener('click', (e) => {
        if (!e.target.classList.contains('notification-close')) {
          window.location.href = data.url;
        }
      });
    }
  }

  // 📤 إرسال إشعار (من جانب الإدارة أو الخادم)
  static async sendNotification(recipientId, recipientType, notificationData) {
    try {
      // في الواقع، يجب إرسال هذا من الخادم (Backend)
      // هنا مثال على البيانات المطلوبة

      const payload = {
        to: recipientId, // FCM Token أو User ID
        notification: {
          title: notificationData.title,
          body: notificationData.body,
          icon: notificationData.icon || '/icon-192x192.png',
          click_action: notificationData.url || '/'
        },
        data: {
          type: notificationData.type || 'general',
          url: notificationData.url || '/',
          ...notificationData.additionalData
        }
      };

      // ⚠️ هذا يجب أن يتم من خلال Cloud Functions أو Backend
      console.log('📤 Notification payload:', payload);
      
      // حفظ الإشعار في Firestore للسجل
      await setDoc(doc(db, 'notifications', `${recipientId}_${Date.now()}`), {
        recipientId,
        recipientType,
        ...notificationData,
        createdAt: serverTimestamp(),
        read: false
      });

      return { success: true };
    } catch (error) {
      console.error('❌ Send notification failed:', error);
      return { success: false, error: error.message };
    }
  }

  // 🔕 تعطيل الإشعارات
  async disableNotifications() {
    try {
      const collection = this.userType === 'customer' ? 'customers' : 'approvedUsers';
      const userRef = doc(db, collection, this.userId);

      await updateDoc(userRef, {
        notificationsEnabled: false,
        fcmTokenDisabledAt: serverTimestamp()
      });

      console.log('✅ Notifications disabled');
      return { success: true };
    } catch (error) {
      console.error('❌ Failed to disable notifications:', error);
      return { success: false, error: error.message };
    }
  }
}

// إضافة الأنماط للإشعارات داخل التطبيق
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
    flex-shrink: 0;
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
    line-height: 1.4;
  }

  .notification-close {
    background: transparent;
    border: none;
    font-size: 24px;
    color: #95a5a6;
    cursor: pointer;
    padding: 0;
    line-height: 1;
    transition: color 0.2s;
  }

  .notification-close:hover {
    color: #e74c3c;
  }

  @keyframes slideIn {
    from {
      transform: translateX(400px);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }

  @keyframes slideOut {
    from {
      transform: translateX(0);
      opacity: 1;
    }
    to {
      transform: translateX(400px);
      opacity: 0;
    }
  }

  @media (max-width: 480px) {
    .in-app-notification {
      top: 10px;
      right: 10px;
      left: 10px;
      min-width: auto;
      max-width: none;
    }
  }
`;
document.head.appendChild(style);

// تصدير الكلاس
export default NotificationManager;