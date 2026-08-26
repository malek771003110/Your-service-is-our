// netlify/functions/ai-assistant.js
// Secure serverless function to proxy requests to Google Gemini API

exports.handler = async function (event, context) {
    // Enable CORS for any origin (including localhost during development)
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Content-Type': 'application/json; charset=utf-8'
    };

    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 200,
            headers,
            body: ''
        };
    }

    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            headers,
            body: JSON.stringify({ error: { message: 'Method Not Allowed' } })
        };
    }

    try {
        const apiKey = process.env.GEMINI_API_KEY;
        
        if (!apiKey) {
            return {
                statusCode: 500,
                headers,
                body: JSON.stringify({
                    error: {
                        message: 'مفتاح GEMINI_API_KEY غير موجود في إعدادات البيئة (Environment Variables) في Netlify.'
                    }
                })
            };
        }

        const model = 'gemini-3.6-flash';
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

        const payload = JSON.parse(event.body || '{}');

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        const data = await response.json();

        return {
            statusCode: response.status,
            headers,
            body: JSON.stringify(data)
        };

    } catch (error) {
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({
                error: {
                    message: error.message || 'حدث خطأ في معالجة الطلب في السيرفر'
                }
            })
        };
    }
};
