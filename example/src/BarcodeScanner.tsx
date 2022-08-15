import { useZxing } from "react-zxing";

export const BarcodeScanner: React.FC<{}> = () => {
  const { ref } = useZxing();

  return <video ref={ref} />;
};
