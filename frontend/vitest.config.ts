/// <reference types="vitest" />
import { defineConfig, mergeConfig } from "vite";
import { configDefaults } from "vitest/config";
import viteConfig from "./vite.config";

export default mergeConfig(
    viteConfig,
    defineConfig({
        test: {
            globals: true,
            environment: "jsdom",
            setupFiles: ["./src/test/setup.ts"],
            exclude: [...configDefaults.exclude, "e2e/*"],
            coverage: {
                provider: "v8",
                reporter: ["text", "json", "html"],
            },
        },
    })
);
