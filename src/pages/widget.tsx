import { useParams } from "@solidjs/router";
import { createSignal, createEffect, Show, For } from "solid-js";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { SettingsForm } from "@/components/SettingsForm";
import type { WidgetManifest, SettingField } from "@/types/app";

type TabType = "intro" | "instances";

export default function WidgetPage() {
  const params = useParams<{ id: string }>();
  const [activeTab, setActiveTab] = createSignal<TabType>("intro");
  const [manifest, setManifest] = createSignal<WidgetManifest | null>(null);
  const [instances, setInstances] = createSignal<Array<{ id: string; name: string; enabled: boolean; settings: Record<string, any> }>>([]);
  const [loading, setLoading] = createSignal(true);
  const [isCreatingInstance, setIsCreatingInstance] = createSignal(false);
  const [newInstanceConfig, setNewInstanceConfig] = createSignal<Record<string, any>>({});

  createEffect(() => {
    const fetchManifest = async () => {
      try {
        setLoading(true);
        // TODO: 替换为实际的 API 调用获取 manifest.json
        const mockManifest: WidgetManifest = {
          name: `Widget ${params.id}`,
          version: "1.0.0",
          description: "这是一个示例 widget，展示了完整的功能。",
          author: "Widget Engine",
          settings: [
            {
              id: "refreshInterval",
              label: "刷新间隔（秒）",
              type: "number",
              default: 60,
              min: 10,
              max: 3600,
              description: "数据更新的间隔时间"
            },
            {
              id: "enableNotifications",
              label: "启用通知",
              type: "boolean",
              default: true
            },
            {
              id: "theme",
              label: "主题",
              type: "select",
              default: "light",
              options: [
                { label: "浅色", value: "light" },
                { label: "深色", value: "dark" }
              ]
            }
          ]
        };
        setManifest(mockManifest);
        
        // Mock instances
        setInstances([
          { 
            id: "instance-1", 
            name: "默认实例", 
            enabled: true, 
            settings: { refreshInterval: 60, enableNotifications: true, theme: "light" } 
          }
        ]);
      } catch (error) {
        console.error("Failed to load widget manifest:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchManifest();
  });

  const handleCreateInstance = () => {
    setIsCreatingInstance(true);
    setNewInstanceConfig({});
  };

  const handleSaveInstance = (values: Record<string, any>) => {
    const newInstance = {
      id: `instance-${Date.now()}`,
      name: `实例 ${instances().length + 1}`,
      enabled: true,
      settings: values
    };
    setInstances([...instances(), newInstance]);
    setIsCreatingInstance(false);
    setNewInstanceConfig({});
  };

  const handleCancelInstance = () => {
    setIsCreatingInstance(false);
    setNewInstanceConfig({});
  };

  const toggleInstanceEnabled = (id: string) => {
    setInstances(
      instances().map((inst) =>
        inst.id === id ? { ...inst, enabled: !inst.enabled } : inst
      )
    );
  };

  return (
    <div class="flex flex-col h-full bg-background">
      {/* Header */}
      <div class="border-b border-border px-6 py-4">
        <Show when={manifest()}>
          <div>
            <h1 class="text-2xl font-bold">{manifest()!.name}</h1>
            <p class="text-muted-foreground text-sm mt-1">{manifest()!.description}</p>
            <p class="text-muted-foreground text-xs mt-2">
              版本: {manifest()!.version} | 作者: {manifest()!.author}
            </p>
          </div>
        </Show>
      </div>

      {/* Tabs Bar */}
      <div class="border-b border-border px-6 py-0">
        <div class="flex gap-8">
          <button
            onClick={() => setActiveTab("intro")}
            class={`py-3 px-1 font-medium text-sm border-b-2 transition-colors ${
              activeTab() === "intro"
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            介绍
          </button>
          <button
            onClick={() => setActiveTab("instances")}
            class={`py-3 px-1 font-medium text-sm border-b-2 transition-colors ${
              activeTab() === "instances"
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            实例管理
          </button>
        </div>
      </div>

      {/* Content */}
      <div class="flex-1 overflow-y-auto">
        {/* Intro Tab */}
        <Show when={activeTab() === "intro" && manifest()}>
          <div class="p-6 max-w-4xl">
            <div class="space-y-6">
              <div>
                <h2 class="text-lg font-semibold mb-2">关于此 Widget</h2>
                <p class="text-foreground/80">{manifest()!.description}</p>
              </div>

              <div class="grid grid-cols-2 gap-4">
                <div class="bg-muted/50 rounded-lg p-4 border border-border">
                  <p class="text-xs text-muted-foreground uppercase font-semibold">版本</p>
                  <p class="text-lg font-mono font-semibold mt-1">{manifest()!.version}</p>
                </div>
                <div class="bg-muted/50 rounded-lg p-4 border border-border">
                  <p class="text-xs text-muted-foreground uppercase font-semibold">作者</p>
                  <p class="text-lg font-semibold mt-1">{manifest()!.author}</p>
                </div>
              </div>

              <Show when={manifest()!.settings && manifest()!.settings!.length > 0}>
                <div>
                  <h3 class="text-md font-semibold mb-3">可用配置项</h3>
                  <div class="space-y-2">
                    <For each={manifest()!.settings}>
                      {(field) => (
                        <div class="bg-muted/30 rounded p-3 border border-border/50">
                          <p class="font-medium text-sm">{field.label}</p>
                          <p class="text-xs text-muted-foreground mt-1">{field.description || `类型: ${field.type}`}</p>
                        </div>
                      )}
                    </For>
                  </div>
                </div>
              </Show>
            </div>
          </div>
        </Show>

        {/* Instances Tab */}
        <Show when={activeTab() === "instances"}>
          <div class="p-6 max-w-4xl">
            <Show when={!isCreatingInstance()}>
              <div class="mb-6 flex justify-between items-center">
                <h2 class="text-lg font-semibold">Widget 实例</h2>
                <Button onClick={handleCreateInstance}>+ 添加新实例</Button>
              </div>
            </Show>

            {/* New Instance Form */}
            <Show when={isCreatingInstance() && manifest()}>
              <div class="bg-muted/30 rounded-lg p-6 border border-border mb-6">
                <h3 class="text-md font-semibold mb-4">创建新实例</h3>
                <Show when={manifest()!.settings && manifest()!.settings!.length > 0}>
                  <SettingsForm
                    fields={manifest()!.settings!}
                    initialValues={newInstanceConfig()}
                    onSave={handleSaveInstance}
                    onCancel={handleCancelInstance}
                  />
                </Show>
                <Show when={!manifest()!.settings || manifest()!.settings!.length === 0}>
                  <div class="space-y-3">
                    <p class="text-sm text-muted-foreground">此 Widget 没有配置选项</p>
                    <div class="flex justify-end gap-3">
                      <Button variant="outline" onClick={handleCancelInstance}>
                        取消
                      </Button>
                      <Button onClick={() => handleSaveInstance({})}>
                        创建实例
                      </Button>
                    </div>
                  </div>
                </Show>
              </div>
            </Show>

            {/* Instances List */}
            <div class="space-y-3">
              <For each={instances()}>
                {(instance) => (
                  <div class="bg-muted/20 rounded-lg p-4 border border-border/50 flex items-center justify-between hover:bg-muted/30 transition-colors">
                    <div class="flex-1">
                      <p class="font-medium">{instance.name}</p>
                      <p class="text-xs text-muted-foreground mt-1">ID: {instance.id}</p>
                      <Show when={Object.keys(instance.settings).length > 0}>
                        <p class="text-xs text-muted-foreground mt-2">
                          配置项: {Object.keys(instance.settings).length}
                        </p>
                      </Show>
                    </div>
                    <div class="flex items-center gap-3">
                      <div class="flex flex-col items-end">
                        <p class="text-xs text-muted-foreground mb-1">启动</p>
                        <Switch
                          checked={instance.enabled}
                          onChange={() => toggleInstanceEnabled(instance.id)}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </For>

              <Show when={instances().length === 0 && !isCreatingInstance()}>
                <div class="text-center py-8">
                  <p class="text-muted-foreground mb-4">还没有创建任何实例</p>
                  <Button onClick={handleCreateInstance}>创建第一个实例</Button>
                </div>
              </Show>
            </div>
          </div>
        </Show>
      </div>
    </div>
  );
}
