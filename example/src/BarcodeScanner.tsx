import { useState } from "react";
import { useZxing } from "react-zxing";

type DecodeEntry = {
  id: string;
  at: Date;
  code: string;
  format: string;
};

const formatError = (error: unknown) =>
  error instanceof Error ? error.message : String(error);

const formatTimestamp = (date: Date) =>
  date.toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

const formatBarcodeType = (format: string) =>
  format.replace(/_/g, "-").toUpperCase();

const buttonClass =
  "rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50";

export const BarcodeScanner = () => {
  const [result, setResult] = useState("");
  const [history, setHistory] = useState<DecodeEntry[]>([]);
  const [error, setError] = useState("");
  const [count, setCount] = useState(0);
  const [paused, setPaused] = useState(false);

  const {
    ref,
    torch: {
      on: torchOn,
      off: torchOff,
      isOn: isTorchOn,
      isAvailable: isTorchAvailable,
    },
  } = useZxing({
    paused,
    formats: ["retail_codes"],
    timeBetweenDecodingAttempts: 100,
    constraints: {
      audio: false,
      video: {
        facingMode: "environment",
        width: { ideal: 1920 },
        height: { ideal: 1080 },
      },
    },
    onDecodeResult(result) {
      setResult(result.rawValue);
      setHistory((prev) => [
        {
          id: crypto.randomUUID(),
          at: new Date(),
          code: result.rawValue,
          format: result.format,
        },
        ...prev,
      ]);
    },
    onError(error) {
      setError(formatError(error));
      // eslint-disable-next-line no-console
      console.error(error);
    },
  });

  // eslint-disable-next-line no-console
  console.log("render");

  return (
    <section className="flex flex-col gap-4">
      <div className="overflow-hidden rounded-xl bg-slate-900 shadow-md ring-1 ring-slate-900/10">
        <video
          ref={ref}
          muted
          playsInline
          className="block h-auto max-h-[min(50dvh,24rem)] w-full max-w-full object-contain"
        />
      </div>
      {error ? (
        <p
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800"
        >
          {error}
        </p>
      ) : null}
      <p className="break-all text-sm text-slate-600">
        <span className="font-medium text-slate-900">Last result: </span>
        <span>{result || "—"}</span>
      </p>
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-sm font-medium text-slate-900">
            Decode history ({history.length})
          </h2>
          {history.length > 0 ? (
            <button
              type="button"
              className="text-sm font-medium text-slate-600 underline-offset-2 hover:text-slate-900 hover:underline"
              onClick={() => setHistory([])}
            >
              Clear
            </button>
          ) : null}
        </div>
        {history.length === 0 ? (
          <p className="text-sm text-slate-500">No successful decodes yet.</p>
        ) : (
          <ul className="max-h-48 divide-y divide-slate-200 overflow-y-auto rounded-lg border border-slate-200 bg-white">
            {history.map((entry) => (
              <li
                key={entry.id}
                className="grid grid-cols-[auto_auto_1fr] gap-x-3 gap-y-0.5 px-3 py-2 text-sm"
              >
                <time
                  dateTime={entry.at.toISOString()}
                  className="tabular-nums text-slate-500"
                >
                  {formatTimestamp(entry.at)}
                </time>
                <span className="font-medium text-slate-700">
                  {formatBarcodeType(entry.format)}
                </span>
                <span className="break-all text-slate-900">{entry.code}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className={buttonClass}
          onClick={() => setPaused(!paused)}
        >
          {paused ? "Resume" : "Pause"}
        </button>
        <button
          type="button"
          className={buttonClass}
          onClick={() => {
            if (isTorchOn) {
              torchOff();
            } else {
              torchOn();
            }
          }}
          disabled={!isTorchAvailable}
        >
          {isTorchOn ? "Disable" : "Enable"} torch
        </button>
        <button
          type="button"
          className={buttonClass}
          onClick={() => setCount(count + 1)}
        >
          Count: {count}
        </button>
      </div>
    </section>
  );
};
