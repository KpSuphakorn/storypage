# ต้นผึ้ง — photo essay atlas

Vite static site for a one-page geographic photo essay about บ้านต้นผึ้ง, หมู่ 7, ตำบลแม่โป่ง, อำเภอดอยสะเก็ด, จังหวัดเชียงใหม่. The opening uses MapLibre GL JS with OpenFreeMap vector tiles and AWS Terrain Tiles (Terrarium) for elevation. Scroll chapters make a continuous, one-way approach from the regional terrain to neighborhood scale and the published community coordinate `18.80842873834785, 99.18079999165937`; close camera stops hold on that point. Approximate satellite-derived building footprints appear at neighborhood zoom, with no measured height, village boundary, or route. Later chapters use authentic field photographs to tell how residents care for the forest, work fallen ตองตึง leaves into vessels, and make Eco-print.

## Run locally

Requires Node.js 20.19+ (Node 22.12+ recommended).

```sh
npm install
npm run dev
```

Vite prints the local preview address. To create the static production site:

```sh
npm run build
```

The deployable output is `dist/`. Run the camera-entry, reading-hold, scrollback, map-fallback, and story-link checks with `npm test`.

## Deploy with Vercel

Import this repository in Vercel and leave Root Directory at its default (`./`). Use the Vite preset, build command `npm run build`, and output directory `dist`. No server-side runtime, environment secret, API key, SPA rewrite, or special `vercel.json` is required. Alternatively, after installing the Vercel CLI, run `vercel` from this directory and follow its project-link prompts.

OpenFreeMap and elevation tiles are public remote map services, so the terrain map needs an internet connection. If WebGL is unavailable or the style cannot load, the page keeps the story readable and shows the authentic forest-path photo. If elevation tiles fail, the vector map remains available in 2D with a status note. Reduced-motion preference disables scroll-driven camera movement while preserving chapter navigation and captions.

## Sources and image provenance

- Community profile and village coordinate: [วิกิชุมชน — บ้านต้นผึ้ง](https://wikicommunity.sac.or.th/community/2871), ศูนย์มานุษยวิทยาสิรินธร.
- Field observations and photographs: เอกสารสรุปพื้นที่โจทย์ ภาคเหนือ, ลงพื้นที่ 14–15 กรกฎาคม 2569. Photographs in `assets/` show the actual forest trail, a community member explaining forest and water management, fallen leaves, a heat press, leaf vessels, and members holding Eco-print fabric.
- Map data: [OpenFreeMap](https://openfreemap.org/), [© OpenMapTiles](https://openmaptiles.org/), [© OpenStreetMap contributors](https://www.openstreetmap.org/copyright), [AWS Terrain Tiles / Tilezen](https://registry.opendata.aws/terrain-tiles/).
- Approximate building footprints: [Microsoft Global ML Building Footprints](https://github.com/microsoft/GlobalMLBuildingFootprints), manifest 2026-08-13. The local GeoJSON selects footprint polygon centroids around 1.2 km from the published point; this is an approximate data-selection radius, not a community boundary or house count. Footprint heights are unknown and are not rendered. See `public/data/tonphueng-footprints-provenance.json` and the included [CDLA Permissive 2.0 license](public/data/CDLA-Permissive-2.0.txt).
