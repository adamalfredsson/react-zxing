import { cleanup, render, waitFor } from "@testing-library/react";
import type { DetectedBarcode } from "barcode-detector/ponyfill";
import { createElement } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useZxing } from "./useZxing";

const { prepareWasm, detect, detectSkewedVideo } = vi.hoisted(() => ({
  prepareWasm: vi.fn().mockResolvedValue(undefined),
  detect: vi.fn().mockResolvedValue([]),
  detectSkewedVideo: vi.fn().mockResolvedValue([]),
}));

vi.mock("./prepareWasm", () => ({
  prepareWasm,
}));

vi.mock("./useBarcodeDetector", () => ({
  useBarcodeDetector: () => ({ detect }),
}));

vi.mock("./detectSkewedVideo", () => ({
  detectSkewedVideo,
}));

const createStream = () => {
  const track = {
    stop: vi.fn(),
    getCapabilities: vi.fn(() => ({})),
  };

  return {
    getTracks: () => [track],
    getVideoTracks: () => [track],
  } as unknown as MediaStream;
};

const prepareVideoForScanning = () => {
  const video = document.querySelector("video");
  if (!video) throw new Error("video element not found");

  Object.defineProperties(video, {
    readyState: {
      value: HTMLMediaElement.HAVE_ENOUGH_DATA,
      configurable: true,
    },
    videoWidth: { value: 640, configurable: true },
    videoHeight: { value: 480, configurable: true },
  });

  return video;
};

const Scanner = ({ options }: { options?: Parameters<typeof useZxing>[0] }) => {
  const { ref } = useZxing(options);
  return createElement("video", { ref });
};

describe("useZxing", () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    vi.stubGlobal("isSecureContext", true);
    vi.stubGlobal("navigator", {
      mediaDevices: {
        getUserMedia: vi.fn().mockResolvedValue(createStream()),
      },
    });
    HTMLVideoElement.prototype.play = vi
      .fn()
      .mockResolvedValue(undefined) as typeof HTMLVideoElement.prototype.play;
    prepareWasm.mockClear();
    detect.mockReset();
    detect.mockResolvedValue([]);
    detectSkewedVideo.mockReset();
    detectSkewedVideo.mockResolvedValue([]);
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("starts the camera and reports decoded barcodes", async () => {
    const barcode: DetectedBarcode = {
      rawValue: "978020137962",
      format: "ean_13",
      boundingBox: new DOMRectReadOnly(0, 0, 1, 1),
      cornerPoints: [
        { x: 0, y: 0 },
        { x: 1, y: 0 },
        { x: 1, y: 1 },
        { x: 0, y: 1 },
      ],
    };
    const onDecodeResult = vi.fn();
    detect.mockResolvedValue([barcode]);

    render(
      createElement(Scanner, {
        options: {
          trySkew: false,
          timeBetweenDecodingAttempts: 50,
          onDecodeResult,
        },
      }),
    );

    await waitFor(() => {
      expect(prepareWasm).toHaveBeenCalledOnce();
      expect(navigator.mediaDevices.getUserMedia).toHaveBeenCalledOnce();
    });

    prepareVideoForScanning();
    await vi.advanceTimersByTimeAsync(100);

    await waitFor(() => {
      expect(onDecodeResult).toHaveBeenCalledWith(barcode);
    });
  });

  it("does not start scanning while paused", async () => {
    render(createElement(Scanner, { options: { paused: true } }));

    await vi.advanceTimersByTimeAsync(500);

    expect(navigator.mediaDevices.getUserMedia).not.toHaveBeenCalled();
    expect(prepareWasm).not.toHaveBeenCalled();
  });

  it("forwards camera setup errors", async () => {
    const onError = vi.fn();
    const cameraError = new Error("permission denied");
    vi.mocked(navigator.mediaDevices.getUserMedia).mockRejectedValue(
      cameraError,
    );

    render(createElement(Scanner, { options: { onError } }));

    await waitFor(() => {
      expect(onError).toHaveBeenCalledWith(cameraError);
    });
  });

  it("uses an explicit device id when provided", async () => {
    render(createElement(Scanner, { options: { deviceId: "back-camera" } }));

    await waitFor(() => {
      expect(navigator.mediaDevices.getUserMedia).toHaveBeenCalledWith({
        audio: false,
        video: { deviceId: { exact: "back-camera" } },
      });
    });
  });

  it("forwards decode errors from the detector", async () => {
    const onDecodeError = vi.fn();
    const decodeError = new Error("decode failed");
    detect.mockRejectedValue(decodeError);

    render(
      createElement(Scanner, {
        options: {
          trySkew: false,
          timeBetweenDecodingAttempts: 50,
          onDecodeError,
        },
      }),
    );

    await waitFor(() => {
      expect(navigator.mediaDevices.getUserMedia).toHaveBeenCalledOnce();
    });

    prepareVideoForScanning();
    await vi.advanceTimersByTimeAsync(100);

    await waitFor(() => {
      expect(onDecodeError).toHaveBeenCalledWith(decodeError);
    });
  });

  it("does not retry skewed frames by default", async () => {
    render(
      createElement(Scanner, {
        options: { timeBetweenDecodingAttempts: 50 },
      }),
    );

    await waitFor(() => {
      expect(navigator.mediaDevices.getUserMedia).toHaveBeenCalledOnce();
    });

    prepareVideoForScanning();
    await vi.advanceTimersByTimeAsync(100);

    expect(detect).toHaveBeenCalled();
    expect(detectSkewedVideo).not.toHaveBeenCalled();
  });

  it("retries skewed frames when enabled", async () => {
    render(
      createElement(Scanner, {
        options: { trySkew: true, timeBetweenDecodingAttempts: 50 },
      }),
    );

    await waitFor(() => {
      expect(navigator.mediaDevices.getUserMedia).toHaveBeenCalledOnce();
    });

    const video = prepareVideoForScanning();
    await vi.advanceTimersByTimeAsync(100);

    expect(detectSkewedVideo).toHaveBeenCalledWith(
      video,
      { detect },
      expect.any(Number),
    );
  });
});
