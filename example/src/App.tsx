import { useState } from "react";
import { BarcodeScanner } from "./BarcodeScanner";

const App = () => {
  const [mounted, setMounted] = useState(true);

  return (
    <>
      <div>
        <h1>react-zxing example</h1>
        <button onClick={() => setMounted(!mounted)}>
          {mounted ? "Unmount" : "Mount"}
        </button>
      </div>
      {mounted ? <BarcodeScanner /> : null}
    </>
  );
};

export default App;
