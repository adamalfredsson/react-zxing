import type { BarcodeFormat, DetectedBarcode } from "barcode-detector/ponyfill";
import { useCallback, useEffect, useMemo, useRef } from "react";
import { DEFAULT_CONSTRAINTS } from "./constants";
import { detectSkewedVideo } from "./detectSkewedVideo";
import { assertCameraAccess } from "./mediaDevices";
import { prepareWasm } from "./prepareWasm";
import { useBarcodeDetector } from "./useBarcodeDetector";
import { useTorch } from "./useTorch";

export interface UseZxingOptions {
  paused?: boolean;
  formats?: BarcodeFormat[];
  wasmUrl?: string;
  timeBetweenDecodingAttempts?: number;
  /** Extra rotation angles (degrees) to try when a frame fails to decode. Helps skewed 1D codes like EAN. */
  trySkew?: boolean | number[];
  onDecodeResult?: (result: DetectedBarcode) => void;
  onDecodeError?: (error: unknown) => void;
  onError?: (error: unknown) => void;
}

export interface UseZxingOptionsWithConstraints extends UseZxingOptions {
  constraints?: MediaStreamConstraints;
}

export interface UseZxingOptionsWithDeviceId extends UseZxingOptions {
  deviceId: string;
}

const DEFAULT_TIME_BETWEEN_DECODING_ATTEMPTS = 300;
const DEFAULT_SKEW_ANGLES = [-20, -15, -10, -5, 5, 10, 15, 20];

const isStaleSession = (session: number, sessionRef: { current: number }) =>
  session !== sessionRef.current;

const isPlayInterrupted = (error: unknown) =>
  error instanceof DOMException && error.name === "AbortError";

const playVideo = async (video: HTMLVideoElement) => {
  video.muted = true;
  video.playsInline = true;
  try {
    await video.play();
  } catch (error: unknown) {
    if (isPlayInterrupted(error)) return;
    throw error;
  }
};

export const useZxing = (
  options: UseZxingOptionsWithConstraints | UseZxingOptionsWithDeviceId = {},
) => {
  const {
    paused = false,
    formats: formatsOption,
    wasmUrl,
    timeBetweenDecodingAttempts = DEFAULT_TIME_BETWEEN_DECODING_ATTEMPTS,
    trySkew: trySkewOption = false,
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
  const formatsKey = JSON.stringify(formatsOption);
  const formats = useMemo(
    () => formatsOption,
    // Stabilize inline format arrays by value, not reference.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- formatsKey
    [formatsKey],
  );
  const trySkewKey = JSON.stringify(trySkewOption);
  const skewAngles = useMemo(
    (): number[] => {
      if (trySkewOption === false) return [];
      if (trySkewOption === true) return [...DEFAULT_SKEW_ANGLES];
      return trySkewOption;
    },
    // Stabilize inline skew arrays by value, not reference.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- trySkewKey
    [trySkewKey],
  );
  const decodeResultHandlerRef = useRef(onDecodeResult);
  const decodeErrorHandlerRef = useRef(onDecodeError);
  const errorHandlerRef = useRef(onError);
  const ref = useRef<HTMLVideoElement>(null);
  const scanTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  );
  const streamRef = useRef<MediaStream | undefined>(undefined);
  const sessionRef = useRef(0);
  const torchInitRef = useRef<(track: MediaStreamTrack) => void>(() => {});
  const startDecodingRef = useRef<() => Promise<void>>(async () => {});
  const skewIndexRef = useRef(0);

  const detector = useBarcodeDetector({ formats });

  const stopDecoding = useCallback(() => {
    if (scanTimeoutRef.current !== undefined) {
      clearTimeout(scanTimeoutRef.current);
      scanTimeoutRef.current = undefined;
    }
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = undefined;
    if (ref.current) ref.current.srcObject = null;
  }, []);

  const scheduleScan = useCallback(
    (video: HTMLVideoElement, session: number) => {
      const scan = async () => {
        if (isStaleSession(session, sessionRef) || ref.current !== video)
          return;
        if (
          video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA ||
          video.videoWidth === 0
        ) {
          scanTimeoutRef.current = setTimeout(
            () => void scan(),
            timeBetweenDecodingAttempts,
          );
          return;
        }
        try {
          const barcodes = await detector.detect(video);
          let [barcode] = barcodes;

          if (!barcode && skewAngles.length > 0) {
            const skewed = await detectSkewedVideo(
              video,
              detector,
              skewAngles[skewIndexRef.current++ % skewAngles.length],
            );
            [barcode] = skewed;
          }

          if (isStaleSession(session, sessionRef) || ref.current !== video)
            return;
          if (barcode) decodeResultHandlerRef.current(barcode);
        } catch (error: unknown) {
          if (isStaleSession(session, sessionRef)) return;
          decodeErrorHandlerRef.current(error);
        }
        if (isStaleSession(session, sessionRef) || ref.current !== video)
          return;
        scanTimeoutRef.current = setTimeout(
          () => void scan(),
          timeBetweenDecodingAttempts,
        );
      };
      scanTimeoutRef.current = setTimeout(
        () => void scan(),
        timeBetweenDecodingAttempts,
      );
    },
    [detector, skewAngles, timeBetweenDecodingAttempts],
  );

  const startDecoding = useCallback(async () => {
    if (!ref.current || paused) return;

    stopDecoding();
    const session = ++sessionRef.current;
    const video = ref.current;
    const mediaConstraints = deviceId
      ? { audio: false, video: { deviceId: { exact: deviceId } } }
      : (constraints ?? DEFAULT_CONSTRAINTS);

    try {
      assertCameraAccess();
      await prepareWasm({ wasmUrl });
      if (isStaleSession(session, sessionRef)) return;

      const stream =
        await navigator.mediaDevices.getUserMedia(mediaConstraints);
      if (isStaleSession(session, sessionRef)) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }

      streamRef.current = stream;
      video.srcObject = stream;
      await playVideo(video);
      if (isStaleSession(session, sessionRef)) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }
    } catch (e: unknown) {
      if (isStaleSession(session, sessionRef) || isPlayInterrupted(e)) return;
      errorHandlerRef.current(e);
      return;
    }

    const videoTrack = streamRef.current?.getVideoTracks()[0];
    if (videoTrack) torchInitRef.current(videoTrack);
    scheduleScan(video, session);
  }, [deviceId, constraints, paused, scheduleScan, stopDecoding, wasmUrl]);

  const { init: torchInit, ...torch } = useTorch({
    resetStream: async () => {
      sessionRef.current += 1;
      stopDecoding();
      await startDecodingRef.current();
    },
  });

  useEffect(() => {
    startDecodingRef.current = startDecoding;
    torchInitRef.current = torchInit;
  }, [startDecoding, torchInit]);

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
    void startDecoding();
    return () => {
      sessionRef.current += 1;
      stopDecoding();
    };
  }, [startDecoding, stopDecoding]);

  return {
    ref,
    torch,
  };
};
