// import { invoke } from "@tauri-apps/api/core";
import { createSignal, onMount, For } from "solid-js";
import { WebviewWindow } from "@tauri-apps/api/webviewWindow";
import type { WidgetManifest } from "@/types/app";
import {
  // setDesktopUnderlay,
  toggleDesktopUnderlay,
} from "tauri-plugin-desktop-underlay-api";
import { readDir, BaseDirectory, exists, readTextFile } from "@tauri-apps/plugin-fs";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-solid";
import { getServices } from "tauri-plugin-httpd-api";

export function WidgetList() {
  const [widgets, setWidgets] = createSignal<{ folder_name: string; manifest: WidgetManifest }[]>([]);
  const [runningWidgets, setRunningWidgets] = createSignal<Record<string, boolean>>({});
  const [servicePort, setServicePort] = createSignal<number>(12312);

  const getWidgetList = async () => {
    const entries = await readDir("widgets", {
      baseDir: BaseDirectory.AppData,
    });
    console.log(entries);

    const promises = entries.map(async (entry) => {
      const manifestPath = `widgets/${entry.name}/manifest.json`;
      console.log(manifestPath);
      if (entry.isDirectory && (await exists(manifestPath, { baseDir: BaseDirectory.AppData }))) {
        const content = await readTextFile(manifestPath, {
          baseDir: BaseDirectory.AppData,
        });
        console.log(content);
        return { folder_name: entry.name, manifest: JSON.parse(content) };
      }
      return null;
    });

    return (await Promise.all(promises)).filter((item) => item !== null);
  };

  onMount(async () => {
    try {
      const services = await getServices();
      if (services.length > 0) {
        console.log(services[0].port);
        setServicePort(services[0].port);
      }
      let widgets = await getWidgetList();
      setWidgets(widgets);
    } catch (err) {
      console.error("获取组件失败:", err);
    }
  });

  const toggleWidget = async (widget: { folder_name: string; manifest: WidgetManifest }, checked: boolean) => {
    const { folder_name, manifest } = widget;
    const label = manifest.name;
    const url = `http://widget.${folder_name}.localhost:${servicePort()}/index.html`;
    console.error(url);
    if (checked) {
      const win = new WebviewWindow(label, {
        ...manifest.window,
        url,
      });

      win.once("tauri://created", () => {
        setRunningWidgets((prev) => ({ ...prev, [label]: true }));
      });

      // widgetWin.once("tauri://error", (e) => {
      //   console.error("窗口创建失败:", e);
      //   setRunningWidgets(prev => ({ ...prev, [label]: false }));
      // });

      // // 监听窗口关闭以同步开关状态
      win.onCloseRequested(async () => {
        setRunningWidgets((prev) => ({ ...prev, [label]: false }));
        await win.close();
      });
    } else {
      const win = await WebviewWindow.getByLabel(label);
      if (win) {
        await win.close();
        setRunningWidgets((prev) => ({ ...prev, [label]: false }));
      }
    }
  };

  const handleToogle = () => {
    toggleDesktopUnderlay("bg");
  };

  return (
    <div class="flex h-screen w-full overflow-hidden bg-gray-50 text-gray-900">
      <div class="absolute right-6 bottom-6 left-6">
        <button
          onClick={handleToogle}
          class="flex w-full justify-center rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium transition-colors hover:bg-gray-50"
        >
          切换底层模式
        </button>
      </div>

      {/* 主内容区域 */}
      <main class="flex-1 overflow-y-auto p-10">
        <header class="mb-8 flex items-center justify-between">
          <h1 class="text-2xl font-bold">已安装的小组件</h1>
          <div class="text-sm text-gray-500">共 {widgets().length} 个</div>
        </header>

        <div class="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          <For each={widgets()}>
            {(widget) => (
              <>
                <div class="flex justify-between rounded-xl border bg-white p-4 shadow-sm transition-shadow hover:shadow-md">
                  <div class="font-bold">{widget.manifest.name}</div>
                  <Switch
                    checked={!!runningWidgets()[widget.manifest.name]}
                    onChange={(checked) => toggleWidget(widget, checked)}
                  />
                  {/* <Button variant="outline" size="icon">
                    <Plus />
                  </Button> */}
                </div>
              </>
            )}
          </For>
          <div class="flex items-center justify-center rounded-xl border-2 border-dashed border-gray-200 p-5 text-gray-400">
            更多组件敬请期待...
          </div>
        </div>
      </main>
    </div>
  );
}
