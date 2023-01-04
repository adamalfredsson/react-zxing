# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.0] - 2023-01-03

### Added

- Added `torch` functionality. You can now control the torch by accessing the `torch` property of the `useZxing` return value.

### Changed

- Removed the `startDecoding` and `stopDecoding` options. You can now control the decoding process by using the `paused` option.
