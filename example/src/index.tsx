import React from "react";
import ReactDOM from "react-dom/client";
import { prepareWasm } from "react-zxing";
import App from "./App";
import "./index.css";

await prepareWasm({ wasmUrl: "/zxing_reader.wasm" });

const root = ReactDOM.createRoot(document.getElementById("app") as HTMLElement);

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
