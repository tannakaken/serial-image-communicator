const { SerialPort } = require('serialport');
const fs = require('fs');
const portName = '/dev/tty.usbserial-14230';
const sp = new SerialPort({
    path: portName,
    baudRate: 115200,
    //dataBits: 8,
    //stopBits: 1,
});


let str = "";
let fileNameWaiting = true;
let fileName = "";
let fileBodyWaiting = false;

const processString = (input, callback) => {
    str += input.toString();
    const arr = str.split(/\r\n|\n/);
    if (arr.length > 1) {
      callback(arr[0]);
      str = arr.slice(1).join("\n");
    }
}

sp.on('data', function(input) {
    if (fileNameWaiting) {
      processString(input, (completedString) => {
        fileName = completedString;
        console.warn("fileName: ", fileName);
        fileNameWaiting = false;
        fileBodyWaiting = true;
      });
    } else if (fileBodyWaiting) {
      processString(input, (completedString) => {
        if (completedString.startsWith("can not open file:")) {
          console.warn(completedString);
        } else {
          fs.writeFile(fileName, completedString, {encoding: "base64"}, (err) => {
            if (!err) {
              console.log(`${fileName} created successfully!`);
            } else {
              console.warn(`${fileName} can not crate`);
            }
          });
        }
        fileBodyWaiting = false;
        fileNameWaiting = true;
        setTimeout(() => {
          sendMessage();
          }, 10000);
        });
    }
});

const sendMessage = () => {
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
  }, 10000);
});

sp.on('error', function(err) {
  console.log('Error: ', err.message)
})

