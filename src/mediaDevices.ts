export const assertCameraAccess = () => {
  if (!window.isSecureContext) {
    throw new Error(
      "Camera access requires a secure context. Use HTTPS or localhost — " +
        "http://192.168.x.x is blocked by the browser.",
    );
  }
  if (!navigator.mediaDevices?.getUserMedia) {
    throw new Error("Camera access is not supported in this browser.");
  }
};
