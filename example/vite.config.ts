import tailwindcss from "@tailwindcss/vite";
import basicSsl from "@vitejs/plugin-basic-ssl";
import react from "@vitejs/plugin-react";
import { cpSync, mkdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig, type Plugin } from "vite";

const __dirname = dirname(fileURLToPath(import.meta.url));
const zxingReaderWasm = resolve(
  __dirname,
  "node_modules/zxing-wasm/dist/reader/zxing_reader.wasm",
);
const publicDir = join(__dirname, "public");

const copyZxingWasm = (): Plugin => ({
  name: "copy-zxing-wasm",
  buildStart() {
    mkdirSync(publicDir, { recursive: true });
    cpSync(zxingReaderWasm, join(publicDir, "zxing_reader.wasm"));
  },
});

export default defineConfig({
  plugins: [copyZxingWasm(), react(), tailwindcss(), basicSsl()],
  server: {
    host: true,
  },
  resolve: {
    alias: {
      "react-zxing": resolve(__dirname, "../src/index.ts"),
    },
  },
});
