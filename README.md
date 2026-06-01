<div align="center">
  <h1>
    <br/>
    <br/>
    📷
    <br />
    react-zxing
    <br />
    <br />
  </h1>
  <br />
  <pre>npm i <a href="https://www.npmjs.com/package/react-zxing">react-zxing</a></pre>
  <br />
</div>

Easily scan QR and EAN codes in your React application. Exports a `useZxing` hook that streams camera video to a `<video>` element and decodes barcodes using [barcode-detector](https://www.npmjs.com/package/barcode-detector) (ZXing-C++ via WebAssembly).

## Setup

Decoding relies on a WebAssembly module (`zxing_reader.wasm`). You can load it from a CDN (default), bundle it with your app, or host it yourself.

### Option 1: CDN (simplest)

Do nothing extra. `useZxing` calls `prepareWasm()` internally, which loads the WASM file from jsDelivr. This works for most online apps.

To start loading WASM earlier (before the scanner mounts), call `prepareWasm()` in your app entry:

```tsx
import { prepareWasm } from "react-zxing";

await prepareWasm();
```

### Option 2: Self-hosted WASM

For offline use, strict CSP, or to avoid a CDN dependency, host `zxing_reader.wasm` yourself and pass its URL to `prepareWasm`.

With Vite, install `zxing-wasm` in your app and import the file URL:

```tsx
import wasmUrl from "zxing-wasm/dist/reader/zxing_reader.wasm?url";
import { prepareWasm } from "react-zxing";

await prepareWasm({ wasmUrl });
```

Alternatively, copy `node_modules/zxing-wasm/dist/reader/zxing_reader.wasm` to your static assets (for example `public/zxing_reader.wasm`) and pass a stable path:

```tsx
await prepareWasm({ wasmUrl: "/zxing_reader.wasm" });
```

You can also pass `wasmUrl` directly to `useZxing` instead of calling `prepareWasm()` yourself.

`prepareWasm()` is idempotent: repeated calls share the same initialization promise. Call it once with the URL you want before mounting scanners. A later call with a different `wasmUrl` rejects; if preparation fails, you can call again to retry. When you preload with a custom URL, `useZxing` can omit `wasmUrl`.

### Secure context (HTTPS)

Camera access requires a [secure context](https://developer.mozilla.org/en-US/docs/Web/Security/Secure_Contexts). `localhost` works, but LAN IPs like `http://192.168.x.x` do not — use HTTPS in development and production when testing on other devices.

## Usage

```tsx
import { useState } from "react";
import { useZxing } from "react-zxing";

export const BarcodeScanner = () => {
  const [result, setResult] = useState("");
  const { ref } = useZxing({
    onDecodeResult(result) {
      setResult(result.rawValue);
    },
  });

  return (
    <>
      <video ref={ref} muted playsInline />
      <p>
        <span>Last result: </span>
        <span>{result}</span>
      </p>
    </>
  );
};
```

Decode results are [`DetectedBarcode`](https://developer.mozilla.org/en-US/docs/Web/API/DetectedBarcode) objects from the Barcode Detection API. Use `result.rawValue` for the scanned text and `result.format` for the symbology (e.g. `"qr_code"`, `"ean_13"`).

### With specific device ID

You can get the device ID from the `MediaDevices` API yourself, or use [react-media-devices](https://www.npmjs.com/package/react-media-devices) to list available devices:

```tsx
import { useMediaDevices } from "react-media-devices";
import { useZxing } from "react-zxing";

const constraints: MediaStreamConstraints = {
  video: true,
  audio: false,
};

export const BarcodeScanner = () => {
  const { devices } = useMediaDevices({ constraints });
  const deviceId = devices?.[0]?.deviceId;
  const { ref } = useZxing({
    paused: !deviceId,
    deviceId,
  });

  return <video ref={ref} muted playsInline />;
};
```

### Barcode formats

Limit which symbologies are scanned with the `formats` option. Values follow the [Barcode Detection API format names](https://developer.mozilla.org/en-US/docs/Web/API/Barcode_Detection_API#supported_barcode_formats), plus convenience groups like `"retail_codes"`, `"linear_codes"`, and `"any"`:

```tsx
const { ref } = useZxing({
  formats: ["retail_codes"],
  onDecodeResult(result) {
    console.log(result.format, result.rawValue);
  },
});
```

## Advanced Usage

### Torch

Control the torch via the `torch` property on the hook return value:

```tsx
import { useZxing } from "react-zxing";

export const BarcodeScanner = () => {
  const {
    ref,
    torch: { on, off, isOn, isAvailable },
  } = useZxing();

  return (
    <>
      <video ref={ref} muted playsInline />
      {isAvailable ? (
        <button type="button" onClick={() => (isOn ? off() : on())}>
          {isOn ? "Turn off" : "Turn on"} torch
        </button>
      ) : (
        <strong>Unfortunately, torch is not available on this device.</strong>
      )}
    </>
  );
};
```

Torch support depends on the device exposing the `torch` constraint. Check `isAvailable` before showing torch controls.

### Skewed 1D barcodes

For hard-to-read skewed labels, the scanner can retry failed frames at slight rotation angles. Enable the default angles with `trySkew: true` (`[-20, -15, -10, -5, 5, 10, 15, 20]`), or pass custom angles in degrees:

```tsx
useZxing({ trySkew: [-15, 0, 15] });
```

Each failed frame tries one angle from the list, rotating through them on subsequent attempts.

## Options

<table>
  <thead>
    <tr>
      <th>Name</th>
      <th>Type</th>
      <th>Default</th>
      <th>Description</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>onDecodeResult</td>
      <td>function</td>
      <td></td>
      <td>
        Called when a barcode is decoded. Receives a
        <a href="https://developer.mozilla.org/en-US/docs/Web/API/DetectedBarcode">
          DetectedBarcode
        </a>
        .
      </td>
    </tr>
    <tr>
      <td>onDecodeError</td>
      <td>function</td>
      <td></td>
      <td>
        Called when decoding throws an error. Empty frames (no barcode found) do not trigger this callback.
      </td>
    </tr>
    <tr>
      <td>onError</td>
      <td>function</td>
      <td></td>
      <td>
        Called when camera or WASM setup fails, e.g. missing permissions or an insecure context.
      </td>
    </tr>
    <tr>
      <td>formats</td>
      <td>BarcodeFormat[]</td>
      <td>all formats</td>
      <td>
        Barcode symbologies to scan. See
        <a href="https://www.npmjs.com/package/barcode-detector">barcode-detector</a>
        for supported values.
      </td>
    </tr>
    <tr>
      <td>wasmUrl</td>
      <td>string</td>
      <td>jsDelivr CDN</td>
      <td>
        URL of <code>zxing_reader.wasm</code> for self-hosting. Passed to
        <code>prepareWasm()</code> before scanning starts.
      </td>
    </tr>
    <tr>
      <td>trySkew</td>
      <td>boolean | number[]</td>
      <td>false</td>
      <td>
        Retry decoding at rotation angles when a frame fails. Pass
        <code>true</code> to use the default angles, or an array of angles in degrees.
      </td>
    </tr>
    <tr>
      <td>timeBetweenDecodingAttempts</td>
      <td>number</td>
      <td>300</td>
      <td>
        Milliseconds to wait between decoding attempts.
      </td>
    </tr>
    <tr>
      <td>constraints</td>
      <td>MediaStreamConstraints</td>
      <td>{ video: { facingMode: 'environment' }, audio: false }</td>
      <td>
        Constraints passed to <code>getUserMedia</code>.
      </td>
    </tr>
    <tr>
      <td>deviceId</td>
      <td>string</td>
      <td></td>
      <td>
        Explicit camera device ID to stream from.
      </td>
    </tr>
    <tr>
      <td>paused</td>
      <td>boolean</td>
      <td>false</td>
      <td>
        Stops the camera stream when <code>true</code>.
      </td>
    </tr>
  </tbody>
</table>

## Exports

| Export               | Description                                                       |
| -------------------- | ----------------------------------------------------------------- |
| `useZxing`           | React hook for camera streaming and barcode scanning              |
| `UseZxingOptions`    | Options type for `useZxing()`                                     |
| `prepareWasm`        | Preload the WASM decoder; optional `{ wasmUrl }` for self-hosting |
| `PrepareWasmOptions` | Options type for `prepareWasm()`                                  |
| `BarcodeFormat`      | Type for format filter values                                     |
| `DetectedBarcode`    | Type for decode results                                           |

## Migrating from v2

Version 3 replaces `@zxing/library` with [barcode-detector](https://www.npmjs.com/package/barcode-detector) (ZXing-C++ via WebAssembly). Update your app as follows:

| v2                                    | v3                              |
| ------------------------------------- | ------------------------------- |
| `result.getText()`                    | `result.rawValue`               |
| `hints: Map<DecodeHintType, unknown>` | `formats: BarcodeFormat[]`      |
| `onDecodeError(error: Exception)`     | `onDecodeError(error: unknown)` |
| Skewed-frame retry always on          | Opt in with `trySkew`           |

Decode results are now `DetectedBarcode` objects. Use `result.format` for the symbology (for example `"qr_code"`, `"ean_13"`).

`onDecodeError` is only called when decoding throws. Empty frames no longer trigger it — v2 filtered `NotFoundException`, `ChecksumException`, and `FormatException` during continuous scanning; v3 treats a missing barcode as a normal empty frame.

For self-hosted or offline apps, add WASM setup with `prepareWasm()` or the `wasmUrl` option (see [Setup](#setup) above).

## Development

```sh
# Install dependencies
pnpm install
# Build the library
pnpm build
# Run unit tests
pnpm test
# Start the example (HTTPS enabled for camera access on LAN devices)
pnpm dev
```

The example runs at [https://localhost:5173](https://localhost:5173).
