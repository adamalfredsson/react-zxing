import { beforeEach, describe, expect, it, vi } from "vitest";

const { prepareZXingModule } = vi.hoisted(() => ({
  prepareZXingModule: vi.fn<() => void | Promise<void>>(() => undefined),
}));

vi.mock("barcode-detector/ponyfill", () => ({
  prepareZXingModule,
}));

const loadPrepareWasm = async () => {
  const { prepareWasm } = await import("./prepareWasm");
  return prepareWasm;
};

describe("prepareWasm", () => {
  beforeEach(() => {
    vi.resetModules();
    prepareZXingModule.mockReset();
    prepareZXingModule.mockReturnValue(undefined);
  });

  it("initializes the ZXing module once", async () => {
    const prepareWasm = await loadPrepareWasm();

    await Promise.all([prepareWasm(), prepareWasm()]);

    expect(prepareZXingModule).toHaveBeenCalledTimes(1);
    expect(prepareZXingModule).toHaveBeenCalledWith({
      fireImmediately: true,
    });
  });

  it("awaits async module initialization", async () => {
    prepareZXingModule.mockReturnValue(Promise.resolve());
    const prepareWasm = await loadPrepareWasm();

    await prepareWasm();

    expect(prepareZXingModule).toHaveBeenCalledOnce();
  });

  it("routes wasm requests through a custom url", async () => {
    const prepareWasm = await loadPrepareWasm();

    await prepareWasm({ wasmUrl: "/custom/zxing_reader.wasm" });

    expect(prepareZXingModule).toHaveBeenCalledOnce();

    const firstCall = (
      prepareZXingModule.mock.calls as unknown as Array<
        [
          {
            overrides: {
              locateFile: (path: string, prefix: string) => string;
            };
          },
        ]
      >
    )[0]?.[0];
    expect(firstCall).toBeDefined();

    const { overrides } = firstCall!;

    expect(overrides.locateFile("zxing_reader.wasm", "/prefix/")).toBe(
      "/custom/zxing_reader.wasm",
    );
    expect(overrides.locateFile("other.js", "/prefix/")).toBe(
      "/prefix/other.js",
    );
  });

  it("reuses the prepared module for the same custom URL", async () => {
    const prepareWasm = await loadPrepareWasm();

    await prepareWasm({ wasmUrl: "/zxing_reader.wasm" });
    await prepareWasm({ wasmUrl: "/zxing_reader.wasm" });

    expect(prepareZXingModule).toHaveBeenCalledOnce();
  });

  it("reuses a custom URL when useZxing calls prepareWasm without wasmUrl", async () => {
    const prepareWasm = await loadPrepareWasm();

    await prepareWasm({ wasmUrl: "/zxing_reader.wasm" });
    await prepareWasm();

    expect(prepareZXingModule).toHaveBeenCalledOnce();
  });

  it("rejects a different wasm URL after the module is prepared", async () => {
    const prepareWasm = await loadPrepareWasm();

    await prepareWasm({ wasmUrl: "/first.wasm" });

    await expect(prepareWasm({ wasmUrl: "/second.wasm" })).rejects.toThrow(
      "different wasmUrl",
    );
    expect(prepareZXingModule).toHaveBeenCalledOnce();
  });

  it("clears a failed preparation so callers can retry", async () => {
    const prepareWasm = await loadPrepareWasm();
    const error = new Error("wasm failed");
    prepareZXingModule
      .mockReturnValueOnce(Promise.reject(error))
      .mockReturnValueOnce(undefined);

    await expect(prepareWasm()).rejects.toThrow(error);
    await expect(prepareWasm()).resolves.toBeUndefined();

    expect(prepareZXingModule).toHaveBeenCalledTimes(2);
  });
});
