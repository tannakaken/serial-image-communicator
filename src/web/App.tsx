import React, { useEffect, useState } from "react";
import "./App.css";
import noImage from "./assets/no_image.jpg";
import ReactLoading from "react-loading";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const labels = [] as string[];
for (let i = 0; i < 100; i++) {
  labels.push("");
}

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
  const [voltageData, setVoltageData] = useState<number[]>([]);
  
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
        <div style={{
          display: "flex",
          flexDirection: "row",
          alignContent: "center",
        }}>
        <div style={{
          display: "flex",
          flexDirection: "column"
        }}>
          <img src={image} height="80%" style={{objectFit: "contain"}}  />
          <p>{metadata}</p>
        </div>
        {voltageData.length > 0 && (
          <Line
            data={{
              labels,
              datasets: [
                {
                  label: "電圧",
                  data: voltageData,
                  borderColor: "rgb(255, 99, 132)",
                  backgroundColor: "rgba(255, 99, 132, 0.5)",
                }
              ]
            }}
            options={{
              responsive: true,
              plugins: {
                title: {
                  display: true,
                  text: "電圧",
                }
              }
            }}
            id="chart-key"
          />
        )}
      </div>
      <button
        disabled={portName === undefined || sending || connecting || !connectOk}
        onClick={() => {
          if (portName === undefined) {
            return;
          }
          setSending(true);
          nativeApi.sendSerialMessage(
            (metadata, base64String, voltageData, hasError) => {
              setMetadata(metadata);
              if (hasError) {
                setImage(noImage);
              } else {
                setImage("data:image/jpeg;base64," + base64String);
                setVoltageData(voltageData);
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
