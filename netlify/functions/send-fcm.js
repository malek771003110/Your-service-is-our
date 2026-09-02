// netlify/functions/send-fcm.js
// Cloud function to send FCM Push Notifications via HTTP v1 API
const crypto = require('crypto');

const SERVICE_ACCOUNT = {
  project_id: "home-services-app-a9c5e",
  client_email: "firebase-adminsdk-fbsvc@home-services-app-a9c5e.iam.gserviceaccount.com",
  private_key: "-----BEGIN PRIVATE KEY-----\nMIIEvAIBADANBgkqhkiG9w0BAQEFAASCBKYwggSiAgEAAoIBAQDRJaZO+rhgX1UY\nvXQ4QOQF1pbAoOrwa4PkHnnR/nbiedu4ACTQBmseFxw/0h9BOW95nSt0KrOKbnB0\nYHd976PULANX/oYUGGJm/BiibDu7aPhcnXdSfT0q8P/L0HNku/t2gRMLYvx2O8p7\n+1vQlreRC20fGyOuFYG+j6w595jTnHk8qxG6wzz2Ie9mifZ4vbQBGqUFiR7ISmGm\nX28i1l/RRlxqXAnQdVZlyb/GPaRYAnyof58t94bb/5KOofaDM9qbpiFD4kVEkTTP\ndPJmGB57SvU4Si5qhFNnPA8Y1Wugyqq4W9aWnyVC3Ug5GuiRuKljD8VW6AQT7fH9\nL7s3NVCLAgMBAAECggEAB2CO7jLqdVPHhPjhyZODDNsAiZ44y0Qvlx36vrfSv7L8\nAhCB5pM4t2Cp+Wz9oeesZptu9fOvo465CWcsWn/XxTB26bqrm2KEzgx5s05NXmiZ\nzMKCe/a47/PSQgEsoNKp+whwgIf8TxCq2Ba0qrXg7GJ9IIoXhxjGcSSmNuE56HTd\n0uis+kpiEULp5Dkt9jl/lpQh+2/1ufRhJQHePskDxUrXj2TUd6n3+gMgI9+EXSjc\n7TnUdMF60hfL294GpTrI1tjePR0LLPac2UPsZuDQGm7ms2lKb1iOi3HU7FBNVSIP\nJ7RApFYOPhPpAT8jSVAN3rl9evCwvE0WeZT13iAF2QKBgQDv9baxMzti3fL9yUf+\n3nHICdalcbZqgAnw7HHHWeNG/PlEN29MfigGJjVOsu+4c2VEhgQoWhpdVn+R9x4h\nNxYD+28kP/jWxsopit3xkSeUzIFY+lwyGy0eoX2DDAFmncOeTJ3EA5R1OELn24Z/\nhjzTRMy4oTsZ7MEEyZjB3PnxRQKBgQDfIKf6K4mVjBiYAiLm32w+DfY7WitkE798\n8GAZL9ZtSrpXCaX9iNAad2tzN3HGm8tQyJYT3pzxBCh77CwIBquUz8ruU1HnWP9b\n5u1FjRSty2VDPnv5gfzjooX9nnd6Wc5tWMwZOkJ5ipFSw4VdOCYs2qtFziFzqM0C\n6CA1SqqPjwKBgAOPFWKTa/IPcKcq8RJqoi1hV/mkMhxqQbt9BkL6plBLODc2y0PL\nKzTMJEZCiSOnMn1Nr4oZrAJuYf38OEot0vnEJOXYvQwSbrUnBhurF3cxgUmcjPmB\nRa4Knx3uc6bd+CTE5iIeG3mRmAxwSRJjH0vS3WZvnbzIsiQsCUP2zw4xAoGAaElU\nGYpV0O7c49dDxtKwPcS6zHzVgP315whWcg840nY1585bpcdXNLeSIhTM+b4BZi2K\nb5kBk2iVH26AGfQ8J96DA6cvxciD+clSJsrM2noRRz+iJDkMILzqkWKKh0YIRHVX\nV4cyYKpSR/OYlrxSo25E1OiGHA/OWkhyHVZbp6MCgYAVTkmiwM53NezIo63S9OsE\nusCcvqPvF/cN+EBs1obO4D56dNVFitcLw3WTbywvCFy9VRmHYHn+DdB0CNRYXeAo\nyf4KbnNaMbAc6vHnKs4+fHNJ10RlbzxJgZBybwNifuJgcLtMPNiXBlGlRkc6A0Hy\nfVh/iDbZh47XGbcsNDXrrw==\n-----END PRIVATE KEY-----\n"
};

function base64UrlEncode(str) {
  return Buffer.from(str).toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

async function getAccessToken() {
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: 'RS256', typ: 'JWT' };
  const claimSet = {
    iss: SERVICE_ACCOUNT.client_email,
    scope: 'https://www.googleapis.com/auth/firebase.messaging',
    aud: 'https://oauth2.googleapis.com/token',
    exp: now + 3600,
    iat: now
  };

  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedClaimSet = base64UrlEncode(JSON.stringify(claimSet));
  const signatureInput = `${encodedHeader}.${encodedClaimSet}`;

  const signer = crypto.createSign('RSA-SHA256');
  signer.update(signatureInput);
  const signature = signer.sign(SERVICE_ACCOUNT.private_key, 'base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');

  const jwt = `${signatureInput}.${signature}`;

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=${jwt}`
  });

  const data = await res.json();
  if (!data.access_token) {
    throw new Error('Failed to obtain access token: ' + JSON.stringify(data));
  }
  return data.access_token;
}

exports.handler = async function (event, context) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json; charset=utf-8'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method Not Allowed' }) };
  }

  try {
    const payload = JSON.parse(event.body || '{}');
    const { title, body, topic, token, data: customData } = payload;

    if (!title && !body) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'title or body is required' }) };
    }

    const accessToken = await getAccessToken();

    const targetTopic = topic || 'all_users';

    const message = {
      notification: {
        title: title || '📢 تنبيه من تطبيق خدمتك 🇯🇴',
        body: body || ''
      },
      android: {
        priority: 'HIGH',
        notification: {
          channel_id: 'khedmtek_channel',
          sound: 'default',
          priority: 'HIGH',
          default_sound: true,
          default_vibrate_timings: true
        }
      },
      data: {
        click_action: 'FLUTTER_NOTIFICATION_CLICK',
        title: title || '',
        body: body || '',
        ...(customData || {})
      }
    };

    if (token) {
      message.token = token;
    } else {
      message.topic = targetTopic;
    }

    const fcmUrl = `https://fcm.googleapis.com/v1/projects/${SERVICE_ACCOUNT.project_id}/messages:send`;
    const fcmRes = await fetch(fcmUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ message })
    });

    const result = await fcmRes.json();

    return {
      statusCode: fcmRes.status,
      headers,
      body: JSON.stringify({ success: fcmRes.ok, result })
    };

  } catch (err) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: err.message })
    };
  }
};
