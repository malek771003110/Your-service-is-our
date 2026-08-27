// ai-assistant.js
// Logic for Khedmtek AI Assistant — powered by secure Netlify Serverless Function

// المفتاح السري محمي ومخفي داخل Netlify Functions ولا يظهر في الكود أبداً
const AI_PROXY_URL = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.protocol === 'file:')
    ? 'https://khedmtek.netlify.app/.netlify/functions/ai-assistant'
    : '/.netlify/functions/ai-assistant';

const SYSTEM_PROMPT = `أنت "المعلم الذكي" 🛠️، المساعد الخبير والعبقري لمنصة "خدمتك" الأردنية 🇯🇴.
مع كل رسالة، سيرفق لك النظام قائمة بالمهنيين المتوفرين.
تعليماتك الصارمة جداً:
1. 🎨 استخدم الإيموجي (Emojis) بشكل جميل ومناسب.
2. ⚠️ تحذير هام جداً: لا تقم أبداً بترشيح أو ذكر أي مهني من القائمة إذا كان سؤال المستخدم عن كيفية استخدام التطبيق أو الموقع (مثل تسجيل الدخول، المفضلة، كلمة السر). أجب على سؤاله فقط وبشكل مختصر!
3. 💡 للتشخيص الفني (فقط إذا سأل عن مشكلة بالمنزل أو عطل): أعطه تشخيصاً ذكياً ومفصلاً بـ 3-5 أسطر يشرح الأسباب المحتملة والحلول الممكنة بشكل احترافي ووافي، ثم رشح له أفضل مهني واحد أو اثنين فقط من القائمة المرفقة ليساعده في الحل. لا تسرد كل القائمة أبداً.
4. 📱 لدعم استخدام الموقع والتطبيق (أجب باختصار وبدون ذكر مهنيين):
   - كيف أحجز؟: "اضغط على زر 'اتصال' 📞 أو 'واتساب' 💬 الموجود ببطاقة المهني."
   - كيف أضيف للمفضلة؟: "اكبس على قلب الحب ❤️ اللي على بطاقة المهني."
   - كيف أقيم مهني؟: "اكبس على زر 'تقييم' ⭐ من بطاقته."
   - نسيت كلمة السر / تعديل الحساب: "من صفحة 'حسابي' أو شاشة تسجيل الدخول بتقدر تعدل بياناتك أو تسترجع كلمة السر بسهولة."
5. 🇯🇴 تحدث بلهجة أردنية محببة وقريبة للقلب ومحترمة.
6. 🎯 كن مباشراً ومختصراً. لا تكرر الكلام ولا تطل في الشرح.`;

let chatHistory = [];

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

    if (chatToggleBtn) chatToggleBtn.addEventListener('click', toggleChat);
    if (closeChatBtn)  closeChatBtn.addEventListener('click', toggleChat);
    if (sendBtn)       sendBtn.addEventListener('click', handleSend);
    if (chatInput) {
        chatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') handleSend();
        });
    }

    setTimeout(() => {
        addMessage("model", "يا هلا! أنا مساعدك الذكي من 'خدمتك' 🤖. بقدر أنصحك فنياً وأرشحلك أفضل مهني من اللي قدامك! كيف أخدمك اليوم؟ 😊");
    }, 600);
});

