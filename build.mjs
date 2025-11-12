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
