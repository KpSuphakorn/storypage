import 'maplibre-gl/dist/maplibre-gl.css';
import './styles.css';

const menuToggle = document.querySelector('.menu-toggle');
const siteMenu = document.querySelector('#site-menu');
const menuScrim = document.querySelector('.menu-scrim');
const pageContent = document.querySelectorAll('main, .sources');

function setMenuOpen(open, restoreFocus = true) {
  document.body.classList.toggle('menu-open', open);
  menuToggle?.setAttribute('aria-expanded', String(open));
  menuToggle?.setAttribute('aria-label', open ? 'ปิดเมนู' : 'เปิดเมนู');
  siteMenu?.setAttribute('aria-hidden', String(!open));
  if (siteMenu) siteMenu.inert = !open;
  pageContent.forEach((element) => { element.inert = open; });
  if (open) siteMenu?.querySelector('a')?.focus();
  else if (restoreFocus) menuToggle?.focus();
}

menuToggle?.addEventListener('click', () => setMenuOpen(menuToggle.getAttribute('aria-expanded') !== 'true'));
menuScrim?.addEventListener('click', () => setMenuOpen(false));
siteMenu?.addEventListener('click', (event) => {
  if (event.target.closest('a')) setMenuOpen(false, false);
});
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && menuToggle?.getAttribute('aria-expanded') === 'true') setMenuOpen(false);
});

const scrollGradients = [...document.querySelectorAll('.scroll-gradient')];
const mosaicFrames = [...document.querySelectorAll('.mosaic-frame')];
const cinematicCover = document.querySelector('#cinematic-cover');
const cinematicHero = document.querySelector('.cinematic-hero');
const atlasStory = document.querySelector('#story');
const atlasGalleryTrack = document.querySelector('.atlas-gallery__track');
const atlasGallerySlides = [...document.querySelectorAll('.atlas-gallery__slide')];
const atlasStage = document.querySelector('#atlas-stage');
const atlasExit = document.querySelector('.atlas__exit');
const forestStory = document.querySelector('#forest');
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const GALLERY_SCROLL_SPEED = 2;
let scrollFrame = 0;

function updateScrollEffects() {
  scrollFrame = 0;
  const viewportHeight = window.innerHeight;

  if (cinematicCover) {
    const wipeDistance = viewportHeight * 0.95;
    const rawWipe = window.scrollY / Math.max(1, wipeDistance);
    const wipeProgress = reducedMotion.matches
      ? (window.scrollY > 40 ? 1 : 0)
      : Math.min(1, Math.max(0, rawWipe));
    cinematicCover.style.setProperty('--cover-wipe', wipeProgress.toFixed(3));

    if (cinematicHero) {
      const rawExit = (window.scrollY - wipeDistance) / Math.max(1, viewportHeight * 0.45);
      const exitProgress = reducedMotion.matches
        ? (window.scrollY > wipeDistance ? 1 : 0)
        : Math.min(1, Math.max(0, rawExit));
      cinematicHero.style.setProperty('--hero-exit', exitProgress.toFixed(3));
      cinematicHero.style.visibility = exitProgress >= 0.99 ? 'hidden' : 'visible';
      cinematicHero.style.pointerEvents = exitProgress >= 0.85 ? 'none' : 'auto';
    }
  }

  scrollGradients.forEach((section) => {
    const bounds = section.getBoundingClientRect();
    const rawProgress = (viewportHeight - bounds.top) / (viewportHeight + bounds.height);
    const progress = reducedMotion.matches ? 0.5 : Math.min(1, Math.max(0, rawProgress));
    const glow = 0.44 + Math.sin(progress * Math.PI) * 0.42;

    section.style.setProperty('--flare-x', `${14 + progress * 72}%`);
    section.style.setProperty('--flare-y', `${72 - progress * 52}%`);
    section.style.setProperty('--gradient-angle', `${132 + progress * 54}deg`);
    section.style.setProperty('--gradient-shift-x', `${(progress - 0.5) * 12}%`);
    section.style.setProperty('--gradient-shift-y', `${(progress - 0.5) * 10}%`);
    section.style.setProperty('--flare-opacity', glow.toFixed(2));
  });

  mosaicFrames.forEach((frame) => {
    if (reducedMotion.matches) {
      frame.style.removeProperty('opacity');
      frame.style.removeProperty('filter');
      frame.style.removeProperty('transform');
      return;
    }
    const bounds = frame.getBoundingClientRect();
    const rawProgress = (viewportHeight * 0.98 - bounds.top) / (viewportHeight * 0.4);
    const progress = Math.min(1, Math.max(0, rawProgress));
    const eased = progress * progress * (3 - 2 * progress);
    frame.style.opacity = eased.toFixed(3);
    frame.style.filter = `blur(${((1 - eased) * 5).toFixed(2)}px) brightness(${(0.62 + eased * 0.38).toFixed(3)})`;
    frame.style.transform = `translate3d(0, ${((1 - eased) * 82).toFixed(1)}px, 0) scale(${(0.98 + eased * 0.02).toFixed(4)})`;
  });

  if (atlasStage && atlasExit && forestStory) {
    const exitBounds = atlasExit.getBoundingClientRect();
    const exitDistance = Math.max(1, atlasExit.offsetHeight - viewportHeight);
    const exitProgress = Math.min(1, Math.max(0, -exitBounds.top / exitDistance));
    const rawFade = Math.min(1, Math.max(0, (exitProgress - 0.56) / 0.44));
    const exitOpacity = reducedMotion.matches
      ? Number(exitProgress >= 1)
      : rawFade * rawFade * (3 - 2 * rawFade);

    atlasStage.style.setProperty('--atlas-exit-opacity', exitOpacity.toFixed(3));
    forestStory.style.setProperty('--forest-reveal', String(Number(exitProgress >= 0.995)));
  }

  if (!atlasStory || !atlasGalleryTrack) return;
  if (window.innerWidth < 900 || reducedMotion.matches) {
    atlasGalleryTrack.style.removeProperty('transform');
    atlasGallerySlides.forEach((slide) => slide.style.removeProperty('--slide-opacity'));
    return;
  }

  const storyBounds = atlasStory.getBoundingClientRect();
  const galleryDistance = Math.max(0, atlasGalleryTrack.scrollHeight - viewportHeight);
  const galleryOffset = Math.min(
    galleryDistance,
    Math.max(0, -storyBounds.top) * GALLERY_SCROLL_SPEED,
  );
  atlasGalleryTrack.style.transform = `translate3d(0, ${-galleryOffset}px, 0)`;
  atlasGallerySlides.forEach((slide) => {
    const slideBounds = slide.getBoundingClientRect();
    const slideCenter = slideBounds.top + slideBounds.height / 2;
    const opacity = Math.min(1, Math.max(0, (slideCenter - viewportHeight * 0.08) / (viewportHeight * 0.3)));
    slide.style.setProperty('--slide-opacity', opacity.toFixed(3));
  });
}

