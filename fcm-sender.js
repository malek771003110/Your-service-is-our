// fcm-sender.js - محرك إرسال إشعارات FCM v1 المباشرة عبر سيرفرات جوجل
// متوافق مع كافة المتصفحات، ويعمل بدون سيرفر خارجي باستخدام Web Crypto API

const SERVICE_ACCOUNT = {
    project_id: "home-services-app-a9c5e",
    private_key_id: "27dd64e4133a08da7e1986f4b249d6e1c71be8cd",
    client_email: "firebase-adminsdk-fbsvc@home-services-app-a9c5e.iam.gserviceaccount.com",
    private_key: `-----BEGIN PRIVATE KEY-----
MIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQC9noGHYoprD3YQ
KUkKqDr7znvzuxL7OpzDdcQubLnMqFoHwl2AmLM2tIdGqxcTiR5w0zhzVXKZ/y4d
d6Okv6ykqDBQSKEflD5/5VsLO82wnShPH2AteGuepYKcvGMGnXqO4LLr5GCvvgB7
lyEECA2DimUWvMnELLPcTjZcvTThtVHETjQbk/ZblBzUDx8jJZu4WBHyy/HyJycA
VOrh3c+UFVHrGwWnrOJq0s+GVWRNY4WeY/WayfhlnSbLTMX3802Zs096F64XAkvd
R+IFgygVyOqcENpvGuAAIHKoDy65o/1kbnPTBts9udmb51rjIZL6GPJzC2iLTTok
VEWOLcWVAgMBAAECggEAAZvSpX9khTwAWGrBP+HlfjVmP88afh8lLVNWcr5hZScY
fHBdsrWY76Hgc+0HqRbEt1hTZkcXTc8oaP+W19L4d/0lS8kR9N6hGRytBQ9g01rB
+MnfWwNmhlYJIaNHg8raO1QUsIOjfloyTtodYZdf5fnKmcLIQ23NqNTRCUBhrniD
l+72PEwPLlPTZXPBS5D72siRnqkA0GZTZg3+6FvbDJvJvzut2ad67DQPR1toM9sE
qtDK6E81uMn6I3FF+4gAGfsGt7Z1fsmNWpnXS0uVDB/yqojDUTnqUGMT1zHSz6cM
nS+rudll0gUI1PCYqdQAcuX93TWT1BMoI6Lp1TWCAQKBgQDfrKS3Pr7KBaEm4Q4E
N1+5S5i7h/9IRvPlzy4Ia0avJAoWXTjwZ4OfJS6ikFKrNaI69bdptlH5s2nZHK//
5rrVKusnvUd/fXKYpYxk3KeFiTCbx0pam8gRaZknplQcD0KEO5q7QuoOZrVkCIdZ
RpIKgcMYUXtc4KIKtMDtKqxF4QKBgQDZBejzEwcj3rG05oDC1J95jbQZ/sWJtqWI
2BtkJEg0e6ErberK97im3vkiLd4XXEH4x0+qscRphEu9X7BgZt5lGnbMO1nBXTkS
6sAkO8rm0/bK7PsOkHQrdLyZJ6QMdfSwTYfKR8SMpdFrdT/1ceULvTKCGJx1ud6n
tCfZQNEONQKBgQDJakadOGRHuVAHmausgkyxp/BuFqX76OCiNbFnJWruNc7bmrC2
UxCEU9At1TaMM+zVmQTDrckdyMDtIFcgYh4l7NL64wgqNsXlzVWiUcyMhCCAdrJu
60761xNyT+X3qookVyQbssLfmv+Gh+ORsem6imUrVdx3o1RnvaLpLn8ZIQKBgQCa
qj2UTjE+fQ0EsWl+cG2fAUAjbpB1Tre2SN1shvb2gE0iWFmGgPkV476Ff07SMyvJ
ErJSIhKqaGBZ/AIFEgrY3v1fG8Uhq0BrnOWGbR5zVwiBIlbh0E0aUz29oKSnRME3
jGmD3ZXT7rDK9mq4j4z+yr1ePg/zTp3BwwDLMghLKQKBgChxRgmJ/BGZKYw59KRY
z1/TAsSXr3rLGS49Rpy1TyYFUfgJJ6p7vYu6g+5oqhAoTBtQ8c03j6zqK3MpicCw
5WDLdczvKdGiVDc6v2FLTUryNlgwMkUVQZIkIpRtH0ig+YXmeVvVh2I37R5gbYUS
3KRQht5j/zjDWcuE6ztmsM2h
-----END PRIVATE KEY-----`
};

let cachedGoogleToken = null;
let tokenExpiresAt = 0;

function b64url(str) {
    return btoa(str).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}

