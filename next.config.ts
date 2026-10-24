import type { NextConfig } from "next";

// Capacitor(Android) 빌드는 정적 export로 번들한다. (scripts/build-android.sh 참고)
const isCapacitor = process.env.CAPACITOR_BUILD === "1";

const nextConfig: NextConfig = {
  ...(isCapacitor && {
    output: "export",
    images: { unoptimized: true },
  }),
};

export default nextConfig;
