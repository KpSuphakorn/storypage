export const CAMERA_STOPS = [
  { center: [99.13, 18.86], zoom: 10.15, pitch: 50, bearing: -8 },
  { center: [99.172, 18.816], zoom: 14.2, pitch: 38, bearing: -8 },
  { center: [99.18079999165937, 18.80842873834785], zoom: 16.8, pitch: 48, bearing: -8 },
  { center: [99.18079999165937, 18.80842873834785], zoom: 17.3, pitch: 48, bearing: -8 },
];

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const mix = (a, b, t) => a + (b - a) * t;
const ease = (t) => t * t * (3 - 2 * t);

export function interpolateCamera(progress, stops = CAMERA_STOPS) {
  const position = clamp(progress, 0, 1) * (stops.length - 1);
  const index = Math.min(stops.length - 2, Math.floor(position));
  const t = ease(position - index);
  const from = stops[index];
  const to = stops[index + 1];
  const bearingDelta = ((to.bearing - from.bearing + 540) % 360) - 180;
  return {
    center: [mix(from.center[0], to.center[0], t), mix(from.center[1], to.center[1], t)],
    zoom: mix(from.zoom, to.zoom, t),
    pitch: mix(from.pitch, to.pitch, t),
    bearing: from.bearing + bearingDelta * t,
  };
}

export function storyCameraProgress(chapterTops, scrollY, viewportHeight, copyBottoms) {
  if (!chapterTops.length || viewportHeight <= 0) return 0;
  if (!copyBottoms || copyBottoms.length !== chapterTops.length) return 0;
  const denominator = chapterTops.length;
  const firstStart = chapterTops[0] - viewportHeight * 0.8;
  const firstEnd = chapterTops[0] - viewportHeight * 0.02;
  if (scrollY < firstStart) return 0;
  if (scrollY < firstEnd) {
    return clamp((scrollY - firstStart) / (firstEnd - firstStart), 0, 1) / denominator;
  }
  for (let index = 0; index < chapterTops.length - 1; index += 1) {
    const nextTop = chapterTops[index + 1];
    const transitionStart = Math.max(nextTop - viewportHeight * 0.8, copyBottoms[index] - viewportHeight * 0.18);
    const transitionEnd = Math.max(transitionStart + 1, nextTop - viewportHeight * 0.02);
    const settled = (index + 1) / denominator;
    if (scrollY < transitionStart) return settled;
    if (scrollY < transitionEnd) {
      return settled + clamp((scrollY - transitionStart) / (transitionEnd - transitionStart), 0, 1) / denominator;
    }
  }
  return 1;
}

export function cameraTarget(progress, activeStep, reducedMotion, stops = CAMERA_STOPS) {
  return reducedMotion ? stops[activeStep] : interpolateCamera(progress, stops);
}

export function mapCameraPadding(width, height, activeStep) {
  const bottom = width <= 760 ? Math.round(height * 0.42) : 0;
  const right = width > 760 && width <= 1100 && activeStep >= 2
    ? Math.round(Math.min(240, Math.max(180, width * 0.235)))
    : 0;
  return { top: 0, right, bottom, left: 0 };
}
