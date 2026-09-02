// fcm-sender.js - محرك إرسال إشعارات FCM v1 المباشرة عبر سيرفرات جوجل
// متوافق مع كافة المتصفحات، ويعمل بدون سيرفر خارجي باستخدام Web Crypto API

const SERVICE_ACCOUNT = {
    project_id: "home-services-app-a9c5e",
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
    return btoa(str).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}

async function getGoogleAccessToken() {
    const now = Math.floor(Date.now() / 1000);
    if (cachedGoogleToken && now < (tokenExpiresAt - 120)) {
        return cachedGoogleToken;
    }

    const pem = SERVICE_ACCOUNT.private_key;
    const pemHeader = "-----BEGIN PRIVATE KEY-----";
    const pemFooter = "-----END PRIVATE KEY-----";
    const pemContents = pem.substring(pem.indexOf(pemHeader) + pemHeader.length, pem.indexOf(pemFooter)).replace(/\s/g, '');
    const binaryDerString = window.atob(pemContents);
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

    const unsignedToken = base64Url(JSON.stringify(header)) + "." + base64Url(JSON.stringify(claimSet));
    const signature = await window.crypto.subtle.sign(
        "RSASSA-PKCS1-v1_5",
        key,
        new TextEncoder().encode(unsignedToken)
    );

    const signatureB64 = btoa(String.fromCharCode(...new Uint8Array(signature)))
        .replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');

    const jwt = unsignedToken + "." + signatureB64;

    const res = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: `grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=${jwt}`
    });

    const data = await res.json();
    if (!data.access_token) {
        throw new Error("Failed to obtain Google access token: " + JSON.stringify(data));
    }

    cachedGoogleToken = data.access_token;
    tokenExpiresAt = now + (data.expires_in || 3600);
    return cachedGoogleToken;
}

/**
 * إرسال إشعار Push حقيقي عبر سيرفرات جوجل Google Cloud Messaging
 * @param {Object} options
 * @param {string} options.title عنوان الإشعار
 * @param {string} options.body نص الإشعار
 * @param {string} [options.topic] القناة (افتراضياً: all_users)
 * @param {string} [options.token] توكن جهاز محدد
 * @param {string} [options.userId] معرف المستخدم لإرساله لقناته الخاصة user_{userId}
 * @param {Object} [options.data] بيانات إضافية
 */
async function sendFcmPush({ title, body, topic = 'all_users', token = null, userId = null, data = {} }) {
    try {
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
        } else if (userId) {
            messagePayload.topic = `user_${userId}`;
        } else {
            messagePayload.topic = topic;
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
        console.log("✅ FCM v1 Push sent successfully:", result);
        return { success: res.ok, result };
    } catch (err) {
        console.error("❌ FCM Push Error:", err);
        return { success: false, error: err.message };
    }
}

// إتاحتها globally
window.sendFcmPush = sendFcmPush;
export { sendFcmPush, getGoogleAccessToken };
