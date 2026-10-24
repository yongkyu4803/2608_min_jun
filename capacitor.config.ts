import type { CapacitorConfig } from "@capacitor/cli";

// APP_URL이 있으면 배포된 사이트를 불러오는 래퍼 앱, 없으면 정적 번들 앱.
const appUrl = process.env.APP_URL;

const config: CapacitorConfig = {
  appId: appUrl ? "kr.gq.minjundae.live" : "kr.gq.minjundae",
  appName: appUrl ? "민주당 순회경선 (라이브)" : "민주당 순회경선",
  webDir: "out",
  ...(appUrl && { server: { url: appUrl, cleartext: false } }),
};

export default config;
