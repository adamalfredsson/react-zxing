# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
