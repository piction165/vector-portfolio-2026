const track = document.querySelector("[data-shorts-track]");
const prevButton = document.querySelector("[data-carousel-prev]");
const nextButton = document.querySelector("[data-carousel-next]");
const contactForm = document.querySelector("[data-contact-form]");
const contactNote = document.querySelector("[data-contact-note]");
const inquiryEndpoint = "https://formsubmit.co/ajax/vector@geekble.kr";

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
            <p class="bot-message">어떤 작업을 상담할까요? 아래에서 가까운 항목을 골라주세요.</p>
          </div>
          <div class="consult-chat-options" data-chat-options>
            <button type="button" data-chat-topic="eP 로봇 커스텀">eP 로봇 커스텀</button>
            <button type="button" data-chat-topic="Physical Robot 제작">Physical Robot 제작</button>
            <button type="button" data-chat-topic="마케팅/영상 제작">마케팅/영상 제작</button>
            <button type="button" data-chat-topic="행사/전시 운영">행사/전시 운영</button>
          </div>
          <form class="consult-chat-form" data-chat-form>
            <input name="email" type="email" autocomplete="email" placeholder="회신 받을 이메일" required />
            <textarea name="message" rows="3" placeholder="프로젝트 내용, 일정, 예산감 등을 적어주세요." required></textarea>
            <button type="submit">상담 보내기</button>
            <p data-chat-note>선택한 항목과 메시지가 vector@geekble.kr로 전달됩니다.</p>
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
  const note = chat.querySelector("[data-chat-note]");
  let topic = "일반 문의";

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

  toggle.addEventListener("click", () => setOpen(panel.hidden));
  close.addEventListener("click", () => setOpen(false));

  options.addEventListener("click", (event) => {
    const button = event.target.closest("[data-chat-topic]");
    if (!button) return;

    topic = button.dataset.chatTopic || "일반 문의";
    appendMessage(topic, "user");
    appendMessage("좋습니다. 목적, 필요한 산출물, 희망 일정만 간단히 남겨주시면 상담 메일로 정리해둘게요.", "bot");
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const data = new FormData(form);
    const email = String(data.get("email") || "").trim();
    const message = String(data.get("message") || "").trim();
    const button = form.querySelector('button[type="submit"]');

    if (button) button.disabled = true;
    note.textContent = "상담 내용을 전송하는 중입니다.";

    try {
      const response = await fetch(inquiryEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          _subject: `[Vector Bot 상담] ${topic}`,
          _template: "table",
          _captcha: "false",
          _replyto: email,
          topic,
          email,
          message,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to send consultation");
      }

      const result = await response.json();
      const needsActivation = String(result.message || "").toLowerCase().includes("activation");

      if (result.success === "false" && !needsActivation) {
        throw new Error("Failed to send consultation");
      }

      appendMessage("상담 요청이 전송됐습니다. 확인 후 회신드릴게요.", "bot");
      form.reset();
      note.textContent = needsActivation
        ? "수신 메일함에서 FormSubmit 확인 링크를 승인하면 문의 수신이 시작됩니다."
        : "상담 요청이 전송되었습니다.";
    } catch (error) {
      note.textContent = "전송에 실패했습니다. vector@geekble.kr로 직접 보내주세요.";
    } finally {
      if (button) button.disabled = false;
    }
  });
};

createConsultChat();
