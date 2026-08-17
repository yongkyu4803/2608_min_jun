/**
 * skorea_provinces_geo.json (KOSTAT 2013) → 인라인 SVG 패스로 변환.
 * 런타임에 지도 라이브러리를 쓰지 않기 위해 한 번만 돌려 결과를 커밋한다.
 *
 * 경계가 갱신되면 다시 받아서 재생성:
 *   curl -sO https://raw.githubusercontent.com/southkorea/southkorea-maps/master/kostat/2013/json/skorea_provinces_geo.json
 *   node --stack-size=8000 scripts/build-korea-map.mjs skorea_provinces_geo.json src/lib/korea-map.ts
 *
 * 원본이 27MB라 기본 스택으로는 RDP 재귀가 넘친다 — --stack-size 필요.
 */
import fs from "node:fs";

const SHORT = {
  서울특별시: "서울",
  부산광역시: "부산",
  대구광역시: "대구",
  인천광역시: "인천",
  광주광역시: "광주",
  대전광역시: "대전",
  울산광역시: "울산",
  세종특별자치시: "세종",
  경기도: "경기",
  강원도: "강원",
  충청북도: "충북",
  충청남도: "충남",
  전라북도: "전북",
  전라남도: "전남",
  경상북도: "경북",
  경상남도: "경남",
  제주특별자치도: "제주",
};

const W = 760;
const PAD = 16;
// H 는 실제 경계 비율에 맞춰 아래에서 계산한다 (여백이 남지 않도록)
let H = 0;

// 메르카토르 (한국 위도대에서 형태 왜곡이 가장 적음)
const mx = (lon) => (lon * Math.PI) / 180;
const my = (lat) => Math.log(Math.tan(Math.PI / 4 + (lat * Math.PI) / 360));

/**
 * 닫힌 링 단순화.
 * RDP는 양 끝점을 기준선으로 삼는데 닫힌 링은 시작=끝이라 기준선 길이가 0이 되어
 * 모든 점의 거리가 0으로 계산된다(전부 붕괴). 시작점에서 가장 먼 점으로 링을
 * 두 조각으로 잘라 각각 RDP를 돌린 뒤 다시 잇는다.
 */
function simplifyRing(points, eps) {
  const last = points[points.length - 1];
  const closed = points[0][0] === last[0] && points[0][1] === last[1];
  const pts = closed ? points.slice(0, -1) : points;
  if (pts.length < 4) return pts;

  let far = 0;
  let farD = -1;
  for (let i = 1; i < pts.length; i++) {
    const d = Math.hypot(pts[i][0] - pts[0][0], pts[i][1] - pts[0][1]);
    if (d > farD) {
      farD = d;
      far = i;
    }
  }

  const head = simplify(pts.slice(0, far + 1), eps);
  const tail = simplify([...pts.slice(far), pts[0]], eps);
  // tail 의 마지막 점은 시작점 — path 는 Z 로 닫으므로 뺀다
  return [...head.slice(0, -1), ...tail.slice(0, -1)];
}

/** Ramer–Douglas–Peucker */
function simplify(points, eps) {
  if (points.length < 3) return points;
  let maxD = 0;
  let idx = 0;
  const [ax, ay] = points[0];
  const [bx, by] = points[points.length - 1];
  const dx = bx - ax;
  const dy = by - ay;
  const len = Math.hypot(dx, dy) || 1;
  for (let i = 1; i < points.length - 1; i++) {
    const [px, py] = points[i];
    const d = Math.abs(dy * px - dx * py + bx * ay - by * ax) / len;
    if (d > maxD) {
      maxD = d;
      idx = i;
    }
  }
  if (maxD <= eps) return [points[0], points[points.length - 1]];
  return [
    ...simplify(points.slice(0, idx + 1), eps).slice(0, -1),
    ...simplify(points.slice(idx), eps),
  ];
}

const geo = JSON.parse(fs.readFileSync(process.argv[2], "utf8"));

