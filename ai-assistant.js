// ai-assistant.js
// Logic for Khedmtek AI Assistant — powered by Groq via secure Cloudflare Worker Proxy

// ✅ المفتاح السري محمي داخل Cloudflare Worker ولا يظهر هنا أبداً
const GROQ_PROXY_URL = 'https://long-river-59c4.himour-mk.workers.dev';
const GROQ_MODEL     = 'llama-3.3-70b-versatile';

const SYSTEM_PROMPT = `أنت "المعلم الذكي" 🛠️، المساعد الخبير والعبقري لمنصة "خدمتك" الأردنية 🇯🇴.
مع كل رسالة، سيرفق لك النظام قائمة بالمهنيين المتوفرين.
تعليماتك الصارمة جداً:
1. 🎨 استخدم الإيموجي (Emojis) بشكل جميل.
2. ⚠️ تحذير هام جداً: لا تقم أبداً بترشيح أو ذكر أي مهني من القائمة إذا كان سؤال المستخدم عن كيفية استخدام التطبيق (مثل تسجيل الدخول، المفضلة، كلمة السر). أجب على سؤاله فقط وبشكل مختصر!
3. 💡 للتشخيص الفني (فقط إذا سأل عن مشكلة بالمنزل): أعطه تشخيصاً ذكياً ومفصلاً بـ 5-7 أسطر يشرح الأسباب المحتملة والحلول الممكنة بشكل احترافي ووافي، ثم رشح له أفضل مهني واحد أو اثنين فقط من القائمة المرفقة ليساعده في الحل. لا تسرد كل القائمة أبداً.
4. 📱 لدعم استخدام الموقع والتطبيق (أجب باختصار وبدون ذكر مهنيين):
   - كيف أحجز؟: "اضغط على زر 'اتصال' 📞 أو 'واتساب' 💬 الموجود ببطاقة المهني."
   - كيف أضيف للمفضلة؟: "اكبس على قلب الحب ❤️ اللي على بطاقة المهني."
   - كيف أقيم مهني؟: "اكبس على زر 'تقييم' ⭐ من بطاقته."
   - نسيت كلمة السر / تعديل الحساب: "من صفحة 'حسابي' أو شاشة تسجيل الدخول بتقدر تعدل بياناتك أو تسترجع كلمة السر بسهولة."
5. 🇯🇴 تحدث بلهجة أردنية محببة وقريبة للقلب.
6. 🎯 كن مباشراً ومختصراً جداً. لا تكرر الكلام ولا تطل في الشرح.`;

let chatHistory = [
    { role: "system", content: SYSTEM_PROMPT }
];

let chatWidget, chatWindow, chatMessages, chatInput, chatToggleBtn, closeChatBtn;

document.addEventListener('DOMContentLoaded', () => {
    injectChatUI();

    chatWidget    = document.getElementById('aiChatWidget');
    chatWindow    = document.getElementById('aiChatWindow');
    chatMessages  = document.getElementById('aiChatMessages');
    chatInput     = document.getElementById('aiChatInput');
    chatToggleBtn = document.getElementById('aiChatToggle');
    closeChatBtn  = document.getElementById('aiCloseChat');
    const sendBtn = document.getElementById('aiSendBtn');

    chatToggleBtn.addEventListener('click', toggleChat);
    closeChatBtn.addEventListener('click', toggleChat);
    sendBtn.addEventListener('click', handleSend);
    chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleSend();
    });

    setTimeout(() => {
        addMessage("model", "يا هلا! أنا مساعدك الذكي من 'خدمتك'. بقدر أنصحك فنياً وأرشحلك أفضل مهني من اللي قدامك! كيف أخدمك؟ 😊");
    }, 600);
});

