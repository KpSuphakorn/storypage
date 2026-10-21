import test from 'node:test';
import assert from 'node:assert/strict';
import { createBaseTileErrorHandler } from '../src/map-errors.js';

test('repeated base-vector tile failures reveal the real-photo fallback', () => {
  const classes = new Set(['is-ready']);
  const stage = { classList: { add: (name) => classes.add(name) } };
  const status = { textContent: 'แผนที่ภูมิประเทศ · บ้านต้นผึ้ง' };
  const showFallback = (message) => {
    stage.classList.add('is-fallback');
    status.textContent = message;
  };
  const handler = createBaseTileErrorHandler(showFallback);

  assert.equal(handler.handleError({ sourceId: 'openmaptiles' }, true), false);
  assert.equal(handler.handleError({ sourceId: 'openmaptiles' }, true), false);
  assert.equal(handler.handleError({ sourceId: 'openmaptiles' }, true), true);
  assert.ok(classes.has('is-fallback'));
  assert.match(status.textContent, /ภาพป่าชุมชนบ้านต้นผึ้ง/);
});

test('an initial base-source metadata failure keeps the photo fallback after load', () => {
  const classes = new Set();
  const stage = {
    classList: {
      add: (name) => classes.add(name),
      remove: (name) => classes.delete(name),
    },
  };
  const status = { textContent: '' };
  const showFallback = (message) => {
    stage.classList.add('is-fallback');
    status.textContent = message;
  };
  const handler = createBaseTileErrorHandler(showFallback);

  assert.equal(handler.handleError({ sourceId: 'openmaptiles' }, false), true);
  assert.ok(classes.has('is-fallback'));

  if (handler.handleLoad()) {
    stage.classList.remove('is-fallback');
    stage.classList.add('is-ready');
    status.textContent = 'แผนที่ภูมิประเทศ · บ้านต้นผึ้ง';
  }

  assert.ok(classes.has('is-fallback'));
  assert.ok(!classes.has('is-ready'));
  assert.match(status.textContent, /แสดงภาพป่าชุมชนบ้านต้นผึ้ง/);
  assert.doesNotMatch(status.textContent, /แผนที่ภูมิประเทศ/);
});