function injectChatUI() {
    if (document.getElementById('aiChatWidget')) return;
    document.body.insertAdjacentHTML('beforeend', `
        <div id="aiChatWidget" class="ai-chat-widget">
            <button id="aiChatToggle" class="ai-chat-toggle" title="المساعد الذكي">
                <span class="ai-icon">🤖</span>
                <span class="ai-tooltip">محتاج مساعدة؟</span>
            </button>
            <div id="aiChatWindow" class="ai-chat-window hidden">
                <div class="ai-chat-header">
                    <div class="ai-header-info">
                        <span class="ai-avatar">🤖</span>
                        <div class="ai-title">مساعد خدمتك الذكي</div>
                    </div>
                    <button id="aiCloseChat" class="ai-close-btn">&times;</button>
                </div>
                <div id="aiChatMessages" class="ai-chat-messages"></div>
                <div class="ai-chat-input-area">
                    <input type="text" id="aiChatInput" placeholder="اكتب سؤالك هنا..." autocomplete="off">
                    <button id="aiSendBtn" class="ai-send-btn" title="إرسال">
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
    if (!chatWindow) return;
    chatWindow.classList.toggle('hidden');
    if (!chatWindow.classList.contains('hidden')) {
        chatInput.focus();
        const tip = chatToggleBtn.querySelector('.ai-tooltip');
        if (tip) tip.style.display = 'none';
    }
}

// -- نظام الردود الفورية الذكية (Instant Responses) للأسئلة الشائعة --
const INSTANT_FAQS = [
    {
        keywords: ['تسجيل دخول', 'اسجل دخول', 'سجل دخول', 'كيف ادخل', 'دخول الحساب', 'تسجيل الدخول'],
        reply: `لـ **تسجيل الدخول** 🔐:\n1. اضغط على زر **"تسجيل الدخول"** أعلى الصفحة أو من القائمة الجانبية ☰.\n2. اختر إذا كنت **زبون** أو **مهني**.\n3. أدخل رقم هاتفك أو بريدك وكلمة المرور.\n\nإذا ما عندك حساب بتقدر تعمل حساب جديد بثواني! ✨`
    },
    {
        keywords: ['مفضلة', 'المفضلة', 'احفظ مهني', 'اضيف للمفضلة', 'قلب'],
        reply: `لإضافة أي مهني إلى **المفضلة** ❤️:\n- اضغط على **أيقونة القلب (🤍)** الموجودة في بطاقة المهني.\n- بتقدر ترجع لكل المهنيين اللي حفظتهم بأي وقت من خيار **"مفضلتي"** في القائمة! 📂`
    },
    {
        keywords: ['حجز', 'احجز', 'اتواصل', 'اتصال', 'رقم الهاتف', 'واتساب', 'احكي مع'],
        reply: `للتواصل مع أي مهني 📞💬:\n1. بعد تسجيل دخولك، بتظهرلك أزرار التواصل مباشرة على بطاقة كل مهني.\n2. اضغط على **"اتصال" 📞** للاتصال المباشر، أو **"واتساب" 💬** لبدء محادثة فورية!`
    },
    {
        keywords: ['مقارنة', 'المقارنة', 'اقارن'],
        reply: `لمقارنة المهنيين ⚖️:\n- اضغط على زر **"إضافة للمقارنة" ⚖️** على بطاقات المهنيين (حتى 3 مهنيين).\n- رح يظهرلك شريط المقارنة بالأسفل، اضغط **"مقارنة الآن"** لمشاهدة الفروقات والأسعار جنباً إلى جنب!`
    },
    {
        keywords: ['سجل مهنتك', 'انضم', 'بدي اشتغل', 'تسجيل مهني', 'اسجل كمهني'],
        reply: `بدك تنضم لشبكة مهنيين "خدمتك"؟ 🛠️✨\n- اضغط على زر **"سجل مهنتك الآن"** أعلى الصفحة أو من القائمة.\n- عبي بياناتك وخبرتك ورقمك، وفريقنا رح يراجع طلبك ويفعل حسابك بسرعة!`
    },
    {
        keywords: ['اسمع', 'مرحبا', 'هلا', 'سلام', 'السلام عليكم', 'الو', 'صباح الخير', 'مساء الخير', 'هاي', 'هلو'],
        reply: `يا هلا وغلا بيك! 🇯🇴👋\nأنا **مساعد خدمتك الذكي** 🤖، كيف بقدر أساعدك اليوم؟ سواء بدك تشخيص لعطل بالبيت، أو ترشيح لأفضل مهني، أو استفسار عن الموقع أنا جاهز فوراً! 🛠️`
    },
    {
        keywords: ['مين انت', 'شو بتعمل', 'شو وظيفتك', 'من انت'],
        reply: `أنا **مساعد خدمتك الذكي** 🤖، خبيرك الفني المرشد في منصة "خدمتك" بالأردن 🇯🇴.\nبساعدك في تشخيص الأعطال المنزلية (كهرباء، سباكة، تكييف، نجارة...) وبرشحلك أحسن المهنيين المتوفرين لتصليحها فوراً!`
    }
];

function checkInstantFAQ(query) {
    const cleanQuery = query.toLowerCase().trim();
    for (const faq of INSTANT_FAQS) {
        for (const kw of faq.keywords) {
            if (cleanQuery.includes(kw)) {
                return faq.reply;
            }
        }
    }
    return null;
}

async function handleSend() {
    const text = chatInput.value.trim();
    if (!text) return;

    addMessage("user", text);
    chatInput.value = '';
    chatInput.disabled = true;

    // ⚡ فحص فوري للأسئلة الشائعة للرد بسرعة الصاروخ بدون انتظار الشبكة
    const instantReply = checkInstantFAQ(text);
    if (instantReply) {
        const typingId = addTypingIndicator();
        setTimeout(() => {
            removeElement(typingId);
            addMessage("model", instantReply);
            chatInput.disabled = false;
            chatInput.focus();
        }, 150); // تأخير طبيعي بسيط جداً (0.15 ثانية) لراحة العين
        return;
    }

    const typingId = addTypingIndicator();

    // -- LIVE DOM SCRAPING FOR CONTEXT (فقط للأسئلة الفنية عند الحاجة) --
    let currentContext = "قائمة المهنيين المعروضين أمام المستخدم الآن:\n";
    try {
        const cards = document.querySelectorAll('.professional-card');
        if (cards && cards.length > 0) {
            let proCount = 0;
            cards.forEach((card) => {
                if (proCount < 10) {
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

    // Keep history manageable
    if (chatHistory.length > 6) {
        chatHistory = chatHistory.slice(-6);
    }
    chatHistory.push({
        role: "user",
        parts: [{ text: enhancedText }]
    });

    try {
        const payload = {
            system_instruction: {
                parts: [{ text: SYSTEM_PROMPT }]
            },
            contents: chatHistory,
            generationConfig: {
                temperature: 0.6,
                maxOutputTokens: 1024
            }
        };

        const response = await fetch(AI_PROXY_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            let errMsg = `خطأ في الاتصال (${response.status})`;
            try {
                const errData = await response.json();
                if (errData?.error?.message) errMsg = errData.error.message;
            } catch(e) {
                if (response.status === 404) {
                    errMsg = 'لم يتم رفع ونشر ملفات Netlify بعد.';
                }
            }
            throw new Error(errMsg);
        }

        const data = await response.json();
        removeElement(typingId);

        const reply = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (reply) {
            chatHistory.push({
                role: "model",
                parts: [{ text: reply }]
            });
            addMessage("model", reply);
        } else {
            throw new Error('لم يتم استلام رد من المساعد.');
        }

    } catch (error) {
        removeElement(typingId);
        chatHistory.pop(); // Remove the last user message on failure
        addMessage("model", `عذراً، حدث خطأ أثناء الاتصال بالمساعد الذكي 😕\n(${error.message})`);
        console.error('AI Gemini Error:', error);
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
