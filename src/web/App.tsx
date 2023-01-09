import React, { useEffect, useState } from "react";
import "./App.css";
import noImage from "./assets/no_image.jpg";
import ReactLoading from "react-loading";

const { nativeApi } = window;
export const App = () => {
  const [portsList, setPortsList] = useState<{ path: string }[]>([]);
  const [portName, setPortName] = useState<string | undefined>(undefined);
  useEffect(() => {
    nativeApi.requestPortsList((list) => {
      setPortsList(list);
      if (list.length === 1) {
        setPortName(list[0].path);
      }
    });
  }, []);
  const [connecting, setConnecting] = useState(false);
  const [connectOk, setConnectOk] = useState(false);
  useEffect(() => {
    if (portName) {
      setConnecting(true);
      nativeApi.connectSerial(portName, (ok) => {
        setConnecting(false);
        setConnectOk(ok);
      })
    }
  }, [portName]);
  const [metadata, setMetadata] = useState("");
  const [image, setImage] = useState<string>(noImage);
  
  const [sending, setSending] = useState(false);
  return (
    <div className="container">
      <select
        value={portName}
        onChange={(event) => {
          setPortName(event.target.value);
        }}
      >
        {portsList.map((item, index) => (
          <option key={index} value={item.path}>
            {item.path}
          </option>
        ))}
      </select>
      {portName !== undefined && !connecting && !connectOk && (
        <div style={{color: "red"}}><p>ポートに接続できません。</p></div>
      )}
      <img src={image} width="80%" height="80%" />
      <p>{metadata}</p>
      <button
        disabled={portName === undefined || sending || connecting || !connectOk}
        onClick={() => {
          if (portName === undefined) {
            return;
          }
          setSending(true);
          nativeApi.sendSerialMessage(
            (metadata, base64String, hasError) => {
              setMetadata(metadata);
              if (hasError) {
                setImage(noImage);
              } else {
                setImage("data:image/jpeg;base64," + base64String);
              }
              setSending(false);
            }
          );
        }}
      >
        更新
      </button>
      {(sending || connecting) && (
        <div
          style={{
            position: "fixed",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            margin: "auto",
          }}
        >
          <ReactLoading
            color="#ebc634"
            height="50px"
            width="50px"
            type="spin"
          />
        </div>
      )}
    </div>
  );
};
