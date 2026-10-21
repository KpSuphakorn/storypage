export function createBaseTileErrorHandler(showFallback, threshold = 3) {
  let failures = 0;
  let failedBeforeLoad = false;
  const message = 'แผนที่เชื่อมต่อไม่สำเร็จ · แสดงภาพป่าชุมชนบ้านต้นผึ้ง';
  return {
    handleError(event, styleLoaded) {
      if (event?.sourceId !== 'openmaptiles') return false;
      if (!styleLoaded) {
        failedBeforeLoad = true;
        showFallback(message);
        return true;
      }
      failures += 1;
      if (failures < threshold) return false;
      showFallback(message);
      return true;
    },
    handleLoad() {
      if (!failedBeforeLoad) return true;
      showFallback(message);
      return false;
    },
  };
}
