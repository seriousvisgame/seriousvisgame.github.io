const tabs = document.querySelectorAll('.tab');
const pageContainer = document.querySelector('#page-container');
const ACTIVE_PAGE_KEY = 'svg-active-page';

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
  initCorpus();
  initWorkshop();
};

const activate = async (tab) => {
  const targetId = tab.dataset.target;
  setActiveTab(targetId);
  window.sessionStorage.setItem(ACTIVE_PAGE_KEY, tab.dataset.page);
  await loadPage(tab.dataset.page);
};

tabs.forEach((tab) => {
  tab.addEventListener('click', () => {
    activate(tab);
  });
});

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

const initCorpus = async () => {
  const grid = document.querySelector('#corpus-grid');
  if (!grid) return;

  grid.innerHTML = `
    <section class="corpus-empty">
      <h2>Loading corpus...</h2>
      <p>Reading <code>source/corpus.json</code>.</p>
    </section>
  `;
  const facetMap = {
    'Structural Constraints': 'facet-f1',
    'Triggering Conditions': 'facet-f1',
    'Constraints Presentation': 'facet-f2',
    'Failure Encoding': 'facet-f2',
    'Action Adjustment': 'facet-f3',
    'Exploratory Learning': 'facet-f3',
    'Interpretive Reframing': 'facet-f3',
  };

  const designColumns = Object.keys(facetMap);

  try {
    const response = await fetch('source/corpus.json');
    if (!response.ok) {
      throw new Error('Failed to load corpus data');
    }

    const items = await response.json();
    grid.innerHTML = '';
    items.forEach((item) => {
      const article = document.createElement('article');
      article.className = 'corpus-card';

      const topRow = document.createElement('div');
      topRow.className = 'corpus-top-row';

      const idBadge = document.createElement('span');
      idBadge.className = 'corpus-id-badge';
      idBadge.textContent = item.ID;
      topRow.appendChild(idBadge);

      const name = document.createElement('h2');
      name.className = 'corpus-name';
      name.textContent = item.name || 'Untitled';
      topRow.appendChild(name);
      article.appendChild(topRow);

      const image = document.createElement('img');
      image.className = 'corpus-image';
      image.src = `images/corpus_img/${item.ID}.png`;
      image.alt = item.name || 'Corpus image';
      image.loading = 'lazy';
      article.appendChild(image);

      if (item.year) {
        const year = document.createElement('span');
        year.className = 'corpus-meta-pill';
        year.textContent = item.year;
        article.appendChild(year);
      }

      if (item.title) {
        const title = document.createElement('p');
        title.className = 'corpus-title';
        title.innerHTML = '<strong>Title:</strong> ';

        const titleValue = document.createElement('span');
        titleValue.textContent = item.title;
        title.appendChild(titleValue);
        article.appendChild(title);
      }

      const linkRow = document.createElement('p');
      linkRow.className = 'corpus-link-row';
      linkRow.innerHTML = '<strong>Link:</strong> ';

      if (item.link) {
        const link = document.createElement('a');
        link.className = 'corpus-link';
        link.href = item.link;
        link.target = '_blank';
        link.rel = 'noreferrer';
        link.textContent = 'Here';
        linkRow.appendChild(link);
      } else {
        const noLink = document.createElement('span');
        noLink.textContent = 'N/A';
        linkRow.appendChild(noLink);
      }

      article.appendChild(linkRow);

      const tags = document.createElement('div');
      tags.className = 'corpus-tags';

      designColumns.forEach((column) => {
        const rawValue = item[column];
        const values = Array.isArray(rawValue) ? rawValue : [rawValue];

        values.filter(Boolean).forEach((value) => {
          const tag = document.createElement('span');
          tag.className = `corpus-tag ${facetMap[column]}`;
          tag.textContent = value;
          tags.appendChild(tag);
        });
      });

      article.appendChild(tags);
      grid.appendChild(article);
    });
  } catch (error) {
    grid.innerHTML = `
      <section class="corpus-empty">
        <h2>Corpus unavailable</h2>
        <p>Could not load <code>source/corpus.json</code>: ${error.message}</p>
      </section>
    `;
  }
};

const initWorkshop = () => {
  const grid = document.querySelector('#workshop-grid');
  const lightbox = document.querySelector('#workshop-lightbox');
  if (!grid || !lightbox) return;

  const title = document.querySelector('#workshop-lightbox-title');
  const imageContainer = document.querySelector('#workshop-lightbox-images');
  const closeButton = document.querySelector('#workshop-lightbox-close');

  const closeLightbox = () => {
    lightbox.classList.remove('is-open');
    lightbox.setAttribute('aria-hidden', 'true');
    imageContainer.innerHTML = '';
  };

  const openLightbox = (card) => {
    const groupId = card.dataset.group || '';
    const images = Array.from(card.querySelectorAll('.workshop-card-image'));

    title.textContent = `Group ${groupId}`;
    imageContainer.innerHTML = '';

    images.forEach((sourceImage) => {
      const img = document.createElement('img');
      img.src = sourceImage.src;
      img.alt = sourceImage.alt || `Group ${groupId}`;
      img.loading = 'lazy';
      imageContainer.appendChild(img);
    });

    lightbox.classList.add('is-open');
    lightbox.setAttribute('aria-hidden', 'false');
  };

  const layoutMasonry = () => {
    const styles = window.getComputedStyle(grid);
    const rowHeight = Number.parseFloat(styles.getPropertyValue('grid-auto-rows'));
    const gap = Number.parseFloat(styles.getPropertyValue('gap'));
    if (!rowHeight) return;

    const cards = grid.querySelectorAll('.workshop-card');
    cards.forEach((card) => {
      card.style.gridRowEnd = 'auto';
      const span = Math.ceil((card.getBoundingClientRect().height + gap) / (rowHeight + gap));
      card.style.gridRowEnd = `span ${span}`;
    });
  };

  const cards = grid.querySelectorAll('.workshop-card');
  cards.forEach((card) => {
    card.onclick = () => openLightbox(card);
    card.onkeydown = (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        openLightbox(card);
      }
    };

    const images = card.querySelectorAll('.workshop-card-image');
    images.forEach((image) => {
      image.addEventListener('load', layoutMasonry, { once: true });
    });
  });

  layoutMasonry();
  window.requestAnimationFrame(layoutMasonry);

  if (!grid.dataset.masonryBound) {
    window.addEventListener('resize', layoutMasonry);
    grid.dataset.masonryBound = 'true';
  }

  closeButton.onclick = closeLightbox;
  lightbox.onclick = (event) => {
    if (event.target instanceof HTMLElement && event.target.dataset.close === 'true') {
      closeLightbox();
    }
  };

  document.onkeydown = (event) => {
    if (event.key === 'Escape' && lightbox.classList.contains('is-open')) {
      closeLightbox();
    }
  };
};

const getInitialTab = () => {
  const savedPage = window.sessionStorage.getItem(ACTIVE_PAGE_KEY);
  const savedTab = savedPage
    ? document.querySelector(`.tab[data-page="${savedPage}"]`)
    : null;

  if (savedTab) {
    return savedTab;
  }

  return document.querySelector('.tab.is-active');
};

activate(getInitialTab());
