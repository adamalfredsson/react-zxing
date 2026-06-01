import type { BarcodeDetector } from "barcode-detector/ponyfill";
import { describe, expect, it, vi } from "vitest";
import { detectSkewedVideo } from "./detectSkewedVideo";

const createVideo = ({
  readyState = HTMLMediaElement.HAVE_ENOUGH_DATA,
  videoWidth = 0,
  videoHeight = 0,
}: {
  readyState?: number;
  videoWidth?: number;
  videoHeight?: number;
} = {}) => {
  const video = document.createElement("video");
  Object.defineProperties(video, {
    readyState: { value: readyState },
    videoWidth: { value: videoWidth, configurable: true },
    videoHeight: { value: videoHeight, configurable: true },
  });
  return video;
};

describe("detectSkewedVideo", () => {
  it("returns an empty list when the video frame is not ready", async () => {
    const detector = { detect: vi.fn() } as unknown as BarcodeDetector;
    const video = createVideo();

    await expect(detectSkewedVideo(video, detector, 15)).resolves.toEqual([]);

    expect(detector.detect).not.toHaveBeenCalled();
  });

  it("detects barcodes from a rotated frame", async () => {
    const barcode = { rawValue: "123", format: "ean_13" };
    const detect = vi.fn().mockResolvedValue([barcode]);
    const detector = { detect } as unknown as BarcodeDetector;
    const video = createVideo({ videoWidth: 40, videoHeight: 20 });
    const context = {
      drawImage: vi.fn(),
      putImageData: vi.fn(),
      translate: vi.fn(),
      rotate: vi.fn(),
      getImageData: vi.fn((width: number, height: number) => ({
        width,
        height,
        data: new Uint8ClampedArray(width * height * 4),
      })),
    };

    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(
      context as unknown as CanvasRenderingContext2D,
    );

    await expect(detectSkewedVideo(video, detector, 10)).resolves.toEqual([
      barcode,
    ]);

    expect(detect).toHaveBeenCalledOnce();
    expect(detect.mock.calls[0]?.[0]).toMatchObject({
      width: expect.any(Number),
      height: expect.any(Number),
      data: expect.any(Uint8ClampedArray),
    });
  });

  it("returns an empty list when canvas context is unavailable", async () => {
    const detector = { detect: vi.fn() } as unknown as BarcodeDetector;
    const video = createVideo({ videoWidth: 40, videoHeight: 20 });

    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(null);

    await expect(detectSkewedVideo(video, detector, 10)).resolves.toEqual([]);
    expect(detector.detect).not.toHaveBeenCalled();
  });
});
