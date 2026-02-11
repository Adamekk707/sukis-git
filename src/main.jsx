import React from "react";
import ReactDOM from "react-dom/client";
import { SWRConfig } from "swr";
import App from "./App";
import { swrConfig } from "./lib/swr";
import "./styles/global.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <SWRConfig value={swrConfig}>
      <App />
    </SWRConfig>
  </React.StrictMode>,
);
