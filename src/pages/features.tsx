import { invoke } from "@tauri-apps/api/core";
import { createSignal, onMount, For, Show } from "solid-js";
import { Button } from "@/components/ui/button";
import Download from "lucide-solid/icons/download";
import CheckCircle from "lucide-solid/icons/check-circle";
import AlertCircle from "lucide-solid/icons/alert-circle";

interface FeatureMetadata {
  id: string;
  name: string;
  description: string;
  download_url: string;
  binary_name: string;
}

export default function FeaturesPage() {
  const [features, setFeatures] = createSignal<FeatureMetadata[]>([]);
  const [installedStatus, setInstalledStatus] = createSignal<Record<string, boolean>>({});
  const [loading, setLoading] = createSignal<Record<string, boolean>>({});

  const refreshStatus = async () => {
    const list = await invoke<FeatureMetadata[]>("list_available_features");
    setFeatures(list);
    
    const status: Record<string, boolean> = {};
    for (const f of list) {
      status[f.id] = await invoke<boolean>("check_feature_installed", { featureId: f.id });
    }
    setInstalledStatus(status);
  };

  onMount(refreshStatus);

  const installFeature = async (feature: FeatureMetadata) => {
    setLoading(prev => ({ ...prev, [feature.id]: true }));
    try {
      // 模拟下载过程：在开发环境下，你可以手动将编译好的 exe 放到对应的 bin 目录
      // 这里我们可以通过一个模拟的命令来触发“安装”
      // 在实际生产中，这里应该是调用 Rust 的下载并解压逻辑
      console.log(`正在安装 ${feature.name}...`);
      await new Promise(resolve => setTimeout(resolve, 2000)); // 模拟网络延迟
      
      // 这里的逻辑仅为演示，实际安装需配合 Rust 后端下载
      alert(`请将编译好的 ${feature.binary_name} 放置到应用数据目录的 bin 文件夹下。`);
      
      await refreshStatus();
    } finally {
      setLoading(prev => ({ ...prev, [feature.id]: false }));
    }
  };

  const testFeature = async (id: string) => {
    try {
      const result = await invoke<string>("invoke_feature", { featureId: id, args: [] });
      alert(`执行结果: ${result}`);
    } catch (err) {
      alert(`执行失败: ${err}`);
    }
  };

  return (
    <div class="h-screen w-full overflow-y-auto bg-gray-50 p-10 text-gray-900">
      <header class="mb-10">
        <h1 class="text-3xl font-bold">扩展特性商店</h1>
        <p class="mt-2 text-gray-500">按需扩展你的 Widget Engine 能力，保持主程序轻量。</p>
      </header>

      <div class="grid grid-cols-1 gap-6 md:grid-cols-2">
        <For each={features()}>
          {(feature) => (
            <div class="flex flex-col justify-between rounded-2xl border bg-white p-6 shadow-sm transition-all hover:shadow-md">
              <div>
                <div class="flex items-center justify-between">
                  <h3 class="text-xl font-bold text-gray-800">{feature.name}</h3>
                  <Show when={installedStatus()[feature.id]} fallback={<span class="text-xs font-medium text-gray-400 bg-gray-100 px-2 py-1 rounded">未安装</span>}>
                    <span class="flex items-center text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded">
                      <CheckCircle class="w-3 h-3 mr-1" /> 已安装
                    </span>
                  </Show>
                </div>
                <p class="mt-3 text-sm text-gray-600 leading-relaxed">{feature.description}</p>
                <div class="mt-4 flex items-center text-xs text-gray-400">
                  <span class="font-mono">ID: {feature.id}</span>
                  <span class="mx-2">|</span>
                  <span>二进制: {feature.binary_name}</span>
                </div>
              </div>

              <div class="mt-8 flex space-x-3">
                <Show when={!installedStatus()[feature.id]}>
                  <Button 
                    class="flex-1" 
                    disabled={loading()[feature.id]}
                    onClick={() => installFeature(feature)}
                  >
                    <Show when={loading()[feature.id]} fallback={<><Download class="w-4 h-4 mr-2" /> 立即下载</>}>
                      正在准备...
                    </Show>
                  </Button>
                </Show>
                <Show when={installedStatus()[feature.id]}>
                  <Button variant="outline" class="flex-1" onClick={() => testFeature(feature.id)}>
                    运行测试
                  </Button>
                  <Button variant="ghost" class="text-red-500 hover:text-red-600 hover:bg-red-50">
                    卸载
                  </Button>
                </Show>
              </div>
            </div>
          )}
        </For>
      </div>

      <div class="mt-10 rounded-xl bg-blue-50 p-6 flex items-start space-x-4 border border-blue-100">
        <AlertCircle class="w-6 h-6 text-blue-500 mt-1" />
        <div>
          <h4 class="font-bold text-blue-900">开发者提示</h4>
          <p class="text-sm text-blue-700 mt-1">
            在开发阶段，请在 <code class="bg-blue-100 px-1 rounded">extensions/sysinfo</code> 目录下运行 <code class="bg-blue-100 px-1 rounded">cargo build --release</code>，并将生成的 <code class="bg-blue-100 px-1 rounded">sysinfo-ext.exe</code> 重命名为 <code class="bg-blue-100 px-1 rounded">sysinfo.exe</code> 后手动放入 AppData 的 <code class="bg-blue-100 px-1 rounded">bin</code> 文件夹中。
          </p>
        </div>
      </div>
    </div>
  );
}
