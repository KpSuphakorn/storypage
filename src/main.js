import 'maplibre-gl/dist/maplibre-gl.css';
import './styles.css';

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
