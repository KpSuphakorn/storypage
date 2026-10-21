import test from 'node:test';
import assert from 'node:assert/strict';
import { isVillageMarkerVisible } from '../src/location-visibility.js';

test('mobile village marker stays hidden for the hero until the chapter is well into view', () => {
  const state = { isMobile: true, chapterTop: 809, viewportHeight: 812 };
  assert.equal(isVillageMarkerVisible({ ...state, scrollY: 0 }), false);
  assert.equal(isVillageMarkerVisible({ ...state, scrollY: 280 }), false);
  assert.equal(isVillageMarkerVisible({ ...state, scrollY: 282 }), true);
  assert.equal(isVillageMarkerVisible({ ...state, scrollY: 0 }), false);
  const resized = { ...state, viewportHeight: 700 };
  assert.equal(isVillageMarkerVisible({ ...resized, scrollY: 300 }), false);
  assert.equal(isVillageMarkerVisible({ ...resized, scrollY: 355 }), true);
});

test('desktop keeps the geographic marker visible in every chapter', () => {
  assert.equal(isVillageMarkerVisible({ isMobile: false, scrollY: 0, chapterTop: 900, viewportHeight: 800 }), true);
});
