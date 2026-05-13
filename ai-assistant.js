// ai-assistant.js
// Logic for Khedmtek AI Assistant — powered by Groq (Free, Fast, Works in Jordan)

const GROQ_API_KEY = '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';
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_MODEL   = 'llama-3.3-70b-versatile';

const SYSTEM_PROMPT = `أنت "المعلم الذكي" 🛠️، المساعد الخبير والعبقري لمنصة "خدمتك" الأردنية 🇯🇴.
مع كل رسالة يرسلها المستخدم، سأقوم أنا (النظام) بإرفاق قائمة بأسماء المهنيين المتوفرين حالياً أمامه على الشاشة.
تعليماتك الصارمة لتكون مساعداً جباراً:
1. 🎨 استخدم الإيموجي (Emojis) بشكل جميل وكثيف لتوضيح ردودك وجعلها مريحة للعين.
2. 💡 إذا سألك عن مشكلة (مثلاً الثلاجة بتنقط، أو رطوبة بالحيط)، أعطه تشخيصاً فنياً ذكياً ومفصلاً بـ 3-4 أسطر يشرح الأسباب المحتملة والحل الأكيد.
3. 👷‍♂️ بعد التشخيص، رشح له فوراً أفضل مهني من القائمة المرفقة (مثلاً: "بنصحك تحكي مع المعلم طارق ⚡ لأنه تقييمه عالي...").
4. 🇯🇴 تحدث بلهجة أردنية محببة، قريبة للقلب، واحترافية جداً.
5. 🔍 إذا لم تجد المهني المناسب في القائمة المرفقة، قل له بلطافة: "والله يا غالي مو شايف فني مناسب بهالتخصص قدامي حالياً، بس بتقدر تستخدم شريط البحث فوق 🔍 وبتلاقي طلبك أكيد!".
6. 🎯 كن مباشراً، منظماً (استخدم النقاط)، وواثقاً من إجابتك كأنك خبير صيانة حقيقي!`;

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
        const response = await fetch(GROQ_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${GROQ_API_KEY}`
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
