import { SerialPort } from 'serialport';

export const sendSerialMessage = (portName: string, listener: (metadata: string, base64String: string, hasError?: boolean) => void) => {
  const sp = new SerialPort({
      path: portName,
      baudRate: 115200,
      //dataBits: 8,
      //stopBits: 1,
  });

  let str = "";
  let metadataWaiting = true;
  let metadata = "";
  let fileBodyWaiting = false;
  let finished = false;

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
            sp.close();
            return;
          }
          if (completedString.startsWith("SpGnss E: Failed to read position data")) {
            // なぜGPSデータがとれたり取れなかったりするかはよくわかってない。
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
          sp.close();
          finished = true;
        });
      }
  });

  const sendMessage = () => {
    if (sp.closed) {
      return;
    }
    sp.write('>', (error) => {
      if (error) {
        console.warn(error);
      } else {
        console.warn("send");
      }
    });
  }

  sp.on('open', () => {
    console.warn("open");
    setTimeout(() => {
      sendMessage();
      setTimeout(() => {
        if (finished) {
          return;
        }
        listener("Timeout", "", true);
        sp.close();
      }, 10000);
    }, 3000);
  });

  sp.on('error', function(err) {
    console.log('Error: ', err.message)
  })
};
