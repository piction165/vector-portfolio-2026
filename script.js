const buttons = Array.from(document.querySelectorAll(".filter"));
const items = Array.from(document.querySelectorAll(".work-item"));
const grid = document.querySelector("#workGrid");

if (buttons.length && items.length && grid) {
  const state = {
    year: "all",
    genre: "all",
  };

  function setActiveButton(type, value) {
    buttons
      .filter((button) => button.dataset.filterType === type)
      .forEach((button) => {
        button.classList.toggle("active", button.dataset.filterValue === value);
      });
  }

  function applyFilters() {
    let visibleCount = 0;

    items.forEach((item) => {
      const yearMatch = state.year === "all" || item.dataset.year === state.year;
      const genres = item.dataset.genre.split(" ");
      const genreMatch = state.genre === "all" || genres.includes(state.genre);
      const isVisible = yearMatch && genreMatch;

      item.classList.toggle("is-hidden", !isVisible);
      if (isVisible) visibleCount += 1;
    });

    grid.dataset.empty = visibleCount === 0 ? "true" : "false";
  }

  buttons.forEach((button) => {
    button.addEventListener("click", () => {
      const type = button.dataset.filterType;
      const value = button.dataset.filterValue;
      state[type] = value;
      setActiveButton(type, value);
      applyFilters();
    });
  });

  applyFilters();
}
