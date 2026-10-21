export function isVillageMarkerVisible({ isMobile, scrollY, chapterTop, viewportHeight }) {
  return !isMobile || scrollY >= chapterTop - viewportHeight * 0.65;
}
