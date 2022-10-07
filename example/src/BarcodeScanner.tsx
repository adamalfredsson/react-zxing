import { useState } from "react";
import { useZxing } from "react-zxing";

export const BarcodeScanner: React.FC<{}> = () => {
  const [result, setResult] = useState("");
  const [count, setCount] = useState(0);
  const { ref } = useZxing({
    onResult(result) {
      setResult(result.getText());
    },
  });

  return (
    <>
      <video ref={ref} />
      <p>
        <span>Last result:</span>
        <span>{result}</span>
      </p>
      <div>
        <button onClick={() => setCount(count + 1)}>Count: {count}</button>
      </div>
    </>
  );
};
