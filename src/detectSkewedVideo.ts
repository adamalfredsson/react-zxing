import type { BarcodeDetector } from "barcode-detector/ponyfill";

type CanvasLike = HTMLCanvasElement | OffscreenCanvas;

const getCanvasContext = (canvas: CanvasLike) => canvas.getContext("2d");

const createCanvas = (width: number, height: number) => {
  if (typeof OffscreenCanvas !== "undefined") {
    const canvas = new OffscreenCanvas(width, height);
    if (getCanvasContext(canvas)) return canvas;
  }

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  return canvas;
};

const captureVideoFrame = (video: HTMLVideoElement) => {
  const { videoWidth: width, videoHeight: height } = video;
  if (
    width === 0 ||
    height === 0 ||
    video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA
  ) {
    return null;
  }

  const canvas = createCanvas(width, height);
  const context = canvas.getContext("2d");
  if (!context) return null;

  context.drawImage(video, 0, 0);
  return context.getImageData(0, 0, width, height);
};

const rotateImageData = (source: ImageData, degrees: number) => {
  const radians = (degrees * Math.PI) / 180;
  const sin = Math.abs(Math.sin(radians));
  const cos = Math.abs(Math.cos(radians));
  const { width, height } = source;
  const rotatedWidth = Math.ceil(width * cos + height * sin);
  const rotatedHeight = Math.ceil(width * sin + height * cos);

  const sourceCanvas = createCanvas(width, height);
  const sourceContext = getCanvasContext(sourceCanvas);
  if (!sourceContext) return null;
  sourceContext.putImageData(source, 0, 0);

  const rotatedCanvas = createCanvas(rotatedWidth, rotatedHeight);
  const context = getCanvasContext(rotatedCanvas);
  if (!context) return null;

  context.translate(rotatedWidth / 2, rotatedHeight / 2);
  context.rotate(radians);
  context.drawImage(sourceCanvas as CanvasImageSource, -width / 2, -height / 2);

  return context.getImageData(0, 0, rotatedWidth, rotatedHeight);
};

export const detectSkewedVideo = async (
  video: HTMLVideoElement,
  detector: BarcodeDetector,
  skewAngle: number,
) => {
  const imageData = captureVideoFrame(video);
  if (!imageData) return [];
  const rotatedImageData = rotateImageData(imageData, skewAngle);
  if (!rotatedImageData) return [];

  return detector.detect(rotatedImageData);
};
