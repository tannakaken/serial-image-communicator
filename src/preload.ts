import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron';
import { Port } from './@types/global';
import { IPC_KEYS, NATIVE_API } from "./constants";

contextBridge.exposeInMainWorld(NATIVE_API, {
  // renderer -> main
  requestPortsList: (listener: (portsList: Port[]) => void) => {
    ipcRenderer.addListener(IPC_KEYS.GET_PORTS_LIST_RESPONSE, (event: IpcRendererEvent, data: Port[]) => {
      listener(data);
    });
    ipcRenderer.invoke(IPC_KEYS.REQUEST_PORTS_LIST);
    return () => {
      ipcRenderer.removeAllListeners(IPC_KEYS.GET_PORTS_LIST_RESPONSE);
    }
  },
  sendSerialMessage: (portName: string, listener: (metadata: string, base64String: string, hasError?: boolean) => void) => {
    ipcRenderer.addListener(IPC_KEYS.GET_SERIAL_RESPONSE, (event: IpcRendererEvent, metadata: string, base64String: string) => {
      listener(metadata, base64String);
    });
    ipcRenderer.invoke(IPC_KEYS.SEND_SERIAL_MESSAGE, portName);
    return () => {
      ipcRenderer.removeAllListeners(IPC_KEYS.GET_SERIAL_RESPONSE);
    }
  },
});
