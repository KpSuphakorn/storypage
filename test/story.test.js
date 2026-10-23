import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const mainScript = readFileSync(new URL('../src/main.js', import.meta.url), 'utf8');
const styles = readFileSync(new URL('../src/styles.css', import.meta.url), 'utf8');
const showcaseData = JSON.parse(readFileSync(new URL('../public/data/village-showcase.json', import.meta.url), 'utf8'));

test('off-canvas story menu has an accessible trigger and close paths', () => {
  assert.match(html, /class="menu-toggle"[^>]+aria-expanded="false"[^>]+aria-controls="site-menu"/);
  assert.match(html, /<nav class="site-menu" id="site-menu"[^>]+aria-hidden="true"[^>]+inert/);
  assert.doesNotMatch(html, /site-menu__coordinates/);
  assert.doesNotMatch(html, /07 \/ FIELD FRAGMENTS/);
  assert.match(mainScript, /event\.key === 'Escape'/);
  assert.match(mainScript, /element\.inert = open/);
});

test('story navigation and local media have valid targets', () => {
  const ids = new Set([...html.matchAll(/\bid="([^"]+)"/g)].map((match) => match[1]));
  const fragments = [...html.matchAll(/\bhref="#([^"]+)"/g)].map((match) => match[1]);
  const missingFragments = fragments.filter((id) => !ids.has(id));
  assert.deepEqual(missingFragments, []);

  const missingAssets = [...html.matchAll(/\b(?:src|href)="(\/assets\/[^\"]+)"/g)]
    .map((match) => match[1])
    .filter((path) => !existsSync(new URL(`..${path}`, import.meta.url)));
  assert.deepEqual(missingAssets, []);
  for (const file of ['tonphueng-footprints.geojson', 'tonphueng-footprints-provenance.json', 'CDLA-Permissive-2.0.txt', 'village-showcase.json']) {
    assert.ok(existsSync(new URL(`../public/data/${file}`, import.meta.url)), `production data asset ${file} must be shipped`);
  }

  const images = [...html.matchAll(/<img\b[^>]*>/g)].map(([tag]) => tag);
  assert.ok(images.length > 0);
  assert.ok(images.every((tag) => /\balt="[^"]+"/.test(tag)), 'all story photographs need descriptive alt text');

  const chapterLinks = [...html.matchAll(/<a\b[^>]*>/g)]
    .map(([tag]) => ({ tag, target: tag.match(/\bhref="#([^"]+)"/)?.[1] }))
    .filter(({ tag }) => /\bclass="hero-link"/.test(tag))
    .map(({ target }) => target);
  assert.deepEqual(chapterLinks, ['chapter-land']);
  assert.doesNotMatch(html, /class="text-link"/);
  assert.equal([...html.matchAll(/class="chapter-illustration"/g)].length, 3);
});

test('village showcase renders four API-backed category sliders before field fragments', () => {
  assert.ok(html.indexOf('id="showcase"') < html.indexOf('id="fragments"'));
  assert.match(html, /id="showcase"[^>]+data-services-endpoint="https:\/\/tonphueng-connect\.vercel\.app\/api\/services"/);
  assert.match(html, /id="showcase"[^>]+data-fallback-endpoint="\/data\/village-showcase\.json"/);
  assert.deepEqual(
    showcaseData.categories.map((category) => category.title),
    ['สินค้าชุมชน', 'ที่พัก', 'ร้านอาหาร', 'การท่องเที่ยว / เส้นทางเดินป่า'],
  );

  showcaseData.categories.forEach((category) => {
    assert.ok(category.items.length > 1, `${category.title} needs multiple slider items`);
    category.items.forEach((item) => {
      for (const field of ['name', 'description', 'image', 'alt']) {
        assert.equal(typeof item[field], 'string');
        assert.ok(item[field].length > 0);
      }
      assert.ok(existsSync(new URL(`..${item.image}`, import.meta.url)), `missing showcase image ${item.image}`);
    });
  });

  assert.match(mainScript, /SHOWCASE_CATEGORIES = \[/);
  assert.match(mainScript, /new URL\(showcase\.dataset\.servicesEndpoint, window\.location\.href\)/);
  assert.match(mainScript, /endpoint\.searchParams\.set\('category', apiCategory\)/);
  assert.match(mainScript, /credentials: 'omit'/);
  assert.match(mainScript, /service\?\.photos/);
  assert.match(mainScript, /Promise\.allSettled\(serviceRequests\)/);
  assert.match(mainScript, /showcase\.dataset\.source = liveCategoryCount/);
  assert.match(mainScript, /createShowcaseRow/);
  assert.match(mainScript, /renderItem\(activeIndex - 1, true, -1\)/);
  assert.match(mainScript, /renderItem\(activeIndex \+ 1, true, 1\)/);
  assert.match(mainScript, /media\.insertBefore\(incomingImage, mediaCaption\);[\s\S]*incomingImage\.getBoundingClientRect\(\);[\s\S]*requestAnimationFrame/);
  assert.match(mainScript, /SHOWCASE_AUTO_INTERVAL = 10000/);
  assert.match(mainScript, /SHOWCASE_START_STAGGER = 2500/);
  assert.match(mainScript, /SHOWCASE_AUTO_INTERVAL \+ categoryIndex \* SHOWCASE_START_STAGGER/);
  assert.doesNotMatch(mainScript, /showcase-(?:dots|count|info__eyebrow)/);
  assert.ok(showcaseData.categories.every((category) => !('eyebrow' in category)));
  assert.match(styles, /\.showcase-row:nth-child\(even\) \.showcase-info/);
  assert.match(styles, /grid-template-columns: minmax\(310px,\.792fr\) minmax\(0,1\.208fr\)/);
  assert.match(styles, /\.showcase-media__image\.is-leaving-left/);
  assert.match(styles, /\.showcase-row:nth-child\(odd\) \.showcase-copy\.is-wiping-out \{ animation: showcase-copy-out-ltr/);
  assert.match(styles, /\.showcase-row:nth-child\(even\) \.showcase-copy\.is-wiping-out \{ animation: showcase-copy-out-rtl/);
  assert.match(styles, /@keyframes showcase-copy-in-ltr/);
  assert.match(styles, /@keyframes showcase-copy-in-rtl/);
  assert.match(styles, /@media \(width <= 760px\) \{[\s\S]*\.showcase-row, \.showcase-row:nth-child\(even\) \{[^}]*grid-template-columns: repeat\(12,minmax\(0,1fr\)\)/);
  assert.match(styles, /\.showcase-row \.showcase-info, \.showcase-row:nth-child\(even\) \.showcase-info \{[^}]*grid-column: 1 \/ 9;[^}]*grid-row: 1/);
  assert.match(styles, /\.showcase-row:nth-child\(even\) \.showcase-info \{ grid-column: 5 \/ 13 \}/);
  assert.match(styles, /\.showcase-row:nth-child\(even\) \.showcase-media \{ grid-column: 1 \/ 9 \}/);
});

test('story gradients are driven by scroll progress and grid captions are unnumbered', () => {
  const mosaic = html.match(/<section class="field-mosaic"[\s\S]*?<\/section>/)?.[0] ?? '';
  assert.equal([...html.matchAll(/\bclass="[^"]*\bscroll-gradient\b/g)].length, 3);
  assert.match(html, /class="place-profile scroll-gradient"/);
  assert.match(mainScript, /getBoundingClientRect\(\)/);
  assert.match(mainScript, /--flare-x/);
  assert.match(mainScript, /window\.addEventListener\('scroll'/);
  assert.doesNotMatch(mosaic, /<figcaption><span>\d{2}<\/span>/);
  assert.match(mainScript, /const mosaicFrames =/);
  assert.match(mainScript, /viewportHeight \* 0\.98 - bounds\.top/);
  assert.match(mainScript, /frame\.style\.opacity = eased\.toFixed\(3\)/);
  assert.match(mainScript, /translate3d\(0, \$\{\(\(1 - eased\) \* 82\)/);
});

test('place statistics count quickly to their displayed values', () => {
  assert.deepEqual([...html.matchAll(/data-count-to="(\d+)"/g)].map((match) => match[1]), ['983', '333', '8', '10', '1055']);
  assert.match(mainScript, /new IntersectionObserver/);
  assert.match(mainScript, /\/ 760/);
  assert.match(mainScript, /getBoundingClientRect\(\)\.top < 0/);
  assert.match(mainScript, /observer\.unobserve\(counter\)/);
});

test('map story separates text cards from the complete vertical image reel', () => {
  assert.match(html, /class="atlas__story-grid" id="story"/);
  assert.doesNotMatch(html, /chapter-copy__media/);
  assert.doesNotMatch(html, /FIELD IMAGES · 01—06/);
  assert.doesNotMatch(html, /atlas-gallery__slide[^]*?<figcaption><span>\d{2}<\/span>/);
  assert.equal([...html.matchAll(/class="atlas-gallery__slide"/g)].length, 6);
  assert.match(mainScript, /atlasGalleryTrack\.scrollHeight - viewportHeight/);
  assert.match(mainScript, /const GALLERY_SCROLL_SPEED = 2/);
  assert.match(mainScript, /Math\.max\(0, -storyBounds\.top\) \* GALLERY_SCROLL_SPEED/);
  assert.match(mainScript, /translate3d\(0, \$\{-galleryOffset\}px, 0\)/);
  assert.match(mainScript, /slide\.style\.setProperty\('--slide-opacity'/);
  assert.match(styles, /grid-template-columns: minmax\(390px,1\.02fr\) minmax\(300px,\.68fr\)/);
  assert.match(styles, /\.map-chapter \{ height: 126svh/);
});

test('map ending holds its frame and crossfades into the forest story', () => {
  assert.match(html, /class="field-story__hero atlas__exit-preview" aria-hidden="true"/);
  assert.match(html, /class="atlas__exit" aria-hidden="true"/);
  assert.match(styles, /\.atlas__exit \{[^}]*height: 230svh/);
  assert.match(styles, /\.field-story--forest \{[^}]*margin-top: -100svh/);
  assert.match(mainScript, /\(exitProgress - 0\.56\) \/ 0\.44/);
  assert.match(mainScript, /--atlas-exit-opacity/);
  assert.match(mainScript, /--forest-reveal/);
});
