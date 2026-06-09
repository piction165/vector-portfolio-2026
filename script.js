const track = document.querySelector("[data-shorts-track]");
const prevButton = document.querySelector("[data-carousel-prev]");
const nextButton = document.querySelector("[data-carousel-next]");
const contactForm = document.querySelector("[data-contact-form]");
const contactNote = document.querySelector("[data-contact-note]");

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
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, email, message }),
      });

      if (!response.ok) {
        throw new Error("Failed to send inquiry");
      }

      contactForm.reset();
      if (contactNote) contactNote.textContent = "문의가 전송되었습니다. 빠르게 확인하겠습니다.";
    } catch (error) {
      if (contactNote) {
        contactNote.textContent = "전송에 실패했습니다. 잠시 후 다시 시도하거나 vector@geekble.kr로 보내주세요.";
      }
    } finally {
      if (button) button.disabled = false;
    }
  });
}
