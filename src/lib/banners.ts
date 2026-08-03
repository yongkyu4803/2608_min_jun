export type Banner = {
  /** 배너 이미지 경로. public/ 아래 파일이면 "/banners/foo.png", 외부면 전체 URL */
  src: string;
  /** 대체 텍스트 — 이미지가 안 뜨거나 스크린리더가 읽을 때 쓰인다 */
  alt: string;
  /** 클릭 시 이동할 주소. 없으면 링크 없이 이미지만 표시 */
  href?: string;
  /** 새 탭으로 열지 (기본: 외부 링크면 새 탭) */
  newTab?: boolean;
};

/**
 * 상단 배너 세 칸. 각 칸이 정확히 1/3 폭을 차지한다.
 *
 * 채우는 법: 이미지를 public/banners/ 에 넣고 아래 배열의 자리를 채운다.
 *   { src: "/banners/example.png", alt: "설명", href: "https://example.com" }
 *
 * 빈 칸은 자리표시자로 표시되며, 셋 다 비어 있으면 배너 영역 자체가 렌더링되지 않는다.
 * 권장 비율은 3:1 (예: 1080×360) — 세 칸 모두 같은 높이로 맞춰진다.
 */
export const BANNERS: [Banner | null, Banner | null, Banner | null] = [
  null,
  null,
  null,
];

export const BANNER_ASPECT = "3 / 1";
