const buttons = document.querySelectorAll('[data-filter]');
const cards = document.querySelectorAll('.work-card');

buttons.forEach((button) => {
  button.addEventListener('click', () => {
    buttons.forEach((item) => item.classList.remove('active'));
    button.classList.add('active');
    const filter = button.dataset.filter;
    cards.forEach((card) => {
      card.hidden = filter !== 'all' && card.dataset.kind !== filter;
    });
  });
});

const infoTabs = document.querySelectorAll('[data-info-tab]');
const infoPanels = document.querySelectorAll('[data-info-panel]');

infoTabs.forEach((tab) => {
  tab.addEventListener('click', () => {
    infoTabs.forEach((item) => item.classList.remove('active'));
    tab.classList.add('active');
    infoPanels.forEach((panel) => {
      panel.hidden = panel.dataset.infoPanel !== tab.dataset.infoTab;
    });
  });
});
