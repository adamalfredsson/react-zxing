import { act, renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useTorch } from "./useTorch";

const createTrack = ({ torch }: { torch?: boolean } = {}) => ({
  getCapabilities: vi.fn(() => ({ ...(torch === undefined ? {} : { torch }) })),
  applyConstraints: vi.fn().mockResolvedValue(undefined),
});

describe("useTorch", () => {
  it("reports torch availability from track capabilities", () => {
    const { result } = renderHook(() =>
      useTorch({ resetStream: vi.fn().mockResolvedValue(undefined) }),
    );

    act(() => {
      result.current.init(
        createTrack({ torch: true }) as unknown as MediaStreamTrack,
      );
    });

    expect(result.current.isAvailable).toBe(true);
  });

  it("reports torch as unavailable when capabilities are missing", () => {
    const { result } = renderHook(() =>
      useTorch({ resetStream: vi.fn().mockResolvedValue(undefined) }),
    );

    act(() => {
      result.current.init({
        getCapabilities: undefined,
      } as unknown as MediaStreamTrack);
    });

    expect(result.current.isAvailable).toBe(false);
  });

  it("turns the torch on with advanced constraints", async () => {
    const track = createTrack({ torch: true });
    const { result } = renderHook(() =>
      useTorch({ resetStream: vi.fn().mockResolvedValue(undefined) }),
    );

    act(() => {
      result.current.init(track as unknown as MediaStreamTrack);
    });

    await act(async () => {
      await result.current.on();
    });

    expect(track.applyConstraints).toHaveBeenCalledWith({
      advanced: [{ torch: true }],
    });
    expect(result.current.isOn).toBe(true);
  });

  it("turns the torch off by resetting the stream", async () => {
    const resetStream = vi.fn().mockResolvedValue(undefined);
    const track = createTrack({ torch: true });
    const { result } = renderHook(() => useTorch({ resetStream }));

    act(() => {
      result.current.init(track as unknown as MediaStreamTrack);
    });

    await act(async () => {
      await result.current.on();
    });

    await act(async () => {
      await result.current.off();
    });

    await waitFor(() => {
      expect(resetStream).toHaveBeenCalledOnce();
    });
    expect(result.current.isOn).toBe(false);
    expect(result.current.isAvailable).toBeNull();
  });
});
