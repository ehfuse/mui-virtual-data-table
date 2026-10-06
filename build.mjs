import * as esbuild from "esbuild";
import { dtsPlugin } from "esbuild-plugin-d.ts";

const baseConfig = {
    entryPoints: ["src/index.ts"],
    bundle: true,
    minify: true,
    sourcemap: true,
    external: [
        "react",
        "react-dom",
        "react-virtuoso",
        "@mui/material",
        "@emotion/react",
        "@emotion/styled",
        // 스크롤바를 번들에 품지 않는다 — 품으면 빌드 당시의 옛 판이 굳어, 스크롤바 패키지를 고쳐도 표에는 닿지 않는다
        // (맨 위에서 휠을 굴리면 스크롤바가 사라지지 않는 옛 버그가 표에만 남았다). dependencies 로 앱의 한 벌을 쓴다.
        "@ehfuse/overlay-scrollbar",
    ],
    plugins: [dtsPlugin()],
};

// ESM build
await esbuild.build({
    ...baseConfig,
    format: "esm",
    outfile: "dist/index.esm.js",
});

// CJS build
await esbuild.build({
    ...baseConfig,
    format: "cjs",
    outfile: "dist/index.js",
});

console.log("✅ Build completed successfully!");
