# react-zxing example

Vite + React demo app for local development.

The example self-hosts `zxing_reader.wasm` (copied to `public/` at dev/build time) and preloads it in `src/index.tsx` before the scanner mounts. The dev server uses HTTPS so camera access works on LAN devices.

```sh
pnpm start
```

Open [https://localhost:5173](https://localhost:5173).
