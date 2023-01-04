import {
  DecodeContinuouslyCallback,
  DecodeHintType,
  Result,
} from "@zxing/library";
import { useCallback, useEffect, useRef, useState } from "react";
import { DEFAULT_CONSTRAINTS } from "./constants";
import { useBrowserMultiFormatReader } from "./useBrowserMultiFormatReader";
import { useTorch } from "./useTorch";
import { deepCompareObjects } from "./utils";

export interface UseZxingOptions {
  paused?: boolean;
  hints?: Map<DecodeHintType, any>;
  timeBetweenDecodingAttempts?: number;
  onResult?: (result: Result) => void;
  onError?: (error: Error) => void;
}

export interface UseZxingOptionsWithConstraints extends UseZxingOptions {
  constraints?: MediaStreamConstraints;
}

export interface UseZxingOptionsWithDeviceId extends UseZxingOptions {
  deviceId: string;
}

function isUseZxingOptionsWithDeviceId(
  options: UseZxingOptions
): options is UseZxingOptionsWithDeviceId {
  return (options as UseZxingOptionsWithDeviceId).deviceId !== undefined;
}

export const useZxing = (
  options: UseZxingOptionsWithConstraints | UseZxingOptionsWithDeviceId = {}
) => {
  const {
    paused = false,
    hints,
    timeBetweenDecodingAttempts,
    onResult = () => {},
    onError = () => {},
  } = options;
  const deviceId = isUseZxingOptionsWithDeviceId(options)
    ? options.deviceId
    : undefined;
  const [constraints, setConstraints] = useState(
    isUseZxingOptionsWithDeviceId(options) ? undefined : options.constraints
  );
  const resultHandlerRef = useRef(onResult);
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
      if (result) resultHandlerRef.current(result);
      if (error) errorHandlerRef.current(error);
    },
    []
  );

  const startDecoding = useCallback(async () => {
    if (!ref.current) return;
    if (paused) return;
    if (deviceId) {
      await reader.decodeFromVideoDevice(deviceId, ref.current, decodeCallback);
    } else {
      await reader.decodeFromConstraints(
        constraints ?? DEFAULT_CONSTRAINTS,
        ref.current,
        decodeCallback
      );
    }
    const mediaStream = ref.current.srcObject as MediaStream;
    const videoTrack = mediaStream.getVideoTracks()[0];
    if (videoTrack) torchInit(videoTrack);
  }, [reader, deviceId, constraints, paused, decodeCallback, torchInit]);

  const stopDecoding = useCallback(() => {
    reader.reset();
  }, [reader]);

  useEffect(() => {
    resultHandlerRef.current = onResult;
  }, [onResult]);

  useEffect(() => {
    errorHandlerRef.current = onError;
  }, [onError]);

  useEffect(() => {
    const isConstraintsValueSame = deepCompareObjects(
      constraints,
      (options as UseZxingOptionsWithConstraints).constraints
    );
    if (!isConstraintsValueSame) {
      setConstraints((options as UseZxingOptionsWithConstraints).constraints);
    }
  }, [constraints, options]);

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