// 1) 전체 경위도 → 평면 좌표로 옮기고 bbox 계산
const rings = []; // { name, coords: [[x,y],...] }
for (const f of geo.features) {
  const name = SHORT[f.properties.name];
  if (!name) throw new Error("이름 매핑 누락: " + f.properties.name);
  const polys =
    f.geometry.type === "Polygon" ? [f.geometry.coordinates] : f.geometry.coordinates;
  for (const poly of polys) {
    // 외곽 링만 사용 (구멍은 시도 단위에서 사실상 없음)
    rings.push({ name, coords: poly[0].map(([lon, lat]) => [mx(lon), my(lat)]) });
  }
}

let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
for (const r of rings)
  for (const [x, y] of r.coords) {
    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
  }

const scale = (W - PAD * 2) / (maxX - minX);
H = Math.round((maxY - minY) * scale) + PAD * 2;
const offX = PAD;
const offY = PAD;
const project = ([x, y]) => [
  offX + (x - minX) * scale,
  offY + (maxY - y) * scale, // y 뒤집기
];

// 2) 화면 좌표로 옮긴 뒤 단순화 (오차 0.6px). 아주 작은 섬은 버린다.
const byName = new Map();
for (const r of rings) {
  const pts = r.coords.map(project);
  const simplified = simplifyRing(pts, 0.6);
  if (simplified.length < 4) continue;
  const xs = simplified.map((p) => p[0]);
  const ys = simplified.map((p) => p[1]);
  const area = (Math.max(...xs) - Math.min(...xs)) * (Math.max(...ys) - Math.min(...ys));
  if (area < 6) continue; // 점처럼 찍히는 부속 도서 제거
  if (!byName.has(r.name)) byName.set(r.name, []);
  byName.get(r.name).push(simplified);
}

// 3) 시도별로 패스 문자열 + 라벨 위치(가장 큰 폴리곤의 무게중심)
const out = [];
for (const [name, polys] of byName) {
  const d = polys
    .map(
      (p) =>
        "M" +
        p.map(([x, y]) => `${x.toFixed(1)} ${y.toFixed(1)}`).join("L") +
        "Z",
    )
    .join("");
  const biggest = polys.reduce((a, b) => (b.length > a.length ? b : a));
  const cx = biggest.reduce((s, p) => s + p[0], 0) / biggest.length;
  const cy = biggest.reduce((s, p) => s + p[1], 0) / biggest.length;
  out.push({ name, d, label: [Math.round(cx), Math.round(cy)] });
}

const ts = `// 자동 생성 파일 — scripts/build-korea-map.js 로 만들어집니다. 직접 수정하지 마세요.
//
// 출처: southkorea/southkorea-maps — KOSTAT(통계청) 센서스용 행정구역경계 2013
//       https://github.com/southkorea/southkorea-maps
// 라이선스: KOSTAT "Free to share or remix"
//
// 경위도를 메르카토르로 투영해 ${W}×${H} 좌표계로 옮기고, RDP 알고리즘으로
// 0.6px 오차까지 단순화했다. 시도 경계는 2012년 세종시 출범 이후 변동이 없다.

export const KOREA_VIEWBOX = "0 0 ${W} ${H}";

export type ProvinceShape = {
  /** 대시보드 지역명과 맞춘 축약 이름 (예: 충남) */
  name: string;
  /** SVG path d */
  d: string;
  /** 라벨을 놓을 좌표 */
  label: [number, number];
};

export const KOREA_PROVINCES: ProvinceShape[] = ${JSON.stringify(out, null, 2)};
`;

fs.writeFileSync(process.argv[3], ts);
const kb = (fs.statSync(process.argv[3]).size / 1024).toFixed(0);
console.log(`시도 ${out.length}개 · ${kb}KB → ${process.argv[3]}`);
console.log("폴리곤 수:", [...byName].map(([n, p]) => `${n}:${p.length}`).join(" "));
