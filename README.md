<div align="center">
  <h1>
    <br/>
    <br/>
    📷
    <br />
    react-zxing
    <br />
    <br />
  </h1>
  <br />
  <pre>npm i <a href="https://www.npmjs.com/package/react-zxing">react-zxing</a></pre>
  <br />
</div>

Easily scan QR and ean codes in your React application. Exports a handy `useZxing` hook that utilizes the popular `@zxing/library` to stream video to an element and decode codes from it.

## Usage

```tsx
import { useState } from "react";
import { useZxing } from "react-zxing";

export const BarcodeScanner = () => {
  const [result, setResult] = useState("");
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
    </>
  );
};
```

### With specific device ID

You could either get the device ID from the `MediaDevices` API yourself or make use of [react-media-devices](https://www.npmjs.com/package/react-media-devices) to list available devices:

```tsx
import { useMediaDevices } from "react-media-devices";
import { useZxing } from "react-zxing";

const constraints: MediaStreamConstraints = {
  video: true,
  audio: false,
};

export const BarcodeScanner = () => {
  const { devices } = useMediaDevices(constraints);
  const deviceId = devices?.[0]?.deviceId;
  const { ref } = useZxing({
    paused: !deviceId,
    deviceId,
  });

  return <video ref={ref} />;
};
```

## Options

<table>
  <thead>
    <tr>
      <th>Name</th>
      <th>Type</th>
      <th>Default</th>
      <th>Description</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>onResult</td>
      <td>function</td>
      <td></td>
      <td>
        Called when a result is found. The result is an instance of 
        <a href="https://github.com/zxing-js/library/blob/master/src/core/Result.ts">
          Result
        </a>
        .
      </td>
    </tr>
    <tr>
      <td>onError</td>
      <td>function</td>
      <td></td>
      <td>
        Called when an error is found. The error is an instance of Error.
      </td>
    </tr>
    <tr>
      <td>hints</td>
      <td>Map&lt;DecodeHintType, any&gt;</td>
      <td></td>
      <td>
        A map of additional parameters to pass to the zxing decoder.
      </td>
    </tr>
    <tr>
      <td>timeBetweenDecodingAttempts</td>
      <td>number</td>
      <td>300</td>
      <td>
        The time in milliseconds to wait between decoding attempts.
      </td>
    </tr>
    <tr>
      <td>constraints</td>
      <td>MediaStreamConstraints</td>
      <td>{ video: { facingMode: 'environment' }, audio: false }</td>
      <td>
        The constraints to use when requesting the camera stream.
      </td>
    </tr>
    <tr>
      <td>deviceId</td>
      <td>string</td>
      <td></td>
      <td>
        You may pass an explicit device ID to stream from.
      </td>
    </tr>
    <tr>
      <td>paused</td>
      <td>boolean</td>
      <td>false</td>
      <td>
        Stops the camera stream when true.
      </td>
    </tr>
  </tbody>
</table>