async function getGoogleAccessToken() {
    const now = Math.floor(Date.now() / 1000);
    if (cachedGoogleToken && now < (tokenExpiresAt - 120)) {
        return cachedGoogleToken;
    }

    const cleanKey = SERVICE_ACCOUNT.private_key
        .replace(/-----BEGIN PRIVATE KEY-----/g, '')
        .replace(/-----END PRIVATE KEY-----/g, '')
        .replace(/\s+/g, '');

    const binaryDerString = window.atob(cleanKey);
    const binaryDer = new Uint8Array(binaryDerString.length);
    for (let i = 0; i < binaryDerString.length; i++) {
        binaryDer[i] = binaryDerString.charCodeAt(i);
    }

    const key = await window.crypto.subtle.importKey(
        "pkcs8",
        binaryDer.buffer,
        { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
        false,
        ["sign"]
    );

    const header = { alg: "RS256", typ: "JWT" };
    const claimSet = {
        iss: SERVICE_ACCOUNT.client_email,
        scope: "https://www.googleapis.com/auth/firebase.messaging",
        aud: "https://oauth2.googleapis.com/token",
        exp: now + 3600,
        iat: now
    };

    const unsignedToken = b64url(JSON.stringify(header)) + "." + b64url(JSON.stringify(claimSet));
    const signature = await window.crypto.subtle.sign(
        "RSASSA-PKCS1-v1_5",
        key,
        new TextEncoder().encode(unsignedToken)
    );

    let binary = '';
    const bytes = new Uint8Array(signature);
    for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    const signatureB64 = btoa(binary).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
    const jwt = unsignedToken + "." + signatureB64;

    const res = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: `grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=${jwt}`
    });

    const data = await res.json();
    if (!data.access_token) {
        throw new Error("فشل الحصول على توكن جوجل OAuth2: " + JSON.stringify(data));
    }

    cachedGoogleToken = data.access_token;
    tokenExpiresAt = now + (data.expires_in || 3600);
    return cachedGoogleToken;
}

/**
 * إرسال إشعار Push حقيقي ومباشر لهدف محدد (توكن أو قناة)
 */
async function sendFcmPushSingle({ title, body, token = null, topic = null, data = {} }) {
    const accessToken = await getGoogleAccessToken();

    const messagePayload = {
        notification: {
            title: title || '📢 تنبيه من تطبيق خدمتك 🇯🇴',
            body: body || ''
        },
        android: {
            priority: "HIGH",
            notification: {
                channel_id: "khedmtek_channel",
                sound: "default",
                notification_priority: "PRIORITY_HIGH",
                default_sound: true,
                default_vibrate_timings: true
            }
        },
        data: {
            click_action: "FLUTTER_NOTIFICATION_CLICK",
            title: title || '',
            body: body || '',
            ...data
        }
    };

    if (token) {
        messagePayload.token = token;
    } else {
        messagePayload.topic = topic || "all_users";
    }

    const res = await fetch(`https://fcm.googleapis.com/v1/projects/${SERVICE_ACCOUNT.project_id}/messages:send`, {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${accessToken}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ message: messagePayload })
    });

    const result = await res.json();
    return { ok: res.ok, status: res.status, result };
}

/**
 * إرسال إشعار شامل لجميع الهواتف مباشرة عبر Tokens + القناة العامة (لحظي 100%)
 */
async function sendFcmPushToAllDevices({ title, body, db, data = {} }) {
    try {
        console.log("🚀 جاري بدء إرسال الـ Push لجميع الهواتف...");
        const accessToken = await getGoogleAccessToken();

        // 1. استخراج جميع الـ Tokens المسجلة في قاعدة البيانات من هواتف المستخدمين
        let tokens = [];
        try {
            const { collection, getDocs } = await import("https://www.gstatic.com/firebasejs/10.1.0/firebase-firestore.js");
            const snap = await getDocs(collection(db, "fcm_tokens"));
            snap.forEach(doc => {
                const t = doc.data().token || doc.id;
                if (t && !tokens.includes(t)) tokens.push(t);
            });
            console.log(`📱 تم العثور على ${tokens.length} هاتف مسجل مباشرة في fcm_tokens.`);
        } catch (te) {
            console.warn("تعذر جلب توكنات الأجهزة مباشرة:", te);
        }

        let successTokensCount = 0;

        // 2. إرسال الإشعار المباشر لكل توكن هاتف على حدة (فوري بأقل من ثانية!)
        for (const token of tokens) {
            try {
                const r = await sendFcmPushSingle({ title, body, token, data });
                if (r.ok) successTokensCount++;
            } catch (err) {
                console.warn("خطأ إرسال لتوكن:", token, err);
            }
        }

        // 3. إرسال نسخة إضافية للقناة العامة all_users
        try {
            await sendFcmPushSingle({ title, body, topic: "all_users", data });
        } catch (err) {
            console.warn("خطأ إرسال للقناة العامة:", err);
        }

        console.log(`🎉 اكتمل الإرسال! تم تسليم الإشعار لـ ${successTokensCount} هاتف مباشرة + القناة العامة.`);
        return { success: true, count: tokens.length, delivered: successTokensCount };
    } catch (err) {
        console.error("❌ فشل إرسال الإشعارات الجماعية:", err);
        return { success: false, error: err.message };
    }
}

/**
 * إرسال لمستخدم محدد (عبر توكنه المسجل وقناته الخاصة)
 */
async function sendFcmPushToUser({ title, body, userId, db, data = {} }) {
    try {
        let userToken = null;
        if (db && userId) {
            try {
                const { doc, getDoc } = await import("https://www.gstatic.com/firebasejs/10.1.0/firebase-firestore.js");
                let uSnap = await getDoc(doc(db, "customers", userId));
                if (!uSnap.exists()) {
                    uSnap = await getDoc(doc(db, "approvedUsers", userId));
                }
                if (uSnap.exists()) {
                    userToken = uSnap.data().fcmToken;
                }
            } catch (e) { console.log(e); }
        }

        if (userToken) {
            await sendFcmPushSingle({ title, body, token: userToken, data });
        }
        // وأيضاً للقناة الخاصة للمستخدم
        await sendFcmPushSingle({ title, body, topic: `user_${userId}`, data });
        return { success: true };
    } catch (err) {
        return { success: false, error: err.message };
    }
}

window.sendFcmPushToAllDevices = sendFcmPushToAllDevices;
window.sendFcmPushToUser = sendFcmPushToUser;
window.sendFcmPushSingle = sendFcmPushSingle;

export { sendFcmPushToAllDevices, sendFcmPushToUser, sendFcmPushSingle };
