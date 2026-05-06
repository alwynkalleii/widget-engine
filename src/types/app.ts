import { WebviewOptions } from "@tauri-apps/api/webview";
import { WindowOptions } from "@tauri-apps/api/window";

export type SettingField = {
  id: string;
  label: string;
  type: "text" | "number" | "boolean" | "select" | "multi-select" | "color" | "slider";
  description?: string;
  default?: any;
  options?: { label: string; value: any }[]; // For select
  min?: number; // For slider/number
  max?: number; // For slider/number
  step?: number; // For slider
  placeholder?: string; // For text/number
  pattern?: string; // Regex pattern for text validation
  
  // Conditional rendering logic
  showIf?: {
    field: string;
    operator: "eq" | "neq" | "gt" | "lt" | "contains";
    value: any;
  };
};

export type WidgetManifest = {
  name: string;
  version: string;
  description: string;
  author: string;

  window?: Omit<WebviewOptions, "x" | "y" | "width" | "height"> & WindowOptions & { desktopUnderlay: Boolean };
  settings?: SettingField[];
};