function requestScrollUpdate() {
  if (!scrollFrame) scrollFrame = requestAnimationFrame(updateScrollEffects);
}

window.addEventListener('scroll', requestScrollUpdate, { passive: true });
window.addEventListener('resize', requestScrollUpdate);
reducedMotion.addEventListener?.('change', requestScrollUpdate);
updateScrollEffects();

const counters = [...document.querySelectorAll('[data-count-to]')];

if (!reducedMotion.matches && 'IntersectionObserver' in window) {
  const countObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;

      const counter = entry.target;
      const target = Number(counter.dataset.countTo);
      const startedAt = performance.now();

      function count(now) {
        const progress = Math.min(1, (now - startedAt) / 760);
        const eased = 1 - (1 - progress) ** 3;
        counter.textContent = Math.round(target * eased).toLocaleString('en-US');
        if (progress < 1) requestAnimationFrame(count);
      }

      requestAnimationFrame(count);
      observer.unobserve(counter);
    });
  }, { threshold: 0.55 });

  counters.forEach((counter) => {
    if (counter.getBoundingClientRect().top < 0) return;
    counter.textContent = '0';
    countObserver.observe(counter);
  });
}

const showcase = document.querySelector('#showcase');
const showcaseGrid = document.querySelector('#showcase-grid');
const showcaseStatus = document.querySelector('#showcase-status');
const SHOWCASE_AUTO_INTERVAL = 10000;
const SHOWCASE_START_STAGGER = 2500;
const SHOWCASE_TRANSITION_DURATION = 700;
const SHOWCASE_COPY_SWAP_DELAY = 260;
const SHOWCASE_CATEGORIES = [
  { id: 'community-products', title: 'สินค้าชุมชน', apiCategory: 'community_product' },
  { id: 'stays', title: 'ที่พัก', apiCategory: 'accommodation' },
  { id: 'food', title: 'ร้านอาหาร', apiCategory: 'restaurant' },
  { id: 'trails', title: 'การท่องเที่ยว / เส้นทางเดินป่า', apiCategory: 'tourism_trail' },
];

