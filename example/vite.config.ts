import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";

// https://vite.dev/config/
export default defineConfig({
    plugins: [react()],
    resolve: {
        dedupe: ["react", "react-dom"],
        alias: {
            "@emotion/styled": "@emotion/styled",
            "@emotion/react": "@emotion/react",
        },
    },
    optimizeDeps: {
        include: [
            "react",
            "react-dom",
            "react-virtuoso",
            "@emotion/react",
            "@emotion/styled",
            "@mui/material",
            "@mui/icons-material",
            "@ehfuse/mui-fadeout-loading-progress",
        ],
        esbuildOptions: {
            define: {
                global: "globalThis",
            },
        },
    },
    build: {
        commonjsOptions: {
            include: [/node_modules/],
        },
    },
});
