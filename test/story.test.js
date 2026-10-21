import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');

test('story navigation and local media have valid targets', () => {
  const ids = new Set([...html.matchAll(/\bid="([^"]+)"/g)].map((match) => match[1]));
  const fragments = [...html.matchAll(/\bhref="#([^"]+)"/g)].map((match) => match[1]);
  const missingFragments = fragments.filter((id) => !ids.has(id));
  assert.deepEqual(missingFragments, []);

  const missingAssets = [...html.matchAll(/\b(?:src|href)="(\/assets\/[^\"]+)"/g)]
    .map((match) => match[1])
    .filter((path) => !existsSync(new URL(`..${path}`, import.meta.url)));
  assert.deepEqual(missingAssets, []);
  for (const file of ['tonphueng-footprints.geojson', 'tonphueng-footprints-provenance.json', 'CDLA-Permissive-2.0.txt']) {
    assert.ok(existsSync(new URL(`../public/data/${file}`, import.meta.url)), `production data asset ${file} must be shipped`);
  }

  const images = [...html.matchAll(/<img\b[^>]*>/g)].map(([tag]) => tag);
  assert.ok(images.length > 0);
  assert.ok(images.every((tag) => /\balt="[^"]+"/.test(tag)), 'all story photographs need descriptive alt text');

  const chapterLinks = [...html.matchAll(/<a\b[^>]*>/g)]
    .map(([tag]) => ({ tag, target: tag.match(/\bhref="#([^"]+)"/)?.[1] }))
    .filter(({ tag }) => /\bclass="(?:hero-link|text-link)"/.test(tag))
    .map(({ target }) => target);
  assert.deepEqual(chapterLinks.slice(0, 4), ['chapter-land', 'chapter-village', 'chapter-hills', 'forest']);
});
