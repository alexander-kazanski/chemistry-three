import reactLogo from "./assets/react.svg";
import viteLogo from "/vite.svg";
import "./App.css";
import { Canvas } from "@react-three/fiber";
import { useState, Suspense } from "react";
import { Environment } from "@react-three/drei";
import { Model } from "./Model";
import Scene from "./Scene";

function App() {
  const [count, setCount] = useState(0);

  return (
    <div style={{ width: '100vw', height: '100vh'}}>
      <Scene />
    </div>
  );
}

export default App;
