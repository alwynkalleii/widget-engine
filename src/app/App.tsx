import { createSignal } from "solid-js";
import logo from "@/assets/logo.svg";
import { invoke } from "@tauri-apps/api/core";
import "./App.css";
import { WidgetList } from "./widget/list";

function App() {
  
  return (
    <main class="container">
      <WidgetList />

    </main>
  );
}

export default App;
