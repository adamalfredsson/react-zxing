# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [3.0.0] - 2026-06-01

### Changed

- Replace `@zxing/library` with `barcode-detector` backed by ZXing-C++ WebAssembly.
- Change decode results from `@zxing/library` `Result` objects to Barcode Detection API-style `DetectedBarcode` objects (`rawValue`, `format`, etc.).
- Replace the `hints` option with `formats`.
- Change `onDecodeError` to receive `unknown` instead of `@zxing/library` `Exception`.
- Make skewed-frame retry opt-in via `trySkew` (default angles: `-20`, `-15`, `-10`, `-5`, `5`, `10`, `15`, `20`).

### Added

- Add `prepareWasm()` for preloading or self-hosting `zxing_reader.wasm`.
- Add `wasmUrl` option to `useZxing` for per-scanner WASM configuration.
- Add focused unit coverage for scanner lifecycle, torch behavior, media errors, WASM setup, and skewed-frame decoding.

### Fixed

- Allow retrying WASM setup after a failed load and reject conflicting `wasmUrl` configuration.
- Avoid throwing when skewed-frame canvas contexts are unavailable.

### Migration

- Replace `result.getText()` with `result.rawValue`.
- Replace `hints` with `formats` (see [barcode-detector](https://www.npmjs.com/package/barcode-detector) for supported values).
- Enable skewed 1D retry explicitly with `trySkew: true` or a custom angle array.
- For offline or CSP-restricted apps, call `prepareWasm({ wasmUrl })` or pass `wasmUrl` to `useZxing`.

## [2.2.0] - 2026-06-01

### Changed

- Remove the `engines` field from `package.json`.

### Fixed

- Filter `NotFoundException`, `ChecksumException`, and `FormatException` from `onDecodeError` during continuous scanning — these are expected when no valid barcode is in frame.
- Stabilize inline `constraints` objects with `useMemo` to avoid unnecessary stream restarts when passing a new object reference with the same values.

## [2.1.0] - 2025-02-20

### Changed

- Add React 19 to peer dependencies.

## [2.0.0] - 2023-08-17

### Changed

- Updated the `@zxing/library` dependency to `0.20.0`.
- Renamed `onResult` and `onError` to `onDecodeResult` and `onDecodeError` respectively.
- Switched the `onDecodeError` error type to use the `Exception` class from `@zxing/library`.

### Added

- Introduced `onError` to handle errors that occur during initialization.

## [1.1.4] - 2023-03-20

### Fixed

- Added engines to `package.json` to prevent installation on unsupported Node.js versions.

## [1.1.3] - 2023-02-13

### Fixed

- Fix `MediaStreamTrack.getCapabilities` not being available in Firefox.

## [1.1.1] - 2023-02-01

### Fixed

- Updated the `@zxing/library` dependency to `0.19.2`.

## [1.1.0] - 2023-01-03

### Added

- Added `torch` functionality. You can now control the torch by accessing the `torch` property of the `useZxing` return value.

### Changed

- Removed the `startDecoding` and `stopDecoding` options. You can now control the decoding process by using the `paused` option.
