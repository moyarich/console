import "@fontsource-variable/inter";
import "./layout.css";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./components/MonacoEditor/setup";
import "./styles.css";
import { App } from "./App";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
