const tabs = document.querySelectorAll('.tab');
const pageContainer = document.querySelector('#page-container');

const setActiveTab = (targetId) => {
  tabs.forEach((tab) => {
    const isActive = tab.dataset.target === targetId;
    tab.classList.toggle('is-active', isActive);
    tab.setAttribute('aria-selected', String(isActive));
  });
};

const loadPage = async (page) => {
  const response = await fetch(`pages/${page}.html`);
  if (!response.ok) {
    pageContainer.innerHTML = '<section class="panel is-active"><h1>Not Found</h1><p>该页面暂不可用。</p></section>';
    return;
  }
  const html = await response.text();
  pageContainer.innerHTML = html;
  const panel = pageContainer.querySelector('.panel');
  if (panel) {
    panel.classList.add('is-active');
    panel.setAttribute('aria-hidden', 'false');
  }
};

const activate = async (tab) => {
  const targetId = tab.dataset.target;
  setActiveTab(targetId);
  await loadPage(tab.dataset.page);
};

tabs.forEach((tab) => {
  tab.addEventListener('click', () => {
    activate(tab);
  });
});

activate(document.querySelector('.tab.is-active'));
