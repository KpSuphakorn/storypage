import { Map as MapLibreMap, setWorkerUrl } from 'maplibre-gl';
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url';
import { CAMERA_STOPS, cameraTarget, exitCameraTarget, mapCameraPadding, storyCameraProgress } from './camera.js';
import { createBaseTileErrorHandler, mapAvailabilityMessage } from './map-errors.js';
import { isVillageMarkerVisible } from './location-visibility.js';

setWorkerUrl(workerUrl);

const STYLE_URL = 'https://tiles.openfreemap.org/styles/positron';
const DEM_URL = 'https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png';
const LOCATION = [99.18079999165937, 18.80842873834785];
const mapElement = document.querySelector('#map');
const stage = document.querySelector('#atlas-stage');
const status = document.querySelector('#map-status');
const mapCaption = document.querySelector('#map-caption');
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const mobileViewport = window.matchMedia('(max-width: 760px)');
const firstChapterCopy = document.querySelector('#chapter-land .chapter-copy');
const atlasExit = document.querySelector('.atlas__exit');
const chapterCaptions = [
  'ภูมิประเทศ · ดอยสะเก็ด',
  'ย่านชุมชน · แม่โป่ง',
  'ระยะใกล้ · ย่านชุมชน',
  'จุดชุมชน · รอยอาคารประมาณจากภาพถ่ายดาวเทียม',
];

function shouldShowLocation() {
  const chapterTop = firstChapterCopy.getBoundingClientRect().top + window.scrollY;
  return isVillageMarkerVisible({
    isMobile: mobileViewport.matches,
    scrollY: window.scrollY,
    chapterTop,
    viewportHeight: window.innerHeight,
  });
}

function showFallback(message) {
  stage.classList.add('is-fallback');
  status.textContent = message;
}