function injectChatUI() {
    if (document.getElementById('aiChatWidget')) return;
    document.body.insertAdjacentHTML('beforeend', `
        <div id="aiChatWidget" class="ai-chat-widget">
            <button id="aiChatToggle" class="ai-chat-toggle">
                <span class="ai-icon">🤖</span>
                <span class="ai-tooltip">احتاج مساعدة؟</span>
            </button>
            <div id="aiChatWindow" class="ai-chat-window hidden">
                <div class="ai-chat-header">
                    <div class="ai-header-info">
                        <span class="ai-avatar">🤖</span>
                        <div class="ai-title">مساعد خدمتك</div>
                    </div>
                    <button id="aiCloseChat" class="ai-close-btn">&times;</button>
                </div>
                <div id="aiChatMessages" class="ai-chat-messages"></div>
                <div class="ai-chat-input-area">
                    <input type="text" id="aiChatInput" placeholder="اكتب سؤالك هنا..." autocomplete="off">
                    <button id="aiSendBtn" class="ai-send-btn">
                        <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                            <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"></path>
                        </svg>
                    </button>
                </div>
            </div>
        </div>
    `);
}

function toggleChat() {
    chatWindow.classList.toggle('hidden');
    if (!chatWindow.classList.contains('hidden')) {
        chatInput.focus();
        const tip = chatToggleBtn.querySelector('.ai-tooltip');
        if (tip) tip.style.display = 'none';
    }
}

async function handleSend() {
    const text = chatInput.value.trim();
    if (!text) return;

    addMessage("user", text);
    chatInput.value = '';
    chatInput.disabled = true;
    const typingId = addTypingIndicator();

    // -- LIVE DOM SCRAPING FOR CONTEXT --
    let currentContext = "قائمة المهنيين المعروضين أمام المستخدم الآن:\n";
    try {
        const cards = document.querySelectorAll('.professional-card');
        if (cards && cards.length > 0) {
            let proCount = 0;
            cards.forEach((card) => {
                if (proCount < 15) { // Pass up to 15 pros
                    const name = card.querySelector('h3')?.innerText.trim() || 'مجهول';
                    const job = card.querySelector('.profession')?.innerText.trim() || '';
                    const city = card.querySelector('.location')?.innerText.replace('📍', '').trim() || '';
                    const rating = card.querySelector('.rating-display > span:not(.rating-count)')?.innerText.trim() || '';
                    currentContext += `- ${name} (${job}) من ${city}. التقييم: ${rating}\n`;
                    proCount++;
                }
            });
        } else {
            currentContext += "لا يوجد أي مهني معروض حالياً على الشاشة.\n";
        }
    } catch(e) {}

    const enhancedText = `[بيانات النظام المخفية]\n${currentContext}\n[رسالة المستخدم الفعلية]\n${text}`;

    // Keep history short (system + last 6 messages) to avoid token overflow
    if (chatHistory.length > 7) {
        chatHistory = [chatHistory[0], ...chatHistory.slice(-6)];
    }
    chatHistory.push({ role: "user", content: enhancedText });

    try {
        const response = await fetch(GROQ_PROXY_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: GROQ_MODEL,
                messages: chatHistory,
                temperature: 0.7,
                max_tokens: 500
            })
        });

        const data = await response.json();
        removeElement(typingId);

        if (!response.ok) {
            const errMsg = data?.error?.message || `خطأ ${response.status}`;
            throw new Error(errMsg);
        }

        const reply = data.choices?.[0]?.message?.content;
        if (reply) {
            chatHistory.push({ role: "assistant", content: reply });
            addMessage("model", reply);
        } else {
            throw new Error('empty response');
        }

    } catch (error) {
        removeElement(typingId);
        chatHistory.pop();
        addMessage("model", `عذراً، حدث خطأ: ${error.message}`);
        console.error('AI Error:', error);
    } finally {
        chatInput.disabled = false;
        chatInput.focus();
    }
}

function addMessage(role, text) {
    const div = document.createElement('div');
    div.className = `ai-message ${role}-message`;
    div.innerHTML = `<div class="ai-bubble">${text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br>')}</div>`;
    chatMessages.appendChild(div);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function addTypingIndicator() {
    const id = 'typing-' + Date.now();
    const div = document.createElement('div');
    div.id = id;
    div.className = 'ai-message model-message';
    div.innerHTML = `<div class="ai-bubble typing-bubble"><span class="ai-dot"></span><span class="ai-dot"></span><span class="ai-dot"></span></div>`;
    chatMessages.appendChild(div);
    chatMessages.scrollTop = chatMessages.scrollHeight;
    return id;
}

function removeElement(id) {
    const el = document.getElementById(id);
    if (el) el.remove();
}
