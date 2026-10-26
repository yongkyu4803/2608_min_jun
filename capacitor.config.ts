import type { CapacitorConfig } from "@capacitor/cli";

// APP_URL이 있으면 배포된 사이트를 불러오는 래퍼 앱, 없으면 정적 번들 앱.
// APP_ID / APP_NAME 으로 패키지명·앱 이름을 바꿀 수 있다 (scripts/build-android.sh 참고).
const appUrl = process.env.APP_URL;

const config: CapacitorConfig = {
  appId: process.env.APP_ID ?? (appUrl ? "kr.gq.minjundae.live" : "kr.gq.minjundae"),
  appName:
    process.env.APP_NAME ?? (appUrl ? "민주당 순회경선 (라이브)" : "민주당 순회경선"),
  webDir: "out",
  ...(appUrl && { server: { url: appUrl, cleartext: false } }),
};

export default config;
