import test from 'node:test';
import assert from 'node:assert/strict';
import { CAMERA_STOPS, cameraTarget, exitCameraTarget, interpolateCamera, mapCameraPadding, storyCameraProgress } from '../src/camera.js';

test('camera interpolation clamps and returns both chapter endpoints', () => {
  const stops = [
    { center: [100, 18], zoom: 10, pitch: 50, bearing: 170 },
    { center: [102, 20], zoom: 14, pitch: 70, bearing: -170 },
  ];
  assert.deepEqual(interpolateCamera(-1, stops), { center: [100, 18], zoom: 10, pitch: 50, bearing: 170 });
  assert.deepEqual(interpolateCamera(1, stops), { center: [102, 20], zoom: 14, pitch: 70, bearing: 190 });
});

test('camera uses shortest bearing path and smooth midpoint', () => {
  const stops = [
    { center: [0, 0], zoom: 10, pitch: 40, bearing: 170 },
    { center: [10, 20], zoom: 14, pitch: 60, bearing: -170 },
  ];
  const midpoint = interpolateCamera(0.5, stops);
  assert.deepEqual(midpoint.center, [5, 10]);
  assert.equal(midpoint.zoom, 12);
  assert.equal(midpoint.pitch, 50);
  assert.equal(midpoint.bearing, 180);
});

test('story camera approaches the village monotonically and holds each chapter pose while copy is read', () => {
  const tops = [1000, 2000, 3000];
  const bottoms = [1450, 2450, 3450];
  const viewportHeight = 800;
  const progress = (scrollY) => storyCameraProgress(tops, scrollY, viewportHeight, bottoms);

  assert.equal(progress(360), 0, 'regional pose holds until the first chapter enters');
  assert.equal(progress(672), 1 / 6, 'first entry transition interpolates halfway to village context');
  assert.equal(progress(984), 1 / 3, 'first chapter settles at its canonical pose');
  assert.equal(progress(1000), 1 / 3, 'camera holds while the first chapter is read');
  assert.equal(cameraTarget(progress(1000), 1, false).zoom, CAMERA_STOPS[1].zoom);
  assert.equal(progress(1672), 1 / 2, 'second chapter entry transitions to the village point');
  assert.equal(progress(2000), 2 / 3, 'camera holds on the village point during the name story');
  assert.equal(cameraTarget(progress(2000), 2, false).zoom, CAMERA_STOPS[2].zoom);
  assert.ok(Math.abs(progress(2672) - 5 / 6) < 1e-12, 'third chapter entry tightens around the same village anchor');
  assert.equal(progress(2984), 1, 'third chapter settles at the close handoff');
  assert.equal(progress(1000), 1 / 3, 'scrolling back restores the first chapter pose');

  const secondChapterTopAtAnchor = storyCameraProgress(tops, 2000, viewportHeight, bottoms);
  assert.equal(secondChapterTopAtAnchor, 2 / 3, 'chapter anchor selects the canonical village camera');
  assert.deepEqual(CAMERA_STOPS[2].center, CAMERA_STOPS[3].center, 'close handoff retains the published village coordinate');
});

test('all canonical camera stops keep approaching without rotating away from the village', () => {
  const zooms = CAMERA_STOPS.map((stop) => stop.zoom);
  assert.deepEqual(zooms, [...zooms].sort((a, b) => a - b));
  assert.ok(zooms[3] > zooms[2], 'the final photo handoff tightens the close-up');
  assert.ok(zooms[3] <= 18.5, 'all stops stay within the supported map zoom');
  assert.ok(CAMERA_STOPS.every((stop) => stop.bearing === -8), 'bearing remains steady through the approach');
  assert.deepEqual(CAMERA_STOPS[2].center, [99.18079999165937, 18.80842873834785]);
  assert.deepEqual(CAMERA_STOPS[3].center, [99.18079999165937, 18.80842873834785]);
});

test('mobile camera holds while the current copy is readable, then approaches the next chapter', () => {
  const tops = [1000, 2000, 2498];
  const bottoms = [1500, 2465, 2900];
  const height = 812;
  const progress = (scrollY) => storyCameraProgress(tops, scrollY, height, bottoms);

  assert.equal(progress(2058), 2 / 3, 'the visible bee story keeps its village close-up while the next article shell is empty');
  assert.equal(progress(2318), 2 / 3, 'approach starts only after the current copy has moved into the upper reading zone');
  assert.ok(progress(2400) > 2 / 3 && progress(2400) < 1, 'the camera advances as the next chapter arrives');
  assert.equal(progress(2482), 1, 'the next canonical pose is reached as the next article enters');
  assert.equal(progress(2058), 2 / 3, 'scrolling back restores the previous chapter hold');
});

test('reduced motion selects an immediate chapter pose instead of a scroll-interpolated camera', () => {
  assert.deepEqual(cameraTarget(0.5, 2, true), CAMERA_STOPS[2]);
  assert.deepEqual(cameraTarget(0.5, 2, false), interpolateCamera(0.5));
});

test('map exit zooms into Ton Phueng, holds, then keeps zooming through the fade', () => {
  assert.equal(exitCameraTarget(0, false).zoom, 17.3);
  assert.equal(exitCameraTarget(0.26, false).zoom, 17.75);
  assert.equal(exitCameraTarget(0.5, false).zoom, 17.75);
  assert.ok(exitCameraTarget(0.75, false).zoom > 17.75);
  assert.equal(exitCameraTarget(1, false).zoom, 18.35);
  assert.deepEqual(exitCameraTarget(0.4, false).center, CAMERA_STOPS.at(-1).center);
  assert.equal(exitCameraTarget(0, true).zoom, 18.35);
});

test('camera padding keeps the true village point clear of cards at mobile and medium widths', () => {
  assert.deepEqual(mapCameraPadding(375, 812, 2), { top: 0, right: 0, bottom: 341, left: 0 });
  assert.equal(mapCameraPadding(768, 1024, 2).right, 180);
  assert.equal(mapCameraPadding(1024, 900, 3).right, 240);
  assert.equal(mapCameraPadding(768, 1024, 1).right, 0, 'neighborhood context keeps its original framing');
  assert.equal(mapCameraPadding(1440, 900, 2).right, 0, 'wide desktop keeps its original framing');
});
