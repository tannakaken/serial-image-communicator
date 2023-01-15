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

export const sendSerialMessage = (listener: (metadata: string, base64String: string, voltageData: number[], hasError?: boolean) => void) => {
  if (sp === undefined) {
    return;
  }

  let str = "";
  let metadataWaiting = true;
  let metadata = "";
  let imageDataWaiting = false;
  let base64String = "";
  let voltageDataWaiting = false;

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
            listener(completedString, "", [], true)
            return;
          }
          if (completedString.startsWith("SpGnss E:")) {
            console.warn(completedString);
            return;
          }
          metadata = completedString;
          console.warn("metadata: ", metadata);
          metadataWaiting = false;
          imageDataWaiting = true;
        });
      } else if (imageDataWaiting) {
        processString(input, (completedString) => {
          console.warn("base64String: ", completedString);
          base64String = completedString;
          imageDataWaiting = false;
          voltageDataWaiting = true;
        });
      } else if (voltageDataWaiting) {
        processString(input, (completedString) => {
          const voltageData = completedString.split(",").map((str) => parseInt(str, 10)).filter((num) => !isNaN(num));
          console.warn(voltageData);
          listener(metadata, base64String, voltageData);
          str = "";
          metadata = "";
          base64String = "";
          metadataWaiting = true;
          voltageDataWaiting = false;
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
