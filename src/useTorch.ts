import { useCallback, useEffect, useRef, useState } from "react";

interface UseTorchOptions {
  resetStream: () => void;
}

export const useTorch = ({ resetStream }: UseTorchOptions) => {
  const [isOn, setIsOn] = useState(false);
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
  const videoTrackRef = useRef<MediaStreamTrack | null>(null);
  const resetStreamRef = useRef(resetStream);

  const init = useCallback((videoTrack: MediaStreamTrack) => {
    videoTrackRef.current = videoTrack;
    setIsAvailable((videoTrack.getCapabilities() as any).torch !== undefined);
  }, []);

  const on = useCallback(async () => {
    if (!videoTrackRef.current || !isAvailable) return;
    await videoTrackRef.current.applyConstraints({
      advanced: [{ torch: true } as any],
    });
    setIsOn(true);
  }, [isAvailable]);

  const off = useCallback(async () => {
    if (!videoTrackRef.current || !isAvailable) return;
    // applyConstraints with torch: false does not work to turn the flashlight off, as a stream's torch stays
    // continuously on, see https://developer.mozilla.org/en-US/docs/Web/API/MediaTrackConstraints#torch. Therefore,
    // we have to stop the stream to turn the flashlight off.
    videoTrackRef.current = null;
    setIsAvailable(null);
    setIsOn(false);
    await resetStreamRef.current();
  }, [isAvailable]);

  useEffect(() => {
    resetStreamRef.current = resetStream;
  }, [resetStream]);

  return { init, isOn, isAvailable, on, off };
};
