// fcm-sender.js - محرك إرسال إشعارات FCM v1 المباشرة عبر سيرفرات جوجل
// متوافق مع كافة المتصفحات، ويعمل بدون سيرفر خارجي باستخدام Web Crypto API

const SERVICE_ACCOUNT = {
    project_id: "home-services-app-a9c5e",
    private_key_id: "a83ad9424115db1415fb7b4a7b523b5ea1bbfc30",
    client_email: "firebase-adminsdk-fbsvc@home-services-app-a9c5e.iam.gserviceaccount.com",
    private_key: `-----BEGIN PRIVATE KEY-----
MIIEvAIBADANBgkqhkiG9w0BAQEFAASCBKYwggSiAgEAAoIBAQDRJaZO+rhgX1UY
vXQ4QOQF1pbAoOrwa4PkHnnR/nbiedu4ACTQBmseFxw/0h9BOW95nSt0KrOKbnB0
YHd976PULANX/oYUGGJm/BiibDu7aPhcnXdSfT0q8P/L0HNku/t2gRMLYvx2O8p7
+1vQlreRC20fGyOuFYG+j6w595jTnHk8qxG6wzz2Ie9mifZ4vbQBGqUFiR7ISmGm
X28i1l/RRlxqXAnQdVZlyb/GPaRYAnyof58t94bb/5KOofaDM9qbpiFD4kVEkTTP
dPJmGB57SvU4Si5qhFNnPA8Y1Wugyqq4W9aWnyVC3Ug5GuiRuKljD8VW6AQT7fH9
L7s3NVCLAgMBAAECggEAB2CO7jLqdVPHhPjhyZODDNsAiZ44y0Qvlx36vrfSv7L8
AhCB5pM4t2Cp+Wz9oeesZptu9fOvo465CWcsWn/XxTB26bqrm2KEzgx5s05NXmiZ
zMKCe/a47/PSQgEsoNKp+whwgIf8TxCq2Ba0qrXg7GJ9IIoXhxjGcSSmNuE56HTd
0uis+kpiEULp5Dkt9jl/lpQh+2/1ufRhJQHePskDxUrXj2TUd6n3+gMgI9+EXSjc
7TnUdMF60hfL294GpTrI1tjePR0LLPac2UPsZuDQGm7ms2lKb1iOi3HU7FBNVSIP
J7RApFYOPhPpAT8jSVAN3rl9evCwvE0WeZT13iAF2QKBgQDv9baxMzti3fL9yUf+
3nHICdalcbZqgAnw7HHHWeNG/PlEN29MfigGJjVOsu+4c2VEhgQoWhpdVn+R9x4h
NxYD+28kP/jWxsopit3xkSeUzIFY+lwyGy0eoX2DDAFmncOeTJ3EA5R1OELn24Z/
hjzTRMy4oTsZ7MEEyZjB3PnxRQKBgQDfIKf6K4mVjBiYAiLm32w+DfY7WitkE798
8GAZL9ZtSrpXCaX9iNAad2tzN3HGm8tQyJYT3pzxBCh77CwIBquUz8ruU1HnWP9b
5u1FjRSty2VDPnv5gfzjooX9nnd6Wc5tWMwZOkJ5ipFSw4VdOCYs2qtFziFzqM0C
6CA1SqqPjwKBgAOPFWKTa/IPcKcq8RJqoi1hV/mkMhxqQbt9BkL6plBLODc2y0PL
KzTMJEZCiSOnMn1Nr4oZrAJuYf38OEot0vnEJOXYvQwSbrUnBhurF3cxgUmcjPmB
Ra4Knx3uc6bd+CTE5iIeG3mRmAxwSRJjH0vS3WZvnbzIsiQsCUP2zw4xAoGAaElU
GYpV0O7c49dDxtKwPcS6zHzVgP315whWcg840nY1585bpcdXNLeSIhTM+b4BZi2K
b5kBk2iVH26AGfQ8J96DA6cvxciD+clSJsrM2noRRz+iJDkMILzqkWKKh0YIRHVX
V4cyYKpSR/OYlrxSo25E1OiGHA/OWkhyHVZbp6MCgYAVTkmiwM53NezIo63S9OsE
usCcvqPvF/cN+EBs1obO4D56dNVFitcLw3WTbywvCFy9VRmHYHn+DdB0CNRYXeAo
yf4KbnNaMbAc6vHnKs4+fHNJ10RlbzxJgZBybwNifuJgcLtMPNiXBlGlRkc6A0Hy
fVh/iDbZh47XGbcsNDXrrw==
-----END PRIVATE KEY-----`
};

let cachedGoogleToken = null;
let tokenExpiresAt = 0;

function base64Url(str) {
    return btoa(unescape(encodeURIComponent(str)))
        .replace(/=/g, '')
        .replace(/\+/g, '-')
        .replace(/\//g, '_');
}

function arrayBufferToBase64Url(buffer) {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
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

    const header = { 
        alg: "RS256", 
        typ: "JWT",
        kid: SERVICE_ACCOUNT.private_key_id
    };

    const claimSet = {
        iss: SERVICE_ACCOUNT.client_email,
        sub: SERVICE_ACCOUNT.client_email,
        scope: "https://www.googleapis.com/auth/firebase.messaging",
        aud: "https://oauth2.googleapis.com/token",
        exp: now + 3600,
        iat: now - 60
    };

    const unsignedToken = base64Url(JSON.stringify(header)) + "." + base64Url(JSON.stringify(claimSet));
    const signature = await window.crypto.subtle.sign(
        "RSASSA-PKCS1-v1_5",
        key,
        new TextEncoder().encode(unsignedToken)
    );

    const signatureB64 = arrayBufferToBase64Url(signature);
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
