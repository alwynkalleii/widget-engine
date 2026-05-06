import { createSignal } from "solid-js";
import { check } from "@tauri-apps/plugin-updater";
import { relaunch } from "@tauri-apps/plugin-process";
import { Button } from "@/components/ui/button";
import RefreshCw from "lucide-solid/icons/refresh-ccw";
import logo from "@/assets/logo.svg";
import { cn } from "@/lib/utils";

export default function AboutPage() {
  const [checking, setChecking] = createSignal(false);
  const [status, setStatus] = createSignal("");
  const [updateInfo, setUpdateInfo] = createSignal<any>(null);

  const handleCheckUpdate = async () => {
    setChecking(true);
    setStatus("正在检查更新...");
    try {
      const update = await check();
      if (update) {
        setUpdateInfo(update);
        setStatus(`发现新版本: ${update.version}`);
      } else {
        setStatus("当前已是最新版本");
      }
    } catch (e) {
      console.error(e);
      setStatus("检查更新失败");
    } finally {
      setChecking(false);
    }
  };

  const handleInstall = async () => {
    const update = updateInfo();
    if (!update) return;
    setStatus("正在下载并安装...");
    try {
      await update.downloadAndInstall((event: any) => {
        switch (event.event) {
          case "Started":
            setStatus("下载已开始...");
            break;
          case "Progress":
            setStatus(`正在下载: ${(event.data.chunkLength / 1024 / 1024).toFixed(2)} MB`);
            break;
          case "Finished":
            setStatus("下载完成，正在重启...");
            break;
        }
      });
      await relaunch();
    } catch (e) {
      console.error(e);
      setStatus("安装失败");
    }
  };

  return (
    <div class="flex h-full w-full flex-col items-center justify-between p-12 text-center">
      {/* 上方区域：Icon */}
      <div class="flex flex-col items-center">
        <div class="group relative mb-6">
          <div class="absolute -inset-1 rounded-full bg-gradient-to-r from-blue-600 to-cyan-400 opacity-25 blur transition duration-1000 group-hover:opacity-50"></div>
          <img src={logo} alt="Logo" class="relative h-32 w-32" />
        </div>
        <h1 class="text-foreground text-3xl font-bold tracking-tight">Widget Engine</h1>
        <p class="mt-2 text-sm font-medium tracking-widest text-blue-600/80 uppercase">Version 0.1.0 Alpha</p>
      </div>

      {/* 中间区域：介绍 */}
      <div class="max-w-md space-y-6">
        <p class="text-muted-foreground leading-relaxed">
          Widget Engine 是一款为桌面极客打造的小组件平台。 它采用先进的微前端架构，赋予了桌面组件无限的可能性。
          无论是系统监控、待办清单还是个性化装饰，一切皆可组件化。
        </p>
        <div class="grid grid-cols-2 gap-4 text-xs">
          <div class="bg-muted/50 border-border/50 rounded-xl border p-3">
            <div class="text-foreground font-bold">原生性能</div>
            <div class="text-muted-foreground mt-1">基于 Rust & Tauri V2</div>
          </div>
          <div class="bg-muted/50 border-border/50 rounded-xl border p-3">
            <div class="text-foreground font-bold">开放架构</div>
            <div class="text-muted-foreground mt-1">支持多框架开发</div>
          </div>
        </div>
      </div>

      {/* 下方区域：检查更新和版权信息 */}
      <div class="flex w-full flex-col items-center gap-8">
        <div class="flex flex-col items-center gap-3">
          {updateInfo() ? (
            <Button onClick={handleInstall} variant="default" class="shadow-primary/20 px-10 shadow-lg">
              立即安装新版本
            </Button>
          ) : (
            <Button variant="outline" onClick={handleCheckUpdate} disabled={checking()} class="gap-2 px-8">
              <RefreshCw class={cn("size-4", checking() && "animate-spin")} />
              {checking() ? "正在检查..." : "检查更新"}
            </Button>
          )}
          <p class="text-muted-foreground h-4 text-xs">{status()}</p>
        </div>

        <div class="space-y-1">
          <p class="text-muted-foreground/60 text-xs">© 2026 Widget Engine Team. Built with ❤️ for enthusiasts.</p>
          <div class="text-muted-foreground/40 flex justify-center gap-4 text-[10px] font-medium tracking-tighter uppercase">
            <span class="hover:text-foreground/60 cursor-pointer transition-colors">Terms of Service</span>
            <span class="hover:text-foreground/60 cursor-pointer transition-colors">Privacy Policy</span>
            <span class="hover:text-foreground/60 cursor-pointer transition-colors">Github</span>
          </div>
        </div>
      </div>
    </div>
  );
}
