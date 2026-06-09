const track = document.querySelector("[data-shorts-track]");
const prevButton = document.querySelector("[data-carousel-prev]");
const nextButton = document.querySelector("[data-carousel-next]");

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