function createShowcaseRow(category, categoryIndex) {
  const items = category.items.filter((item) => (
    typeof item?.name === 'string'
    && typeof item.description === 'string'
    && typeof item.image === 'string'
    && typeof item.alt === 'string'
  ));
  if (!items.length) return null;

  const row = document.createElement('article');
  row.className = 'showcase-row';
  row.dataset.category = category.id || String(categoryIndex + 1);

  const info = document.createElement('div');
  info.className = 'showcase-info';

  const categoryTitle = document.createElement('h3');
  categoryTitle.textContent = category.title;

  const copy = document.createElement('div');
  copy.className = 'showcase-copy';
  copy.setAttribute('aria-live', 'polite');

  const itemName = document.createElement('h4');
  const itemDescription = document.createElement('p');
  copy.append(itemName, itemDescription);

  const controls = document.createElement('div');
  controls.className = 'showcase-controls';

  const previous = document.createElement('button');
  previous.type = 'button';
  previous.className = 'showcase-control';
  previous.setAttribute('aria-label', `ดูรายการก่อนหน้าในหมวด${category.title}`);
  previous.textContent = '←';

  const pause = document.createElement('button');
  pause.type = 'button';
  pause.className = 'showcase-control showcase-control--pause';

  const next = document.createElement('button');
  next.type = 'button';
  next.className = 'showcase-control';
  next.setAttribute('aria-label', `ดูรายการถัดไปในหมวด${category.title}`);
  next.textContent = '→';

  controls.append(previous, pause, next);

  const media = document.createElement('figure');
  media.className = 'showcase-media';

  let image = document.createElement('img');
  image.id = `showcase-image-${categoryIndex + 1}`;
  image.className = 'showcase-media__image';
  image.loading = 'lazy';
  image.decoding = 'async';
  previous.setAttribute('aria-controls', image.id);
  next.setAttribute('aria-controls', image.id);

  const mediaCaption = document.createElement('figcaption');
  media.append(image, mediaCaption);
  info.append(categoryTitle, copy, controls);
  row.append(info, media);

  let activeIndex = 0;
  let isAnimating = false;
  let autoTimer = 0;
  let autoPaused = reducedMotion.matches;

  function updateCopy(item) {
    itemName.textContent = item.name;
    itemDescription.textContent = item.description;
    mediaCaption.textContent = `${category.title} · ${item.name}`;
  }

  function scheduleAuto(delay = SHOWCASE_AUTO_INTERVAL) {
    window.clearTimeout(autoTimer);
    if (autoPaused) return;
    autoTimer = window.setTimeout(() => {
      if (document.hidden || isAnimating) {
        scheduleAuto(1000);
        return;
      }
      renderItem(activeIndex + 1, true, 1);
      scheduleAuto();
    }, delay);
  }

  function setAutoPaused(paused) {
    autoPaused = paused;
    pause.setAttribute('aria-pressed', String(paused));
    pause.setAttribute('aria-label', paused ? `เริ่มเลื่อนอัตโนมัติในหมวด${category.title}` : `หยุดเลื่อนอัตโนมัติในหมวด${category.title}`);
    pause.textContent = paused ? '▶' : 'Ⅱ';
    if (paused) window.clearTimeout(autoTimer);
    else scheduleAuto();
  }

  function renderItem(nextIndex, animate = true, direction = 1) {
    const normalizedIndex = (nextIndex + items.length) % items.length;
    if (isAnimating || (animate && normalizedIndex === activeIndex)) return false;
    const item = items[normalizedIndex];

    if (!animate || reducedMotion.matches) {
      activeIndex = normalizedIndex;
      updateCopy(item);
      image.src = item.image;
      image.alt = item.alt;
      return true;
    }

    isAnimating = true;
    const currentImage = image;
    const imageId = currentImage.id;
    const incomingImage = document.createElement('img');
    incomingImage.className = `showcase-media__image showcase-media__image--incoming ${direction > 0 ? 'is-from-right' : 'is-from-left'}`;
    incomingImage.loading = 'eager';
    incomingImage.decoding = 'async';
    incomingImage.alt = item.alt;

    let transitionStarted = false;
    function startTransition() {
      if (transitionStarted) return;
      transitionStarted = true;
      activeIndex = normalizedIndex;
      media.insertBefore(incomingImage, mediaCaption);
      copy.classList.add('is-wiping-out');
      incomingImage.getBoundingClientRect();

      requestAnimationFrame(() => {
        currentImage.classList.add(direction > 0 ? 'is-leaving-left' : 'is-leaving-right');
        incomingImage.classList.add('is-entering');
      });

      window.setTimeout(() => {
        updateCopy(item);
        copy.classList.remove('is-wiping-out');
        copy.classList.add('is-wiping-in');
      }, SHOWCASE_COPY_SWAP_DELAY);

      window.setTimeout(() => {
        currentImage.remove();
        incomingImage.id = imageId;
        incomingImage.className = 'showcase-media__image';
        image = incomingImage;
        copy.classList.remove('is-wiping-in');
        isAnimating = false;
      }, SHOWCASE_TRANSITION_DURATION);
    }

    incomingImage.addEventListener('load', startTransition, { once: true });
    incomingImage.addEventListener('error', () => { isAnimating = false; }, { once: true });
    incomingImage.src = item.image;
    if (incomingImage.complete && incomingImage.naturalWidth > 0) startTransition();
    return true;
  }

  previous.addEventListener('click', () => {
    if (renderItem(activeIndex - 1, true, -1)) scheduleAuto();
  });
  next.addEventListener('click', () => {
    if (renderItem(activeIndex + 1, true, 1)) scheduleAuto();
  });
  pause.addEventListener('click', () => setAutoPaused(!autoPaused));

  renderItem(0, false);
  setAutoPaused(autoPaused);
  if (!autoPaused) scheduleAuto(SHOWCASE_AUTO_INTERVAL + categoryIndex * SHOWCASE_START_STAGGER);

  return row;
}

