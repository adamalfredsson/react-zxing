import { afterEach, describe, expect, it, vi } from "vitest";
import { assertCameraAccess } from "./mediaDevices";

describe("assertCameraAccess", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("throws when the page is not a secure context", () => {
    vi.stubGlobal("isSecureContext", false);

    expect(() => assertCameraAccess()).toThrow(
      "Camera access requires a secure context",
    );
  });

  it("throws when getUserMedia is unavailable", () => {
    vi.stubGlobal("isSecureContext", true);
    vi.stubGlobal("navigator", {});

    expect(() => assertCameraAccess()).toThrow(
      "Camera access is not supported in this browser.",
    );
  });

  it("passes when camera APIs are available", () => {
    vi.stubGlobal("isSecureContext", true);
    vi.stubGlobal("navigator", {
      mediaDevices: { getUserMedia: vi.fn() },
    });

    expect(() => assertCameraAccess()).not.toThrow();
  });
});
