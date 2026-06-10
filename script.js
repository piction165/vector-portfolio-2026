const track = document.querySelector("[data-shorts-track]");
const prevButton = document.querySelector("[data-carousel-prev]");
const nextButton = document.querySelector("[data-carousel-next]");
const contactForm = document.querySelector("[data-contact-form]");
const contactNote = document.querySelector("[data-contact-note]");
const inquiryEndpoint = "https://formsubmit.co/ajax/vector@geekble.kr";
const vectorChatEndpoint = "/api/vector-chat";

if (track && prevButton && nextButton) {
  const getStep = () => {
    const card = track.querySelector(".short-card");
    if (!card) return track.clientWidth;
    const gap = Number.parseFloat(getComputedStyle(track).columnGap || "0");
    return card.getBoundingClientRect().width + gap;
  };

  const updateButtons = () => {
    const maxScroll = track.scrollWidth - track.clientWidth - 2;
    prevButton.disabled = track.scrollLeft <= 2;
    nextButton.disabled = track.scrollLeft >= maxScroll;
  };

  prevButton.addEventListener("click", () => {
    track.scrollBy({ left: -getStep(), behavior: "smooth" });
  });

  nextButton.addEventListener("click", () => {
    track.scrollBy({ left: getStep(), behavior: "smooth" });
  });

  track.addEventListener("scroll", updateButtons, { passive: true });
  window.addEventListener("resize", updateButtons);
  updateButtons();
}

if (contactForm) {
  contactForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const data = new FormData(contactForm);
    const title = String(data.get("title") || "").trim();
    const email = String(data.get("email") || "").trim();
    const message = String(data.get("message") || "").trim();
    const button = contactForm.querySelector('button[type="submit"]');

    if (button) button.disabled = true;
    if (contactNote) contactNote.textContent = "문의 내용을 전송하는 중입니다.";

    try {
      const response = await fetch(inquiryEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          _subject: `[Vector World 문의] ${title}`,
          _template: "table",
          _captcha: "false",
          _replyto: email,
          title,
          email,
          message: message || "(내용 없음)",
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to send inquiry");
      }

      const result = await response.json();
      const needsActivation = String(result.message || "").toLowerCase().includes("activation");

      if (result.success === "false" && !needsActivation) {
        throw new Error("Failed to send inquiry");
      }

      contactForm.reset();
      if (contactNote) {
        contactNote.textContent = needsActivation
          ? "수신 메일함에서 FormSubmit 확인 링크를 한 번 승인하면 문의 수신이 시작됩니다."
          : "문의가 전송되었습니다. 빠르게 확인하겠습니다.";
      }
    } catch (error) {
      if (contactNote) {
        contactNote.textContent = "전송에 실패했습니다. 잠시 후 다시 시도하거나 vector@geekble.kr로 보내주세요.";
      }
    } finally {
      if (button) button.disabled = false;
    }
  });
}

