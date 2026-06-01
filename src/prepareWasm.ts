import { prepareZXingModule } from "barcode-detector/ponyfill";

export interface PrepareWasmOptions {
  wasmUrl?: string;
}

let wasmReady:
  | {
      wasmUrl: string | undefined;
      promise: Promise<void>;
    }
  | undefined;

export const prepareWasm = ({ wasmUrl }: PrepareWasmOptions = {}) => {
  if (wasmReady) {
    if (wasmUrl !== undefined && wasmReady.wasmUrl !== wasmUrl) {
      return Promise.reject(
        new Error(
          "prepareWasm() has already been called with a different wasmUrl. " +
            "Call it once with the URL you want before mounting scanners.",
        ),
      );
    }

    return wasmReady.promise;
  }

  const promise = (async () => {
    const result = prepareZXingModule({
      ...(wasmUrl
        ? {
            overrides: {
              locateFile: (path: string, prefix: string) =>
                path.endsWith(".wasm") ? wasmUrl : prefix + path,
            },
          }
        : {}),
      fireImmediately: true,
    });
    if (result instanceof Promise) await result;
  })();

  wasmReady = { wasmUrl, promise };

  promise.catch(() => {
    if (wasmReady?.promise === promise) wasmReady = undefined;
  });

  return promise;
};
