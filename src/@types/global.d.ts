import { NATIVE_API } from "../constants";

declare global {
    interface Window {
        [NATIVE_API]: IAPI;
    }
}
type Port = {
    path: string;
};

export interface IAPI {
    requestPortsList: (listner: (portsList: Port[]) => void) => void;
    sendSerialMessage: (portName: string, listener: (fileName: string, base64String: string, hasError?: boolean) => void) => void;
}