export function initAtlas() {
  const probe = document.createElement('canvas');
  if (!probe.getContext('webgl2', { failIfMajorPerformanceCaveat: false }) && !probe.getContext('webgl', { failIfMajorPerformanceCaveat: false })) {
    showFallback('แสดงภาพเส้นทางป่าชุมชนแทนแผนที่ · บ้านต้นผึ้ง');
    return null;
  }

  let map;
  try {
    map = new MapLibreMap({
      container: mapElement,
      style: STYLE_URL,
      center: CAMERA_STOPS[0].center,
      zoom: CAMERA_STOPS[0].zoom,
      pitch: CAMERA_STOPS[0].pitch,
      bearing: CAMERA_STOPS[0].bearing,
      maxPitch: 75,
      minZoom: 8,
      maxZoom: 18.5,
      interactive: false,
      attributionControl: false,
      antialias: true,
      preserveDrawingBuffer: false,
      trackResize: true,
    });
  } catch {
    showFallback('ไม่สามารถเปิดแผนที่ได้ · แสดงภาพป่าชุมชนบ้านต้นผึ้ง');
    return null;
  }

  let demAvailable = true;
  let footprintsAvailable = true;
  let styleLoaded = false;
  const handleBaseTileError = createBaseTileErrorHandler(showFallback);
  let fatalTimer = window.setTimeout(() => {
    if (!styleLoaded) showFallback('แผนที่ใช้เวลานานกว่าปกติ · ภาพป่าชุมชนบ้านต้นผึ้ง');
  }, 12000);
  map.on('error', (event) => {
    if (!styleLoaded && !event?.sourceId) {
      showFallback('แผนที่เชื่อมต่อไม่สำเร็จ · แสดงภาพป่าชุมชนบ้านต้นผึ้ง');
    } else if (event?.sourceId === 'tonphueng-footprints' && footprintsAvailable) {
      footprintsAvailable = false;
      status.textContent = mapAvailabilityMessage(demAvailable, footprintsAvailable);
    } else if (event?.sourceId === 'tonphueng-dem' && demAvailable) {
      demAvailable = false;
      try { map.setTerrain(null); map.removeLayer('tonphueng-hillshade'); } catch { /* map may still be loading */ }
      status.textContent = mapAvailabilityMessage(demAvailable, footprintsAvailable);
    } else {
      handleBaseTileError.handleError(event, styleLoaded);
    }
  });

  map.on('load', () => {
    styleLoaded = true;
    window.clearTimeout(fatalTimer);
    if (!handleBaseTileError.handleLoad()) return;
    status.textContent = mapAvailabilityMessage(demAvailable, footprintsAvailable);
    stage.classList.remove('is-fallback');
    stage.classList.add('is-ready');
    for (const layer of map.getStyle().layers) {
      if (layer.type === 'symbol') map.setLayoutProperty(layer.id, 'visibility', 'none');
    }
    const zoomColor = (regional, close) => ['interpolate', ['linear'], ['zoom'], 10, regional, 15, close];
    const layerColors = {
      background: zoomColor('#eeeade', '#173a37'),
      landcover_wood: zoomColor('#cbd6c2', '#244c43'),
      park: zoomColor('#dbe3d2', '#2c5548'),
      water: zoomColor('#cadbd6', '#31545a'),
      landuse_residential: zoomColor('#e6e4d8', '#1b403d'),
      building: zoomColor('#ddcdb4', '#b86645'),
    };
    for (const layer of map.getStyle().layers) {
      const sourceLayer = layer['source-layer'];
      let color = layerColors[layer.id];
      if (sourceLayer === 'transportation' && layer.type === 'line') {
        color = zoomColor('#7b8175', '#e6dec8');
      }
      if (sourceLayer === 'landcover' && /wood|forest/i.test(layer.id)) {
        color = zoomColor('#cbd6c2', '#244c43');
      }
      if (color && layer.type === 'fill') map.setPaintProperty(layer.id, 'fill-color', color);
      if (color && layer.type === 'background') map.setPaintProperty(layer.id, 'background-color', color);
      if (color && layer.type === 'line') map.setPaintProperty(layer.id, 'line-color', color);
    }
    try {
      map.addSource('tonphueng-dem', {
        type: 'raster-dem',
        tiles: [DEM_URL],
        tileSize: 256,
        encoding: 'terrarium',
        maxzoom: 15,
        attribution: 'AWS Terrain Tiles · Tilezen',
      });
      map.setTerrain({ source: 'tonphueng-dem', exaggeration: 1.7 });
      map.addLayer({
        id: 'tonphueng-hillshade',
        source: 'tonphueng-dem',
        type: 'hillshade',
        paint: {
          'hillshade-shadow-color': '#475448',
          'hillshade-highlight-color': '#faf9f2',
          'hillshade-accent-color': '#8e9c82',
          'hillshade-exaggeration': 0.35,
          'hillshade-illumination-direction': 315,
        },
      }, 'water');
    } catch {
      demAvailable = false;
      status.textContent = mapAvailabilityMessage(demAvailable, footprintsAvailable);
    }

    try {
      map.addSource('tonphueng-footprints', {
        type: 'geojson',
        data: '/data/tonphueng-footprints.geojson',
        maxzoom: 14,
        attribution: 'Microsoft Global ML Building Footprints · CDLA Permissive 2.0',
      });
      map.addLayer({
        id: 'tonphueng-footprints-fill',
        type: 'fill',
        source: 'tonphueng-footprints',
        minzoom: 14.5,
        paint: {
          'fill-color': '#d27a56',
          'fill-opacity': 0.82,
          'fill-outline-color': '#f4d0a0',
        },
      });
    } catch {
      footprintsAvailable = false;
      status.textContent = mapAvailabilityMessage(demAvailable, footprintsAvailable);
    }

    map.addSource('tonphueng-place', {
      type: 'geojson',
      data: { type: 'FeatureCollection', features: [{ type: 'Feature', properties: { name: 'บ้านต้นผึ้ง' }, geometry: { type: 'Point', coordinates: LOCATION } }] },
    });
    map.addLayer({
      id: 'tonphueng-place-dot',
      type: 'circle',
      source: 'tonphueng-place',
      layout: { visibility: shouldShowLocation() ? 'visible' : 'none' },
      paint: { 'circle-radius': 5, 'circle-color': '#e9875e', 'circle-stroke-color': '#fffdf6', 'circle-stroke-width': 2.5 },
    });
    map.addLayer({
      id: 'tonphueng-place-label',
      type: 'symbol',
      source: 'tonphueng-place',
      layout: { 'visibility': shouldShowLocation() ? 'visible' : 'none', 'text-field': ['get', 'name'], 'text-font': ['Noto Sans Regular'], 'text-size': 13, 'text-offset': [0, 1.45], 'text-anchor': 'top', 'text-allow-overlap': true },
      paint: { 'text-color': '#f6f3e7', 'text-halo-color': '#102b29', 'text-halo-width': 2.6 },
    });

  });

  map.on('webglcontextlost', () => showFallback('อุปกรณ์หยุดการเรนเดอร์แผนที่ · แสดงภาพป่าชุมชนบ้านต้นผึ้ง'));

  let ticking = false;
  let lastCameraStep = null;
  let lastPaddingKey = '';
  const chapters = [...document.querySelectorAll('.map-chapter')];
  function updateCamera() {
    ticking = false;
    const chapterTops = chapters.map((chapter) => chapter.getBoundingClientRect().top + window.scrollY);
    const copyBottoms = chapters.map((chapter) => chapter.querySelector('.chapter-copy').getBoundingClientRect().bottom + window.scrollY);
    const progress = storyCameraProgress(chapterTops, window.scrollY, window.innerHeight, copyBottoms);
    const activeStep = progress === 0 ? 0 : Math.min(chapters.length, Math.ceil(progress * chapters.length));
    stage.dataset.chapter = String(activeStep);
    if (mapCaption) mapCaption.textContent = chapterCaptions[activeStep];
    if (!stage.classList.contains('is-ready')) return;
    const locationVisibility = shouldShowLocation() ? 'visible' : 'none';
    for (const layer of ['tonphueng-place-dot', 'tonphueng-place-label']) {
      if (map.getLayer(layer) && map.getLayoutProperty(layer, 'visibility') !== locationVisibility) {
        map.setLayoutProperty(layer, 'visibility', locationVisibility);
      }
    }
    const stageRect = stage.getBoundingClientRect();
    if (stageRect.bottom <= 0 || stageRect.top >= window.innerHeight) return;
    const padding = mapCameraPadding(window.innerWidth, window.innerHeight, activeStep);
    const paddingKey = `${padding.top}:${padding.right}:${padding.bottom}:${padding.left}`;
    const exitBounds = atlasExit?.getBoundingClientRect();
    const exitProgress = exitBounds && exitBounds.top <= 0
      ? Math.min(1, Math.max(0, -exitBounds.top / Math.max(1, atlasExit.offsetHeight - window.innerHeight)))
      : null;
    const target = exitProgress === null
      ? cameraTarget(progress, activeStep, reducedMotion.matches)
      : exitCameraTarget(exitProgress, reducedMotion.matches);
    const cameraStep = exitProgress === null ? activeStep : 'exit';
    if (reducedMotion.matches) {
      if (cameraStep !== lastCameraStep || paddingKey !== lastPaddingKey) {
        map.jumpTo({ ...target, padding });
      }
      lastCameraStep = cameraStep;
      lastPaddingKey = paddingKey;
      return;
    }
    map.jumpTo({ ...target, padding });
    lastCameraStep = cameraStep;
    lastPaddingKey = paddingKey;
  }
  function onScroll() {
    if (!ticking) {
      ticking = true;
      window.requestAnimationFrame(updateCamera);
    }
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll, { passive: true });
  reducedMotion.addEventListener?.('change', () => { lastCameraStep = null; onScroll(); });
  map.once('idle', onScroll);
  return map;
}
