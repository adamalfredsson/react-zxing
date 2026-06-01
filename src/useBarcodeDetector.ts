import type { BarcodeFormat } from "barcode-detector/ponyfill";
import { BarcodeDetector } from "barcode-detector/ponyfill";
import { useMemo } from "react";

interface UseBarcodeDetectorOptions {
  formats?: BarcodeFormat[];
}

export const useBarcodeDetector = ({
  formats,
}: UseBarcodeDetectorOptions = {}) =>
  useMemo(
    () => new BarcodeDetector({ ...(formats ? { formats } : {}) }),
    [formats],
  );
