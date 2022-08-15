import {
  BrowserMultiFormatReader,
  DecodeContinuouslyCallback,
  DecodeHintType,
  Result,
} from "@zxing/library";
import { useCallback, useEffect, useMemo, useRef } from "react";

export interface UseZxingOptions {
  hints?: Map<DecodeHintType, any>;
  constraints?: MediaStreamConstraints;
  timeBetweenDecodingAttempts?: number;
  onResult?: (result: Result) => void;
  onError?: (error: Error) => void;
}

export const useZxing = ({
  constraints = {
    audio: false,
    video: {
      facingMode: "environment",
    },
  },
  hints,
  timeBetweenDecodingAttempts = 300,
  onResult = () => {},
  onError = () => {},
}: UseZxingOptions = {}) => {
  const ref = useRef<HTMLVideoElement>(null);

  const reader = useMemo<BrowserMultiFormatReader>(() => {
    const instance = new BrowserMultiFormatReader(hints);
    instance.timeBetweenDecodingAttempts = timeBetweenDecodingAttempts;
    return instance;
  }, [hints, timeBetweenDecodingAttempts]);

  const decodeCallback = useCallback<DecodeContinuouslyCallback>(
    (result, error) => {
      if (result) onResult(result);
      if (error) onError(error);
    },
    [onResult, onError]
  );

  useEffect(() => {
    if (!ref.current) return;
    reader.decodeFromConstraints(constraints, ref.current, decodeCallback);
    return () => {
      reader.reset();
    };
  }, [ref, reader, constraints, decodeCallback]);

  return { ref };
};
