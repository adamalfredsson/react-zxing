import { BrowserMultiFormatReader, DecodeHintType } from "@zxing/library";
import { useMemo } from "react";
import { DEFAULT_TIME_BETWEEN_DECODING_ATTEMPTS } from "./constants";

interface UseBrowserMultiFormatReaderOptions {
  hints?: Map<DecodeHintType, any>;
  timeBetweenDecodingAttempts?: number;
}

export const useBrowserMultiFormatReader = ({
  timeBetweenDecodingAttempts = DEFAULT_TIME_BETWEEN_DECODING_ATTEMPTS,
  hints,
}: UseBrowserMultiFormatReaderOptions = {}) => {
  return useMemo<BrowserMultiFormatReader>(() => {
    const instance = new BrowserMultiFormatReader(hints);
    instance.timeBetweenDecodingAttempts = timeBetweenDecodingAttempts;
    return instance;
  }, [hints, timeBetweenDecodingAttempts]);
};
