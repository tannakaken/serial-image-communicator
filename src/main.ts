import path from 'node:path';
import { BrowserWindow, ipcMain ,app, IpcMainInvokeEvent } from 'electron';
import { SerialPort } from 'serialport';
import { IPC_KEYS } from "./constants";
import { connectSerial, sendSerialMessage } from './serial-image-transfer';

ipcMain.handle(IPC_KEYS.REQUEST_PORTS_LIST, async (event: IpcMainInvokeEvent) => {
  SerialPort.list().then((portsList) => {
    event.sender.send(IPC_KEYS.GET_PORTS_LIST_RESPONSE, portsList);
  });
});
ipcMain.handle(IPC_KEYS.CONNECT_SERIAL, async (event: IpcMainInvokeEvent, portName: string) => {
  connectSerial(portName, (ok: boolean) => {
    event.sender.send(IPC_KEYS.GET_CONNECT_SERIAL_RESULT, ok);
  });
});
ipcMain.handle(IPC_KEYS.SEND_SERIAL_MESSAGE, async (event: IpcMainInvokeEvent) => {
  sendSerialMessage((metadata, base64String, voltageData) => {
    event.sender.send(IPC_KEYS.GET_SERIAL_RESPONSE, metadata, base64String, voltageData);
  })
});

app.whenReady().then(() => {
  // アプリの起動イベント発火で BrowserWindow インスタンスを作成
  const mainWindow = new BrowserWindow({
    title: 'マイアプリ',
    webPreferences: {
      // webpack が出力したプリロードスクリプトを読み込み
      preload: path.join(__dirname, 'preload.js'),
    },
    fullscreen: true,
  });
  
  // レンダラープロセスをロード
  mainWindow.loadFile('dist/index.html');
});

// すべてのウィンドウが閉じられたらアプリを終了する
app.once('window-all-closed', () => app.quit());