const createConsultChat = () => {
  if (document.querySelector("[data-consult-chat]")) return;

  document.body.insertAdjacentHTML(
    "beforeend",
    `
      <aside class="consult-chat" data-consult-chat>
        <button class="consult-chat-toggle" type="button" aria-label="상담 챗봇 열기" data-chat-toggle>
          <span>상담</span>
        </button>
        <section class="consult-chat-panel" aria-label="상담 챗봇" data-chat-panel hidden>
          <header class="consult-chat-head">
            <div>
              <span>Vector Bot</span>
              <strong>프로젝트 상담</strong>
            </div>
            <button type="button" aria-label="상담 챗봇 닫기" data-chat-close>×</button>
          </header>
          <div class="consult-chat-messages" data-chat-messages>
            <p class="bot-message">안녕하세요. 로봇 제작, eP 커스텀, 행사 운영, 영상 제작 중 어떤 상담이 필요하신가요?</p>
          </div>
          <div class="consult-chat-options" data-chat-options>
            <button type="button" data-chat-topic="eP 로봇 커스텀">eP 로봇 커스텀</button>
            <button type="button" data-chat-topic="Physical Robot 제작">Physical Robot 제작</button>
            <button type="button" data-chat-topic="마케팅/영상 제작">마케팅/영상 제작</button>
            <button type="button" data-chat-topic="행사/전시 운영">행사/전시 운영</button>
          </div>
          <form class="consult-chat-form" data-chat-form>
            <textarea name="message" rows="3" placeholder="궁금한 내용을 입력하세요." required></textarea>
            <input name="contact" type="text" autocomplete="email" placeholder="연락처 또는 이메일 선택 입력" />
            <div class="consult-chat-actions">
              <button type="submit">보내기</button>
              <button type="button" data-chat-notify>요약 보내기</button>
            </div>
            <p data-chat-note>상담을 이어가다가 필요하면 연락처를 남겨주세요.</p>
          </form>
        </section>
      </aside>
    `
  );

  const chat = document.querySelector("[data-consult-chat]");
  const toggle = chat.querySelector("[data-chat-toggle]");
  const panel = chat.querySelector("[data-chat-panel]");
  const close = chat.querySelector("[data-chat-close]");
  const messages = chat.querySelector("[data-chat-messages]");
  const options = chat.querySelector("[data-chat-options]");
  const form = chat.querySelector("[data-chat-form]");
  const notifyButton = chat.querySelector("[data-chat-notify]");
  const note = chat.querySelector("[data-chat-note]");
  let topic = "일반 문의";
  let history = [];

  const setOpen = (isOpen) => {
    panel.hidden = !isOpen;
    toggle.setAttribute("aria-label", isOpen ? "상담 챗봇 닫기" : "상담 챗봇 열기");
  };

  const appendMessage = (text, type) => {
    const message = document.createElement("p");
    message.className = type === "user" ? "user-message" : "bot-message";
    message.textContent = text;
    messages.appendChild(message);
    messages.scrollTop = messages.scrollHeight;
  };

  const askVectorChat = async (message) => {
    note.textContent = "답변을 준비하는 중입니다.";

    const response = await fetch(vectorChatEndpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        topic,
        message,
        contact: String(new FormData(form).get("contact") || "").trim(),
        history,
      }),
    });

    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.error || "chat_failed");
    }

    return String(result.reply || "").trim();
  };

  const sendMessage = async (message) => {
    const text = String(message || "").trim();
    if (!text) return;

    const button = form.querySelector('button[type="submit"]');
    appendMessage(text, "user");
    history.push({ role: "user", content: text });

    if (button) button.disabled = true;
    try {
      const reply = await askVectorChat(text);
      const safeReply = reply || "좋습니다. 프로젝트 목적과 일정, 필요한 산출물을 조금 더 알려주세요.";
      appendMessage(safeReply, "bot");
      history.push({ role: "assistant", content: safeReply });
      history = history.slice(-10);
      note.textContent = "견적이나 미팅이 필요하면 이메일/연락처를 남겨주세요.";
    } catch (error) {
      appendMessage("지금 자동 상담 연결이 불안정합니다. 프로젝트 내용과 연락처를 vector@geekble.kr로 보내주시면 확인하겠습니다.", "bot");
      note.textContent = "일시적으로 답변 생성에 실패했습니다.";
    } finally {
      if (button) button.disabled = false;
    }
  };

  toggle.addEventListener("click", () => setOpen(panel.hidden));
  close.addEventListener("click", () => setOpen(false));

  options.addEventListener("click", (event) => {
    const button = event.target.closest("[data-chat-topic]");
    if (!button) return;

    topic = button.dataset.chatTopic || "일반 문의";
    sendMessage(`${topic} 관련 상담을 받고 싶습니다.`);
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const data = new FormData(form);
    const message = String(data.get("message") || "").trim();
    const messageField = form.querySelector('textarea[name="message"]');
    if (messageField) messageField.value = "";
    await sendMessage(message);
  });

  notifyButton.addEventListener("click", async () => {
    if (history.length === 0) {
      note.textContent = "먼저 상담 대화를 시작해주세요.";
      return;
    }

    const data = new FormData(form);
    const contact = String(data.get("contact") || "").trim();

    notifyButton.disabled = true;
    note.textContent = "상담 내용을 요약해 전송하는 중입니다.";

    try {
      const response = await fetch(vectorChatEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "notify", topic, contact, history }),
      });
      const result = await response.json();

      if (!response.ok || !result.ok) {
        throw new Error(result.error || "notification_failed");
      }

      appendMessage("상담 요약을 Vector에게 보냈습니다. 연락처를 남겼다면 확인 후 회신드릴게요.", "bot");
      note.textContent = "상담 요약이 vector@geekble.kr로 전송되었습니다.";
    } catch (error) {
      note.textContent = "요약 전송에 실패했습니다. 대화 내용을 복사해 vector@geekble.kr로 보내주세요.";
    } finally {
      notifyButton.disabled = false;
    }
  });
};

createConsultChat();
