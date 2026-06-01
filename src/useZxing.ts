import {
  ChecksumException,
  DecodeContinuouslyCallback,
  DecodeHintType,
  Exception,
  FormatException,
  NotFoundException,
  Result,
} from "@zxing/library";
import { useCallback, useEffect, useMemo, useRef } from "react";
import { DEFAULT_CONSTRAINTS } from "./constants";
import { useBrowserMultiFormatReader } from "./useBrowserMultiFormatReader";
import { useTorch } from "./useTorch";

const isExpectedDecodeError = (error: Exception) =>
  error instanceof NotFoundException ||
  error instanceof ChecksumException ||
  error instanceof FormatException;

export interface UseZxingOptions {
  paused?: boolean;
  hints?: Map<DecodeHintType, unknown>;
  timeBetweenDecodingAttempts?: number;
  onDecodeResult?: (result: Result) => void;
  onDecodeError?: (error: Exception) => void;
  onError?: (error: unknown) => void;
}

export interface UseZxingOptionsWithConstraints extends UseZxingOptions {
  constraints?: MediaStreamConstraints;
}

export interface UseZxingOptionsWithDeviceId extends UseZxingOptions {
  deviceId: string;
}

export const useZxing = (
  options: UseZxingOptionsWithConstraints | UseZxingOptionsWithDeviceId = {},
) => {
  const {
    paused = false,
    hints,
    timeBetweenDecodingAttempts,
    onDecodeResult = () => {},
    onDecodeError = () => {},
    onError = () => {},
  } = options;
  const deviceId = "deviceId" in options ? options.deviceId : undefined;
  const constraintsOption =
    "constraints" in options ? options.constraints : undefined;
  const constraintsKey = JSON.stringify(constraintsOption);
  const constraints = useMemo(
    () => constraintsOption,
    // Stabilize inline constraint objects by value, not reference.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- constraintsKey
    [constraintsKey],
  );
  const decodeResultHandlerRef = useRef(onDecodeResult);
  const decodeErrorHandlerRef = useRef(onDecodeError);
  const errorHandlerRef = useRef(onError);
  const ref = useRef<HTMLVideoElement>(null);

  const reader = useBrowserMultiFormatReader({
    hints,
    timeBetweenDecodingAttempts,
  });

  const { init: torchInit, ...torch } = useTorch({
    resetStream: async () => {
      stopDecoding();
      await startDecoding();
    },
  });

  const decodeCallback = useCallback<DecodeContinuouslyCallback>(
    (result, error) => {
      if (result) decodeResultHandlerRef.current(result);
      if (error && !isExpectedDecodeError(error)) {
        decodeErrorHandlerRef.current(error);
      }
    },
    [],
  );

  const startDecoding = useCallback(async () => {
    if (!ref.current) return;
    if (paused) return;
    try {
      if (deviceId) {
        await reader.decodeFromVideoDevice(
          deviceId,
          ref.current,
          decodeCallback,
        );
      } else {
        await reader.decodeFromConstraints(
          constraints ?? DEFAULT_CONSTRAINTS,
          ref.current,
          decodeCallback,
        );
      }
    } catch (e: unknown) {
      errorHandlerRef.current(e);
      return;
    }

    if (!ref.current) return;
    const mediaStream = ref.current.srcObject as MediaStream;
    const videoTrack = mediaStream.getVideoTracks()[0];
    if (videoTrack) torchInit(videoTrack);
  }, [reader, deviceId, constraints, paused, decodeCallback, torchInit]);

  const stopDecoding = useCallback(() => {
    reader.reset();
  }, [reader]);

  useEffect(() => {
    decodeResultHandlerRef.current = onDecodeResult;
  }, [onDecodeResult]);

  useEffect(() => {
    decodeErrorHandlerRef.current = onDecodeError;
  }, [onDecodeError]);

  useEffect(() => {
    errorHandlerRef.current = onError;
  }, [onError]);

  useEffect(() => {
    startDecoding();
    return () => {
      stopDecoding();
    };
  }, [startDecoding, stopDecoding]);

  return {
    ref,
    torch,
  };
};
