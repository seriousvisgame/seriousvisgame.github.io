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
  initConstruction();
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

const initConstruction = () => {
  const sidebar = document.querySelector('.sidebar');
  if (!sidebar) return;

  const toggle = sidebar.querySelector('.sidebar-toggle');
  const links = sidebar.querySelectorAll('a[href^="#"]');
  const sections = document.querySelectorAll(
    '.construction-content [id^="facet-"], .construction-content [id^="dimension-"]'
  );
  let activeLockHash = null;
  let lockedTargetY = null;

  const setActiveLink = (hash) => {
    links.forEach((link) => {
      link.classList.toggle('is-active', link.getAttribute('href') === hash);
    });
  };

  const releaseActiveLock = () => {
    activeLockHash = null;
    lockedTargetY = null;
  };

  if (toggle) {
    toggle.addEventListener('click', () => {
      const collapsed = sidebar.classList.toggle('is-collapsed');
      toggle.setAttribute('aria-expanded', String(!collapsed));
    });
  }

  links.forEach((link) => {
    link.addEventListener('click', (event) => {
      event.preventDefault();
      const hash = link.getAttribute('href');
      const target = document.querySelector(hash);
      if (!target) return;

      const headerOffset = 110;
      const targetY = Math.max(
        0,
        window.scrollY + target.getBoundingClientRect().top - headerOffset
      );

      activeLockHash = hash;
      lockedTargetY = targetY;
      setActiveLink(hash);
      window.history.replaceState(null, '', hash);
      window.scrollTo({
        top: targetY,
        behavior: 'smooth',
      });

      if (window.matchMedia('(max-width: 720px)').matches) {
        sidebar.classList.add('is-collapsed');
        if (toggle) toggle.setAttribute('aria-expanded', 'false');
      }
    });
  });

  if (!sections.length) return;

  const observer = new IntersectionObserver(
    (entries) => {
      if (activeLockHash) {
        return;
      }

      const visible = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio);

      if (visible.length) {
        setActiveLink(`#${visible[0].target.id}`);
      }
    },
    {
      rootMargin: '-40% 0px -50% 0px',
      threshold: [0, 0.25, 0.5, 0.75, 1],
    }
  );

  sections.forEach((section) => observer.observe(section));
  window.addEventListener(
    'scroll',
    () => {
      if (activeLockHash === null || lockedTargetY === null) {
        return;
      }

      if (Math.abs(window.scrollY - lockedTargetY) < 6) {
        releaseActiveLock();
      }
    },
    { passive: true }
  );

  const hash = window.location.hash;
  if (hash) {
    setActiveLink(hash);
  } else if (sections[0]) {
    setActiveLink(`#${sections[0].id}`);
  }
};
