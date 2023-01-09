import { SerialPort } from 'serialport';

let sp: SerialPort | undefined;

// シリアルにつなげた最初の通信にそれなりに時間がかかる。
// シリアル接続初回にspresense側でGPS情報の取得に失敗することがある。
// シリアルに毎回つなげる仕方だとGPS情報の取得に必ず失敗する。
export const connectSerial = (portName: string, callback: (ok:  boolean) => void) => {
  sp = new SerialPort({
    path: portName,
    baudRate: 115200,
    //dataBits: 8,
    //stopBits: 1,
  });
  sp.on('open', () => {
    callback(true);
  });
  sp.on('error', function(error) {
    console.warn(error);
    callback(false);
  });
};

export const sendSerialMessage = (listener: (metadata: string, base64String: string, hasError?: boolean) => void) => {
  if (sp === undefined) {
    return;
  }

  let str = "";
  let metadataWaiting = true;
  let metadata = "";
  let fileBodyWaiting = false;

  const processString = (input: any, callback: (completeString: string) => void) => {
      str += input.toString();
      const arr = str.split(/\r\n|\n/);
      if (arr.length > 1) {
        callback(arr[0]);
        str = arr.slice(1).join("\n");
      }
  }

  sp.on('data', function(input) {
      if (metadataWaiting) {
        processString(input, (completedString) => {
          if (completedString.startsWith("image not found")) {
            console.warn(completedString);
            listener(completedString, "", true)
            return;
          }
          if (completedString.startsWith("SpGnss E: Failed to read position data")) {
            console.warn(completedString);
            return;
          }
          metadata = completedString;
          console.warn("metadata: ", metadata);
          metadataWaiting = false;
          fileBodyWaiting = true;
        });
      } else if (fileBodyWaiting) {
        processString(input, (completedString) => {
          console.warn("base64String: ", completedString);
          if (completedString.startsWith("image not  found")) {
            console.warn(completedString);
          } else {
            listener(metadata, completedString);
          }
          str = "";
          metadata = "";
          metadataWaiting = true;
          fileBodyWaiting = false;
        });
      }
  });

  sp.write('>', (error) => {
    if (error) {
      console.warn(error);
    } else {
      console.warn("send");
    }
  });
};
