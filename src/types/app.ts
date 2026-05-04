import { WebviewOptions } from "@tauri-apps/api/webview";
import { WindowOptions } from "@tauri-apps/api/window";

export type WidgetManifest = {
  name: string;
  version: string;
  description: string;
  author: string;

  window?: Omit<WebviewOptions, "x" | "y" | "width" | "height"> & WindowOptions & { desktopUnderlay: Boolean };
};