async function loadShowcase() {
  if (!showcase || !showcaseGrid || !showcaseStatus) return;

  try {
    const fallbackRequest = fetch(showcase.dataset.fallbackEndpoint, { headers: { Accept: 'application/json' } })
      .then((response) => (response.ok ? response.json() : { categories: [] }))
      .catch(() => ({ categories: [] }));
    const serviceRequests = SHOWCASE_CATEGORIES.map(async ({ apiCategory }) => {
      const services = [];
      let offset = 0;
      let hasMore = true;

      while (hasMore) {
        const endpoint = new URL(showcase.dataset.servicesEndpoint, window.location.href);
        endpoint.searchParams.set('category', apiCategory);
        endpoint.searchParams.set('offset', String(offset));
        const response = await fetch(endpoint, {
          credentials: 'omit',
          headers: { Accept: 'application/json' },
        });
        if (!response.ok) throw new Error(`Service List request failed: ${response.status}`);

        const payload = await response.json();
        const page = Array.isArray(payload?.services) ? payload.services : [];
        services.push(...page);
        offset += page.length;
        hasMore = payload?.hasMore === true && page.length > 0;
      }

      return services;
    });
    const [fallbackPayload, serviceResults] = await Promise.all([
      fallbackRequest,
      Promise.allSettled(serviceRequests),
    ]);
    const fallbackCategories = Array.isArray(fallbackPayload?.categories) ? fallbackPayload.categories : [];
    let liveCategoryCount = 0;
    const categories = SHOWCASE_CATEGORIES.map((category, categoryIndex) => {
      const fallbackCategory = fallbackCategories.find((entry) => entry.id === category.id);
      const fallbackItems = Array.isArray(fallbackCategory?.items) ? fallbackCategory.items : [];
      const result = serviceResults[categoryIndex];
      const services = result.status === 'fulfilled' ? result.value : [];
      if (services.length) liveCategoryCount += 1;
      if (result.status === 'rejected') console.warn(`Showcase category ${category.apiCategory} unavailable`, result.reason);

      const items = services.map((service, itemIndex) => {
        const fallbackItem = fallbackItems[itemIndex % Math.max(fallbackItems.length, 1)];
        const description = typeof service?.description === 'string' && service.description.trim()
          ? service.description.trim()
          : service?.address || 'รายละเอียดกำลังอยู่ระหว่างการอัปเดตจากชุมชน';
        const image = Array.isArray(service?.photos) && service.photos[0]
          ? service.photos[0]
          : fallbackItem?.image;
        return {
          id: service?.id,
          name: service?.name,
          description,
          image,
          alt: `ภาพของ${service?.name || category.title}`,
        };
      }).filter((item) => typeof item.name === 'string' && typeof item.image === 'string');

      return {
        id: category.id,
        title: category.title,
        items: items.length ? items : fallbackItems,
      };
    });
    if (!categories.length) throw new Error('Showcase response has no categories');

    const rows = categories.map(createShowcaseRow).filter(Boolean);
    if (!rows.length) throw new Error('Showcase response has no valid items');

    showcaseGrid.replaceChildren(...rows);
    showcase.dataset.source = liveCategoryCount === SHOWCASE_CATEGORIES.length
      ? 'live'
      : liveCategoryCount > 0 ? 'mixed' : 'fallback';
    showcaseStatus.hidden = true;
  } catch (error) {
    console.error(error);
    showcaseStatus.textContent = 'ยังไม่สามารถโหลดรายการจากชุมชนได้ กรุณาลองใหม่อีกครั้ง';
  }
}

loadShowcase();

requestAnimationFrame(() => {
  const status = document.querySelector('#map-status');
  if (status) status.textContent = 'กำลังเปิดแผนที่ภูมิประเทศ…';
  import('./atlas.js')
    .then(({ initAtlas }) => initAtlas())
    .catch(() => {
      const stage = document.querySelector('#atlas-stage');
      stage?.classList.add('is-fallback');
      const status = document.querySelector('#map-status');
      if (status) status.textContent = 'แสดงภาพป่าชุมชนบ้านต้นผึ้ง';
    });
});
