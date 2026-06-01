import { useState } from "react";
import { BarcodeScanner } from "./BarcodeScanner";

const App = () => {
  const [mounted, setMounted] = useState(true);

  return (
    <div className="mx-auto flex min-h-dvh max-w-lg flex-col gap-6 p-4 sm:p-6">
      <header className="flex items-center justify-between gap-4">
        <h1 className="text-xl font-semibold tracking-tight text-slate-900">
          react-zxing example
        </h1>
        <button
          type="button"
          onClick={() => setMounted(!mounted)}
          className="shrink-0 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
        >
          {mounted ? "Unmount" : "Mount"}
        </button>
      </header>
      {mounted ? <BarcodeScanner /> : null}
    </div>
  );
};

export default App;
